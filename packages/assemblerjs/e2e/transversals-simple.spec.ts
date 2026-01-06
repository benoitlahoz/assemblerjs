import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, TransversalManager, type AssemblerContext } from '../src';
import {
  AbstractUserService,
  UserService,
  LoggingTransversal,
  AbstractLoggingTransversal,
} from './fixtures/transversals';

describe('AOP (Transversals) - Simple Test', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  it('should register and use a transversal', async () => {
    @Assemblage({
      inject: [
        [AbstractUserService, UserService],
      ],
      engage: [[AbstractLoggingTransversal, LoggingTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    
    // Get transversal instance from context
    const loggingTransversal = app.context.require(AbstractLoggingTransversal);
    
    // Verify transversal is initialized
    expect(loggingTransversal).toBeDefined();
    expect(loggingTransversal.logs).toEqual([]);
    
    // Call a method
    await app.userService.create({ name: 'John', email: 'john@test.com' });
    
    // Check transversal was triggered
    expect(loggingTransversal.logs.length).toBeGreaterThan(0);
  });
});
