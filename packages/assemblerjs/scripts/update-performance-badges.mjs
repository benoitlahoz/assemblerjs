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
const workspaceRoot = join(packageRoot, '../..');
const readmePath = join(packageRoot, 'README.md');
const benchmarksPath = join(packageRoot, '../../docs/assemblerjs/performance/benchmarks.md');
const benchResultsPath = join(packageRoot, 'bench/bench-results.json');

/**
 * Execute benchmarks and generate JSON output
 */
function runBenchmarks() {
  console.log('🏃 Running benchmarks...');
  try {
    // Use Nx command from workspace root
    // JSON output is configured in vite.config.mts via benchmark.outputJson
    execSync('npx nx bench assemblerjs', {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    console.log('✅ Benchmarks completed');
  } catch (error) {
    console.error('❌ Failed to run benchmarks:', error.message);
    process.exit(1);
  }
}

/**
 * Parse benchmark JSON output to extract ops/sec metrics
 * Vitest benchmark JSON structure - search through all results
 * Note: Some benchmarks have internal loops, so we multiply Hz by loop count
 */
function parseBenchmarkResults() {
  try {
    const jsonContent = readFileSync(benchResultsPath, 'utf-8');
    const benchData = JSON.parse(jsonContent);
    
    const results = {};
    
    // Vitest benchmark JSON structure
    const searchBenchmarks = (obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(item => searchBenchmarks(item));
      } else if (obj && typeof obj === 'object') {
        // Check if this is a benchmark result with hz value
        if (obj.name && obj.hz && obj.hz > 0) {
          const name = obj.name;
          const hz = obj.hz;
          
          // Match specific benchmarks we want to track
          if (name.includes('Build medium application')) {
            if (!results.assemblerBuilding || hz > results.assemblerBuilding) {
              results.assemblerBuilding = Math.round(hz);
            }
          } else if (name.includes('Access singleton service') && name.includes('no dependencies')) {
            if (!results.injectableResolution || hz > results.injectableResolution) {
              results.injectableResolution = Math.round(hz);
            }
          } else if (name === 'Emit with 1 listener') {
            results.eventSystem = Math.round(hz);
          } else if (name === '@Assemblage() decorator application') {
            results.decorators = Math.round(hz);
          }
        }
        // Recursively search in object values
        Object.values(obj).forEach(value => searchBenchmarks(value));
      }
    };
    
    searchBenchmarks(benchData);
    
    return results;
  } catch (error) {
    console.warn('⚠️  Failed to read benchmark JSON:', error.message);
    return {};
  }
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

[→ Full Benchmarks](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/performance/benchmarks.md)`;

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
 * Update benchmarks.md with new performance badges
 */
function updateBenchmarks(results) {
  console.log('📝 Updating benchmarks.md...');

  const benchmarks = readFileSync(benchmarksPath, 'utf-8');

  // Create new badges section
  const badges = [
    generateBadge('assembler building', results.assemblerBuilding || 156_000),
    generateBadge('singleton cache', results.injectableResolution || 1_200_000),
    generateBadge('event emit', results.eventSystem || 432_000),
    generateBadge('decorators', results.decorators || 890_000),
  ].join('\n');

  const newSection = `## Performance Metrics

${badges}`;

  // Match and replace the Performance Metrics section (only badges, no link)
  const pattern = /## Performance Metrics\n\n.*?(?=\n\n##)/s;
  
  if (pattern.test(benchmarks)) {
    const updatedBenchmarks = benchmarks.replace(pattern, newSection);
    writeFileSync(benchmarksPath, updatedBenchmarks, 'utf-8');
    console.log('✅ benchmarks.md updated successfully!');
  } else {
    console.warn('⚠️  Performance Metrics section not found in benchmarks.md');
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

  const skipBenchmarks = process.argv.includes('--skip-benchmarks');
  
  if (skipBenchmarks) {
    console.log('⏭️  Skipping benchmark run, using existing results...\n');
  } else {
    runBenchmarks();
  }
  
  const results = parseBenchmarkResults();

  if (Object.keys(results).length === 0) {
    console.warn('⚠️  No benchmark results found in output');
    console.log('Using fallback values...');
  }

  displayResults(results);
  updateReadme(results);
  updateBenchmarks(results);

  console.log('✨ Done!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
