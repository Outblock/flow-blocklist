import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

export const config = {
  runtime: 'edge'
}

const app = new Hono().basePath('/api')

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
          const content = await fs.readFile(file, 'utf8')
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
app.get('/search', async (c) => {
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
app.get('/domain', (c) => c.json({
  flow: cache.flowDomains,
  evm: cache.flowEvmDomains
}))

app.get('/token', (c) => c.json({
  flow: cache.flowTokens,
  evm: cache.flowEvmTokens
}))

app.get('/nft', (c) => c.json({
  flow: cache.flowNFTs,
  evm: cache.flowEvmNFTs
}))

// Check Flow domain
app.get('/check/flow/domain/:domain', (c) => {
  const domain = c.req.param('domain').toLowerCase()
  const isMalicious = cache.flowDomains.some(d => d.toLowerCase() === domain)
  return c.json({
    domain,
    isMalicious,
    type: isMalicious ? 'flow-domain' : 'unknown'
  })
})

// Check Flow-EVM domain
app.get('/check/flow-evm/domain/:domain', (c) => {
  const domain = c.req.param('domain').toLowerCase()
  const isMalicious = cache.flowEvmDomains.some(d => d.toLowerCase() === domain)
  return c.json({
    domain,
    isMalicious,
    type: isMalicious ? 'flow-evm-domain' : 'unknown'
  })
})

// Check Flow identifier
app.get('/check/flow/:identifier', (c) => {
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
app.get('/check/flow-evm/:address', (c) => {
  const address = c.req.param('address')
  const isToken = cache.flowEvmTokens.includes(address)
  const isNFT = cache.flowEvmNFTs.includes(address)
  return c.json({
    address,
    isMalicious: isToken || isNFT,
    type: isToken ? 'flow-evm-token' : (isNFT ? 'flow-evm-nft' : 'unknown')
  })
})

// Export Vercel Edge handler
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
export const HEAD = handle(app)
export const OPTIONS = handle(app) 