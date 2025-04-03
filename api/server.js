import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

// CORS middleware
app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.res.headers.set('Access-Control-Max-Age', '86400')

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: c.res.headers
    })
  }

  await next()
})

// Cache for blocklists
let cache = {
  flowDomains: [],
  flowEvmDomains: [],
  flowTokens: [],
  flowNFTs: [],
  flowEvmTokens: [],
  flowEvmNFTs: []
}

// Load blocklists into memory
async function loadBlocklists() {
  try {
    // Determine if we're in Vercel or local environment
    const isVercel = process.env.VERCEL === '1'
    const rootDir = isVercel ? '/var/task' : path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
    
    console.log('Environment:', isVercel ? 'Vercel' : 'Local')
    console.log('Root directory:', rootDir)
    
    const files = [
      'dapp-blocklist.json',
      'flow-evm-dapp-blocklist.json',
      'token-blocklist.json',
      'nft-blocklist.json',
      'flow-evm-token-blocklist.json',
      'flow-evm-nft-blocklist.json'
    ]

    const fileContents = await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(rootDir, file)
          console.log(`Attempting to load ${filePath}`)
          const content = await fs.readFile(filePath, 'utf8')
          console.log(`Successfully loaded ${file}`)
          return JSON.parse(content)
        } catch (err) {
          console.error(`Error loading ${file}:`, err.message)
          return {}
        }
      })
    )

    const [
      flowDomains,
      flowEvmDomains,
      flowTokens,
      flowNFTs,
      flowEvmTokens,
      flowEvmNFTs
    ] = fileContents

    cache = {
      flowDomains: flowDomains.domains || [],
      flowEvmDomains: flowEvmDomains.domains || [],
      flowTokens: flowTokens.identifiers || [],
      flowNFTs: flowNFTs.identifiers || [],
      flowEvmTokens: flowEvmTokens.addresses || [],
      flowEvmNFTs: flowEvmNFTs.addresses || []
    }

    console.log('Cache loaded with entries:', {
      flowDomains: cache.flowDomains.length,
      flowEvmDomains: cache.flowEvmDomains.length,
      flowTokens: cache.flowTokens.length,
      flowNFTs: cache.flowNFTs.length,
      flowEvmTokens: cache.flowEvmTokens.length,
      flowEvmNFTs: cache.flowEvmNFTs.length
    })
  } catch (error) {
    console.error('Error loading blocklists:', error.message)
    // Continue with empty cache
  }
}

// Simple search function
function simpleSearch(query, list) {
  query = query.toLowerCase()
  return list.filter(item => item.toLowerCase().includes(query))
}

// Middleware to ensure blocklists are loaded
app.use('*', async (c, next) => {
  if (cache.flowDomains.length === 0) {
    try {
      await loadBlocklists()
    } catch (error) {
      console.error('Failed to load blocklists:', error)
    }
  }
  await next()
})

// Unified search endpoint with exact substring matching
app.get('/api/search', async (c) => {
  const query = c.req.query('q')?.toLowerCase()
  if (!query) {
    return c.json({
      error: 'Query parameter "q" is required'
    }, 400)
  }

  const results = {
    matches: [],
    query
  }

  // Search in Flow domains
  const flowDomainMatches = simpleSearch(query, cache.flowDomains).map(domain => ({
    value: domain,
    type: 'flow-domain'
  }))

  // Search in Flow-EVM domains
  const flowEvmDomainMatches = simpleSearch(query, cache.flowEvmDomains).map(domain => ({
    value: domain,
    type: 'flow-evm-domain'
  }))

  // Search in Flow tokens
  const flowTokenMatches = simpleSearch(query, cache.flowTokens).map(token => ({
    value: token,
    type: 'flow-token'
  }))

  // Search in Flow NFTs
  const flowNFTMatches = simpleSearch(query, cache.flowNFTs).map(nft => ({
    value: nft,
    type: 'flow-nft'
  }))

  // Search in Flow-EVM tokens
  const flowEvmTokenMatches = simpleSearch(query, cache.flowEvmTokens).map(token => ({
    value: token,
    type: 'flow-evm-token'
  }))

  // Search in Flow-EVM NFTs
  const flowEvmNFTMatches = simpleSearch(query, cache.flowEvmNFTs).map(nft => ({
    value: nft,
    type: 'flow-evm-nft'
  }))

  // Combine all matches
  results.matches = [
    ...flowDomainMatches,
    ...flowEvmDomainMatches,
    ...flowTokenMatches,
    ...flowNFTMatches,
    ...flowEvmTokenMatches,
    ...flowEvmNFTMatches
  ]

  return c.json(results)
})

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'healthy' }))

// List endpoints
app.get('/api/domain', (c) => c.json({
  flow: cache.flowDomains,
  evm: cache.flowEvmDomains
}))

app.get('/api/token', (c) => c.json({
  flow: cache.flowTokens,
  evm: cache.flowEvmTokens
}))

app.get('/api/nft', (c) => c.json({
  flow: cache.flowNFTs,
  evm: cache.flowEvmNFTs
}))

// Check Flow domain
app.get('/api/check/flow/domain/:domain', (c) => {
  const domain = c.req.param('domain').toLowerCase()
  const isMalicious = cache.flowDomains.some(d => d.toLowerCase() === domain)
  return c.json({
    domain,
    isMalicious,
    type: isMalicious ? 'flow-domain' : 'unknown'
  })
})

// Check Flow-EVM domain
app.get('/api/check/flow-evm/domain/:domain', (c) => {
  const domain = c.req.param('domain').toLowerCase()
  const isMalicious = cache.flowEvmDomains.some(d => d.toLowerCase() === domain)
  return c.json({
    domain,
    isMalicious,
    type: isMalicious ? 'flow-evm-domain' : 'unknown'
  })
})

// Check Flow identifier
app.get('/api/check/flow/:identifier', (c) => {
  const identifier = c.req.param('identifier')
  const isToken = cache.flowTokens.includes(identifier)
  const isNFT = cache.flowNFTs.includes(identifier)
  return c.json({
    identifier,
    isMalicious: isToken || isNFT,
    type: isToken ? 'flow-token' : (isNFT ? 'flow-nft' : 'unknown')
  })
})

// Check Flow-EVM address
app.get('/api/check/flow-evm/:address', (c) => {
  const address = c.req.param('address')
  const isToken = cache.flowEvmTokens.includes(address)
  const isNFT = cache.flowEvmNFTs.includes(address)
  return c.json({
    address,
    isMalicious: isToken || isNFT,
    type: isToken ? 'flow-evm-token' : (isNFT ? 'flow-evm-nft' : 'unknown')
  })
})

// Create handler for Vercel
const vercelHandler = async (req) => {
  try {
    // Load blocklists if not loaded
    if (cache.flowDomains.length === 0) {
      await loadBlocklists()
    }
    
    return app.fetch(req)
  } catch (error) {
    console.error('Error handling request:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
}

// Export the handler for Vercel
export default vercelHandler 