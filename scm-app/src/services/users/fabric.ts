import { buildCAClient } from "@/lib/fabric/caClient";
import { buildWallet } from "@/lib/fabric/wallet";
import prisma from "@/lib/prisma";

export const enrollUserFromFabricCa = async (
    enrollmentId: string,
    enrollmentSecret: string,
    affiliation: string,
    role: string = "client",
    msp: string,
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
    })
    if (users) {
        await prisma.user.update({
            where: { email: enrollmentId },
            data: {
                fabricEnrollment: true,
            },
        });
    }
    console.log("User fabric enrollment status updated successfully:", enrollmentId, true);
};

export const revokeUserFromFabricCa = async (enrollmentId: string, msp: string) => {
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
    })
    if (users) {
        await prisma.user.update({
            where: { email: enrollmentId },
            data: {
                fabricEnrollment: false,
            },
        });
    }
    console.log("User fabric enrollment status updated successfully:", enrollmentId, false);
};
