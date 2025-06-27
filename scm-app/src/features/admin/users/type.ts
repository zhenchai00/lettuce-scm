export type UserData = {
    name: string
    email: string
    role: "ADMIN" | "FARMER" | "DISTRIBUTOR" | "RETAILER"
}

export type UserRow = {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
    updatedAt: string
}

export type CreateUserData = UserData & {
    password: string
}

export type UpdateUserData = {
    id: string
    data: UserData
}

export const UserMSPMapping: Record<string, string> = {
    ADMIN: "AdminMSP",
    FARMER: "FarmerMSP",
    DISTRIBUTOR: "DistributorMSP",
    RETAILER: "RetailerMSP",
}