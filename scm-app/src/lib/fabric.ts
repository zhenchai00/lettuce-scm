import { fabricConfig } from "@/config/fabric-config";
import { FabricGatewayService } from "./fabric-gateway-service"

export const _fabricGatewayService = new FabricGatewayService();

let connectionPromise: Promise<void> | null = null;

export const getFabricService = async (): Promise<FabricGatewayService> => {
    if (_fabricGatewayService["contract"] !== null) {
        console.log("Fabric gateway service already connected.");
        return _fabricGatewayService;
    }

    if (connectionPromise) {
        console.log("Awaiting existing Fabric connection...");
        await connectionPromise;
        return _fabricGatewayService;
    }

    console.log("Initializing connection to Fabric gateway service...");
    connectionPromise = _fabricGatewayService.connect(fabricConfig.USER_IDENTITY)
        .then(() => {
            console.log("Fabric gateway service connected successfully.");
            return;
        })
        .catch((error) => {
            console.error("Failed to connect to Fabric gateway service:", error);
            connectionPromise = null; // Reset promise on failure
            throw error;
        }
    );

    await connectionPromise;
    return _fabricGatewayService;
};