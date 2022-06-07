// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
    AlchemyWeb3,
    createAlchemyWeb3,
    GetNftsParams,
    Nft as AlchemyNft,
} from '@alch/alchemy-web3';

export interface NFT {
    /**
     * A descriptive name for the NFT
     */
    name: string;

    /**
     * The address of the collection contract
     */
    contract_address: string;

    /**
     * The token id associated with the source contract address
     */
    token_id: string;

    /**
     *  Uri representing the location of the NFT media asset. The uri often
     *  links to an image. The uri is parsed from the metadata and can be
     *  standard URLs pointing to images on conventional servers, IPFS, or
     *  Arweave. The image format can be SVGs, PNGs, JPEGs, etc.
     */
    media_uri?: string;
}

export interface NFTInfo {
    token: NFT;
    claim_status: 'none' | 'claimed';
    destination_sui_address?: string;
    sui_explorer_link?: string;
}

/**
 * Utility class for fetching NFT info
 */
export class NFTFetcher {
    /** @internal */ _alchemy: AlchemyWeb3;

    constructor() {
        this._alchemy = this.getAlchemyAPI();
    }

    public async getNFTInfoByAddress(address: string): Promise<NFTInfo[]> {
        return await this.getNFTInfo({ owner: address });
    }

    public async getNFTInfo(params: GetNftsParams): Promise<NFTInfo[]> {
        const nfts = await this.getNFTsByAddress(params);
        return nfts.map((token) => ({
            token,
            // TODO: check db to see if airdrop has been claimed or not
            claim_status: 'none',
        }));
    }

    private async getNFTsByAddress(params: GetNftsParams): Promise<NFT[]> {
        const nfts = await this._alchemy.alchemy.getNfts(params);
        return await Promise.all(
            nfts.ownedNfts.map((a) =>
                this.extractFieldsFromAlchemyNFT(a as AlchemyNft)
            )
        );
    }

    private async extractFieldsFromAlchemyNFT(
        alchemyNft: AlchemyNft
    ): Promise<NFT> {
        // TODO: look into using gateway uri https://docs.alchemy.com/alchemy/guides/nft-api-faq#understanding-nft-metadata
        const {
            title,
            metadata,
            id: { tokenId: token_id },
            contract: { address: contract_address },
        } = alchemyNft;
        const name = (await this.getTokenName(contract_address)) ?? title;
        return {
            contract_address,
            name,
            token_id,
            media_uri: metadata?.image,
        };
    }

    private getAlchemyAPI(): AlchemyWeb3 {
        // TODO: implement pagination
        const api_key = process.env.ALCHEMY_API_KEY || 'demo';
        return createAlchemyWeb3(
            `https://eth-mainnet.alchemyapi.io/v2/${api_key}`
        );
    }

    private async getTokenName(tokenContract: string) {
        try {
            const contractABI = require('./erc721.abi.json');
            const contractObject = new (this.getAlchemyAPI().eth.Contract)(
                contractABI,
                tokenContract
            );
            return await contractObject.methods.name().call();
        } catch (err) {
            console.error(
                `Encountered error fetching name for contract ${tokenContract}: ${err}`
            );
            return '';
        }
    }
}
