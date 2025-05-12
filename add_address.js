import fs from 'fs/promises';

// Usage: node add_address.js [targetFile]
const inputFile = 'tmp.txt';
const targetFile = process.argv[2] || 'flow-evm-nft-blocklist.json';

async function main() {
  // Read all addresses from tmp.txt
  const txt = await fs.readFile(inputFile, 'utf8');
  const newAddresses = txt
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0);

  // Read the target JSON file
  const json = JSON.parse(await fs.readFile(targetFile, 'utf8'));
  const existing = Array.isArray(json.addresses) ? json.addresses : [];

  // Merge, deduplicate, and sort
  const merged = Array.from(new Set([...existing, ...newAddresses]));

  // Save back to the JSON file
  json.addresses = merged;
  await fs.writeFile(targetFile, JSON.stringify(json, null, 2));
  console.log(`Added ${merged.length - existing.length} new addresses. Total: ${merged.length}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
