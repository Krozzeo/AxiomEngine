//! Native loopback HTTP adapter for the Axiom semantic protocol.

pub mod compiler;

use axum::{
    Json, Router,
    body::Bytes,
    extract::{DefaultBodyLimit, OriginalUri, Path, Query, Request, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::{SecondsFormat, Utc};
use serde::Deserialize;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet, VecDeque},
    env,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    path::{Component, Path as FilePath, PathBuf},
    sync::{
        Arc, Mutex,
        atomic::{AtomicU64, Ordering},
    },
    time::Instant,
};
use tokio::net::TcpListener;
use uuid::Uuid;

pub const BODY_LIMIT: usize = 256 * 1024;
const MAX_EVENTS: usize = 512;
const MAX_TRACES: usize = 128;
const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DaemonPolicy {
    pub bind: SocketAddr,
    pub arbitrary_process_execution: bool,
    pub system_filesystem_access: bool,
}

impl Default for DaemonPolicy {
    fn default() -> Self {
        Self {
            bind: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4317),
            arbitrary_process_execution: false,
            system_filesystem_access: false,
        }
    }
}

#[derive(Clone, Debug)]
pub struct DaemonConfig {
    pub bind: SocketAddr,
    pub project_root: PathBuf,
    pub token: Option<String>,
}

impl DaemonConfig {
    #[must_use]
    pub fn from_environment() -> Self {
        let port = env::var("AXIOM_PORT")
            .ok()
            .and_then(|value| value.parse().ok())
            .unwrap_or(4317);
        let project_root = env::var_os("AXIOM_PROJECT_ROOT")
            .map(PathBuf::from)
            .or_else(discover_project_root)
            .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
        Self {
            bind: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port),
            project_root,
            token: None,
        }
    }
}

pub struct AppState {
    token: String,
    allowed_origins: HashSet<String>,
    schema_hash: String,
    editor_dir: PathBuf,
    bus: Mutex<CommandBus>,
    started_at: Instant,
    requests: AtomicU64,
    security_rejections: AtomicU64,
}

#[derive(Default)]
struct CommandBus {
    counter: i64,
    revision: u64,
    sequence: u64,
    events: VecDeque<Value>,
    traces: HashMap<String, Value>,
    trace_order: VecDeque<String>,
    undo: Vec<i64>,
}

#[derive(Deserialize)]
struct EventsQuery {
    since: Option<u64>,
}

#[derive(Debug)]
pub struct DaemonError(String);

impl std::fmt::Display for DaemonError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.0)
    }
}

impl std::error::Error for DaemonError {}

pub fn build_router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/v1/handshake", get(handshake))
        .route("/v1/commands", post(commands))
        .route("/v1/events", get(events))
        .route("/v1/traces/{trace_id}", get(trace))
        .route("/v1/metrics", get(metrics))
        .fallback(static_asset)
        .layer(DefaultBodyLimit::max(BODY_LIMIT))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            request_policy,
        ))
        .with_state(state)
}

pub async fn run(config: DaemonConfig) -> Result<(), DaemonError> {
    validate_editor_build(&config.project_root)?;
    let listener = TcpListener::bind(config.bind)
        .await
        .map_err(|error| DaemonError(format!("cannot bind {}: {error}", config.bind)))?;
    let address = listener
        .local_addr()
        .map_err(|error| DaemonError(format!("cannot inspect listener: {error}")))?;
    if !address.ip().is_loopback() {
        return Err(DaemonError(
            "native daemon refused a non-loopback bind".into(),
        ));
    }
    let origin = format!("http://127.0.0.1:{}", address.port());
    let token = config.token.unwrap_or_else(generate_token);
    let state = create_state(&config.project_root, &origin, token.clone()).await?;
    println!("Axiom native daemon listening at {origin}");
    println!("Open editor: {origin}/#token={token}");
    axum::serve(listener, build_router(state))
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(|error| DaemonError(format!("HTTP server failed: {error}")))
}

