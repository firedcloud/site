// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use move_binary_format::{
    access::ModuleAccess,
    binary_views::BinaryIndexedView,
    file_format::{AbilitySet, Bytecode, FunctionDefinition, SignatureToken, Visibility},
    CompiledModule,
};
use move_core_types::{account_address::AccountAddress, ident_str, identifier::IdentStr};
use sui_types::{
    base_types::{
        STD_OPTION_MODULE_NAME, STD_OPTION_STRUCT_NAME, TX_CONTEXT_MODULE_NAME,
        TX_CONTEXT_STRUCT_NAME,
    },
    error::{SuiError, SuiResult},
    id::{ID_MODULE_NAME, ID_STRUCT_NAME},
    MOVE_STDLIB_ADDRESS, SUI_FRAMEWORK_ADDRESS,
};

use crate::{format_signature_token, resolve_struct};

pub const INIT_FN_NAME: &IdentStr = ident_str!("init");

/// Checks valid rules rules for entry points, both for module initialization and transactions
///
/// For module initialization
/// - The existence of the function is optional
/// - The function must have the name specified by `INIT_FN_NAME`
/// - The function must have `Visibility::Private`
/// - The function can have a single parameter: &mut TxContext (see `is_tx_context`)
/// - Alternatively, the function can have zero parameters
///
/// For transaction entry points
/// - The function must have `Visibility::Script`
/// - The function must have at least one parameter: &mut TxContext (see `is_tx_context`)
///   - The transaction context parameter must be the last parameter
/// - The function cannot have any return values
pub fn verify_module(module: &CompiledModule) -> SuiResult {
    for func_def in &module.function_defs {
        verify_init_not_called(module, func_def)
            .map_err(|error| SuiError::ModuleVerificationFailure { error })?;

        let handle = module.function_handle_at(func_def.function);
        let name = module.identifier_at(handle.name);
        if name == INIT_FN_NAME {
            verify_init_function(module, func_def)
                .map_err(|error| SuiError::ModuleVerificationFailure { error })?;
            continue;
        }

        // find candidate entry functions and checke their parameters
        // (ignore other functions)
        if func_def.visibility != Visibility::Script {
            // it's not an entry function as a non-script function
            // cannot be called from Sui
            continue;
        }
        verify_entry_function_impl(module, func_def)
            .map_err(|error| SuiError::ModuleVerificationFailure { error })?;
    }
    Ok(())
}

fn verify_init_not_called(
    module: &CompiledModule,
    fdef: &FunctionDefinition,
) -> Result<(), String> {
    let code = match &fdef.code {
        None => return Ok(()),
        Some(code) => code,
    };
    code.code
        .iter()
        .enumerate()
        .filter_map(|(idx, instr)| match instr {
            Bytecode::Call(fhandle_idx) => Some((idx, module.function_handle_at(*fhandle_idx))),
            Bytecode::CallGeneric(finst_idx) => {
                let finst = module.function_instantiation_at(*finst_idx);
                Some((idx, module.function_handle_at(finst.handle)))
            }
            _ => None,
        })
        .try_for_each(|(idx, fhandle)| {
            let name = module.identifier_at(fhandle.name);
            if name == INIT_FN_NAME {
                Err(format!(
                    "{}::{} at offset {}. Cannot call a module's '{}' function from another Move function",
                    module.self_id(),
                    name,
                    idx,
                    INIT_FN_NAME
                ))
            } else {
                Ok(())
            }
        })
}

/// Checks if this module has a conformant `init`
fn verify_init_function(module: &CompiledModule, fdef: &FunctionDefinition) -> Result<(), String> {
    let view = &BinaryIndexedView::Module(module);

    if fdef.visibility != Visibility::Private {
        return Err(format!(
            "{}. '{}' function must be private",
            module.self_id(),
            INIT_FN_NAME
        ));
    }

    let fhandle = module.function_handle_at(fdef.function);
    if !fhandle.type_parameters.is_empty() {
        return Err(format!(
            "{}. '{}' function cannot have type parameters",
            module.self_id(),
            INIT_FN_NAME
        ));
    }

    if !view.signature_at(fhandle.return_).0.is_empty() {
        return Err(format!(
            "{}, '{}' function cannot have return values",
            module.self_id(),
            INIT_FN_NAME
        ));
    }

    let parameters = &view.signature_at(fhandle.parameters).0;
    if parameters.len() != 1 {
        return Err(format!(
            "Expected exactly one parameter for {}::{}  of type &mut {}::{}::{}",
            module.self_id(),
            INIT_FN_NAME,
            SUI_FRAMEWORK_ADDRESS,
            TX_CONTEXT_MODULE_NAME,
            TX_CONTEXT_STRUCT_NAME,
        ));
    }

    if is_tx_context(view, &parameters[0]) {
        Ok(())
    } else {
        Err(format!(
            "Expected parameter for {}::{} to be &mut mut {}::{}::{}, but found {}",
            module.self_id(),
            INIT_FN_NAME,
            SUI_FRAMEWORK_ADDRESS,
            TX_CONTEXT_MODULE_NAME,
            TX_CONTEXT_STRUCT_NAME,
            format_signature_token(view, &parameters[0]),
        ))
    }
}

