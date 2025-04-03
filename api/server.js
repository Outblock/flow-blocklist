import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('Root directory:', rootDir);

const app = express();

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
    console.log('Loading blocklists from:', rootDir);
    
    // Check if files exist
    const files = [
      'dapp-blocklist.json',
      'token-blocklist.json',
      'nft-blocklist.json',
      'flow-evm-dapp-blocklist.json',
      'flow-evm-token-blocklist.json',
      'flow-evm-nft-blocklist.json'
    ];

    for (const file of files) {
      try {
        const filePath = path.join(rootDir, file);
        await fs.access(filePath);
        console.log(`File exists: ${file}`);
      } catch (err) {
        console.error(`File not found: ${file}`);
      }
    }

    const [
      flowDomains,
      flowEvmDomains,
      flowTokens,
      flowNFTs,
      flowEvmTokens,
      flowEvmNFTs
    ] = await Promise.all([
      fs.readFile(path.join(rootDir, 'dapp-blocklist.json'), 'utf8'),
      fs.readFile(path.join(rootDir, 'flow-evm-dapp-blocklist.json'), 'utf8'),
      fs.readFile(path.join(rootDir, 'token-blocklist.json'), 'utf8'),
      fs.readFile(path.join(rootDir, 'nft-blocklist.json'), 'utf8'),
      fs.readFile(path.join(rootDir, 'flow-evm-token-blocklist.json'), 'utf8'),
      fs.readFile(path.join(rootDir, 'flow-evm-nft-blocklist.json'), 'utf8')
    ]);

    console.log('Flow domains content:', flowDomains);

    cache.flowDomains = JSON.parse(flowDomains).domains || [];
    cache.flowTokens = JSON.parse(flowTokens).identifiers || [];
    cache.flowNFTs = JSON.parse(flowNFTs).identifiers || [];
    cache.flowEvmDomains = JSON.parse(flowEvmDomains).domains || [];
    cache.flowEvmTokens = JSON.parse(flowEvmTokens).addresses || [];
    cache.flowEvmNFTs = JSON.parse(flowEvmNFTs).addresses || [];

    console.log('Cache after loading:', cache);
  } catch (error) {
    console.error('Error loading blocklists:', error);
    throw error; // Re-throw to handle in the startup
  }
}

// Simple search function
function simpleSearch(query, list) {
  query = query.toLowerCase();
  return list.filter(item => item.toLowerCase().includes(query));
}

// Middleware to ensure blocklists are loaded
app.use(async (req, res, next) => {
  if (cache.flowDomains.length === 0) {
    try {
      await loadBlocklists();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load blocklists' });
    }
  }
  next();
});

// Unified search endpoint with exact substring matching
app.get('/api/search', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  if (!query) {
    return res.status(400).json({
      error: 'Query parameter "q" is required'
    });
  }

  console.log('Current cache state:', cache);
  console.log('Search query:', query);

  const results = {
    matches: [],
    query
  };

  // Search in Flow domains
  const flowDomainMatches = simpleSearch(query, cache.flowDomains).map(domain => ({
    value: domain,
    type: 'flow-domain'
  }));

  console.log('Flow domain matches:', flowDomainMatches);

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Check Flow domain
app.get('/api/check/flow/domain/:domain', (req, res) => {
  const domain = req.params.domain.toLowerCase();
  const isMalicious = cache.flowDomains.some(d => d.toLowerCase() === domain);
  res.json({
    domain,
    isMalicious,
    type: isMalicious ? 'flow-domain' : 'unknown'
  });
});

// Check Flow-EVM domain
app.get('/api/check/flow-evm/domain/:domain', (req, res) => {
  const domain = req.params.domain.toLowerCase();
  const isMalicious = cache.flowEvmDomains.some(d => d.toLowerCase() === domain);
  res.json({
    domain,
    isMalicious,
    type: isMalicious ? 'flow-evm-domain' : 'unknown'
  });
});

// Check Flow identifier
app.get('/api/check/flow/:identifier', (req, res) => {
  const identifier = req.params.identifier;
  const isToken = cache.flowTokens.includes(identifier);
  const isNFT = cache.flowNFTs.includes(identifier);
  res.json({
    identifier,
    isMalicious: isToken || isNFT,
    type: isToken ? 'flow-token' : (isNFT ? 'flow-nft' : 'unknown')
  });
});

// Check Flow-EVM address
app.get('/api/check/flow-evm/:address', (req, res) => {
  const address = req.params.address;
  const isToken = cache.flowEvmTokens.includes(address);
  const isNFT = cache.flowEvmNFTs.includes(address);
  res.json({
    address,
    isMalicious: isToken || isNFT,
    type: isToken ? 'flow-evm-token' : (isNFT ? 'flow-evm-nft' : 'unknown')
  });
});

// Initialize server
async function initializeServer() {
  try {
    await loadBlocklists();
    if (import.meta.url === `file://${process.argv[1]}`) {
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start server
initializeServer();

// Export for serverless
export default app; 