async fn create_state(
    project_root: &FilePath,
    origin: &str,
    token: String,
) -> Result<Arc<AppState>, DaemonError> {
    let editor_dir = project_root.join("dist/editor");
    let schema_hash = calculate_schema_hash(project_root).await?;
    let port = origin.rsplit(':').next().unwrap_or("4317");
    Ok(Arc::new(AppState {
        token,
        allowed_origins: HashSet::from([origin.to_owned(), format!("http://localhost:{port}")]),
        schema_hash,
        editor_dir,
        bus: Mutex::new(CommandBus::default()),
        started_at: Instant::now(),
        requests: AtomicU64::new(0),
        security_rejections: AtomicU64::new(0),
    }))
}

fn validate_editor_build(project_root: &FilePath) -> Result<(), DaemonError> {
    let index = project_root.join("dist/editor/index.html");
    if !index.is_file() {
        return Err(DaemonError(format!(
            "editor build not found at {}; run `npm run build` first",
            index.display()
        )));
    }
    Ok(())
}

async fn request_policy(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    state.requests.fetch_add(1, Ordering::Relaxed);
    if request.uri().path().starts_with("/v1/")
        && let Err((status, code, cause)) = authorize(request.headers(), &state)
    {
        state.security_rejections.fetch_add(1, Ordering::Relaxed);
        return with_security_headers(json_response(
            status,
            json!({ "code": code, "cause": cause }),
        ));
    }
    with_security_headers(next.run(request).await)
}

fn authorize(
    headers: &HeaderMap,
    state: &AppState,
) -> Result<(), (StatusCode, &'static str, &'static str)> {
    let origin = headers
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok());
    let fetch_site = headers
        .get("sec-fetch-site")
        .and_then(|value| value.to_str().ok());
    let origin_allowed = origin.map_or(fetch_site == Some("same-origin"), |value| {
        state.allowed_origins.contains(value)
    });
    if !origin_allowed {
        return Err((
            StatusCode::FORBIDDEN,
            "AX_SECURITY_0001",
            "Origin is not authorized",
        ));
    }
    let expected = format!("Bearer {}", state.token);
    let actual = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok());
    if actual != Some(expected.as_str()) {
        return Err((
            StatusCode::UNAUTHORIZED,
            "AX_SECURITY_0002",
            "Session token is invalid",
        ));
    }
    Ok(())
}

async fn health() -> Response {
    json_response(
        StatusCode::OK,
        json!({ "status": "ok", "service": "axiom-daemon", "version": VERSION }),
    )
}

async fn handshake(State(state): State<Arc<AppState>>, headers: HeaderMap) -> Response {
    let requested = headers
        .get("axiom-protocol-version")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(1);
    if requested != 1 {
        return json_response(
            StatusCode::CONFLICT,
            json!({ "code": "AX_PROTOCOL_0003", "supported": { "min": 1, "max": 1 } }),
        );
    }
    json_response(
        StatusCode::OK,
        json!({
            "protocol": { "min": 1, "max": 1, "selected": 1 },
            "schemaHash": state.schema_hash,
            "server": { "name": "axiom-daemon", "version": VERSION },
            "capabilities": [
                "command.system.ping",
                "command.demo.increment",
                "command.editor.undo",
                "events.delta",
                "diagnostics.trace"
            ],
            "limits": {
                "requestBytes": BODY_LIMIT,
                "retainedEvents": MAX_EVENTS,
                "retainedTraces": MAX_TRACES
            }
        }),
    )
}

async fn commands(State(state): State<Arc<AppState>>, body: Bytes) -> Response {
    let command = match serde_json::from_slice::<Value>(&body) {
        Ok(command) => command,
        Err(error) => {
            return json_response(
                StatusCode::BAD_REQUEST,
                json!({ "code": "AX_HTTP_0002", "cause": format!("Malformed JSON: {error}") }),
            );
        }
    };
    let mut bus = state
        .bus
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let result = bus.execute(&command);
    let status = if result["kind"] == "error" {
        StatusCode::UNPROCESSABLE_ENTITY
    } else {
        StatusCode::OK
    };
    json_response(status, result)
}

async fn events(State(state): State<Arc<AppState>>, Query(query): Query<EventsQuery>) -> Response {
    let bus = state
        .bus
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let since = query.since.unwrap_or(0);
    let events: Vec<&Value> = bus
        .events
        .iter()
        .filter(|event| event["payload"]["sequence"].as_u64().unwrap_or(0) > since)
        .collect();
    json_response(
        StatusCode::OK,
        json!({ "events": events, "state": { "counter": bus.counter, "revision": bus.revision } }),
    )
}

