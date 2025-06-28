#!/usr/bin/env bash
set -euxo pipefail

#
# 04-install-batch-chaincode.sh
# Host-side script to package, install, approve & commit "batchcc"
#

# ————————————————————————————————————————————————
# CONFIGURATION
# ————————————————————————————————————————————————
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_CONTAINER="cli"
CHANNEL="farmer-distributor"
CC_NAME="batchcc"
CC_VERSION="1.0"
CC_SEQUENCE=1
CC_LANG="node"
CC_LABEL="${CC_NAME}_${CC_VERSION}"
HOST_CC_PATH="${ROOT}/chaincode/batchcc/dist"
PACKAGE_TGZ="${ROOT}/chaincode/${CC_NAME}.tar.gz"

# MSPs and peers to install on:
#   format: "<OrgMSP>;<cli-peer-address>;<msp-path-in-container>"
PEERS=(
  "AdminMSP;peer0.admin.example.com:8051;/etc/hyperledger/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
  "FarmerMSP;peer0.farmer.example.com:9051;/etc/hyperledger/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp"
)

# ————————————————————————————————————————————————
# 1) PACKAGE chaincode on the host
# ————————————————————————————————————————————————
rm -f "$PACKAGE_TGZ"
echo
echo "→ Packaging chaincode '$CC_NAME' v$CC_VERSION for channel '$CHANNEL'"
peer lifecycle chaincode package "$PACKAGE_TGZ" \
  --path "$HOST_CC_PATH" \
  --lang "$CC_LANG" \
  --label "$CC_LABEL"

echo
echo "✔ Packaged chaincode to $PACKAGE_TGZ"

# ————————————————————————————————————————————————
# 2) COPY package into CLI container
# ————————————————————————————————————————————————
docker cp "$PACKAGE_TGZ" "${CLI_CONTAINER}:/tmp/${CC_NAME}.tar.gz"
echo
echo "✔ Copied package into ${CLI_CONTAINER}:/tmp/${CC_NAME}.tar.gz"

# ————————————————————————————————————————————————
# 3) INSTALL & APPROVE for each org
# ————————————————————————————————————————————————
for entry in "${PEERS[@]}"; do
  IFS=";" read -r MSP PEER_ADDR MSP_PATH <<< "$entry"

  echo
  echo "→ Installing on $MSP @ $PEER_ADDR"

  docker exec "$CLI_CONTAINER" bash -lc "\
    CORE_PEER_LOCALMSPID=${MSP} \
    CORE_PEER_MSPCONFIGPATH=${MSP_PATH} \
    CORE_PEER_ADDRESS=${PEER_ADDR} \
    peer lifecycle chaincode install /tmp/${CC_NAME}.tar.gz
  "

  echo "   ↪ Querying installed package ID…"
  PKG_ID=\$\(docker exec "$CLI_CONTAINER" bash -lc "\
    peer lifecycle chaincode queryinstalled \
      | awk '/${CC_LABEL}/ {print \\\$3}' \
      | sed 's/,//'
  "\)
  echo "   ↪ Package ID is $PKG_ID"

  echo "   ↪ Approving for org $MSP on channel $CHANNEL…"
  docker exec "$CLI_CONTAINER" bash -lc "\
    CORE_PEER_LOCALMSPID=${MSP} \
    CORE_PEER_MSPCONFIGPATH=${MSP_PATH} \
    peer lifecycle chaincode approveformyorg \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --package-id ${PKG_ID} \
      --sequence ${CC_SEQUENCE} \
      --init-required
  "
done

# ————————————————————————————————————————————————
# 4) COMMIT chaincode definition (once)
# ————————————————————————————————————————————————
# Build up --peerAddresses args
PEER_ADDR_ARGS=()
for entry in "${PEERS[@]}"; do
  PEER_ADDR=\$(echo \$entry | cut -d: -f2)
  PEER_ADDR_ARGS+=(--peerAddresses \${PEER_ADDR})
done

docker exec "$CLI_CONTAINER" bash -lc "\
  peer lifecycle chaincode commit \
    --channelID ${CHANNEL} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --init-required \
    ${PEER_ADDR_ARGS[*]} \
    --orderer orderer.example.com:7050
"

echo "✔ Chaincode '${CC_NAME}' v${CC_VERSION} committed on channel '${CHANNEL}'"
