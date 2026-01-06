import { Transversal, Before, After, AbstractTransversal, type AdviceContext } from '../../../src';

/**
 * Caching transversal for read operations
 */
@Transversal()
export class CachingTransversal implements AbstractTransversal {
  private cache = new Map<string, any>();
  public hits = 0;
  public misses = 0;

  onInit() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  @Before('execution(UserService.findById)')
  checkCache(context: AdviceContext) {
    const [id] = context.args;
    const cacheKey = `findById:${id}`;
    if (this.cache.has(cacheKey)) {
      this.hits++;
      // Note: We can't short-circuit the method call from @Before
      // This is just for demonstration
    } else {
      this.misses++;
    }
  }

  @After('execution(UserService.findById)')
  updateCache(context: AdviceContext) {
    const [id] = context.args;
    const cacheKey = `findById:${id}`;
    this.cache.set(cacheKey, context.result);
  }

  @After('execution(UserService.create)')
  @After('execution(UserService.update)')
  @After('execution(UserService.delete)')
  invalidateCache(context: AdviceContext) {
    // Clear cache on write operations
    this.cache.clear();
  }
}