async fn trace(State(state): State<Arc<AppState>>, Path(trace_id): Path<String>) -> Response {
    let bus = state
        .bus
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    bus.traces.get(&trace_id).map_or_else(
        || {
            json_response(
                StatusCode::NOT_FOUND,
                json!({ "code": "AX_DIAGNOSTICS_0001", "cause": "Trace was not retained" }),
            )
        },
        |trace| json_response(StatusCode::OK, trace.clone()),
    )
}

async fn metrics(State(state): State<Arc<AppState>>) -> Response {
    let bus = state
        .bus
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    json_response(
        StatusCode::OK,
        json!({
            "uptimeMs": state.started_at.elapsed().as_secs_f64() * 1_000.0,
            "requests": state.requests.load(Ordering::Relaxed),
            "securityRejections": state.security_rejections.load(Ordering::Relaxed),
            "commandState": { "counter": bus.counter, "revision": bus.revision }
        }),
    )
}

async fn static_asset(
    State(state): State<Arc<AppState>>,
    OriginalUri(uri): OriginalUri,
) -> Response {
    if uri.path().starts_with("/v1/") {
        return json_response(
            StatusCode::NOT_FOUND,
            json!({ "code": "AX_HTTP_0002", "cause": "Route not found" }),
        );
    }
    let relative = if uri.path() == "/" {
        "index.html"
    } else {
        uri.path().trim_start_matches('/')
    };
    if relative.is_empty()
        || FilePath::new(relative)
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return json_response(
            StatusCode::BAD_REQUEST,
            json!({ "code": "AX_HTTP_0001", "cause": "Invalid static path" }),
        );
    }
    let path = state.editor_dir.join(relative);
    match tokio::fs::read(&path).await {
        Ok(content) => {
            let content_type = match path.extension().and_then(|extension| extension.to_str()) {
                Some("html") => "text/html; charset=utf-8",
                Some("js") => "text/javascript; charset=utf-8",
                Some("css") => "text/css; charset=utf-8",
                _ => "application/octet-stream",
            };
            let cache = if relative == "index.html" {
                "no-store"
            } else {
                "public, max-age=60"
            };
            (
                StatusCode::OK,
                [
                    (header::CONTENT_TYPE, HeaderValue::from_static(content_type)),
                    (header::CACHE_CONTROL, HeaderValue::from_static(cache)),
                ],
                content,
            )
                .into_response()
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => json_response(
            StatusCode::NOT_FOUND,
            json!({ "code": "AX_HTTP_0002", "cause": "Asset not found" }),
        ),
        Err(error) => json_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            json!({ "code": "AX_SYSTEM_0002", "cause": error.to_string() }),
        ),
    }
}

impl CommandBus {
    fn execute(&mut self, command: &Value) -> Value {
        let started = Instant::now();
        let trace_id = text_field(command, "traceId")
            .unwrap_or("invalid")
            .to_owned();
        let correlation_id = text_field(command, "correlationId")
            .unwrap_or("invalid")
            .to_owned();
        let causation_id = text_field(command, "messageId").map(str::to_owned);
        let command_type = command.pointer("/payload/type").and_then(Value::as_str);
        let mut steps = vec![json!({
            "stage": "command.accepted",
            "atMs": 0.0,
            "command": command_type
        })];

        let payload = match self.apply(command, started, &mut steps) {
            Ok(payload) => payload,
            Err(detail) => {
                steps.push(json!({
                    "stage": "command.rejected",
                    "atMs": elapsed_ms(started),
                    "code": detail["code"]
                }));
                self.record_trace(json!({
                    "traceId": trace_id,
                    "correlationId": correlation_id,
                    "level": "normal",
                    "steps": steps,
                    "durationMs": elapsed_ms(started)
                }));
                return envelope(
                    "error",
                    detail,
                    &correlation_id,
                    &trace_id,
                    causation_id.as_deref(),
                );
            }
        };

        self.sequence += 1;
        let mut payload = payload;
        payload["sequence"] = json!(self.sequence);
        let event = envelope(
            "event",
            payload,
            &correlation_id,
            &trace_id,
            causation_id.as_deref(),
        );
        steps.push(json!({
            "stage": "event.emitted",
            "atMs": elapsed_ms(started),
            "event": event["payload"]["type"]
        }));
        self.record_event(event.clone());
        self.record_trace(json!({
            "traceId": trace_id,
            "correlationId": correlation_id,
            "level": "normal",
            "steps": steps,
            "durationMs": elapsed_ms(started)
        }));
        event
    }

