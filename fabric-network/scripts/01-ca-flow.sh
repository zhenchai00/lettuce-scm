#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORG_DOMAIN="example.com"
export PATH="${ROOT}/bin:${PATH}"
export FABRIC_CFG_PATH="${ROOT}/config"

# The five “orgs” in our network:
ORGS=(orderer admin farmer distributor retailer)

# Map each org to its CA port and CA name
declare -A CA_PORT CA_NAME
CA_PORT=( 
  [orderer]=7054
  [admin]=8054
  [farmer]=9054
  [distributor]=10054
  [retailer]=11054
)
CA_NAME=(
  [orderer]=ca-orderer
  [admin]=ca-admin
  [farmer]=ca-farmer
  [distributor]=ca-distributor
  [retailer]=ca-retailer
)

# 1) copy each CA’s root certificate into crypto-config
echo "---- Copy CA certs into crypto-config ----"
for org in "${ORGS[@]}"; do
    if [[ "$org" == "orderer" ]]; then
        target="ordererOrganizations/${ORG_DOMAIN}"
    else
        target="peerOrganizations/${org}.${ORG_DOMAIN}"
    fi
  mkdir -p "${ROOT}/crypto-config/${target}/ca"
  cp "${ROOT}/ca-server/${org}/ca-cert.pem" "${ROOT}/crypto-config/${target}/ca/"
done

# helper: enroll a CA admin
enroll_ca_admin() {
  local org=$1 port=$2 name=$3
  echo
  echo "--- Enroll bootstrap admin for ${org}Org ---"
  if [[ $org = orderer ]]; then
    export FABRIC_CA_CLIENT_HOME="${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}"
    TLS_CERT_FILE="${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/ca/ca-cert.pem"
  else
    export FABRIC_CA_CLIENT_HOME="${ROOT}/crypto-config/peerOrganizations/${org}.${ORG_DOMAIN}/users/Admin@${org}.${ORG_DOMAIN}"
    TLS_CERT_FILE="${ROOT}/crypto-config/peerOrganizations/${org}.${ORG_DOMAIN}/ca/ca-cert.pem"
  fi

  mkdir -p "${FABRIC_CA_CLIENT_HOME}/msp"
  fabric-ca-client enroll \
    -u "http://admin:adminpw@localhost:${port}" \
    --caname "${name}" \
    -M "${FABRIC_CA_CLIENT_HOME}/msp" \
    --tls.certfiles "${TLS_CERT_FILE}" 
}

# helper: bootstrap MSP dirs (Org MSP and Node MSP)
bootstrap_msp() {
  local base=$1
  mkdir -p "${base}/msp"
  cp "${ROOT}/config/ca-config.yaml" "${base}/msp/config.yaml"
}

# 2) Enroll each CA’s bootstrap admin
for org in "${ORGS[@]}"; do
  enroll_ca_admin "$org" "${CA_PORT[$org]}" "${CA_NAME[$org]}"
done

# 3) For each peer org (admin, farmer, distributor, retailer) register & enroll:
for org in admin farmer distributor retailer; do
  port=${CA_PORT[$org]}
  caname=${CA_NAME[$org]}
  orgMSP="${ROOT}/crypto-config/peerOrganizations/${org}.${ORG_DOMAIN}"

  # a) register & enroll OrgAdmin (OU=admin)
  echo
  echo "--- Register & enroll OrgAdmin for ${org}Org ---"
  export FABRIC_CA_CLIENT_HOME="${orgMSP}/users/Admin@${org}.${ORG_DOMAIN}"
  fabric-ca-client register \
    --caname "${caname}" \
    --id.name OrgAdmin \
    --id.secret OrgAdminpw \
    --id.type client \
    --id.affiliation org1.admin \
    --tls.certfiles "${orgMSP}/ca/ca-cert.pem"

  export FABRIC_CA_CLIENT_HOME="${orgMSP}/users/OrgAdmin@${org}.${ORG_DOMAIN}"
  mkdir -p "${FABRIC_CA_CLIENT_HOME}/msp"
  fabric-ca-client enroll \
    -u "http://OrgAdmin:OrgAdminpw@localhost:${port}" \
    --caname "${caname}" \
    -M "${FABRIC_CA_CLIENT_HOME}/msp" \
    --csr.cn="OrgAdmin@${org}.${ORG_DOMAIN}" \
    --tls.certfiles "${orgMSP}/ca/ca-cert.pem"

  # b) register & enroll peer0 (OU=peer)
  echo
  echo "--- Register & enroll peer0.${org}.${ORG_DOMAIN} ---"
  export FABRIC_CA_CLIENT_HOME="${orgMSP}/users/Admin@${org}.${ORG_DOMAIN}"
  fabric-ca-client register \
    --caname "${caname}" \
    --id.name peer0${org} \
    --id.secret peer0${org}pw \
    --id.type peer \
    --id.affiliation org1.peer \
    --tls.certfiles "${orgMSP}/ca/ca-cert.pem"

  export FABRIC_CA_CLIENT_HOME="${orgMSP}/peers/peer0.${org}.${ORG_DOMAIN}"
  mkdir -p "${FABRIC_CA_CLIENT_HOME}/msp"
  fabric-ca-client enroll \
    -u "http://peer0${org}:peer0${org}pw@localhost:${port}" \
    --caname "${caname}" \
    -M "${FABRIC_CA_CLIENT_HOME}/msp" \
    --csr.hosts "peer0.${org}.${ORG_DOMAIN}" \
    --tls.certfiles "${orgMSP}/ca/ca-cert.pem"

  # c) bootstrap Org MSP and peer0 MSP
  bootstrap_msp "${orgMSP}"
  bootstrap_msp "${orgMSP}/peers/peer0.${org}.${ORG_DOMAIN}"
