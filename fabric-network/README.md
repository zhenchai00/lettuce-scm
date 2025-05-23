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
