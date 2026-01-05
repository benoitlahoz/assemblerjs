import { Aspect, Around, AbstractAspect, type AdviceContext } from '../../../src';

/**
 * Performance monitoring aspect
 */
@Aspect()
export class PerformanceAspect implements AbstractAspect {
  public measurements: Array<{ method: string; duration: number }> = [];

  onInit() {
    this.measurements = [];
  }

  @Around('execution(UserService.*)', 50)
  async measurePerformance(context: AdviceContext) {
    const start = Date.now();
    try {
      const result = await context.proceed!();
      const duration = Date.now() - start;
      this.measurements.push({ method: context.methodName, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.measurements.push({ method: context.methodName, duration });
      throw error;
    }
  }
}
