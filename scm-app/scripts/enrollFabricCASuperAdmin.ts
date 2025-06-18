import { buildCAClient } from "@/lib/fabric/caClient";
import { buildWallet } from "@/lib/fabric/wallet";

const main = async () => {
    const msp = "AdminMSP";
    const enrollmentId = "admin";
    const enrollmentSecret = "adminpw";
    const caClient = buildCAClient(`${msp}-init`);
    const wallet = await buildWallet();

    // only enroll if the user is not already enrolled
    if (await wallet.get(enrollmentId)) {
        console.log("User already enrolled:", enrollmentId);
        return;
    }

    const enrollment = await caClient.enroll({
        enrollmentID: enrollmentId,
        enrollmentSecret,
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: msp,
        type: 'X.509' as const,
    };

    await wallet.put(enrollmentId, x509Identity);
    console.log("User enrolled successfully:", enrollmentId);
}

main().catch(console.error);