import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Assemblage,
  Assembler,
  AbstractAssemblage,
  Context,
  TransversalManager,
  type AssemblerContext,
  Transversal,
  Before,
  AbstractTransversal,
  type AdviceContext,
} from '../src';
import { AbstractUserService, UserService } from './fixtures/transversals';

// Service injecté dans le transversal
@Assemblage()
class Logger {
  logs: string[] = [];

  log(message: string) {
    this.logs.push(message);
  }
}

// Transversal avec une dépendance - Logger sera résolu depuis le contexte parent
@Transversal()
class LoggingTransversalWithDependency implements AbstractTransversal {
  constructor(private logger: Logger) {}

  @Before('execution(UserService.*)')
  logBefore(context: AdviceContext) {
    this.logger.log(`[BEFORE] ${context.methodName}`);
  }
}

describe('AOP (Transversals) - Aspects with Dependencies', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  it('should support transversals with injected dependencies', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService], [Logger]],
      engage: [[LoggingTransversalWithDependency]],
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
