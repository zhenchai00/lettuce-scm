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

## Idea on configuration of the Hyperledger Fabric network
Because of this lettuce supply chain project, we need to have multiple roles in system and the system able to manage the roles which including the action create and remove of the roles.
The roles are:
- Admin
- Farmer
- Distributor
- Retailer

So because of this, the configuration for the network will be a bit different from the default configuration. Because of the network is a permissioned network, we need to have a dynamic enrollment and revoke of the roles to each organizations of the network. 

# Setup The Network
To set up the network, we will run the following commands in the terminal:
```bash
./scripts/01-cryptogen.sh
./scripts/02-generate-artifacts.sh

docker-compose -f docker-compose.yaml --profile peer up -d

./scripts/03-setup-channel.sh
```

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
docker-compose up -d orderer.example.com peer0.farmer.example.com peer0.distributor.example.com peer0.retailer.example.com

```


couchdb admin
```markdown
http://localhost:5984/_utils/
admin: admin
password: adminpw
```

## URLs for Accessing the Network
| URL | Description |
|-----|-------------|
| http://localhost:5984/_utils/ | CouchDB Admin UI for Admin peer |
| http://localhost:7054/health | Health check for CA server (Orderer) |



## Docker Containers and Ports
| Docker Container | Port | Description |
|------------------|------|-------------|
| ca-orderer       | 7054 | CA server for Orderer organization |
| ca-admin         | 8054 | CA server for Admin organization |
| ca-farmer        | 9054 | CA server for Farmer organization |
| ca-distributor   | 10054| CA server for Distributor organization |
| ca-retailer      | 11054| CA server for Retailer organization |
| admin couchdb  | 5984 | CouchDB instance for Admin peer |
| farmer couchdb  | 6984 | CouchDB instance for Farmer peer |
| distributor couchdb | 7984 | CouchDB instance for Distributor peer |
| retailer couchdb | 8984 | CouchDB instance for Retailer peer |
| orderer          | 7050 | Orderer node |
| peer0.admin      | 8051 | Peer node for Admin organization |
| peer0.farmer     | 9051 | Peer node for Farmer organization |
| peer0.distributor| 10051 | Peer node for Distributor organization |
| peer0.retailer   | 11051 | Peer node for Retailer organization |