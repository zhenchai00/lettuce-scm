#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# 03-setup-channels.sh
#
# Creates each channel (farmer-distributor, distributor-retailer, retailer-consumer),
# has the appropriate peers join, and updates anchor peers—without relying on
# a users/<Admin> folder. Instead, we use the org-level MSP under
# crypto-config/peerOrganizations/<org>.example.com/msp, because that contains
# the CA-admin’s certificates (enrolled by 01-ca-flow.sh).
#
# Prerequisites:
# 1) 01-ca-flow.sh and 02-generate-artifacts.sh have both successfully run.
#    - crypto material is under crypto-config/
#    - channel TX files + anchor TX files are under channel-artifacts/
# 2) Orderer is running on localhost:7050, peers are running on 7051/8051/9051/10051.
# 3) TLS is disabled (no --tls, --cafile flags are used).
# 4) peer/orderer/configtxgen binaries (v2.5) are in fabric-network/bin.
# 5) A minimal core.yaml lives in tmp-config/ so peer CLI does not attempt to load
#    a missing MSP path.
# ──────────────────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_CONFIG_DIR="${ROOT}/tmp-config"
CRYPTO_BASE="${ROOT}/crypto-config"
CHANNEL_ARTIFACTS="${ROOT}/channel-artifacts"

# 1) Create tmp-config/ with a minimal core.yaml (no mspConfigPath).
# mkdir -p "${TMP_CONFIG_DIR}"
# cat > "${TMP_CONFIG_DIR}/core.yaml" <<EOF
# peer:
#   # TLS disabled
#   tls:
#     enabled: false
#   # Do NOT set mspConfigPath here—use CORE_PEER_MSPCONFIGPATH instead.
#   BCCSP:
#     Default: SW
#     SW:
#       Hash: SHA2
#       Security: 256
#       FileKeystore:
#         KeyStore: keyStore
# EOF

# 2) Export env so `peer` picks up this tmp-config as FABRIC_CFG_PATH
export FABRIC_CFG_PATH="${ROOT}"
export PATH="${ROOT}/bin:$PATH"

# 3) Sanity checks
if [ ! -d "${CHANNEL_ARTIFACTS}" ]; then
  echo "ERROR: channel-artifacts/ directory not found under ${ROOT}"
  exit 1
fi

if ! docker ps | grep 'orderer'; then
  echo "ERROR: orderer.example.com is not running. Start the orderer container first."
  exit 1
fi

echo
echo "📣 Using FABRIC_CFG_PATH=${FABRIC_CFG_PATH}"
echo "📣 Using peer binary: $(which peer) ($(peer version | head -1))"
echo

# Helper: set CORE_PEER_* to point at an org’s MSP folder + peer address
# USAGE: setPeerEnv <OrgMSPID> <OrgMSPPath> <PeerAddress>
setPeerEnv() {
  local ORG_MSP="$1"           # e.g. "AdminMSP" or "FarmerMSP"
  local ORG_MSP_PATH="$2"      # e.g. $CRYPTO_BASE/peerOrganizations/admin.example.com/msp
  local PEER_ADDR="$3"         # e.g. "localhost:7051"

  export CORE_PEER_LOCALMSPID="${ORG_MSP}"
  export CORE_PEER_MSPCONFIGPATH="${ORG_MSP_PATH}"
  export CORE_PEER_ADDRESS="${PEER_ADDR}"
}

# -----------------------------------------------------------------------------
# 1) farmer-distributor
# -----------------------------------------------------------------------------
echo
echo "─────────────────────────────────────────────────────────────────────────────"
echo "1) Creating & joining peers to 'farmer-distributor' channel"
echo "─────────────────────────────────────────────────────────────────────────────"

# 1.a) Create the channel (signed by AdminOrg’s CA-admin)
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel create \
  -o localhost:7050 \
  -c farmer-distributor \
  -f "${CHANNEL_ARTIFACTS}/farmer-distributor.tx" \
  --outputBlock "${CHANNEL_ARTIFACTS}/farmer-distributor.block"
echo "✓ farmer-distributor.block generated."

# 1.b) Join AdminOrg’s peer0.admin to farmer-distributor
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel join -b "${CHANNEL_ARTIFACTS}/farmer-distributor.block"
echo "✓ peer0.admin joined farmer-distributor"

# 1.c) Join FarmerOrg’s peer0.farmer
setPeerEnv "FarmerMSP" "${CRYPTO_BASE}/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp" "localhost:8051"
peer channel join -b "${CHANNEL_ARTIFACTS}/farmer-distributor.block"
echo "✓ peer0.farmer joined farmer-distributor"

# 1.d) Join DistributorOrg’s peer0.distributor
setPeerEnv "DistributorMSP" "${CRYPTO_BASE}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp" "localhost:9051"
peer channel join -b "${CHANNEL_ARTIFACTS}/farmer-distributor.block"
echo "✓ peer0.distributor joined farmer-distributor"

# 1.e) Update anchor peers
echo
echo "── Updating anchor peers for farmer-distributor ──"

# AdminOrg anchor
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel update -o localhost:7050 -c farmer-distributor -f "${CHANNEL_ARTIFACTS}/adminanchors-farmer-distributor.tx"
echo "✓ AdminOrg anchor updated."

