# Flow Blocklist API Documentation

The Flow Blocklist API provides endpoints to check if a domain, token, or NFT is known to be malicious across both Flow and Flow-EVM networks.

## Structure

The repository contains several blocklist files:

- `flow-dapp-blocklist.json`: Contains malicious Flow dApp domains
- `flow-evm-dapp-blocklist.json`: Contains malicious Flow-EVM dApp domains
- `flow-token-blocklist.json`: Contains malicious Flow token identifiers
- `flow-evm-token-blocklist.json`: Contains malicious Flow-EVM token addresses
- `flow-nft-blocklist.json`: Contains malicious Flow NFT collection identifiers
- `flow-evm-nft-blocklist.json`: Contains malicious Flow-EVM NFT addresses

## Base URL
```
http://localhost:3000
```

For production deployments, replace with your deployed API URL.

## Endpoints

### Search Across All Blocklists
```http
GET /api/search?q=searchterm
```

Search across all blocklists with case-insensitive substring matching.

**Parameters**
- `q`: Search query (required) - Can be a partial domain, address, or identifier

**Response**
```json
{
  "query": "flow",
  "matches": [
    {
      "value": "fake-flow-mint.com",
      "type": "flow-domain"
    },
    {
      "value": "flow-evm-airdrop.com",
      "type": "flow-evm-domain"
    },
    {
      "value": "A.1234567890abcdef.FlowToken",
      "type": "flow-token"
    }
  ]
}
```

### List All Domains
```http
GET /api/domain
```

Get all malicious domains from both Flow and Flow-EVM networks.

**Response**
```json
{
  "flow": [
    "fake-flow-mint.com",
    "flowblockchain-airdrop.com"
  ],
  "evm": [
    "fake-flow-evm-mint.com",
    "flow-evm-airdrop.com"
  ]
}
```

### List All Tokens
```http
GET /api/token
```

Get all malicious token identifiers from both networks.

**Response**
```json
{
  "flow": [
    "A.1234567890abcdef.FlowToken"
  ],
  "evm": [
    "0x1234567890123456789012345678901234567890"
  ]
}
```

### List All NFTs
```http
GET /api/nft
```

Get all malicious NFT identifiers from both networks.

**Response**
```json
{
  "flow": [
    "A.01cf0e2f2f715450.FakeNFT"
  ],
  "evm": [
    "0x2345678901234567890123456789012345678901"
  ]
}
```

### Check Flow Domain
```http
GET /api/check/flow/domain/:domain
```

Check if a domain is malicious in the Flow network.

**Response**
```json
{
  "domain": "fake-flow-mint.com",
  "isMalicious": true,
  "type": "flow-domain"
}
```

### Check Flow-EVM Domain
```http
GET /api/check/flow-evm/domain/:domain
```

Check if a domain is malicious in the Flow-EVM network.

**Response**
```json
{
  "domain": "fake-flow-evm-mint.com",
  "isMalicious": true,
  "type": "flow-evm-domain"
}
```

### Check Flow Identifier
```http
GET /api/check/flow/:identifier
```

Check if a Flow token or NFT identifier is malicious.

**Response**
```json
{
  "identifier": "A.1234567890abcdef.FlowToken",
  "isMalicious": true,
  "type": "flow-token"
}
```

### Check Flow-EVM Address
```http
GET /api/check/flow-evm/:address
```

Check if a Flow-EVM token or NFT address is malicious.

**Response**
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "isMalicious": true,
  "type": "flow-evm-token"
}
```

### Health Check
```http
GET /health
```

Check if the API is running.

**Response**
```json
{
  "status": "healthy"
}
```

## Response Types

The `type` field in responses can be one of:
- `"flow-domain"`: Malicious Flow domain
- `"flow-evm-domain"`: Malicious Flow-EVM domain
- `"flow-token"`: Malicious Flow token
- `"flow-nft"`: Malicious Flow NFT
- `"flow-evm-token"`: Malicious Flow-EVM token
- `"flow-evm-nft"`: Malicious Flow-EVM NFT
- `"unknown"`: Not found in any blocklist

## Error Responses

### 400 Bad Request
```json
{
  "error": "Query parameter \"q\" is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to load blocklists"
}
```

## Notes

- All searches are case-insensitive
- Substring matching is supported for search endpoint
- Exact matching is used for specific check endpoints
- Empty search queries will return a 400 error
- The server caches blocklists in memory for better performance
- Blocklists are reloaded automatically when needed

## Examples

1. Search for a partial domain:
```
GET /api/search?q=flow-mint
```

2. Check a specific Flow token:
```
GET /api/check/flow/A.1234567890abcdef.FlowToken
```

3. Check a Flow-EVM NFT address:
```
GET /api/check/flow-evm/0x1234567890123456789012345678901234567890
```

4. Get all malicious domains:
```
GET /api/domain
``` 