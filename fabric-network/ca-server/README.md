# Certificates Authority Server
This is the Certificate Authority (CA) server for managing SSL/TLS certificates. It is designed to issue, revoke, and manage certificates for secure communications.

**Notes that the CA server doesn't enable SSL/TLS by itself, becuase this is for development purpose only.*

Each organization should run its own CA server, and the CA server should be run in a secure environment.

# Organization CA Server
|Organization | CA Server URL |
|---|---|
|Orderer | `http://localhost:7054` |
|Admin | `http://localhost:8054` |
|Farmer | `http://localhost:9054` |
|Distributor | `http://localhost:10054` |
|Retailer | `http://localhost:11054` |

# Files and Directories
The CA server directory contains the following files and directories:
|file|description|
|---|---|
|`ca-cert.pem`|The public certificate of the CA — used by clients to verify identities|
|`IssuerPublicKey`|Public key used by the CA for issuing certificates|
|`IssuerRevocationPublicKey`|Public key used for revoking certificates|
|`fabric-ca-server.db`|SQLite database storing enrolled identities, certificates, revocation lists **not included versioning*|
|`msp`|Contains private keys and generated certs **not included versioning*|
|`fabric-ca-server-config.yaml`|Configuration file for the CA server, including database settings and TLS configuration|