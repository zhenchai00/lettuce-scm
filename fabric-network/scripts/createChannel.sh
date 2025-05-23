#!/usr/bin/env bash
set -e

CHANNEL_NAME=lettucechannel
ORDERER_ADDRESS=orderer.example.com:7050

# environment to use AdminOrg admin identity
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_MSPCONFIGPATH=crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp
export CORE_PEER_ADDRESS=peer0.admin.example.com:7051

echo "🛰️ Creating channel ${CHANNEL_NAME}..."
peer channel create \
    -o $ORDERER_ADDRESS \
    -c $CHANNEL_NAME \
    -f ./channel.tx \

# have each org's peer0 join
for ORG in admin farmer distributor retailer; do
    MSP_PATH=crypto-config/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp
    PEER_ADDRESS=peer0.${ORG}.example.com:$( [ $ORG == admin ] && echo 7051 || [ $ORG == farmer ] && echo 8051 || [ $ORG == distributor ] && echo 9051 || echo 10051 )
    MSPID=$( echo $ORG | awk '{print toupper(substr($))})0,1,1)) substr($0,2)"OrgMSP"}' )

    export CORE_PEER_LOCALMSPID=$MSPID
    export CORE_PEER_MSPCONFIGPATH=$MSP_PATH
    export CORE_PEER_ADDRESS=$PEER_ADDRESS

    echo "➡️ peer0.${ORG} joining channel ${CHANNEL_NAME}..."
    peer channel join \
        -b ${CHANNEL_NAME}.block
done

echo "✅ All peers have joined ${CHANNEL_NAME}"