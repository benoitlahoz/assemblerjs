import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Assemblage,
  Assembler,
  AbstractAssemblage,
  Context,
  AspectManager,
  type AssemblerContext,
  Aspect,
  Before,
  AbstractAspect,
  type AdviceContext,
} from '../src';
import { AbstractUserService, UserService } from './fixtures/aspects';

// Service injecté dans l'aspect
@Assemblage()
class Logger {
  logs: string[] = [];

  log(message: string) {
    this.logs.push(message);
  }
}

// Aspect avec une dépendance - Logger sera résolu depuis le contexte parent
@Aspect()
class LoggingAspectWithDependency implements AbstractAspect {
  constructor(private logger: Logger) {}

  @Before('execution(UserService.*)')
  logBefore(context: AdviceContext) {
    this.logger.log(`[BEFORE] ${context.methodName}`);
  }
}

describe('AOP - Aspects with Dependencies', () => {
  beforeEach(() => {
    AspectManager.resetGlobalState();
  });

  it('should support aspects with injected dependencies', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService], [Logger]],
      aspects: [[LoggingAspectWithDependency]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public logger: Logger,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Call a method
    await app.userService.create({ name: 'John', email: 'john@test.com' });

    // Check logs were captured through the injected Logger
    console.log('Logger logs:', app.logger.logs);
    expect(app.logger.logs.length).toBeGreaterThan(0);
    expect(app.logger.logs[0]).toContain('[BEFORE] create');
  });
});
