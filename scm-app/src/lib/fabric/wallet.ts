import { Wallet, Wallets } from 'fabric-network';
import * as path from 'path';

export const buildWallet = async (): Promise<Wallet> => {
    const walletPath = path.join(__dirname, '../wallet');
    console.log(`Using wallet path: ${walletPath}`);
    const wallet = Wallets.newFileSystemWallet(walletPath);
    return wallet;
}