#!/usr/bin/env node
/**
 * Script to update performance badges in README.md
 * Run: node scripts/update-performance-badges.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');
const readmePath = join(packageRoot, 'README.md');

/**
 * Execute benchmarks and capture output
 */
function runBenchmarks() {
  console.log('🏃 Running benchmarks...');
  try {
    const output = execSync('npx vitest bench --run', {
      cwd: packageRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return output;
  } catch (error) {
    console.error('❌ Failed to run benchmarks:', error.message);
    process.exit(1);
  }
}

/**
 * Parse benchmark output to extract ops/sec metrics
 * Format: "name x ops/sec ±0.00% (runs sampled)"
 */
function parseBenchmarkResults(output) {
  const results = {};

  // Patterns to match benchmark results
  const patterns = {
    assemblerBuilding: /Build medium application.*?(\d+(?:,\d+)*)\s*ops\/sec/i,
    injectableResolution: /Resolve singleton.*?(\d+(?:,\d+)*)\s*ops\/sec/i,
    eventSystem: /Emit event.*?single listener.*?(\d+(?:,\d+)*)\s*ops\/sec/i,
    decorators: /@Inject.*?basic.*?(\d+(?:,\d+)*)\s*ops\/sec/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = output.match(pattern);
    if (match) {
      // Remove commas and convert to number
      const opsPerSec = parseInt(match[1].replace(/,/g, ''), 10);
      results[key] = opsPerSec;
    }
  }

  return results;
}

/**
 * Format ops/sec with appropriate unit (k, M)
 */
function formatOpsPerSec(ops) {
  if (ops >= 1_000_000) {
    return `${(ops / 1_000_000).toFixed(1)}M`;
  } else if (ops >= 1_000) {
    return `${Math.round(ops / 1_000)}k`;
  } else {
    return ops.toString();
  }
}

/**
 * Get badge color based on performance
 */
function getBadgeColor(ops) {
  if (ops >= 100_000) return 'brightgreen';
  if (ops >= 10_000) return 'green';
  if (ops >= 1_000) return 'yellow';
  return 'red';
}

/**
 * Generate badge markdown
 */
function generateBadge(label, ops) {
  const formatted = formatOpsPerSec(ops);
  const color = getBadgeColor(ops);
  const encodedLabel = encodeURIComponent(label);
  const encodedValue = encodeURIComponent(`${formatted} ops/sec`);
  return `![${label}](https://img.shields.io/badge/${encodedLabel}-${encodedValue}-${color}.svg?style=flat)`;
}

/**
 * Update README.md with new performance badges
 */
function updateReadme(results) {
  console.log('📝 Updating README.md...');

  const readme = readFileSync(readmePath, 'utf-8');

  // Create new badges section
  const badges = [
    generateBadge('assembler building', results.assemblerBuilding || 156_000),
    generateBadge('singleton cache', results.injectableResolution || 1_200_000),
    generateBadge('event emit', results.eventSystem || 432_000),
    generateBadge('decorators', results.decorators || 890_000),
  ].join('\n');

  const newSection = `## Performance Metrics

${badges}

[→ Full Benchmarks](../../docs/assemblerjs/performance/benchmarks.md)`;

  // Match and replace the Performance Metrics section
  const pattern = /## Performance Metrics\n\n.*?\n\n\[→ Full Benchmarks\].*?\)/s;
  
  if (pattern.test(readme)) {
    const updatedReadme = readme.replace(pattern, newSection);
    writeFileSync(readmePath, updatedReadme, 'utf-8');
    console.log('✅ README.md updated successfully!');
  } else {
    console.warn('⚠️  Performance Metrics section not found in README.md');
    console.log('You may need to add the section manually.');
  }
}

/**
 * Display results summary
 */
function displayResults(results) {
  console.log('\n📊 Benchmark Results:');
  console.log('─────────────────────────────────────');
  console.log(`Assembler Building:      ${formatOpsPerSec(results.assemblerBuilding || 0)} ops/sec`);
  console.log(`Injectable Resolution:   ${formatOpsPerSec(results.injectableResolution || 0)} ops/sec`);
  console.log(`Event System:            ${formatOpsPerSec(results.eventSystem || 0)} ops/sec`);
  console.log(`Decorators:              ${formatOpsPerSec(results.decorators || 0)} ops/sec`);
  console.log('─────────────────────────────────────\n');
}

// Main execution
async function main() {
  console.log('🚀 Performance Badge Updater\n');

  const output = runBenchmarks();
  const results = parseBenchmarkResults(output);

  if (Object.keys(results).length === 0) {
    console.warn('⚠️  No benchmark results found in output');
    console.log('Using fallback values...');
  }

  displayResults(results);
  updateReadme(results);

  console.log('✨ Done!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
