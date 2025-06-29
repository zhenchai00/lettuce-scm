import * as grpc from '@grpc/grpc-js';
import { connect, Contract, hash, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
import { fabricConfig } from '../config/fabric-config'; 

const utf8Decoder = new TextDecoder();

export class FabricGatewayService {
    private client: grpc.Client | null = null;
    private gateway: ReturnType<typeof connect> | null = null;
    private contract: Contract | null = null;
    private currentUserIdentity: Identity | string | null = null;

    constructor() {
        // Constructor can be empty, or initialize with default user if always the same
    }

    private async newGrpcConnection(tlsCertPath: string, peerEndpoint: string, peerHostAlias: string): Promise<grpc.Client> {
        const tlsRootCert = await fs.readFile(tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        return new grpc.Client(peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': peerHostAlias,
        });
    }

    private async newIdentity(certDirectoryPath: string, mspId: string): Promise<Identity> {
        const certPath = await this.getFirstDirFileName(certDirectoryPath);
        const credentials = await fs.readFile(certPath);
        return { mspId, credentials };
    }

    private async newSigner(keyDirectoryPath: string): Promise<Signer> {
        const keyPath = await this.getFirstDirFileName(keyDirectoryPath);
        const privateKeyPem = await fs.readFile(keyPath);
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        return signers.newPrivateKeySigner(privateKey);
    }

    private async getFirstDirFileName(dirPath: string): Promise<string> {
        const files = await fs.readdir(dirPath);
        const file = files.find(file => file.endsWith('sk') || file.endsWith('.pem')); // Look for .sk for private keys, or .pem for certs
        if (!file) {
            throw new Error(`No suitable files found in directory: ${dirPath}`);
        }
        return path.join(dirPath, file);
    }

    /**
     * Connects to the Fabric network using the specified user identity.
     * @param userIdentity The label of the user identity to use (e.g., 'User1@org1.example.com').
     */
    public async connect(userIdentity: string = fabricConfig.USER_IDENTITY): Promise<void> {
        // If already connected with the same user, no need to reconnect
        if (this.gateway && this.currentUserIdentity === userIdentity) {
            console.log('Already connected to Fabric network with the same user.');
            return;
        }

        // Close existing connections if user is changing
        if (this.gateway) {
            this.gateway.close();
            this.gateway = null;
        }
        if (this.client) {
            this.client.close();
            this.client = null;
        }

        console.log(`Connecting to Fabric network as user: ${userIdentity}`);
        try {
            const tlsCertPath = fabricConfig.getTlsCertPath(fabricConfig.PEER_NAME);
            const keyDirectoryPath = fabricConfig.getKeyDirectoryPath(userIdentity);
            const certDirectoryPath = fabricConfig.getCertDirectoryPath(userIdentity);

            this.client = await this.newGrpcConnection(tlsCertPath, fabricConfig.PEER_ENDPOINT, fabricConfig.PEER_HOST_ALIAS);

            this.gateway = connect({
                client: this.client,
                identity: await this.newIdentity(certDirectoryPath, fabricConfig.MSP_ID),
                signer: await this.newSigner(keyDirectoryPath),
                hash: hash.sha256,
                // Optional: set custom timeouts for gRPC calls
                evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
                endorseOptions: () => ({ deadline: Date.now() + 15000 }),
                submitOptions: () => ({ deadline: Date.now() + 5000 }),
                commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
            });

            const network = this.gateway.getNetwork(fabricConfig.CHANNEL_NAME);
            this.contract = network.getContract(fabricConfig.CHAINCODE_NAME);
            this.currentUserIdentity = userIdentity;
            console.log('Successfully connected to Fabric network.');

        } catch (error) {
            console.error(`Failed to connect to Fabric network: ${error}`);
            // Ensure client and gateway are closed on error
            if (this.gateway) this.gateway.close();
            if (this.client) this.client.close();
            this.gateway = null;
            this.client = null;
            this.contract = null;
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.gateway) {
            this.gateway.close();
            this.gateway = null;
        }
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        this.contract = null;
        this.currentUserIdentity = null;
        console.log('Disconnected from Fabric network.');
    }

    /**
     * Submits a transaction to the chaincode.
     * @param functionName The name of the chaincode function to invoke.
     * @param args Arguments for the chaincode function.
     * @returns The result of the transaction as a string.
     */
    public async submitTransaction(functionName: string, ...args: string[]): Promise<string> {
        if (!this.contract) {
            throw new Error('Not connected to Fabric network. Call connect() first.');
        }
        console.log(`\n--> Submit Transaction: ${functionName} with args: ${args}`);
        try {
            const resultBytes = await this.contract.submitTransaction(functionName, ...args);
            const result = utf8Decoder.decode(resultBytes);
            console.log(`*** Transaction committed successfully. Result: ${result}`);
            return result;
        } catch (error) {
            console.error(`Failed to submit transaction ${functionName}:`, error);
            throw error; // Re-throw to be handled by the caller
        }
    }

    /**
     * Evaluates a transaction (read-only query) on the chaincode.
     * @param functionName The name of the chaincode function to evaluate.
     * @param args Arguments for the chaincode function.
     * @returns The result of the query as a parsed JSON object (if parsable) or string.
     */
    public async evaluateTransaction(functionName: string, ...args: string[]): Promise<any> {
        if (!this.contract) {
            throw new Error('Not connected to Fabric network. Call connect() first.');
        }
        console.log(`\n--> Evaluate Transaction: ${functionName} with args: ${args}`);
        try {
            const resultBytes = await this.contract.evaluateTransaction(functionName, ...args);
            const resultJson = utf8Decoder.decode(resultBytes);
            try {
                const parsedResult = JSON.parse(resultJson);
                console.log(`*** Result:`, parsedResult);
                return parsedResult;
            } catch (jsonError) {
                console.log(`*** Result (non-JSON):`, resultJson);
                return resultJson;
            }
        } catch (error) {
            console.error(`Failed to evaluate transaction ${functionName}:`, error);
            throw error; // Re-throw to be handled by the caller
        }
    }

    /**
     * Initializes the ledger (calls InitLedger chaincode function).
     * This is typically a one-time operation.
     */
    public async initLedger(): Promise<void> {
        if (!this.contract) {
            throw new Error('Not connected to Fabric network. Call connect() first.');
        }
        console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
        await this.contract.submitTransaction('InitLedger');
        console.log('*** InitLedger transaction committed successfully');
    }
};