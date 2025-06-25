import { buildCAClient } from "@/lib/fabric/caClient";
import { buildWallet } from "@/lib/fabric/wallet";
import prisma from "@/lib/prisma";
import FabricCAServices from "fabric-ca-client";
import * as fs from "fs";
import * as path from "path";

const enrollAdmin = async (msp: string) => {
    // this is the bootstrap identity you supplied with `fabric-ca-server start -b admin:adminpw`
    const caInfo = JSON.parse(
        fs.readFileSync(
            path.resolve(process.cwd(), "src/config/fabric", `ca-${msp}.json`),
            "utf8"
        )
    );
    const caClient = new FabricCAServices(
        caInfo.url,
        {
            trustedRoots: [
                fs.readFileSync(
                    path.resolve(__dirname, "..", "..", caInfo.tlsCertPem.path),
                    "utf8"
                ),
            ],
            verify: false,
        },
        caInfo.caName
    );

    const wallet = await buildWallet();
    // only enroll “OrgAdmin” once
    if (await wallet.get("OrgAdmin")) {
        console.log("Admin already enrolled:", "OrgAdmin");
        return;
    }

    const enrollment = await caClient.enroll({
        enrollmentID: "admin",
        enrollmentSecret: "adminpw",
    });
    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: msp,
        type: "X.509",
    };
    await wallet.put("OrgAdmin", x509Identity);
    console.log("Admin enrolled successfully:", "OrgAdmin");
};

export const registerAndEnrollUser = async (
    enrollmentId: string,
    role: string,
    affiliation: string,
    msp: string
) => {
    // make sure the admin is in the wallet
    await enrollAdmin(msp);
    // build ca client and wallet
    const caInfo = JSON.parse(
        fs.readFileSync(
            path.resolve(process.cwd(), "src/config/fabric", `ca-${msp}.json`),
            "utf8"
        )
    );
    const caClient = new FabricCAServices(
        caInfo.url,
        {
            trustedRoots: [
                fs.readFileSync(
                    path.resolve(__dirname, "..", "..", caInfo.tlsCertPem.path),
                    "utf8"
                ),
            ],
            verify: false,
        },
        caInfo.caName
    );
    const wallet = await buildWallet();

    // get OrgAdmin's user context
    const adminIdentity = await wallet.get("OrgAdmin");
    if (!adminIdentity) {
        console.error("Admin identity not found in wallet");
        throw new Error("Admin identity not found in wallet");
    }
    const provider = wallet
        .getProviderRegistry()
        .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "OrgAdmin");

    // register the new user (will throw error if user already exists)
    const secret = await caClient.register(
        {
            affiliation,
            enrollmentID: enrollmentId,
            role,
            attrs: [
                {
                    name: "hf.Affiliation",
                    value: affiliation,
                    ecert: true,
                },
                {
                    name: "hf.Type",
                    value: role,
                    ecert: true,
                },
            ],
        },
        adminUser
    );

    // enroll the new user, storing its certs and key in the wallet
    const enrollment = await caClient.enroll({
        enrollmentID: enrollmentId,
        enrollmentSecret: secret,
        attr_reqs: [
            {
                name: "hf.Affiliation",
                optional: false,
            },
            {
                name: "hf.Type",
                optional: false,
            },
        ],
    });
    const userIdentity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: msp,
        type: "X.509",
    };
    await wallet.put(enrollmentId, userIdentity);
    console.log(
        "User enrolled successfully:",
        enrollmentId,
        "with role:",
        role,
        secret
    );
    return {
        enrollmentId,
        secret,
    };
};

export const revokeUserFromFabricCA = async (
    enrollmentId: string,
    msp: string
) => {
    // enroll admin if needed
    await enrollAdmin(msp);
    // build ca client and wallet
    const caInfo = JSON.parse(
        fs.readFileSync(
            path.resolve(process.cwd(), "src/config/fabric", `ca-${msp}.json`),
            "utf8"
        )
    );
    const caClient = new FabricCAServices(
        caInfo.url,
        {
            trustedRoots: [
                fs.readFileSync(
                    path.resolve(__dirname, "..", "..", caInfo.tlsCertPem.path),
                    "utf8"
                ),
            ],
            verify: false,
        },
        caInfo.caName
    );
    const wallet = await buildWallet();

    // get OrgAdmin's user context
    const adminIdentity = await wallet.get("OrgAdmin");
    if (!adminIdentity) {
        console.error("Admin identity not found in wallet");
        throw new Error("Admin identity not found in wallet");
    }
    const provider = wallet
        .getProviderRegistry()
        .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "OrgAdmin");

    // revoke the user
    await caClient.revoke({ enrollmentID: enrollmentId }, adminUser);
    // remove the user from the wallet
    await wallet.remove(enrollmentId);
    console.log("User revoked successfully from fabric network:", enrollmentId);
    return { enrollmentId };
};

export const enrollUserFromFabricCa = async (
    enrollmentId: string,
    enrollmentSecret: string,
    affiliation: string,
    role: string = "client",
    msp: string
) => {
    const caClient = buildCAClient(msp);
    const wallet = await buildWallet();

    if (await wallet.get(enrollmentId)) {
        console.log("User already enrolled:", enrollmentId);
        throw new Error(
            `User with email ${enrollmentId} already enrolled in the CA`
        );
    }

    // Enroll with ca
    const enrollment = await caClient.enroll({
        enrollmentID: enrollmentId,
        enrollmentSecret,
        attr_reqs: [
            {
                name: "hf.Type",
                optional: false,
            },
            {
                name: "hf.Affiliation",
                optional: false,
            },
        ],
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: msp,
        type: "X.509",
    };
    await wallet.put(enrollmentId, x509Identity);
    console.log("User enrolled successfully:", enrollmentId);

    const users = await prisma.user.findFirst({
        where: { email: enrollmentId },
    });
    if (users) {
        await prisma.user.update({
            where: { email: enrollmentId },
            data: {
                fabricEnrollment: true,
            },
        });
    }
    console.log(
        "User fabric enrollment status updated successfully:",
        enrollmentId,
        true
    );
};

export const revokeUserFromFabricCa = async (
    enrollmentId: string,
    msp: string
) => {
    const caClient = buildCAClient(msp);
    const wallet = await buildWallet();

    // need the admin identity to revoke the user
    const adminIdentity = await wallet.get("OrgAdmin");
    if (!adminIdentity) {
        throw new Error("Admin identity not found in wallet");
    }

    const provider = wallet
        .getProviderRegistry()
        .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "OrgAdmin");

    // Revoke the user
    await caClient.revoke({ enrollmentID: enrollmentId }, adminUser);
    await wallet.remove(enrollmentId);
    console.log("User revoked successfully from fabric network:", enrollmentId);

    const users = await prisma.user.findFirst({
        where: { email: enrollmentId },
    });
    if (users) {
        await prisma.user.update({
            where: { email: enrollmentId },
            data: {
                fabricEnrollment: false,
            },
        });
    }
    console.log(
        "User fabric enrollment status updated successfully:",
        enrollmentId,
        false
    );
};
