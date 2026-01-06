import { Transversal, Before, After, Around, AbstractTransversal, type AdviceContext } from '../../../src';

export abstract class AbstractLoggingTransversal implements AbstractTransversal {
  public abstract logs: string[];
}

/**
 * Logging transversal for testing @Before, @After, and @Around advices
 */
@Transversal()
export class LoggingTransversal implements AbstractLoggingTransversal {
  public logs: string[] = [];

  onInit() {
    this.logs = [];
  }

  @Before('execution(*.*)')
  logBefore(context: AdviceContext) {
    this.logs.push(`[BEFORE] ${context.methodName}(${JSON.stringify(context.args)})`);
  }

  @After('execution(*.*)')
  logAfter(context: AdviceContext) {
    this.logs.push(`[AFTER] ${context.methodName} -> ${JSON.stringify(context.result)}`);
  }

  @Around('execution(*.create)')
  async logAround(context: AdviceContext) {
    this.logs.push(`[AROUND-START] ${context.methodName}`);
    const start = Date.now();
    try {
      const result = await context.proceed!();
      const duration = Date.now() - start;
      this.logs.push(`[AROUND-END] ${context.methodName} (${duration}ms)`);
      return result;
    } catch (error) {
      this.logs.push(`[AROUND-ERROR] ${context.methodName}`);
      throw error;
    }
  }
}
