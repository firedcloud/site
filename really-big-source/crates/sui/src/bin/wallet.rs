// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use std::{
    io,
    io::{stderr, stdout, Write},
    ops::Deref,
    path::PathBuf,
};

use async_trait::async_trait;
use clap::*;
use jsonrpsee::http_client::HttpClientBuilder;
use tracing::debug;

use colored::Colorize;
use sui::{
    config::{GatewayType, WalletConfig},
    keystore::KeystoreType,
    shell::{
        install_shell_plugins, AsyncHandler, CacheKey, CommandStructure, CompletionCache, Shell,
    },
    wallet_commands::*,
};
use sui_config::{sui_config_dir, Config, SUI_DEV_NET_URL, SUI_WALLET_CONFIG};
use sui_types::exit_main;

const SUI: &str = "   _____       _    _       __      ____     __
  / ___/__  __(_)  | |     / /___ _/ / /__  / /_
  \\__ \\/ / / / /   | | /| / / __ `/ / / _ \\/ __/
 ___/ / /_/ / /    | |/ |/ / /_/ / / /  __/ /_
/____/\\__,_/_/     |__/|__/\\__,_/_/_/\\___/\\__/";

#[derive(Parser)]
#[clap(
    name = "wallet",
    about = "A Byzantine fault tolerant chain with low-latency finality and high throughput",
    rename_all = "kebab-case"
)]
struct ClientOpt {
    #[clap(short, global = true)]
    /// Start interactive wallet
    interactive: bool,
    /// Sets the file storing the state of our user accounts (an empty one will be created if missing)
    #[clap(long)]
    config: Option<PathBuf>,
    /// Subcommands. Acceptable values are transfer, query_objects, benchmark, and create_accounts.
    #[clap(subcommand)]
    cmd: Option<WalletCommands>,
    /// Return command outputs in json format.
    #[clap(long, global = true)]
    json: bool,
}

async fn try_main() -> Result<(), anyhow::Error> {
    let _guard = telemetry_subscribers::TelemetryConfig::new(env!("CARGO_BIN_NAME"))
        .with_log_file("wallet.log")
        .with_env()
        .init();

    if let Some(git_rev) = std::option_env!("GIT_REV") {
        debug!("Wallet built at git revision {git_rev}");
    }

    let mut app: Command = ClientOpt::command();
    app = app.no_binary_name(false);
    let options: ClientOpt = ClientOpt::from_arg_matches(&app.get_matches())?;

    let wallet_conf_path = options
        .config
        .clone()
        .unwrap_or(sui_config_dir()?.join(SUI_WALLET_CONFIG));

    // Prompt user for connect to gateway if config not exists.
    if !wallet_conf_path.exists() {
        print!(
            "Config file [{:?}] doesn't exist, do you want to connect to a Sui Gateway [yN]?",
            wallet_conf_path
        );
        if matches!(read_line(), Ok(line) if line.trim().to_lowercase() == "y") {
            print!("Sui Gateway Url (Default to Sui DevNet if not specified) : ");
            let url = read_line()?;
            let url = if url.trim().is_empty() {
                SUI_DEV_NET_URL
            } else {
                &url
            };

            // Check url is valid
            HttpClientBuilder::default().build(url)?;
            let keystore_path = wallet_conf_path
                .parent()
                .unwrap_or(&sui_config_dir()?)
                .join("wallet.key");
            let keystore = KeystoreType::File(keystore_path);
            let new_address = keystore.init()?.add_random_key()?;
            WalletConfig {
                accounts: vec![new_address],
                keystore,
                gateway: GatewayType::RPC(url.to_string()),
                active_address: Some(new_address),
            }
            .persisted(&wallet_conf_path)
            .save()?;
        }
    }

    let mut context = WalletContext::new(&wallet_conf_path)?;

    // Sync all accounts on start up.
    // Do not sync if command is a gateway switch, as the current gateway might be unreachable and causes sync to panic.
    if !matches!(
        options.cmd,
        Some(WalletCommands::Switch {
            gateway: Some(_),
            ..
        })
    ) {
        for address in context.config.accounts.clone() {
            WalletCommands::SyncClientState {
                address: Some(address),
            }
            .execute(&mut context)
            .await?;
        }
    }

    let mut out = stdout();

    if options.interactive {
        let app: Command = WalletCommands::command();
        writeln!(out, "{}", SUI.cyan().bold())?;
        let mut version = app
            .get_long_version()
            .unwrap_or_else(|| app.get_version().unwrap_or("unknown"))
            .to_owned();
        if let Some(git_rev) = std::option_env!("GIT_REV") {
            version.push('-');
            version.push_str(git_rev);
        }
        writeln!(out, "--- sui wallet {version} ---")?;
        writeln!(out)?;
        writeln!(out, "{}", context.config.deref())?;
        writeln!(out, "Welcome to the Sui interactive shell.")?;
        writeln!(out)?;

        let mut shell = Shell::new(
            "sui>-$ ".bold().green(),
            context,
            ClientCommandHandler,
            CommandStructure::from_clap(&install_shell_plugins(app)),
        );

        shell.run_async(&mut out, &mut stderr()).await?;
    } else if let Some(cmd) = options.cmd {
        cmd.execute(&mut context).await?.print(!options.json);
    } else {
        ClientOpt::command().print_long_help()?
    }
    Ok(())
}

fn read_line() -> Result<String, anyhow::Error> {
    let mut s = String::new();
    let _ = stdout().flush();
    io::stdin().read_line(&mut s)?;
    Ok(s.trim_end().to_string())
}

#[tokio::main]
async fn main() {
    exit_main!(try_main().await)
}

struct ClientCommandHandler;

#[async_trait]
impl AsyncHandler<WalletContext> for ClientCommandHandler {
    async fn handle_async(
        &self,
        args: Vec<String>,
        context: &mut WalletContext,
        completion_cache: CompletionCache,
    ) -> bool {
        match handle_command(get_command(args), context, completion_cache).await {
            Err(e) => {
                let _err = writeln!(stderr(), "{}", e.to_string().red());
                false
            }
            Ok(return_value) => return_value,
        }
    }
}

fn get_command(args: Vec<String>) -> Result<WalletOpts, anyhow::Error> {
    let app: Command = install_shell_plugins(WalletOpts::command());
    Ok(WalletOpts::from_arg_matches(
        &app.try_get_matches_from(args)?,
    )?)
}

async fn handle_command(
    wallet_opts: Result<WalletOpts, anyhow::Error>,
    context: &mut WalletContext,
    completion_cache: CompletionCache,
) -> Result<bool, anyhow::Error> {
    let wallet_opts = wallet_opts?;
    let result = wallet_opts.command.execute(context).await?;

    // Update completion cache
    // TODO: Completion data are keyed by strings, are there ways to make it more error proof?
    if let Ok(mut cache) = completion_cache.write() {
        match result {
            WalletCommandResult::Addresses(ref addresses) => {
                let addresses = addresses
                    .iter()
                    .map(|addr| format!("{addr}"))
                    .collect::<Vec<_>>();
                cache.insert(CacheKey::flag("--address"), addresses.clone());
                cache.insert(CacheKey::flag("--to"), addresses);
            }
            WalletCommandResult::Objects(ref objects) => {
                let objects = objects
                    .iter()
                    .map(|oref| format!("{}", oref.object_id))
                    .collect::<Vec<_>>();
                cache.insert(CacheKey::new("object", "--id"), objects.clone());
                cache.insert(CacheKey::flag("--gas"), objects.clone());
                cache.insert(CacheKey::flag("--coin-object-id"), objects);
            }
            _ => {}
        }
    }
    result.print(!wallet_opts.json);

    // Quit shell after gateway switch
    if matches!(
        result,
        WalletCommandResult::Switch(SwitchResponse {
            gateway: Some(_),
            ..
        })
    ) {
        println!("Gateway switch completed, please restart wallet.");
        return Ok(true);
    }
    Ok(false)
}