    fn apply(
        &mut self,
        command: &Value,
        started: Instant,
        steps: &mut Vec<Value>,
    ) -> Result<Value, Value> {
        if command["protocolVersion"] != 1 || command["kind"] != "command" {
            return Err(diagnostic(
                "AX_PROTOCOL_0001",
                "Invalid command envelope",
                vec![json!({
                    "protocolVersion": command.get("protocolVersion"),
                    "kind": command.get("kind")
                })],
            ));
        }
        if ["messageId", "correlationId", "traceId"]
            .iter()
            .any(|field| text_field(command, field).is_none_or(str::is_empty))
            || command
                .pointer("/payload/type")
                .and_then(Value::as_str)
                .is_none_or(str::is_empty)
        {
            return Err(diagnostic(
                "AX_PROTOCOL_0002",
                "Command envelope is missing required identity fields",
                vec![],
            ));
        }
        if let Some(expected) = command.pointer("/payload/expectedRevision")
            && expected.as_u64() != Some(self.revision)
        {
            return Err(diagnostic(
                "AX_COMMAND_0003",
                "Expected revision does not match current revision",
                vec![json!({ "expected": expected, "actual": self.revision })],
            ));
        }

        match command
            .pointer("/payload/type")
            .and_then(Value::as_str)
            .unwrap_or_default()
        {
            "system.ping" => {
                steps.push(json!({ "stage": "system.ping.handled", "atMs": elapsed_ms(started) }));
                Ok(json!({
                    "type": "system.pong",
                    "data": {
                        "echo": command.pointer("/payload/data/echo")
                            .cloned()
                            .unwrap_or(Value::Null)
                    }
                }))
            }
            "demo.increment" => {
                let amount_value = command.pointer("/payload/data/amount");
                const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;
                let amount = parse_increment_amount(amount_value, MAX_SAFE_INTEGER);
                let current = amount.and_then(|value| self.counter.checked_add(value));
                if amount.is_none()
                    || amount == Some(0)
                    || current.is_none_or(|value| value.unsigned_abs() > MAX_SAFE_INTEGER as u64)
                {
                    return Err(diagnostic(
                        "AX_COMMAND_0004",
                        "Increment amount must be a non-zero safe integer",
                        vec![json!({ "received": amount_value })],
                    ));
                }
                let previous = self.counter;
                self.counter = current.unwrap_or(previous);
                self.revision += 1;
                self.undo.push(previous);
                steps.push(json!({
                    "stage": "demo.counter.mutated",
                    "atMs": elapsed_ms(started),
                    "previous": previous,
                    "current": self.counter
                }));
                Ok(json!({
                    "type": "demo.counterChanged",
                    "reasonCode": "AX_DEMO_0001",
                    "data": {
                        "previous": previous,
                        "current": self.counter,
                        "revision": self.revision
                    }
                }))
            }
            "editor.undo" => {
                let Some(restored) = self.undo.pop() else {
                    return Err(diagnostic(
                        "AX_COMMAND_0005",
                        "There is no command to undo",
                        vec![],
                    ));
                };
                let previous = self.counter;
                self.counter = restored;
                self.revision += 1;
                steps.push(json!({ "stage": "editor.undo.applied", "atMs": elapsed_ms(started) }));
                Ok(json!({
                    "type": "editor.commandUndone",
                    "reasonCode": "AX_EDITOR_0001",
                    "data": {
                        "previous": previous,
                        "current": self.counter,
                        "revision": self.revision
                    }
                }))
            }
            other => Err(diagnostic(
                "AX_COMMAND_0002",
                "Command type is not registered",
                vec![json!({ "type": other })],
            )),
        }
    }

    fn record_event(&mut self, event: Value) {
        if self.events.len() == MAX_EVENTS {
            self.events.pop_front();
        }
        self.events.push_back(event);
    }

