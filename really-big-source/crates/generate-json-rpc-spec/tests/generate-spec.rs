// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

const GENERATE_JSON_RPC_SPEC_BIN: &str = env!("CARGO_BIN_EXE_generate-json-rpc-spec");

#[test]
fn test_json_rpc_spec() {
    // If this test breaks and you intended a json rpc schema change, you need to run to get the fresh schema:
    // # cargo -q run --bin generate-json-rpc-spec -- record
    let status = std::process::Command::new(GENERATE_JSON_RPC_SPEC_BIN)
        .arg("test")
        .status()
        .expect("failed to execute process");
    assert!(status.success());
}
