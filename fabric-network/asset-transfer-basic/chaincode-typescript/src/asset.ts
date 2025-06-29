/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

export enum EventType {
    PLANTED = 'PLANTED',
    HARVESTED = 'HARVESTED',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
}

@Object()
export class Asset {
    @Property()
    public id: string = '';

    @Property()
    public eventType: EventType = EventType.PLANTED;

    @Property()
    public timestamp: string = '';

    @Property()
    public txHash?: string = '';

    @Property()
    public quantity?: number = 0;

    @Property()
    public description?: string = '';

    @Property()
    public batchId: string = '';

    @Property()
    public shipmentId?: string = '';

    @Property()
    public userId: string = '';
}
