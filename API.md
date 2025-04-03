# Flow Blocklist API Documentation

The Flow Blocklist API provides endpoints to check if a domain, token, or NFT is known to be malicious.

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

## Endpoints

### Search
```http
GET /api/search?q=searchterm
```
Search across all blocklists with substring matching.

**Parameters**
- `q`: Search query (required) - Can be a partial domain, address, or identifier

**Response**
```json
{
  "query": "0x123",
  "matches": [
    {
      "value": "0x1234567890abcdef",
      "type": "flow-evm-token"
    },
    {
      "value": "0x123456789abcdef",
      "type": "flow-evm-nft"
    }
  ]
}
```

**Match Types**
- `flow-domain`: Malicious Flow domain
- `flow-evm-domain`: Malicious Flow-EVM domain
- `flow-token`: Malicious Flow token
- `flow-nft`: Malicious Flow NFT
- `flow-evm-token`: Malicious Flow-EVM token
- `flow-evm-nft`: Malicious Flow-EVM NFT

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

### Check Any Identifier (Universal Endpoint)
```http
GET /api/check/:identifier
```
Check if any identifier (domain, Flow identifier, or Flow-EVM address) is malicious.

**Response**
```json
{
  "identifier": "example.com",
  "isMalicious": true,
  "type": "flow-domain"
}
```

### Check Flow Domain
```http
GET /api/check/flow/domain/:domain
```
Check if a domain is malicious in Flow network.

**Response**
```json
{
  "domain": "example.com",
  "isMalicious": true,
  "type": "flow-domain"
}
```

### Check Flow-EVM Domain
```http
GET /api/check/flow-evm/domain/:domain
```
Check if a domain is malicious in Flow-EVM network.

**Response**
```json
{
  "domain": "example.com",
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
  "identifier": "A.1234567890abcdef.FFLOW",
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
  "address": "0x1234567890abcdef",
  "isMalicious": true,
  "type": "flow-evm-token"
}
```

## Response Types

The `type` field in responses can be one of:
- `"flow-domain"`: For malicious Flow domains
- `"flow-evm-domain"`: For malicious Flow-EVM domains
- `"flow-token"`: For malicious Flow tokens
- `"flow-nft"`: For malicious Flow NFTs
- `"flow-evm-token"`: For malicious Flow-EVM tokens
- `"flow-evm-nft"`: For malicious Flow-EVM NFTs
- `"unknown"`: If the identifier is not found in any blocklist

## Error Handling

- 400 Bad Request: Missing or invalid query parameter
- 500 Internal Server Error: Server-side issues

## Examples

1. Search for a partial domain:
```
GET /api/search?q=flow-mint
```

2. Search for a partial Flow identifier:
```
GET /api/search?q=A.1234
```

3. Search for a partial EVM address:
```
GET /api/search?q=0x123
```

## Notes

- Searches are case-insensitive
- Substring matches are supported
- Empty query parameter will return a 400 error
- No matches will return an empty matches array 