    fn record_trace(&mut self, trace: Value) {
        let trace_id = trace["traceId"].as_str().unwrap_or("invalid").to_owned();
        if !self.traces.contains_key(&trace_id) {
            if self.trace_order.len() == MAX_TRACES
                && let Some(expired) = self.trace_order.pop_front()
            {
                self.traces.remove(&expired);
            }
            self.trace_order.push_back(trace_id.clone());
        }
        self.traces.insert(trace_id, trace);
    }
}

fn diagnostic(code: &str, cause: &str, evidence: Vec<Value>) -> Value {
    json!({
        "code": code,
        "subsystem": "command-bus",
        "severity": "error",
        "resource": null,
        "location": null,
        "cause": cause,
        "evidence": evidence,
        "suggestedInspections": ["describeError(code)", "trace(command.traceId)"]
    })
}

fn envelope(
    kind: &str,
    payload: Value,
    correlation_id: &str,
    trace_id: &str,
    causation_id: Option<&str>,
) -> Value {
    json!({
        "protocolVersion": 1,
        "messageId": Uuid::new_v4().to_string(),
        "kind": kind,
        "timestamp": Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
        "correlationId": correlation_id,
        "traceId": trace_id,
        "causationId": causation_id,
        "actor": { "kind": "system", "id": "axiom" },
        "payload": payload
    })
}

fn text_field<'a>(value: &'a Value, field: &str) -> Option<&'a str> {
    value.get(field).and_then(Value::as_str)
}

fn parse_increment_amount(value: Option<&Value>, maximum: i64) -> Option<i64> {
    let Some(value) = value.filter(|value| !value.is_null()) else {
        return Some(1);
    };
    if let Some(integer) = value.as_i64() {
        return (integer.unsigned_abs() <= maximum as u64).then_some(integer);
    }
    let number = value.as_f64()?;
    (number.is_finite() && number.fract() == 0.0 && number.abs() <= maximum as f64)
        .then_some(number as i64)
}

fn elapsed_ms(started: Instant) -> f64 {
    started.elapsed().as_secs_f64() * 1_000.0
}

fn json_response(status: StatusCode, value: Value) -> Response {
    (
        status,
        [
            (
                header::CONTENT_TYPE,
                HeaderValue::from_static("application/json; charset=utf-8"),
            ),
            (header::CACHE_CONTROL, HeaderValue::from_static("no-store")),
        ],
        Json(value),
    )
        .into_response()
}

