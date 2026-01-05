import { readFileSync } from 'node:fs';

const benchmarksPath = '/Users/benoitlahoz/Documents/Development/assemblerjs/docs/assemblerjs/performance/benchmarks.md';
const benchmarks = readFileSync(benchmarksPath, 'utf-8');

const pattern = /## Performance Metrics\n\n.*?(?=\n\n##)/s;

console.log('Pattern test:', pattern.test(benchmarks));

if (pattern.test(benchmarks)) {
  const match = benchmarks.match(pattern);
  console.log('\n✅ Pattern matched!');
  console.log('Matched section:');
  console.log('─────────────────────────────────────');
  console.log(match[0]);
  console.log('─────────────────────────────────────');
} else {
  console.log('\n❌ Pattern did not match');
  
  // Let's see what we have
  const lines = benchmarks.split('\n').slice(0, 20);
  console.log('\nFirst 20 lines:');
  console.log(lines.join('\n'));
}
