use axiom_daemon::{DaemonConfig, run};

#[tokio::main]
async fn main() {
    if let Err(error) = run(DaemonConfig::from_environment()).await {
        eprintln!("AX_DAEMON_0002: {error}");
        std::process::exit(1);
    }
}
