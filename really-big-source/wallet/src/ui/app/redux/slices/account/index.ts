// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
    createAsyncThunk,
    createSelector,
    createSlice,
} from '@reduxjs/toolkit';
import Browser from 'webextension-polyfill';

import { suiObjectsAdapterSelectors } from '_redux/slices/sui-objects';
import { Coin } from '_redux/slices/sui-objects/Coin';
import { generateMnemonic } from '_shared/cryptography/mnemonics';

import type { SuiAddress, SuiMoveObject } from '@mysten/sui.js';
import type { PayloadAction } from '@reduxjs/toolkit';

export const loadAccountFromStorage = createAsyncThunk(
    'account/loadAccount',
    async (): Promise<string | null> => {
        const { mnemonic } = await Browser.storage.local.get('mnemonic');
        return mnemonic || null;
    }
);

export const createMnemonic = createAsyncThunk(
    'account/createMnemonic',
    async (existingMnemonic?: string): Promise<string> => {
        const mnemonic = existingMnemonic || generateMnemonic();
        await Browser.storage.local.set({ mnemonic });
        return mnemonic;
    }
);

export const logout = createAsyncThunk(
    'account/logout',
    async (): Promise<void> => {
        await Browser.storage.local.set({ mnemonic: null });
        window.location.reload();
    }
);

type AccountState = {
    loading: boolean;
    mnemonic: string | null;
    creating: boolean;
    createdMnemonic: string | null;
    address: SuiAddress | null;
};

const initialState: AccountState = {
    loading: true,
    mnemonic: null,
    creating: false,
    createdMnemonic: null,
    address: null,
};

const accountSlice = createSlice({
    name: 'account',
    initialState,
    reducers: {
        setMnemonic: (state, action: PayloadAction<string>) => {
            state.mnemonic = action.payload;
        },
        setAddress: (state, action: PayloadAction<string | null>) => {
            state.address = action.payload;
        },
    },
    extraReducers: (builder) =>
        builder
            .addCase(loadAccountFromStorage.fulfilled, (state, action) => {
                state.loading = false;
                state.mnemonic = action.payload;
            })
            .addCase(createMnemonic.pending, (state) => {
                state.creating = true;
            })
            .addCase(createMnemonic.fulfilled, (state, action) => {
                state.creating = false;
                state.createdMnemonic = action.payload;
            })
            .addCase(createMnemonic.rejected, (state) => {
                state.creating = false;
                state.createdMnemonic = null;
            }),
});

export const { setMnemonic, setAddress } = accountSlice.actions;

export default accountSlice.reducer;

export const accountCoinsSelector = createSelector(
    suiObjectsAdapterSelectors.selectAll,
    (allSuiObjects) => {
        return allSuiObjects
            .filter(Coin.isCoin)
            .map((aCoin) => aCoin.data as SuiMoveObject);
    }
);

// return an aggregate balance for each coin type
export const accountAggregateBalancesSelector = createSelector(
    accountCoinsSelector,
    (coins) => {
        return coins.reduce((acc, aCoin) => {
            const coinType = Coin.getCoinTypeArg(aCoin);
            if (coinType) {
                if (typeof acc[coinType] === 'undefined') {
                    acc[coinType] = BigInt(0);
                }
                acc[coinType] += Coin.getBalance(aCoin);
            }
            return acc;
        }, {} as Record<string, bigint>);
    }
);

// return a list of balances for each coin object for each coin type
export const accountItemizedBalancesSelector = createSelector(
    accountCoinsSelector,
    (coins) => {
        return coins.reduce((acc, aCoin) => {
            const coinType = Coin.getCoinTypeArg(aCoin);
            if (coinType) {
                if (typeof acc[coinType] === 'undefined') {
                    acc[coinType] = [];
                }
                acc[coinType].push(Coin.getBalance(aCoin));
            }
            return acc;
        }, {} as Record<string, bigint[]>);
    }
);

export const accountNftsSelector = createSelector(
    suiObjectsAdapterSelectors.selectAll,
    (allSuiObjects) => {
        return allSuiObjects.filter((anObj) => !Coin.isCoin(anObj));
    }
);
