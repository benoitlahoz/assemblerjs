import { readFileSync, writeFileSync } from 'fs';

const files = [
  './packages/assemblerjs/e2e/aspects-apply-decorator.spec.ts',
  './packages/assemblerjs/e2e/aspects-basic.spec.ts',
  './packages/assemblerjs/e2e/aspects-integration.spec.ts',
  './packages/assemblerjs/e2e/aspects-pointcuts.spec.ts',
  './packages/assemblerjs/e2e/aspects-priorities.spec.ts',
  './packages/assemblerjs/e2e/aspects-simple.spec.ts',
  './packages/assemblerjs/e2e/aspects-with-dependencies.spec.ts'
];

const beforeEachCode = `  beforeEach(() => {
    AspectManager.resetGlobalState();
  });

`;

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  
  // Si le fichier a déjà le resetGlobalState, skip
  if (content.includes('AspectManager.resetGlobalState()')) {
    console.log(`✓ ${file} - déjà mis à jour`);
    return;
  }
  
  // Remplacer tous les describe( par describe + beforeEach
  const describeRegex = /(describe\([^{]+\{)\n/g;
  content = content.replace(describeRegex, `$1\n${beforeEachCode}`);
  
  writeFileSync(file, content, 'utf-8');
  console.log(`✓ ${file} - mis à jour`);
});

console.log('\n✅ Tous les fichiers ont été mis à jour');
