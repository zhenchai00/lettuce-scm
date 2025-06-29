/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Asset, EventType} from './asset';
import { randomUUID } from 'crypto';

@Info({title: 'AssetTransfer', description: 'Smart contract for trading assets'})
export class AssetTransferContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        console.info('============= START : InitLedger ===========');

        const assets: Asset[] = [
            {
                id: 'event001',
                eventType: EventType.PLANTED,
                timestamp: '2025-06-29T08:37:26.000Z',
                txHash: 'txhash1',
                quantity: 100,
                description: 'Planting event',
                batchId: 'batch1',
                shipmentId: 'shipment1',
                userId: 'user1',
            },
            {
                id: 'event002',
                eventType: EventType.HARVESTED,
                timestamp: '2025-06-29T08:38:06.000Z',
                txHash: 'txhash2',
                quantity: 100,
                description: 'Harvesting event',
                batchId: 'batch1',
                shipmentId: 'shipment1',
                userId: 'user1',
            },
            {
                id: 'event003',
                eventType: EventType.SHIPPED,
                timestamp: '2025-06-29T08:39:29.000Z',
                txHash: 'txhash3',
                quantity: 100,
                description: 'Shipping event',
                batchId: 'batch1',
                shipmentId: 'shipment1',
                userId: 'user1',
            },
            {
                id: 'event004',
                eventType: EventType.DELIVERED,
                timestamp: '2025-06-29T08:40:36.000Z',
                txHash: 'txhash4',
                quantity: 100,
                description: 'Delivery event',
                batchId: 'batch1',
                shipmentId: 'shipment1',
                userId: 'user1',
            },
            {
                id: 'event005',
                eventType: EventType.SHIPPED,
                timestamp: '2025-06-29T08:41:26.000Z',
                txHash: 'txhash5',
                quantity: 100,
                description: 'Shipping event',
                batchId: 'batch1',
                shipmentId: 'shipment1',
                userId: 'user1',
            },
            {
                id: 'event006',
                eventType: EventType.DELIVERED,
                timestamp: '2025-06-29T08:42:26.000Z',
                txHash: 'txhash6',
                quantity: 100,
                description: 'Delivery event',
                batchId: 'batch1',
                shipmentId: 'shipment1',
                userId: 'user1',
            },
        ];

        for (const asset of assets) {
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.id, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.info(`Asset ${asset.id} initialized`);
        }
        console.info('============= END : InitLedger ===========');
    }

    // CreateAsset issues a new asset to the world state with given details.
    @Transaction()
    public async CreateAsset(
        ctx: Context,
        eventDetails: string,
    ): Promise<void> {
        console.info('============= START : CreateAsset ===========');
        const asset: Partial<Asset> = JSON.parse(eventDetails) as Asset;

        if (!asset.eventType || !asset.batchId || !asset.userId) {
            throw new Error('Event type, batch ID, and user ID are required');
        }
        if (!Object.values(EventType).includes(asset.eventType)) {
            throw new Error(`Invalid event type: ${asset.eventType}`);
        }
        if ((asset.eventType === EventType.SHIPPED || asset.eventType === EventType.DELIVERED) && !asset.shipmentId) {
            throw new Error(`Shipment ID is required for ${asset.eventType} events.`);
        }
        if ((asset.eventType === EventType.PLANTED || asset.eventType === EventType.HARVESTED) && asset.shipmentId) {
            console.warn(`Shipment ID provided for ${asset.eventType} event. It will be ignored.`);
            asset.shipmentId = undefined; // Or set to an empty string
        }

        const productEventId = asset.id || randomUUID().toString();
        const exists = await this.AssetExists(ctx, productEventId);
        if (exists) {
            throw new Error(`The asset ${productEventId} already exists`);
        }

        const txTimestamp = ctx.stub.getTxTimestamp();
        const timestampMs = (txTimestamp.seconds.toNumber() * 1000) + (txTimestamp.nanos / 1000000);
        const timestampISO = new Date(timestampMs).toISOString();
        const txHash = ctx.stub.getTxID();

        const newProductEvent: Asset = {
            id: productEventId,
            docType: 'productEvent',
            eventType: asset.eventType,
            timestamp: timestampISO,
            txHash: txHash,
            quantity: asset.quantity,
            description: asset.description,
            batchId: asset.batchId,
            shipmentId: asset.shipmentId || '',
            userId: asset.userId,
        };

        await ctx.stub.putState(productEventId, Buffer.from(JSON.stringify(sortKeysRecursive(newProductEvent))));
        console.info(`Asset ${productEventId} created successfully`);
        console.info('============= END : CreateAsset ===========');
    }

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadAsset(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    @Transaction(false)
    @Returns('string')
    public async GetProductJourney(
        ctx: Context,
        batchId: string,
        shipmentId?: string
    ): Promise<string> {
        let queryString = {
            selector: {
                docType: 'productEvent',
                batchId: batchId,
            } as Record<string, unknown>,
            sort: [{ timestamp: 'asc' }],
        };
        if (shipmentId && shipmentId !== '') {
            queryString.selector['shipmentId'] = shipmentId;
        }

        console.info(`Executing rich query: ${JSON.stringify(queryString)}`);
        const queryResults = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results: Asset[] = [];

        let current = await queryResults.next();
        while (!current.done) {
            if (current.value && current.value.value) {
                const asset = JSON.parse(current.value.value.toString()) as Asset;
                results.push(asset);
            }
            current = await queryResults.next();
        }
        return stringify(sortKeysRecursive(results));
    };

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    @Transaction()
    public async UpdateAsset(
        ctx: Context,
        eventDetails: string,
    ): Promise<void> {
        console.info('============= START : UpdateAsset ===========');
        const incomingAsset: Partial<Asset> = JSON.parse(eventDetails) as Partial<Asset>;

        if (!incomingAsset.id) {
            throw new Error('Asset ID is required for update');
        }

        const exists = await this.AssetExists(ctx, incomingAsset.id);
        if (!exists) {
            throw new Error(`The asset ${incomingAsset.id} does not exist`);
        }

        const oldAssetBytes = await ctx.stub.getState(incomingAsset.id);
        const oldAsset: Asset = JSON.parse(oldAssetBytes.toString()) as Asset;

        const txTimestamp = ctx.stub.getTxTimestamp();
        const timestampMs = (txTimestamp.seconds.toNumber() * 1000) + (txTimestamp.nanos / 1000000);
        const timestampISO = new Date(timestampMs).toISOString();

        const updatedAsset: Asset = {
            ...oldAsset,
            ...incomingAsset,
            id: oldAsset.id,
            timestamp: timestampISO,
            txHash: ctx.stub.getTxID(),
        };

        if (incomingAsset.eventType && !Object.values(EventType).includes(incomingAsset.eventType)) {
            throw new Error(`Invalid event type: ${incomingAsset.eventType}`);
        }

        console.info('============= END : UpdateAsset ===========');
        return ctx.stub.putState(
            incomingAsset.id, 
            new Uint8Array(Buffer.from(stringify(sortKeysRecursive(updatedAsset))))
        );
    }

    // DeleteAsset deletes an given asset from the world state.
    @Transaction()
    public async DeleteAsset(ctx: Context, id: string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON.length > 0;
    }

    // GetAllAssets returns all assets found in the world state.
    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue) as Asset;
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}
