# Flow Blockchain Blocklist

This repository serves as the single source of truth for malicious URLs, tokens, and NFTs in the Flow blockchain ecosystem, covering both Flow and Flow-EVM networks. When integrated with Flow wallets or dApps, this blocklist helps protect users from known scams and malicious content.

## Structure

The repository contains several blocklist files:

- `flow-dapp-blocklist.json`: Contains malicious Flow dApp domains
- `flow-evm-dapp-blocklist.json`: Contains malicious Flow-EVM dApp domains
- `flow-token-blocklist.json`: Contains malicious Flow token identifiers
- `flow-evm-token-blocklist.json`: Contains malicious Flow-EVM token addresses
- `flow-nft-blocklist.json`: Contains malicious Flow NFT collection identifiers
- `flow-evm-nft-blocklist.json`: Contains malicious Flow-EVM NFT addresses

## Format

### Flow DApp Blocklist
```json
{
  "domains": [
    "malicious-example.com",
    "scam-flow-site.com"
  ]
}
```

### Flow-EVM DApp Blocklist
```json
{
  "domains": [
    "malicious-flow-evm.com",
    "scam-flow-evm-site.com"
  ]
}
```

### Flow Token and NFT Blocklists
```json
{
  "identifiers": [
    "A.1234567890abcdef.FFLOW",
    "A.abcdef1234567890.FlowPunks"
  ]
}
```

### Flow-EVM Token and NFT Blocklists
```json
{
  "addresses": [
    "0x1234567890abcdef1234567890abcdef12345678",
    "0xabcdef1234567890abcdef1234567890abcdef12"
  ]
}
```

## API Server

The repository includes an Express.js server that provides API endpoints for querying the blocklists. The server:

- Loads all blocklist files into memory on startup
- Provides search functionality across all blocklists
- Offers specific endpoints for checking domains, tokens, and NFTs
- Supports both Flow and Flow-EVM networks

For detailed API documentation, see [API.md](API.md).

## Contributing

To submit a new entry to any blocklist:

1. Fork this repository
2. Add the new entry to the appropriate blocklist file:
   - For Flow tokens and NFTs: Add the full identifier in format `A.{address}.{identifier}`
   - For Flow-EVM tokens and NFTs: Add the contract address (full 40-character hex)
   - For dApps: Add the domain without protocol (e.g., "example.com" not "https://example.com")
3. Create a pull request with evidence of malicious activity

## Integration

This repository can be used by:
- Flow wallets to warn users about suspicious dApps/tokens/NFTs
- dApp browsers to block known malicious sites
- NFT marketplaces to flag suspicious collections
- Token exchanges to prevent listing of scam tokens

## Development

The project uses:
- Node.js (>=14.0.0)
- Express.js for the API server
- CORS middleware for cross-origin requests
- JSON files for blocklist storage

## License

MIT License 