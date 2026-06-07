export interface OrderingKey {
  order: number;
  declarationIndex: number;
}

export interface OrderingOptions<T> {
  getKey(item: T): OrderingKey;
  tieBreaker?: (a: T, b: T) => number;
  fallbackOrder?: number;
  fallbackDeclarationIndex?: number;
}

export class OrderingEngine<T> {
  private readonly getKeyFn: (item: T) => OrderingKey;
  private readonly tieBreaker?: (a: T, b: T) => number;
  private readonly fallbackOrder: number;
  private readonly fallbackDeclarationIndex: number;

  constructor(options: OrderingOptions<T>) {
    this.getKeyFn = options.getKey;
    this.tieBreaker = options.tieBreaker;
    this.fallbackOrder = options.fallbackOrder ?? Number.MAX_SAFE_INTEGER;
    this.fallbackDeclarationIndex =
      options.fallbackDeclarationIndex ?? Number.MAX_SAFE_INTEGER;
  }

  public compare(a: T, b: T): number {
    const keyA = this.normalizeKey(this.getKeyFn(a));
    const keyB = this.normalizeKey(this.getKeyFn(b));

    const byOrder = OrderingEngine.compareKeys(keyA, keyB);

    if (byOrder !== 0) {
      return byOrder;
    }

    if (this.tieBreaker) {
      return this.tieBreaker(a, b);
    }

    return 0;
  }

  public sort(items: readonly T[]): T[] {
    return [...items].sort((a, b) => this.compare(a, b));
  }

  public findLowestKey(items: Iterable<T>): OrderingKey {
    let best: OrderingKey | undefined;

    for (const item of items) {
      const candidate = this.normalizeKey(this.getKeyFn(item));

      if (!best || OrderingEngine.compareKeys(candidate, best) < 0) {
        best = candidate;
      }
    }

    return (
      best ?? {
        order: this.fallbackOrder,
        declarationIndex: this.fallbackDeclarationIndex,
      }
    );
  }

  public static compareKeys(a: OrderingKey, b: OrderingKey): number {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.declarationIndex - b.declarationIndex;
  }

  private normalizeKey(key: Partial<OrderingKey>): OrderingKey {
    return {
      order: typeof key.order === 'number' ? key.order : this.fallbackOrder,

      declarationIndex:
        typeof key.declarationIndex === 'number'
          ? key.declarationIndex
          : this.fallbackDeclarationIndex,
    };
  }
}
