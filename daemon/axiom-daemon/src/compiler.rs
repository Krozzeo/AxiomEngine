//! Named compiler capability. No client-controlled executable, arguments or shell.
use std::{
    fs,
    io::{self, Read},
    path::Path,
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc,
    },
    thread,
    time::{Duration, Instant},
};
use uuid::Uuid;

const OUTPUT_LIMIT: usize = 256 * 1024;

#[derive(Clone, Copy, Debug)]
pub enum BuildMode {
    Development,
    Aot,
}

#[derive(Debug)]
pub struct CompilerResult {
    pub success: bool,
    pub output: String,
    pub reason: Option<String>,
}

/// Audit events carry the fixed capability and build identity, never source text.
#[derive(Debug)]
pub struct CompilerAudit<'a> {
    pub capability: &'static str,
    pub build: &'a str,
    pub stage: &'static str,
}

#[must_use]
pub fn arguments(mode: BuildMode) -> Vec<&'static str> {
    let mut args = vec![
        "publish",
        "Axiom.Game.csproj",
        "-c",
        "Release",
        "-o",
        "publish",
        "--disable-build-servers",
        "-p:ImportDirectoryBuildProps=false",
        "-p:ImportDirectoryBuildTargets=false",
        "-p:EnableDefaultCompileItems=false",
        "-p:WasmEnableHotReload=false",
    ];
    if matches!(mode, BuildMode::Aot) {
        args.extend(["-p:WasmBuildNative=true", "-p:RunAOTCompilation=true"]);
    }
    args
}

/// `root` is a daemon-authorized build root, not a value taken from an HTTP request.
/// The daemon creates the fixed template files before invoking this capability.
pub fn compile(
    root: &Path,
    build: &str,
    mode: BuildMode,
    cancelled: &AtomicBool,
    mut audit: impl FnMut(CompilerAudit<'_>),
) -> io::Result<CompilerResult> {
    if Uuid::parse_str(build)
        .map(|id| id.to_string() != build)
        .unwrap_or(true)
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Invalid build ID",
        ));
    }
    if fs::symlink_metadata(root)?.file_type().is_symlink() {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Build root is a link",
        ));
    }
    let authorized = root.canonicalize()?;
    let directory = authorized.join(build);
    if fs::symlink_metadata(&directory)?.file_type().is_symlink()
        || directory.canonicalize()?.parent() != Some(authorized.as_path())
    {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Build escapes capability",
        ));
    }
    for name in [
        "Axiom.Game.csproj",
        "Sdk.cs",
        "GeneratedComponents.cs",
        "Host.cs",
        "Game.cs",
        "global.json",
    ] {
        let info = fs::symlink_metadata(directory.join(name))?;
        if !info.is_file() || info.file_type().is_symlink() || info.len() > 65536 {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Invalid compiler input",
            ));
        }
    }
    if cancelled.load(Ordering::Relaxed) {
        return Ok(CompilerResult {
            success: false,
            output: String::new(),
            reason: Some("Compilation cancelled".into()),
        });
    }
    let mut command = Command::new("dotnet");
    command
        .args(arguments(mode))
        .current_dir(directory)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .env("DOTNET_CLI_TELEMETRY_OPTOUT", "1");
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }
    audit(CompilerAudit {
        capability: "script.compile.csharp",
        build,
        stage: "started",
    });
    let mut child = command.spawn()?;
    let (sender, receiver) = mpsc::sync_channel(16);
    let stdout = child.stdout.take().expect("piped stdout");
    let stderr = child.stderr.take().expect("piped stderr");
    let readers: Vec<_> = [Box::new(stdout) as Box<dyn Read + Send>, Box::new(stderr)]
        .into_iter()
        .map(|mut stream| {
            let sender = sender.clone();
            thread::spawn(move || {
                let mut buffer = [0; 4096];
                loop {
                    match stream.read(&mut buffer) {
                        Ok(0) | Err(_) => break,
                        Ok(n) => {
                            if sender.send(buffer[..n].to_vec()).is_err() {
                                break;
                            }
                        }
                    }
                }
            })
        })
        .collect();
    drop(sender);
    let start = Instant::now();
    let timeout = Duration::from_secs(if matches!(mode, BuildMode::Aot) {
        600
    } else {
        180
    });
    let mut output = Vec::new();
    let mut reason = None;
    let status = loop {
        while let Ok(chunk) = receiver.try_recv() {
            if output.len() + chunk.len() > OUTPUT_LIMIT {
                reason = Some("Compiler diagnostic limit exceeded".to_string());
                break;
            }
            output.extend(chunk);
        }
        if cancelled.load(Ordering::Relaxed) {
            reason = Some("Compilation cancelled".into());
        }
        if start.elapsed() >= timeout {
            reason = Some("Compilation timed out".into());
        }
        if reason.is_some() {
            #[cfg(unix)]
            {
                let _ = Command::new("/bin/kill")
                    .args(["-KILL", "--", &format!("-{}", child.id())])
                    .status();
            }
            #[cfg(windows)]
            {
                let _ = Command::new("taskkill")
                    .args(["/pid", &child.id().to_string(), "/T", "/F"])
                    .status();
            }
            let _ = child.kill();
            break child.wait()?;
        }
        if let Some(status) = child.try_wait()? {
            break status;
        }
        thread::sleep(Duration::from_millis(10));
    };
    // Drain reader channels before joining: a reader may be waiting on the bounded queue.
    for chunk in receiver {
        if output.len() + chunk.len() <= OUTPUT_LIMIT {
            output.extend(chunk);
        } else {
            reason.get_or_insert_with(|| "Compiler diagnostic limit exceeded".to_string());
        }
    }
    for reader in readers {
        let _ = reader.join();
    }
    audit(CompilerAudit {
        capability: "script.compile.csharp",
        build,
        stage: "finished",
    });
    Ok(CompilerResult {
        success: status.success() && reason.is_none(),
        output: String::from_utf8_lossy(&output).into_owned(),
        reason,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn named_templates_never_accept_shell_arguments() {
        assert_eq!(arguments(BuildMode::Development)[0], "publish");
        assert!(
            !arguments(BuildMode::Development)
                .iter()
                .any(|v| v.contains("RunAOTCompilation"))
        );
        assert!(arguments(BuildMode::Aot).contains(&"-p:RunAOTCompilation=true"));
        let cancelled = AtomicBool::new(false);
        assert!(
            compile(
                Path::new("."),
                "../escape",
                BuildMode::Development,
                &cancelled,
                |_| {}
            )
            .is_err()
        );
    }
}
