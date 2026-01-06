import { Transversal, Around, AbstractTransversal, type AdviceContext, Configuration } from '../../../src';

/**
 * Performance monitoring transversal
 */
@Transversal()
export class PerformanceTransversal implements AbstractTransversal {
  public measurements: Array<{ method: string; duration: number }> = [];

  constructor(@Configuration() public config?: { threshold: number }) {}

  onInit() {
    this.measurements = [];
  }

  @Around('execution(UserService.*)', 50)
  async measurePerformance(context: AdviceContext) {
    const start = Date.now();
    try {
      const result = await context.proceed!();
      const duration = Date.now() - start;
      
      // Use threshold to filter slow measurements
    if (duration >= (this.config?.threshold ?? 0)) {
        this.measurements.push({ method: context.methodName, duration });
        console.warn(`Performance alert: ${context.methodName} took ${duration}ms (threshold: ${this.config?.threshold ?? 0}ms)`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Same logic for errors
    if (duration >= (this.config?.threshold ?? 0)) {
        this.measurements.push({ method: context.methodName, duration });
        console.error(`Performance error: ${context.methodName} failed after ${duration}ms`);
      }
      
      throw error;
    }
  }
}
