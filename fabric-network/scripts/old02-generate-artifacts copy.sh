#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="$ROOT/channel-artifacts"
CONFIG_DIR="$ROOT/config"
SYSTEM_GENESIS_DIR="$ROOT/system-genesis-block" 

# --- Configuration for our single channel ---
CHANNEL_NAME="lettucechannel"
CHANNEL_PROFILE="LettuceChannel" # Matches the profile name in configtx.yaml
# All organizations participating in this single channel
CHANNEL_ORGS="Admin Farmer Distributor Retailer"
# ------------------------------------------

export FABRIC_CFG_PATH="$CONFIG_DIR" # this points to the directory containing configtx.yaml

# clean and recreate output directory
echo "=> Cleaning and creating artifacts directory"
rm -rf "$ARTIFACTS" && mkdir -p "$ARTIFACTS"
mkdir -p "$SYSTEM_GENESIS_DIR" # Also need a dir for the orderer genesis block

# Generate the genesis block for the system channel (name: “orderersystem”)
# Note: The channelID for the system channel must match what's configured in your orderer's setup
SYSTEM_CHANNEL_ID="system-channel" # Default name used by Fabric
echo ""
echo "=================== Generating Genesis Block for Orderer ==================="
configtxgen \
  -profile "OrdererGenesis" \
  -channelID "$SYSTEM_CHANNEL_ID" \
  -outputBlock "$ROOT/system-genesis-block/genesis.block"
echo "✔ Created: $ROOT/system-genesis-block/genesis.block"
echo ""

# Generate channel creation tx file for lettucechannel
echo ""
echo "=================== Generating Channel Creation Tx for '$CHANNEL_NAME' ==================="
configtxgen \
  -profile "$CHANNEL_PROFILE" \
  -channelID "$CHANNEL_NAME" \
  -outputCreateChannelTx "$ARTIFACTS/$CHANNEL_NAME.tx" \
  -configPath "$CONFIG_DIR"
echo "✔ Created: $ARTIFACTS/$CHANNEL_NAME.tx"
echo ""

# Generate anchor peer update transactions for each organization on the single channel
echo ""
echo "=================== Generating Anchor Peer Update Transactions for '$CHANNEL_NAME' ==================="
read -r -a ORGS <<< "${CHANNEL_ORGS}" # Convert space-separated string to array

for ORG in "${ORGS[@]}"; do
  ANCHOR_TX="$ARTIFACTS/${ORG,,}anchors-${CHANNEL_NAME}.tx" # e.g., adminanchors-lettucechannel.tx
  
  echo ""
  echo "=> Generating anchor peer update for ${ORG}Org on channel $CHANNEL_NAME"
  configtxgen \
    -profile "$CHANNEL_PROFILE" \
    -channelID "$CHANNEL_NAME" \
    -asOrg "${ORG}Org" \
    -outputAnchorPeersUpdate "$ANCHOR_TX" \
    -configPath "$CONFIG_DIR"
  echo "✔ Created: $ANCHOR_TX"
  echo ""
done

echo ""
echo "=================================================================="
echo "✔ All channel artifacts created in $ARTIFACTS and system genesis block in $ROOT/system-genesis-block"
echo "=================================================================="