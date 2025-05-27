#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS=$ROOT/channel-artifacts
CHANNEL_NAME=lettuce
ORDERER_CHANNEL=orderersystem
PROFILE_ORDERER=OrdererGenesis
PROFILE_APP=LettuceChannel

# 1) Clean and recreate output dir
rm -rf $ARTIFACTS && mkdir -p $ARTIFACTS

# 2) Export FABRIC_CFG_PATH so configtxgen reads your configtx.yaml
export FABRIC_CFG_PATH=$ROOT

# 3) Generate the genesis block for the system channel (name: “orderersystem”)
configtxgen \
  -profile "$PROFILE_ORDERER" \
  -channelID "$ORDERER_CHANNEL" \
  -outputBlock $ARTIFACTS/genesis.block

# 4) Generate a channel creation tx (name: “supplychain”)
configtxgen \
  -profile "$PROFILE_APP" \
  -outputCreateChannelTx $ARTIFACTS/"$CHANNEL_NAME".tx \
  -channelID "$CHANNEL_NAME"

# 5) For each org, generate an anchor peer update tx
orgs=( Admin Farmer Distributor Retailer )
for ORG in "${orgs[@]}"; do
  AS_ORG="${ORG}Org"

  configtxgen \
    -profile "$PROFILE_APP" \
    -channelID "$CHANNEL_NAME" \
    -asOrg "$AS_ORG" \
    -outputAnchorPeersUpdate "$ARTIFACTS"/"${ORG,,}"anchors.tx

  echo "  ↳ Generated ${ORG,,}anchors.tx for org $AS_ORG"
done

echo "✔ Channel artifacts created in $ARTIFACTS"