import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const testCases = [
  {
    name: 'Import Assemblage only',
    code: `import { Assemblage } from './packages/assemblerjs/dist/index.mjs'; console.log(Assemblage);`
  },
  {
    name: 'Import Assembler only',
    code: `import { Assembler } from './packages/assemblerjs/dist/index.mjs'; console.log(Assembler);`
  },
  {
    name: 'Import EventManager only',
    code: `import { EventManager } from './packages/assemblerjs/dist/index.mjs'; console.log(EventManager);`
  },
  {
    name: 'Import all',
    code: `import * as assemblerjs from './packages/assemblerjs/dist/index.mjs'; console.log(assemblerjs);`
  }
];

async function analyzeTreeShaking() {
  for (const testCase of testCases) {
    try {
      const bundle = await rollup({
        input: 'virtual-entry',
        plugins: [
          {
            name: 'virtual',
            resolveId(id) {
              if (id === 'virtual-entry') return id;
              return null;
            },
            load(id) {
              if (id === 'virtual-entry') return testCase.code;
              return null;
            }
          },
          nodeResolve()
        ],
        external: ['@assemblerjs/core']
      });
      
      const { output } = await bundle.generate({
        format: 'es'
      });
      
      const size = output[0].code.length;
      console.log(`${testCase.name}: ${size} bytes`);
    } catch (error) {
      console.error(`Error in ${testCase.name}:`, error.message);
    }
  }
}

analyzeTreeShaking();
