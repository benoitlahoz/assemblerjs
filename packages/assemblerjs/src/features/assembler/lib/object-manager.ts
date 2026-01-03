export class ObjectManager {
  private objects: Map<string | symbol, unknown> = new Map();
  private globals: Map<string, any> = new Map();

  public use<T>(identifier: string | symbol, object: T): T {
    if (this.has(identifier)) {
      throw new Error(
        `A value is already registered with identifier '${String(identifier)}'.`
      );
    }
    this.objects.set(identifier, object);
    return object;
  }

  public has(identifier: string | symbol): boolean {
    return this.objects.has(identifier);
  }

  public require<T>(identifier: string | symbol): T {
    if (!this.objects.has(identifier)) {
      throw new Error(
        `Injected object with identifier '${String(
          identifier
        )}' has not been registered.`
      );
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