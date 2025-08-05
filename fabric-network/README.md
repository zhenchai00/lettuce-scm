# Fabric Network 

To run the fabric infrastructure, you need to have Docker installed and running on your machine. The following steps will guide you through the process of setting up the Fabric network and deploying the asset transfer chaincode.

> This configuration is based on the Hyperledger Fabric test network. You can find more details in the [Hyperledger Fabric documentation](https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html).

```bash
# access the test-network directory
cd test-network

# Start the Fabric network with setup a channel
./network.sh up createChannel -c mychannel -s couchdb

# Deploy the asset transfer chaincode written in TypeScript
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript -ccl typescript -c mychannel


# To retrieve all assets
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'

# To retrieve the product journey
peer chaincode query -C mychannel -n basic -c '{"function":"GetProductJourney","Args":["<product-batch-id>","<shipment-id>","<user-id>"]}'

```