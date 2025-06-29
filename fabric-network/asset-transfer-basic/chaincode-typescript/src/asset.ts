/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from "fabric-contract-api";

export enum EventType {
    PLANTED = "PLANTED",
    HARVESTED = "HARVESTED",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
}

@Object()
export class Asset {
    @Property()
    public id: string;

    @Property()
    public docType?: string;

    @Property()
    public eventType: EventType;

    @Property()
    public timestamp: string;

    @Property()
    public txHash?: string;

    @Property()
    public quantity?: number;

    @Property()
    public description?: string;

    @Property()
    public batchId: string;

    @Property()
    public shipmentId?: string;

    @Property()
    public userId: string;

    constructor(
      id: string,
      docType: string = "productEvent",
      eventType: EventType,
      timestamp: string,
      txHash: string,
      batchId: string,
      userId: string,
      quantity?: number,
      description?: string,
      shipmentId?: string
    ) {
        this.id = id;
        this.docType = docType;
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.txHash = txHash;
        this.quantity = quantity;
        this.description = description;
        this.batchId = batchId;
        this.shipmentId = shipmentId;
        this.userId = userId;
    }
}
