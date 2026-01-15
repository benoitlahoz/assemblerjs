/**
 * Example AssemblerJS application
 * 
 * This demonstrates how to use AssemblerJS with vite-plugin-assemblerjs.
 * Notice that:
 * 1. No manual import of 'reflect-metadata' needed
 * 2. No manual SWC configuration needed
 * 3. Decorators just work!
 */

// These imports would normally come from the installed package
// For this example, we're just showing the structure
interface AbstractAssemblage {
  onInit?(): void | Promise<void>;
  onDispose?(): void | Promise<void>;
}

// Mock decorator for example purposes
function Assemblage(_options?: any) {
  return function (target: any) {
    return target;
  };
}

// Example service
@Assemblage()
// @ts-expect-error No common properties
class Logger implements AbstractAssemblage {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }

  error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
}

// Example service with dependency
@Assemblage({
  inject: [[Logger]]
})
class UserService implements AbstractAssemblage {
  constructor(private logger: Logger) {}

  async onInit() {
    this.logger.log('UserService initialized');
  }

  getUsers() {
    this.logger.log('Fetching users');
    return ['Alice', 'Bob', 'Charlie'];
  }
}

// Example application
@Assemblage({
  inject: [[UserService]]
})
// @ts-expect-error No common properties
class App implements AbstractAssemblage {
  constructor(private userService: UserService) {}

  async start() {
    const users = this.userService.getUsers();
    console.log('Users:', users);
  }
}

// In a real application, you would build and run the app:
// const app = Assembler.build(App);
// await app.start();

export { App, UserService, Logger };