done

# 4) Register & enroll the orderer
echo
echo "--- Register & enroll orderer.example.com ---"
export FABRIC_CA_CLIENT_HOME="${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}"
fabric-ca-client register \
  --caname ca-orderer \
  --id.name orderer \
  --id.secret ordererpw \
  --id.type orderer \
  --tls.certfiles "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/ca/ca-cert.pem"

export FABRIC_CA_CLIENT_HOME="${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}"
mkdir -p "${FABRIC_CA_CLIENT_HOME}/msp"
fabric-ca-client enroll \
  -u "http://orderer:ordererpw@localhost:7054" \
  --caname ca-orderer \
  -M "${FABRIC_CA_CLIENT_HOME}/msp" \
  --csr.hosts "orderer.${ORG_DOMAIN}" \
  --tls.certfiles "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/ca/ca-cert.pem"

# bootstrap orderer MSP
bootstrap_msp "crypto-config/ordererOrganizations/${ORG_DOMAIN}"
bootstrap_msp "crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}"

echo
echo "=== Bootstrapping OrdererOrg MSP (cacerts + admincerts + config.yaml) ==="
ORDERER_MSP="${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/msp"

# (re-)create the directory structure
mkdir -p "${ORDERER_MSP}/cacerts" "${ORDERER_MSP}/admincerts"

# copy the CA root cert
cp "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/ca/ca-cert.pem" \
   "${ORDERER_MSP}/cacerts/ca-cert.pem"

# copy the admin’s signed cert into admincerts
cp "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}/msp/signcerts/"*.pem \
   "${ORDERER_MSP}/admincerts/Admin@${ORG_DOMAIN}-cert.pem"

# copy the NodeOUs config
cp "${ROOT}/config/ca-config.yaml" "${ORDERER_MSP}/config.yaml"

echo
echo "=== Bootstrapping each Org’s MSP (cacerts + admincerts + config.yaml) ==="
for org in admin farmer distributor retailer; do
  ORG_MSP="${ROOT}/crypto-config/peerOrganizations/${org}.${ORG_DOMAIN}/msp"

  mkdir -p "${ORG_MSP}/cacerts" "${ORG_MSP}/admincerts"

  # copy this org’s CA root
  cp "${ROOT}/crypto-config/peerOrganizations/${org}.${ORG_DOMAIN}/ca/ca-cert.pem" \
     "${ORG_MSP}/cacerts/ca-cert.pem"

  # copy the OrgAdmin’s signcert (enrolled earlier) into admincerts
  cp "${ROOT}/crypto-config/peerOrganizations/${org}.${ORG_DOMAIN}/users/OrgAdmin@${org}.${ORG_DOMAIN}/msp/signcerts/"*.pem \
     "${ORG_MSP}/admincerts/${org}Admin@${org}.${ORG_DOMAIN}-cert.pem"

  # copy NodeOUs config so Fabric can classify OU roles
  cp "${ROOT}/config/ca-config.yaml" "${ORG_MSP}/config.yaml"
done

echo
echo "*** All identities registered & enrolled, MSPs bootstrapped! ***"
