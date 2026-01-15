import type { Plugin } from 'vite';
import type { AssemblerjsPluginOptions } from './types';

/**
 * Build-time validation for AssemblerJS configurations.
 */
export function createValidationPlugin(options: Required<AssemblerjsPluginOptions>): Plugin {
  if (!options.validation.enabled) {
    return {};
  }

  const assemblages = new Map<string, { file: string; dependencies: string[]; tags: string[] }>();
  const warnings: string[] = [];
  const errors: string[] = [];

  return {
    name: 'vite-plugin-assemblerjs:validation',

    buildStart() {
      assemblages.clear();
      warnings.length = 0;
      errors.length = 0;
    },

    transform(code: string, id: string) {
      if (!isAssemblerFile(code)) {
        return;
      }
      // Basic AST analysis for AssemblerJS patterns
      analyzeAssemblerCode(code, id, assemblages, warnings, errors, options);
    },

    buildEnd() {
      console.log('Assemblages:', Array.from(assemblages.entries()));
      console.log('Errors before validation:', errors);
      // Perform validation checks
      validateDependencies(assemblages, warnings, errors, options);
      console.log('Errors after validateDependencies:', errors);
      validateCircularDependencies(assemblages, warnings, errors, options);
      console.log('Errors after validateCircular:', errors);
      validateTags(assemblages, warnings, errors, options);


      // Report results
      if (errors.length > 0) {
        console.error('❌ AssemblerJS Validation Errors:');
        errors.forEach(error => console.error(`  ${error}`));
        throw new Error('AssemblerJS validation failed');
      }

      if (warnings.length > 0 && options.validation.warnUnusedAssemblages) {
        console.warn('⚠️  AssemblerJS Validation Warnings:');
        warnings.forEach(warning => console.warn(`  ${warning}`));
      }

      if (errors.length === 0) {
      }
    },
  };
}

/**
 * Check if a file contains AssemblerJS code that needs validation.
 * We only analyze files that contain actual injection logic (@Assemblage decorators
 * or injection-related decorators), not abstract interface definitions.
 */
function isAssemblerFile(code: string): boolean {
  return code.includes('@Assemblage') ||
         code.includes('@Context') ||
         code.includes('@Configuration') ||
         code.includes('@Use') ||
         code.includes('@Definition') ||
         code.includes('@Global') ||
         code.includes('@Optional') ||
         code.includes('inject:') ||
         code.includes('tags:');
}

/**
 * Analyze AssemblerJS code for validation.
 */
