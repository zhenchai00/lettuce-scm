import { Gateway } from "fabric-network";
import * as fs from "fs";
import * as path from "path";
import { buildWallet } from "./wallet";

export const useGateway = async (msp: string) => {
    const ccpPath = path.resolve(process.cwd(),'src', 'config', 'fabric', `connection-${msp}.json`);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const wallet = await buildWallet();
    const identityLabel = `AppUser@${msp}`; // e.g., AppUser@AdminMSP
    const gateway = new Gateway();
    try {
        await gateway.connect(ccp, {
            wallet,
            identity: identityLabel,
            discovery: { enabled: true, asLocalhost: true }
        });
        return gateway;
    } catch (error) {
        console.error(`Failed to connect to fabric gateway: ${error}`);
        throw error;
    }
}