fn verify_entry_function_impl(
    module: &CompiledModule,
    func_def: &FunctionDefinition,
) -> Result<(), String> {
    let view = &BinaryIndexedView::Module(module);
    let handle = view.function_handle_at(func_def.function);
    let params = view.signature_at(handle.parameters);

    let all_non_ctx_params = match params.0.last() {
        Some(last_param) if is_tx_context(view, last_param) => &params.0[0..params.0.len() - 1],
        _ => &params.0,
    };
    for param in all_non_ctx_params {
        verify_param_type(view, &handle.type_parameters, param)?;
    }

    let return_ = view.signature_at(handle.return_);
    if !return_.is_empty() {
        return Err(format!(
            "Entry function {} cannot have return values",
            view.identifier_at(handle.name)
        ));
    }

    Ok(())
}

fn verify_param_type(
    view: &BinaryIndexedView,
    function_type_args: &[AbilitySet],
    param: &SignatureToken,
) -> Result<(), String> {
    if is_primitive(view, function_type_args, param) {
        return Ok(());
    }

    if is_object(view, function_type_args, param)? {
        Ok(())
    } else {
        Err(format!(
            "Invalid entry point parameter type. Expected primitive or object type. Got: {}",
            format_signature_token(view, param)
        ))
    }
}

pub const RESOLVED_SUI_ID: (&AccountAddress, &IdentStr, &IdentStr) =
    (&SUI_FRAMEWORK_ADDRESS, ID_MODULE_NAME, ID_STRUCT_NAME);
pub const RESOLVED_STD_OPTION: (&AccountAddress, &IdentStr, &IdentStr) = (
    &MOVE_STDLIB_ADDRESS,
    STD_OPTION_MODULE_NAME,
    STD_OPTION_STRUCT_NAME,
);

fn is_primitive(
    view: &BinaryIndexedView,
    function_type_args: &[AbilitySet],
    s: &SignatureToken,
) -> bool {
    match s {
        SignatureToken::Bool
        | SignatureToken::U8
        | SignatureToken::U64
        | SignatureToken::U128
        | SignatureToken::Address => true,
        SignatureToken::Signer => false,
        // optimistic, but no primitive has key
        SignatureToken::TypeParameter(idx) => !function_type_args[*idx as usize].has_key(),

        SignatureToken::Struct(idx) => {
            let resolved_struct = resolve_struct(view, *idx);
            resolved_struct == RESOLVED_SUI_ID
        }

        SignatureToken::StructInstantiation(idx, targs) => {
            let resolved_struct = resolve_struct(view, *idx);
            // is option of a primitive
            resolved_struct == RESOLVED_STD_OPTION
                && targs.len() == 1
                && is_primitive(view, function_type_args, &targs[0])
        }

        SignatureToken::Vector(inner) => is_primitive(view, function_type_args, inner),
        SignatureToken::Reference(_) | SignatureToken::MutableReference(_) => false,
    }
}

pub fn is_tx_context(view: &BinaryIndexedView, p: &SignatureToken) -> bool {
    match p {
        SignatureToken::MutableReference(m) => match &**m {
            SignatureToken::Struct(idx) => {
                let (module_addr, module_name, struct_name) = resolve_struct(view, *idx);
                module_name == TX_CONTEXT_MODULE_NAME
                    && module_addr == &SUI_FRAMEWORK_ADDRESS
                    && struct_name == TX_CONTEXT_STRUCT_NAME
            }
            _ => false,
        },
        _ => false,
    }
}

pub fn is_object(
    view: &BinaryIndexedView,
    function_type_args: &[AbilitySet],
    t: &SignatureToken,
) -> Result<bool, String> {
    use SignatureToken as S;
    match t {
        S::Reference(inner) | S::MutableReference(inner) | S::Vector(inner) => {
            is_object(view, function_type_args, inner)
        }
        _ => is_object_struct(view, function_type_args, t),
    }
}

fn is_object_struct(
    view: &BinaryIndexedView,
    function_type_args: &[AbilitySet],
    s: &SignatureToken,
) -> Result<bool, String> {
    use SignatureToken as S;
    match s {
        S::Bool
        | S::U8
        | S::U64
        | S::U128
        | S::Address
        | S::Signer
        | S::Vector(_)
        | S::Reference(_)
        | S::MutableReference(_) => Ok(false),
        S::TypeParameter(idx) => Ok(function_type_args
            .get(*idx as usize)
            .map(|abs| abs.has_key())
            .unwrap_or(false)),
        S::Struct(_) | S::StructInstantiation(_, _) => {
            let abilities = view
                .abilities(s, function_type_args)
                .map_err(|vm_err| vm_err.to_string())?;
            Ok(abilities.has_key())
        }
    }
}