# FarmerOrg anchor
setPeerEnv "FarmerMSP" "${CRYPTO_BASE}/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp" "localhost:8051"
peer channel update -o localhost:7050 -c farmer-distributor -f "${CHANNEL_ARTIFACTS}/farmeranchors-farmer-distributor.tx"
echo "✓ FarmerOrg anchor updated."

# DistributorOrg anchor
setPeerEnv "DistributorMSP" "${CRYPTO_BASE}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp" "localhost:9051"
peer channel update -o localhost:7050 -c farmer-distributor -f "${CHANNEL_ARTIFACTS}/distributoranchors-farmer-distributor.tx"
echo "✓ DistributorOrg anchor updated."



# -----------------------------------------------------------------------------
# 2) distributor-retailer
# -----------------------------------------------------------------------------
echo
echo "─────────────────────────────────────────────────────────────────────────────"
echo "2) Creating & joining peers to 'distributor-retailer' channel"
echo "─────────────────────────────────────────────────────────────────────────────"

# 2.a) Create the channel (signed by AdminOrg’s CA-admin)
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel create \
  -o localhost:7050 \
  -c distributor-retailer \
  -f "${CHANNEL_ARTIFACTS}/distributor-retailer.tx" \
  --outputBlock "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ distributor-retailer.block generated."

# 2.b) Join peers
#   - AdminOrg / peer0.admin
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel join -b "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ peer0.admin joined distributor-retailer"

#   - DistributorOrg / peer0.distributor
setPeerEnv "DistributorMSP" "${CRYPTO_BASE}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp" "localhost:9051"
peer channel join -b "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ peer0.distributor joined distributor-retailer"

#   - RetailerOrg / peer0.retailer
setPeerEnv "RetailerMSP" "${CRYPTO_BASE}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp" "localhost:10051"
peer channel join -b "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ peer0.retailer joined distributor-retailer"

# 2.c) Update anchor peers
echo
echo "── Updating anchor peers for distributor-retailer ──"

#   - AdminOrg anchor
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel update -o localhost:7050 -c distributor-retailer -f "${CHANNEL_ARTIFACTS}/adminanchors-distributor-retailer.tx"
echo "✓ AdminOrg anchor updated."

#   - DistributorOrg anchor
setPeerEnv "DistributorMSP" "${CRYPTO_BASE}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp" "localhost:9051"
peer channel update -o localhost:7050 -c distributor-retailer -f "${CHANNEL_ARTIFACTS}/distributoranchors-distributor-retailer.tx"
echo "✓ DistributorOrg anchor updated."

#   - RetailerOrg anchor
setPeerEnv "RetailerMSP" "${CRYPTO_BASE}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp" "localhost:10051"
peer channel update -o localhost:7050 -c distributor-retailer -f "${CHANNEL_ARTIFACTS}/retaileranchors-distributor-retailer.tx"
echo "✓ RetailerOrg anchor updated."



# -----------------------------------------------------------------------------
# 3) retailer-consumer
# -----------------------------------------------------------------------------
echo
echo "─────────────────────────────────────────────────────────────────────────────"
echo "3) Creating & joining peers to 'retailer-consumer' channel"
echo "─────────────────────────────────────────────────────────────────────────────"

# 3.a) Create the channel (signed by AdminOrg’s CA-admin)
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel create \
  -o localhost:7050 \
  -c retailer-consumer \
  -f "${CHANNEL_ARTIFACTS}/retailer-consumer.tx" \
  --outputBlock "${CHANNEL_ARTIFACTS}/retailer-consumer.block"
echo "✓ retailer-consumer.block generated."

# 3.b) Join peers
#   - AdminOrg / peer0.admin
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel join -b "${CHANNEL_ARTIFACTS}/retailer-consumer.block"
echo "✓ peer0.admin joined retailer-consumer"

#   - RetailerOrg / peer0.retailer
setPeerEnv "RetailerMSP" "${CRYPTO_BASE}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp" "localhost:10051"
peer channel join -b "${CHANNEL_ARTIFACTS}/retailer-consumer.block"
echo "✓ peer0.retailer joined retailer-consumer"

# (If you have a ConsumerOrg peer, add it here in the same pattern)

# 3.c) Update anchor peers
echo
echo "── Updating anchor peers for retailer-consumer ──"

#   - AdminOrg anchor
setPeerEnv "AdminMSP" "${CRYPTO_BASE}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp" "localhost:7051"
peer channel update -o localhost:7050 -c retailer-consumer -f "${CHANNEL_ARTIFACTS}/adminanchors-retailer-consumer.tx"
echo "✓ AdminOrg anchor updated."

#   - RetailerOrg anchor
setPeerEnv "RetailerMSP" "${CRYPTO_BASE}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp" "localhost:10051"
peer channel update -o localhost:7050 -c retailer-consumer -f "${CHANNEL_ARTIFACTS}/retaileranchors-retailer-consumer.tx"
echo "✓ RetailerOrg anchor updated."

# (If you have a ConsumerOrg, update its anchor here)

echo
echo "🎉 All channels created, peers joined, and anchors updated. 🎉"
