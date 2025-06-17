// Please refer to https://www.prisma.io/docs/getting-started/quickstart
// for more information on how to use Prisma Client

import { PrismaClient } from "generated/prisma";

declare global {
    var globalPrisma: PrismaClient | undefined;
}

let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
} else {
    if (!global.globalPrisma) {
        global.globalPrisma = new PrismaClient();
    }
    prisma = global.globalPrisma;
}

export default prisma;
