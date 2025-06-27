export const PRODUCE_TYPES = [
    "BUTTERHEAD",
    "LOOSELEAF",
    "OAKLEAF",
    "ROMAINE",
    "SPINACH",
] as const;

export const USER_ROLES = [
    "ADMIN",
    "FARMER",
    "DISTRIBUTOR",
    "RETAILER",
] as const;

export const SHIPMENT_STATUS = [
    "ORDERED",
    "OUTOFDELIVERY",
    "DELIVERED",
    "CANCELLED",
] as const;