function analyzeAssemblerCode(
  code: string,
  file: string,
  assemblages: Map<string, { file: string; dependencies: string[]; tags: string[] }>,
  warnings: string[],
  errors: string[],
  options: Required<AssemblerjsPluginOptions>
): void {
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect @Assemblage decorators
    if (line.includes('@Assemblage(')) {
      const classMatch = findClassDeclaration(lines, i);
      if (classMatch) {
        const className = classMatch.className;
        const assemblageInfo = {
          file,
          dependencies: [] as string[],
          tags: [] as string[]
        };

        // Analyze the @Assemblage configuration
        const configBlock = extractAssemblageConfig(lines, i);
        if (configBlock) {
          // Extract inject dependencies
          const injectMatches = configBlock.match(/inject:\s*\[([\s\S]*?)\]/);
          console.log('injectMatches:', injectMatches);
          if (injectMatches) {
            const injectContent = injectMatches[1];
            // Extract dependency arrays like [ClassName] or [AbstractClass, ConcreteClass]
            const depArrays = injectContent.match(/\[[^\]]+\]/g);
            if (depArrays) {
              for (const depArray of depArrays) {
                // Extract class names from the array
                const classNames = depArray.match(/(\w+)/g);
                if (classNames && classNames.length > 0) {
                  // For [Abstract, Concrete], we want the abstract class as the dependency
                  // For [Concrete], we want the concrete class
                  const dependencyName = classNames[0]; // First element is always the dependency type
                  console.log('Pushing dependency:', dependencyName);
                  assemblageInfo.dependencies.push(dependencyName);
                }
              }
            }
          }

          // Extract tags
          const tagsMatches = configBlock.match(/tags:\s*\[([^\]]*)\]/);
          if (tagsMatches) {
            const tagsContent = tagsMatches[1];
            const tagMatches = tagsContent.match(/['"]([^'"]+)['"]/g);
            if (tagMatches) {
              assemblageInfo.tags = tagMatches.map(tag => tag.slice(1, -1));
            }
          }

          // Also check for single string tags like tags: 'tag_name'
          const singleTagMatch = configBlock.match(/tags:\s*['"]([^'"]+)['"]/);
          if (singleTagMatch) {
            assemblageInfo.tags.push(singleTagMatch[1]);
          }
        }

        assemblages.set(className, assemblageInfo);
      }
    }

    // Detect constructor injection patterns
    if (line.includes('constructor(') && assemblages.size > 0) {
      const currentAssemblage = Array.from(assemblages.values()).find(a => a.file === file);
      if (currentAssemblage) {
        // Extract parameter types from constructor
        const paramMatch = line.match(/constructor\(([^)]+)\)/);
        if (paramMatch) {
          const params = paramMatch[1];
          // Basic regex to extract type annotations
          const typeMatches = params.match(/:\s*(\w+)/g);
          if (typeMatches) {
            const constructorDeps = typeMatches.map(match => match.replace(': ', ''));
            // Validate that constructor dependencies match configured inject dependencies
            if (options.validation.strictInjection) {
              for (const dep of constructorDeps) {
                if (!currentAssemblage.dependencies.includes(dep)) {
                  warnings.push(`Constructor parameter '${dep}' in ${Array.from(assemblages.keys()).find(key => assemblages.get(key) === currentAssemblage)} is not declared in inject configuration`);
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Find the class declaration after a decorator.
 */
function findClassDeclaration(lines: string[], decoratorLineIndex: number): { className: string } | null {
  for (let i = decoratorLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const classMatch = line.match(/^(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      return { className: classMatch[1] };
    }
    // Stop if we encounter another decorator
    if (line.startsWith('@')) {
      break;
    }
  }
  return null;
}

/**
 * Extract the @Assemblage configuration block.
 */
function extractAssemblageConfig(lines: string[], decoratorLineIndex: number): string | null {
  let configStart = -1;
  let braceCount = 0;
  let inConfig = false;

  for (let i = decoratorLineIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('@Assemblage(')) {
      configStart = i;
      inConfig = true;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }

    if (inConfig) {
      const add = (line.match(/\{/g) || []).length;
      const sub = (line.match(/\}/g) || []).length;
      braceCount += add;
      braceCount -= sub;

      if (braceCount === 0) {
        // Extract the config block
        const configLines = lines.slice(configStart, i + 1);
        const result = configLines.join('\n');
        return result;
      }
    }

    // Stop if we find the class declaration
    if (line.match(/^(?:export\s+)?class\s+\w+/)) {
      break;
    }
  }

  return null;
}

/**
 * Validate that all dependencies exist.
 */
function validateDependencies(
  assemblages: Map<string, { file: string; dependencies: string[]; tags: string[] }>,
  warnings: string[],
  errors: string[],
  options: Required<AssemblerjsPluginOptions>
): void {
  if (!options.validation.strictInjection) return;

  const allClassNames = new Set(assemblages.keys());

  for (const [className, info] of assemblages) {
    for (const dep of info.dependencies) {
      if (!allClassNames.has(dep)) {
        errors.push(`Missing dependency: ${className} injects ${dep} but ${dep} is not registered as an Assemblage`);
      }
    }
  }
}

/**
 * Validate circular dependencies.
 */
function validateCircularDependencies(
  assemblages: Map<string, { file: string; dependencies: string[]; tags: string[] }>,
  warnings: string[],
  errors: string[],
  options: Required<AssemblerjsPluginOptions>
): void {
  if (!options.validation.checkCircular) return;

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCircularDependency(className: string): boolean {
    if (recursionStack.has(className)) return true;
    if (visited.has(className)) return false;

    visited.add(className);
    recursionStack.add(className);

    const info = assemblages.get(className);
    if (info) {
      for (const dep of info.dependencies) {
        if (hasCircularDependency(dep)) {
          return true;
        }
      }
    }

    recursionStack.delete(className);
    return false;
  }

  for (const className of assemblages.keys()) {
    if (hasCircularDependency(className)) {
      errors.push(`Circular dependency detected involving ${className}`);
      break; // Only report first circular dependency found
    }
  }
}

/**
 * Validate tag references.
 */
function validateTags(
  assemblages: Map<string, { file: string; dependencies: string[]; tags: string[] }>,
  warnings: string[],
  errors: string[],
  options: Required<AssemblerjsPluginOptions>
): void {
  if (!options.validation.validateTags) return;

  // Collect all unique tags
  const allTags = new Set<string>();
  for (const info of assemblages.values()) {
    info.tags.forEach(tag => allTags.add(tag));
  }

  // Check for potential tag reference issues
  // This is a basic validation - in a real implementation,
  // we'd need to analyze @Context().tagged() calls
  if (allTags.size > 0) {
  }
}