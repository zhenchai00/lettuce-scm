import * as fs from 'fs';
import * as path from 'path';
import { Wallets } from 'fabric-network';

const main = async () => {
    // build a file-system wallet
    const walletPath = path.resolve(__dirname, '../wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // for each orgs
    const orgs = [
        {
            msp: "AdminMSP",
            dir: "../../fabric-network/crypto-config/peerOrganizations/admin.example.com/users/User1@admin.example.com/msp",
        },
        {
            msp: "FarmerMSP",
            dir: "../../fabric-network/crypto-config/peerOrganizations/farmer.example.com/users/User1@farmer.example.com/msp",
        },
        {
            msp: "DistributorMSP",
            dir: "../../fabric-network/crypto-config/peerOrganizations/distributor.example.com/users/User1@distributor.example.com/msp",
        },
        {
            msp: "RetailerMSP",
            dir: "../../fabric-network/crypto-config/peerOrganizations/retailer.example.com/users/User1@retailer.example.com/msp",
        },
    ];

    for (const { msp, dir } of orgs) {
        const mspPath = path.resolve(__dirname, dir);
        const certPath = path.join(mspPath, 'signcerts', fs.readdirSync(path.join(mspPath, 'signcerts'))[0]);
        const keyDir = path.join(mspPath, 'keystore');
        const keyPath = path.join(keyDir, fs.readdirSync(keyDir)[0]);

        const certificate = fs.readFileSync(certPath).toString();
        const privateKey = fs.readFileSync(keyPath).toString();

        const identityLabel = `AppUser@${msp}`; // e.g., AppUser@AdminMSP
        const identity = {
            credentials: {
                certificate,
                privateKey,
            },
            mspId: msp,
            type: 'X.509' as const,
        };

        // Check if the identity already exists
        if (await wallet.get(identityLabel)) {
            console.log(`Identity ${identityLabel} already exists in the wallet.`);
        }
        else {
            // Add the identity to the wallet
            await wallet.put(identityLabel, identity);
            console.log(`Identity ${identityLabel} added to the wallet.`);
        }
    }
}

main().catch(console.error);