# Configure Hyperledger Fabric Network
This folder is about the configuration of the Hyperledger Fabric network. 

## Prerequisites
- Docker
- Hyperledger Fabric binaries

## Configuration 
first we run the script `install-fabric.sh` to install the required version of Hyperledger Fabric and its dependencies. 
```bash
./install-fabric.sh
```
Then we run the script `generate-artifacts.sh` to create the network. 
```bash
./scripts/generate-artifacts.sh
```
This script will create the necessary artifacts for the network, including the channel configuration and the genesis block.


## Idea on configuration of the Hyperledger Fabric network
Because of this lettuce supply chain project, we need to have multiple roles in system and the system able to manage the roles which including the action create and remove of the roles.
The roles are:
- Admin
- Farmer
- Distributor
- Retailer

So because of this, the configuration for the network will be a bit different from the default configuration. Because of the network is a permissioned network, we need to have a dynamic enrollment and revoke of the roles to each organizations of the network. 


## Folder Structure 
```
    fabric-network/          # Fabric network configurations and scripts
    ├── bin/                 # Fabric binaries
    ├── builders/            # Builders for chaincode
    ├── ca-server/           # CA server configurations for each org
    ├── config/              # Configuration files (e.g., ca-config.yaml)
    ├── crypto-config/       # Generated MSPs and crypto materials
    ├── scripts/             # Automation scripts (e.g., enrollment scripts)
    ├── configtx.yaml        # Channel configuration
    └── docker-compose.yaml  # Docker Compose setup for CA servers
```



external command 
```bash

rm -rf ./ca-server/*/fabric-ca-server.db ./ca-server/*/msp ./ca-server/*/Issue* ./ca-server/*/*.pem crypto-config

docker-compose down
docker-compose up -d

docker-compose up -d ca-orderer ca-admin ca-farmer ca-distributor ca-retailer

```