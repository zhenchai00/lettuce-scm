#!/bin/bash
set -euo pipefail

CHAINCODE_TAR="../chaincode/lettuce-contract.tar.gz"
CC_NAME="lettuce"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_POLICY="OR('AdminMSP.member','FarmerMSP.member','DistributorMSP.member','RetailerMSP.member')"
CHANNELS=("farmer-distributor" "distributor-retailer" "retailer-consumer")

echo "=> Installing chaincode on all peers..."

PEERS=(
  "peer0.admin.example.com"
  "peer0.farmer.example.com"
  "peer0.distributor.example.com"
  "peer0.retailer.example.com"
)

for PEER in "${PEERS[@]}"; do
  echo "=> Installing chaincode on $PEER"
  docker exec -it "$PEER" peer lifecycle chaincode package "$CC_NAME.tar.gz" \
    --path "../chaincode/lettuce-contract" \
    --label "$CC_NAME-$CC_VERSION"

  docker exec -it "$PEER" peer lifecycle chaincode install "$CC_NAME.tar.gz"
done

echo ""
echo "=> Approving and committing chaincode definition on each channel..."

for CHANNEL_NAME in "${CHANNELS[@]}"; do
  echo ""
  echo "=================== Channel: $CHANNEL_NAME ==================="

  # Approve for AdminOrg
  docker exec -it peer0.admin.example.com peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --channelID "$CHANNEL_NAME" \
    --name "$CC_NAME" \
    --version "$CC_VERSION" \
    --package-id "lettuce-1.0:$(docker exec -it peer0.admin.example.com peer lifecycle chaincode queryinstalled | grep -o 'PackageID:.*' | awk '{print $2}' | sed 's/,//')" \
    --sequence "$CC_SEQUENCE" \
    --signature-policy "$CC_POLICY"

  # Commit for AdminOrg
  docker exec -it peer0.admin.example.com peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --channelID "$CHANNEL_NAME" \
    --name "$CC_NAME" \
    --version "$CC_VERSION" \
    --sequence "$CC_SEQUENCE" \
    --signature-policy "$CC_POLICY"
done

echo ""
echo "✔ Chaincode installed and instantiated on all channels!"