fn with_security_headers(mut response: Response) -> Response {
    let headers = response.headers_mut();
    for (name, value) in [
        ("cross-origin-opener-policy", "same-origin"),
        ("cross-origin-embedder-policy", "require-corp"),
        ("cross-origin-resource-policy", "same-origin"),
        ("x-content-type-options", "nosniff"),
        ("referrer-policy", "no-referrer"),
        (
            "content-security-policy",
            "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        ),
    ] {
        headers.insert(
            axum::http::HeaderName::from_static(name),
            HeaderValue::from_static(value),
        );
    }
    response
}

fn generate_token() -> String {
    let mut bytes = [0_u8; 32];
    getrandom::fill(&mut bytes).expect("operating system random source unavailable");
    URL_SAFE_NO_PAD.encode(bytes)
}

async fn calculate_schema_hash(project_root: &FilePath) -> Result<String, DaemonError> {
    let mut hash = Sha256::new();
    for file in [
        "command.schema.json",
        "event.schema.json",
        "protocol-envelope.schema.json",
    ] {
        let path = project_root.join("protocol/schema").join(file);
        let content = tokio::fs::read(&path)
            .await
            .map_err(|error| DaemonError(format!("cannot read {}: {error}", path.display())))?;
        hash.update(content);
    }
    Ok(format!("sha256:{:x}", hash.finalize()))
}

fn discover_project_root() -> Option<PathBuf> {
    let current = env::current_dir().ok()?;
    current.ancestors().find_map(|candidate| {
        (candidate.join("protocol/schema").is_dir() && candidate.join("apps/editor").is_dir())
            .then(|| candidate.to_path_buf())
    })
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::{Body, to_bytes},
        http::Request,
    };
    use serde::Deserialize;
    use tower::ServiceExt;

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ParityVector {
        name: String,
        r#type: String,
        data: Value,
        expected_revision_input: Option<u64>,
        expected_kind: String,
        expected_type: Option<String>,
        expected_code: Option<String>,
        expected_counter: i64,
        expected_revision: u64,
    }

    fn command(command_type: &str, data: Value, expected_revision: Option<u64>) -> Value {
        let id = Uuid::new_v4().to_string();
        let mut payload = json!({ "type": command_type, "data": data });
        if let Some(expected) = expected_revision {
            payload["expectedRevision"] = json!(expected);
        }
        json!({
            "protocolVersion": 1,
            "messageId": Uuid::new_v4().to_string(),
            "kind": "command",
            "timestamp": Utc::now().to_rfc3339(),
            "correlationId": id,
            "traceId": id,
            "causationId": null,
            "actor": { "kind": "test", "id": "native-daemon-test" },
            "payload": payload
        })
    }

    #[test]
    fn default_policy_is_local_and_deny_by_default() {
        let policy = DaemonPolicy::default();
        assert!(policy.bind.ip().is_loopback());
        assert!(!policy.arbitrary_process_execution);
        assert!(!policy.system_filesystem_access);
    }

    #[test]
    fn native_command_bus_matches_mutation_revision_and_undo_contract() {
        let mut bus = CommandBus::default();
        let changed = bus.execute(&command("demo.increment", json!({ "amount": 3 }), None));
        assert_eq!(changed["payload"]["data"]["current"], 3);
        let stale = bus.execute(&command("demo.increment", json!({ "amount": 1 }), Some(0)));
        assert_eq!(stale["payload"]["code"], "AX_COMMAND_0003");
        assert_eq!(bus.counter, 3);
        let undone = bus.execute(&command("editor.undo", json!({}), None));
        assert_eq!(undone["payload"]["type"], "editor.commandUndone");
        assert_eq!(bus.counter, 0);
    }

    #[test]
    fn native_command_bus_satisfies_shared_parity_vectors() {
        let vectors: Vec<ParityVector> = serde_json::from_str(include_str!(
            "../../../protocol/fixtures/command-parity.json"
        ))
        .expect("parity vectors");
        let mut bus = CommandBus::default();
        for vector in vectors {
            let result = bus.execute(&command(
                &vector.r#type,
                vector.data,
                vector.expected_revision_input,
            ));
            assert_eq!(result["kind"], vector.expected_kind, "{}", vector.name);
            if let Some(expected) = vector.expected_type {
                assert_eq!(result["payload"]["type"], expected, "{}", vector.name);
            }
            if let Some(expected) = vector.expected_code {
                assert_eq!(result["payload"]["code"], expected, "{}", vector.name);
            }
            assert_eq!(bus.counter, vector.expected_counter, "{}", vector.name);
            assert_eq!(bus.revision, vector.expected_revision, "{}", vector.name);
        }
    }

    #[tokio::test]
    async fn native_http_adapter_accepts_browser_same_origin_handshake() {
        let project_root = discover_project_root().expect("project root");
        let state = create_state(&project_root, "http://127.0.0.1:4317", "test-token".into())
            .await
            .expect("state");
        let response = build_router(state)
            .oneshot(
                Request::builder()
                    .uri("/v1/handshake")
                    .header("authorization", "Bearer test-token")
                    .header("axiom-protocol-version", "1")
                    .header("sec-fetch-site", "same-origin")
                    .body(Body::empty())
                    .expect("request"),
            )
            .await
            .expect("response");
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers()["cross-origin-opener-policy"],
            "same-origin"
        );
        let body = to_bytes(response.into_body(), BODY_LIMIT)
            .await
            .expect("body");
        let handshake: Value = serde_json::from_slice(&body).expect("JSON");
        assert_eq!(handshake["protocol"]["selected"], 1);
    }

    #[tokio::test]
    async fn native_http_adapter_rejects_wrong_origin() {
        let project_root = discover_project_root().expect("project root");
        let state = create_state(&project_root, "http://127.0.0.1:4317", "test-token".into())
            .await
            .expect("state");
        let response = build_router(state)
            .oneshot(
                Request::builder()
                    .uri("/v1/handshake")
                    .header("authorization", "Bearer test-token")
                    .header("origin", "https://attacker.example")
                    .body(Body::empty())
                    .expect("request"),
            )
            .await
            .expect("response");
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }
}
