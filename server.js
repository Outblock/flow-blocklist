const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cache for blocklists
let cache = {
  flowDomains: [],
  flowEvmDomains: [],
  flowTokens: [],
  flowNFTs: [],
  flowEvmTokens: [],
  flowEvmNFTs: []
};

// Load blocklists into memory
async function loadBlocklists() {
  try {
    const [
      flowDomains,
      flowEvmDomains,
      flowTokens,
      flowNFTs,
      flowEvmTokens,
      flowEvmNFTs
    ] = await Promise.all([
      fs.readFile(path.join(__dirname, 'dapp-blocklist.json'), 'utf8'),
      fs.readFile(path.join(__dirname, 'flow-evm-dapp-blocklist.json'), 'utf8'),
      fs.readFile(path.join(__dirname, 'token-blocklist.json'), 'utf8'),
      fs.readFile(path.join(__dirname, 'nft-blocklist.json'), 'utf8'),
      fs.readFile(path.join(__dirname, 'flow-evm-token-blocklist.json'), 'utf8'),
      fs.readFile(path.join(__dirname, 'flow-evm-nft-blocklist.json'), 'utf8')
    ]);

    cache.flowDomains = JSON.parse(flowDomains).domains;
    cache.flowEvmDomains = JSON.parse(flowEvmDomains).domains;
    cache.flowTokens = JSON.parse(flowTokens).identifiers;
    cache.flowNFTs = JSON.parse(flowNFTs).identifiers;
    cache.flowEvmTokens = JSON.parse(flowEvmTokens).addresses;
    cache.flowEvmNFTs = JSON.parse(flowEvmNFTs).addresses;

    console.log('Blocklists loaded successfully');
  } catch (error) {
    console.error('Error loading blocklists:', error);
  }
}

// Simple search function
function simpleSearch(query, list) {
  query = query.toLowerCase();
  return list.filter(item => item.toLowerCase().includes(query));
}

// Unified search endpoint with exact substring matching
app.get('/api/search', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  if (!query) {
    return res.status(400).json({
      error: 'Query parameter "q" is required'
    });
  }

  const results = {
    matches: [],
    query
  };

  // Search in Flow domains
  const flowDomainMatches = simpleSearch(query, cache.flowDomains).map(domain => ({
    value: domain,
    type: 'flow-domain'
  }));

  // Search in Flow-EVM domains
  const flowEvmDomainMatches = simpleSearch(query, cache.flowEvmDomains).map(domain => ({
    value: domain,
    type: 'flow-evm-domain'
  }));

  // Search in Flow tokens
  const flowTokenMatches = simpleSearch(query, cache.flowTokens).map(token => ({
    value: token,
    type: 'flow-token'
  }));

  // Search in Flow NFTs
  const flowNFTMatches = simpleSearch(query, cache.flowNFTs).map(nft => ({
    value: nft,
    type: 'flow-nft'
  }));

  // Search in Flow-EVM tokens
  const flowEvmTokenMatches = simpleSearch(query, cache.flowEvmTokens).map(token => ({
    value: token,
    type: 'flow-evm-token'
  }));

  // Search in Flow-EVM NFTs
  const flowEvmNFTMatches = simpleSearch(query, cache.flowEvmNFTs).map(nft => ({
    value: nft,
    type: 'flow-evm-nft'
  }));

  // Combine all matches
  results.matches = [
    ...flowDomainMatches,
    ...flowEvmDomainMatches,
    ...flowTokenMatches,
    ...flowNFTMatches,
    ...flowEvmTokenMatches,
    ...flowEvmNFTMatches
  ];

  res.json(results);
});

// Check Flow domain
app.get('/api/check/flow/domain/:domain', (req, res) => {
  const domain = req.params.domain.toLowerCase();
  const isMalicious = cache.flowDomains.includes(domain);
  
  res.json({
    domain,
    isMalicious,
    type: 'flow-domain'
  });
});

// Check Flow-EVM domain
app.get('/api/check/flow-evm/domain/:domain', (req, res) => {
  const domain = req.params.domain.toLowerCase();
  const isMalicious = cache.flowEvmDomains.includes(domain);
  
  res.json({
    domain,
    isMalicious,
    type: 'flow-evm-domain'
  });
});

// Check Flow token or NFT identifier
app.get('/api/check/flow/:identifier', (req, res) => {
  const identifier = req.params.identifier;
  const isMaliciousToken = cache.flowTokens.includes(identifier);
  const isMaliciousNFT = cache.flowNFTs.includes(identifier);
  
  res.json({
    identifier,
    isMalicious: isMaliciousToken || isMaliciousNFT,
    type: isMaliciousToken ? 'flow-token' : (isMaliciousNFT ? 'flow-nft' : 'unknown')
  });
});

// Check Flow-EVM address
app.get('/api/check/flow-evm/:address', (req, res) => {
  const address = req.params.address.toLowerCase();
  const isMaliciousToken = cache.flowEvmTokens.includes(address);
  const isMaliciousNFT = cache.flowEvmNFTs.includes(address);
  
  res.json({
    address,
    isMalicious: isMaliciousToken || isMaliciousNFT,
    type: isMaliciousToken ? 'flow-evm-token' : (isMaliciousNFT ? 'flow-evm-nft' : 'unknown')
  });
});

// Check any identifier (unified endpoint)
app.get('/api/check/:identifier', (req, res) => {
  const identifier = req.params.identifier.toLowerCase();
  
  // Check if it's a domain
  if (!identifier.startsWith('0x') && !identifier.startsWith('a.')) {
    const isFlowMalicious = cache.flowDomains.includes(identifier);
    const isFlowEvmMalicious = cache.flowEvmDomains.includes(identifier);
    return res.json({
      identifier,
      isMalicious: isFlowMalicious || isFlowEvmMalicious,
      type: isFlowMalicious ? 'flow-domain' : (isFlowEvmMalicious ? 'flow-evm-domain' : 'unknown')
    });
  }
  
  // Check if it's a Flow identifier
  if (identifier.startsWith('a.')) {
    const isMaliciousToken = cache.flowTokens.includes(identifier);
    const isMaliciousNFT = cache.flowNFTs.includes(identifier);
    return res.json({
      identifier,
      isMalicious: isMaliciousToken || isMaliciousNFT,
      type: isMaliciousToken ? 'flow-token' : (isMaliciousNFT ? 'flow-nft' : 'unknown')
    });
  }
  
  // Check if it's a Flow-EVM address
  const isMaliciousToken = cache.flowEvmTokens.includes(identifier);
  const isMaliciousNFT = cache.flowEvmNFTs.includes(identifier);
  return res.json({
    identifier,
    isMalicious: isMaliciousToken || isMaliciousNFT,
    type: isMaliciousToken ? 'flow-evm-token' : (isMaliciousNFT ? 'flow-evm-nft' : 'unknown')
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
async function startServer() {
  await loadBlocklists();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer(); 