# Flow Blockchain Blocklist

This repository serves as the single source of truth for malicious URLs, tokens, and NFTs in the Flow blockchain ecosystem, covering both Flow and Flow-EVM networks. When integrated with Flow wallets or dApps, this blocklist helps protect users from known scams and malicious content.

## Structure

The repository contains several blocklist files:

- `blocklist.json`: Contains malicious dApp domains for both Flow and Flow-EVM networks
- `flow-token-blocklist.json`: Contains malicious Flow token identifiers
- `flow-evm-token-blocklist.json`: Contains malicious Flow-EVM token addresses
- `flow-nft-blocklist.json`: Contains malicious Flow NFT collection identifiers
- `flow-evm-nft-blocklist.json`: Contains malicious Flow-EVM NFT addresses

## Format

### DApp Blocklist
```json
{
  "domains": [
    "malicious-example.com",
    "scam-flow-site.com"
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
    "0x1234567890abcdef",
    "0xabcdef1234567890"
  ]
}
```

## Contributing

To submit a new entry to any blocklist:

1. Fork this repository
2. Add the new entry to the appropriate blocklist file:
   - For Flow tokens and NFTs: Add the full identifier in format `A.{address}.{identifier}`
   - For Flow-EVM tokens and NFTs: Add the contract address
   - For dApps: Add the domain without protocol (e.g., "example.com" not "https://example.com")
3. Create a pull request with evidence of malicious activity

## Implementation

The blocklist is implemented as simple JSON files:
- dApp blocklist: List of malicious domains
- Flow tokens/NFTs: List of Flow identifiers (`A.{address}.{identifier}`)
- Flow-EVM tokens/NFTs: List of contract addresses

## Integration

This repository can be used by:
- Flow wallets to warn users about suspicious dApps/tokens/NFTs
- dApp browsers to block known malicious sites
- NFT marketplaces to flag suspicious collections
- Token exchanges to prevent listing of scam tokens

## License

MIT License 