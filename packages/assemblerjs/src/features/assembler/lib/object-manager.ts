import { DebugLogger } from './debug-logger';

/**
 * Get the type of identifier (string or symbol)
 */
function getIdentifierType(identifier: string | symbol): string {
  return typeof identifier === 'symbol' ? 'symbol' : 'string';
}

export class ObjectManager {
  private objects: Map<string | symbol, unknown> = new Map();
  private globals: Map<string, any> = new Map();

  public use<T>(identifier: string | symbol, object: T): T {
    if (this.has(identifier)) {
      const identifierStr = typeof identifier === 'symbol' ? identifier.toString() : String(identifier);
      const errorMessage = `Object/value '${identifierStr}' is already registered (cannot register twice).`;
      
      DebugLogger.getInstance().log('error', 'Duplicate object/value registration', {
        identifier: identifierStr,
        type: getIdentifierType(identifier),
        error: errorMessage,
      });
      
      throw new Error(errorMessage);
    }
    this.objects.set(identifier, object);
    return object;
  }

  public has(identifier: string | symbol): boolean {
    return this.objects.has(identifier);
  }

  public require<T>(identifier: string | symbol): T {
    if (!this.objects.has(identifier)) {
      const identifierStr = typeof identifier === 'symbol' ? identifier.toString() : String(identifier);
      const errorMessage = `Object/value '${identifierStr}' has not been registered in the object store.`;
      
      DebugLogger.getInstance().log('error', 'Object/value not found', {
        identifier: identifierStr,
        type: getIdentifierType(identifier),
        error: errorMessage,
      });
      
      throw new Error(errorMessage);
    }
    return this.objects.get(identifier) as T;
  }

  public addGlobal(key: string, value: any): void {
    if (this.globals.has(key)) {
      throw new Error(
        `Global value with key '${key}' has already been registered.`
      );
    }
    this.globals.set(key, value);
  }

  public global(key: string): any | undefined {
    return this.globals.get(key);
  }
}