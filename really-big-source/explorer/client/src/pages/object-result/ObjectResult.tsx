// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import ErrorResult from '../../components/error-result/ErrorResult';
import { NetworkContext } from '../../context';
import theme from '../../styles/theme.module.css';
import { DefaultRpcClient as rpc } from '../../utils/api/DefaultRpcClient';
import { IS_STATIC_ENV } from '../../utils/envUtil';
import ObjectLoaded from './ObjectLoaded';
import {
    instanceOfDataType,
    translate,
    type DataType,
} from './ObjectResultType';

const DATATYPE_DEFAULT: DataType = {
    id: '',
    category: '',
    owner: '',
    version: '',
    objType: '',
    data: {
        contents: {},
        owner: { ObjectOwner: [] },
        tx_digest: '',
    },
    loadState: 'pending',
};

const Fail = ({ objID }: { objID: string | undefined }): JSX.Element => {
    return (
        <ErrorResult
            id={objID}
            errorMsg="Data could not be extracted on the following specified object ID"
        />
    );
};

const ObjectResultAPI = ({ objID }: { objID: string }): JSX.Element => {
    const [showObjectState, setObjectState] = useState(DATATYPE_DEFAULT);
    const [network] = useContext(NetworkContext);
    useEffect(() => {
        rpc(network)
            .getObject(objID as string)
            .then((objState) => {
                setObjectState({
                    ...(translate(objState) as DataType),
                    loadState: 'loaded',
                });
            })
            .catch((error) => {
                console.log(error);
                setObjectState({ ...DATATYPE_DEFAULT, loadState: 'fail' });
            });
    }, [objID, network]);

    if (showObjectState.loadState === 'loaded') {
        return <ObjectLoaded data={showObjectState as DataType} />;
    }
    if (showObjectState.loadState === 'pending') {
        return (
            <div className={theme.pending}>Please wait for results to load</div>
        );
    }
    if (showObjectState.loadState === 'fail') {
        return <Fail objID={objID} />;
    }

    return <div>"Something went wrong"</div>;
};

const ObjectResultStatic = ({ objID }: { objID: string }): JSX.Element => {
    const { findDataFromID } = require('../../utils/static/searchUtil');
    const data = findDataFromID(objID, undefined);

    if (instanceOfDataType(data)) {
        return <ObjectLoaded data={data} />;
    } else {
        try {
            return <ObjectLoaded data={translate(data)} />;
        } catch (err) {
            console.error("Couldn't parse data", err);
            return <Fail objID={objID} />;
        }
    }
};

const ObjectResult = (): JSX.Element => {
    const { id: objID } = useParams();
    const { state } = useLocation();

    if (instanceOfDataType(state)) {
        return <ObjectLoaded data={state} />;
    }

    if (objID !== undefined) {
        return IS_STATIC_ENV ? (
            <ObjectResultStatic objID={objID} />
        ) : (
            <ObjectResultAPI objID={objID} />
        );
    }

    return <Fail objID={objID} />;
};

export { ObjectResult };
export type { DataType };
