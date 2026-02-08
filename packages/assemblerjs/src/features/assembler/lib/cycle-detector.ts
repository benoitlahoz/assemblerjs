import type { Identifier } from '@/shared/common';

export interface CycleDetectionResult {
  cycle: string[];
  path: string;
}

/**
 * Abstract cycle detector base class
 */
abstract class AbstractCycleDetector {
  abstract detect(
    injectables: Map<Identifier<any>, any>,
    formatFn: (id: Identifier<any>) => string
  ): CycleDetectionResult[];
}

/**
 * NoOp implementation - zero overhead when disabled
 */
class NoOpCycleDetector extends AbstractCycleDetector {
  detect(): CycleDetectionResult[] {
    return [];
  }
}

/**
 * Active implementation - real cycle detection
 */
class ActiveCycleDetector extends AbstractCycleDetector {
  detect(
    injectables: Map<Identifier<any>, any>,
    formatFn: (id: Identifier<any>) => string
  ): CycleDetectionResult[] {
    const cycles: CycleDetectionResult[] = [];
    const globalVisited = new Set<Identifier<any>>();

    for (const [identifier] of injectables) {
      // Skip if we've already fully analyzed this node and found no cycles starting from it
      if (globalVisited.has(identifier)) continue;

      const path: Identifier<any>[] = [];
      const inPath = new Set<Identifier<any>>();

      if (this.hasCycleDFS(identifier, path, inPath, injectables)) {
        // Cycle found - extract the cycle path
        const cycleStartIdx = path.findIndex((id) => id === identifier);
        if (cycleStartIdx >= 0) {
          const cyclePath = path.slice(cycleStartIdx).map((id) => formatFn(id));
          cycles.push({
            cycle: cyclePath,
            path: cyclePath.join(' → '),
          });
        }
      }

      // Mark as visited only after fully exploring
      globalVisited.add(identifier);
    }

    return cycles;
  }

  /**
   * DFS helper to detect cycles
   * Only tracks the current path (inPath), not globally visited nodes
   * This allows the same service to be used by multiple parents without false positives
   */
  private hasCycleDFS(
    current: Identifier<any>,
    path: Identifier<any>[],
    inPath: Set<Identifier<any>>,
    injectables: Map<Identifier<any>, any>
  ): boolean {
    if (inPath.has(current)) {
      path.push(current);
      return true; // Cycle detected in current path
    }

    path.push(current);
    inPath.add(current);

    const injectable = injectables.get(current);
    if (injectable?.dependencies && injectable.dependencies.length > 0) {
      for (const dep of injectable.dependencies) {
        if (this.hasCycleDFS(dep, path, inPath, injectables)) {
          return true;
        }
      }
    }

    inPath.delete(current);
    path.pop();
    return false;
  }
}

/**
 * Singleton manager for cycle detector
 */
export class CycleDetector {
  private static instance: AbstractCycleDetector;

  static {
    // Default: NoOp (zero overhead)
    CycleDetector.instance = new NoOpCycleDetector();
  }

  public static getInstance(): AbstractCycleDetector {
    return CycleDetector.instance;
  }

  public static enable(): void {
    CycleDetector.instance = new ActiveCycleDetector();
  }

  public static disable(): void {
    CycleDetector.instance = new NoOpCycleDetector();
  }
}
