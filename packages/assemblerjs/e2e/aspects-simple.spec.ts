import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, type AssemblerContext } from '../src';
import {
  AbstractUserService,
  UserService,
  LoggingAspect,
} from './fixtures/aspects';

describe('AOP - Simple Test', () => {
  it('should register and use an aspect', async () => {
    @Assemblage({
      inject: [
        [AbstractUserService, UserService],
      ],
      aspects: [[LoggingAspect]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    
    // Get aspect instance from context
    const loggingAspect = app.context.require(LoggingAspect) as LoggingAspect;
    
    // Verify aspect is initialized
    expect(loggingAspect).toBeDefined();
    expect(loggingAspect.logs).toEqual([]);
    
    // Call a method
    const result = await app.userService.create({ name: 'John', email: 'john@test.com' });
    
    // Check aspect was triggered
    expect(loggingAspect.logs.length).toBeGreaterThan(0);
  });
});
