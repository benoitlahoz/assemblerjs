# Advanced Examples

Real-world patterns and complete examples for `assemblerjs`.

## Multi-Module Application

A complete application with database, API, and lifecycle management.

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage, Context, AssemblerContext, Global, Dispose } from 'assemblerjs';

// Database module
@Assemblage({ tags: ['module', 'database'] })
class DatabaseModule implements AbstractAssemblage {
  private connection: any;
  
  static onRegister() {
    console.log('Database module registered');
  }
  
  async onInit(@Configuration() config: any) {
    console.log(`Connecting to ${config.dbUrl}...`);
    // Simulate connection
    this.connection = { connected: true };
  }
  
  query(sql: string) {
    console.log(`Executing: ${sql}`);
    return [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }];
  }
  
  async onDispose() {
    console.log('Closing database connection');
    this.connection = null;
  }
}

// API module
@Assemblage({ 
  tags: ['module', 'api'],
  inject: [[DatabaseModule]],
})
class ApiModule implements AbstractAssemblage {
  constructor(private db: DatabaseModule) {}
  
  getUsers() {
    return this.db.query('SELECT * FROM users');
  }
  
  getUserById(id: number) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Application
@Assemblage({
  inject: [[DatabaseModule], [ApiModule]],
  global: { 
    appName: 'MyApp',
    version: '1.0.0',
  },
})
class Application implements AbstractAssemblage {
  constructor(
    @Global('appName') private name: string,
    @Global('version') private version: string,
    @Context() private context: AssemblerContext,
    @Dispose() public dispose: () => void,
    private api: ApiModule
  ) {
    console.log(`Starting ${this.name} v${this.version}`);
  }
  
  async start() {
    const users = await this.api.getUsers();
    console.log('Users:', users);
    
    const user = await this.api.getUserById(1);
    console.log('User 1:', user);
  }
}

// Bootstrap
async function main() {
  const app = Assembler.build(Application, {
    dbUrl: 'postgresql://localhost/mydb',
  });

  await app.start();
  await app.dispose(); // Cleanup
}

main();
```

## Plugin System with Tags

Extensible plugin architecture using tags.

```typescript
// Plugin interface
abstract class Plugin implements AbstractAssemblage {
  abstract name: string;
  abstract version: string;
  abstract init(): void | Promise<void>;
}

// Auth plugin
@Assemblage({ tags: ['plugin', 'auth'] })
class AuthPlugin extends Plugin {
  name = 'auth';
  version = '1.0.0';
  
  async init() {
    console.log('Auth plugin initialized');
  }
  
  authenticate(username: string, password: string) {
    console.log(`Authenticating ${username}...`);
    return { token: 'jwt-token' };
  }
}

// Logging plugin
@Assemblage({ tags: ['plugin', 'logging'] })
class LoggingPlugin extends Plugin {
  name = 'logging';
  version = '1.0.0';
  
  async init() {
    console.log('Logging plugin initialized');
  }
  
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

// Cache plugin
@Assemblage({ tags: ['plugin', 'cache'] })
class CachePlugin extends Plugin {
  name = 'cache';
  version = '1.0.0';
  private cache = new Map();
  
  async init() {
    console.log('Cache plugin initialized');
  }
  
  set(key: string, value: any) {
    this.cache.set(key, value);
  }
  
  get(key: string) {
    return this.cache.get(key);
  }
}

// Plugin system
@Assemblage({
  inject: [[AuthPlugin], [LoggingPlugin], [CachePlugin]],
})
class PluginSystem implements AbstractAssemblage {
  private plugins: Plugin[] = [];
  
  constructor(@Context() private context: AssemblerContext) {}
  
  async onInit() {
    // Dynamically load all plugins
    this.plugins = this.context.tagged('plugin');
    console.log(`Loading ${this.plugins.length} plugins...`);
    
    for (const plugin of this.plugins) {
      await plugin.init();
      console.log(`✓ ${plugin.name} v${plugin.version}`);
    }
  }
  
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.find(p => p.name === name);
  }
  
  getPluginsByTag(tag: string): Plugin[] {
    return this.context.tagged(tag);
  }
}

// Usage
const system = Assembler.build(PluginSystem);
const authPlugin = system.getPlugin('auth') as AuthPlugin;
authPlugin.authenticate('user', 'pass');
```

## Factory Pattern with Transient

Create multiple instances with factory pattern.

```typescript
// Task interface
interface TaskData {
  id: number;
  type: string;
  payload: any;
}

// Transient task - new instance each time
@Assemblage({ singleton: false })
class Task implements AbstractAssemblage {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  execute(data: TaskData) {
    console.log(`Task ${data.id}: Processing ${data.type}`);
    console.log(`Payload:`, data.payload);
    
    // Simulate processing
    const duration = Date.now() - this.startTime;
    console.log(`Task ${data.id}: Completed in ${duration}ms`);
  }
}

// Factory that creates tasks
@Assemblage({ inject: [[Task]] })
class TaskFactory implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}
  
  createTask(): Task {
    // Each call returns a new Task instance
    return this.context.require(Task);
  }
}

// Task runner
@Assemblage({ inject: [[TaskFactory]] })
class TaskRunner implements AbstractAssemblage {
  constructor(private factory: TaskFactory) {}
  
  runMany(tasks: TaskData[]) {
    for (const taskData of tasks) {
      const task = this.factory.createTask();
      task.execute(taskData);
    }
  }
}

// Usage
const runner = Assembler.build(TaskRunner);
runner.runMany([
  { id: 1, type: 'email', payload: { to: 'user@example.com' } },
  { id: 2, type: 'sms', payload: { phone: '+1234567890' } },
  { id: 3, type: 'push', payload: { deviceId: 'abc123' } },
]);
```

## Event-Driven Architecture

Complete event system with multiple services.

```typescript
import { EventManager } from 'assemblerjs';

// Event definitions
const Events = {
  USER_CREATED: 'app.users:created',
  USER_UPDATED: 'app.users:updated',
  USER_DELETED: 'app.users:deleted',
  EMAIL_SENT: 'app.email:sent',
};

// User service (emits events)
@Assemblage({
  events: Object.values(Events),
})
export class UserService 
  extends EventManager 
  implements AbstractAssemblage 
{
  private users: User[] = [];
  
  constructor() {
    super(...Object.values(Events));
  }
  
  createUser(name: string, email: string) {
    const user = { id: Date.now(), name, email };
    this.users.push(user);
    this.emit(Events.USER_CREATED, user);
    return user;
  }
  
  updateUser(id: number, name: string) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.name = name;
      this.emit(Events.USER_UPDATED, user);
    }
    return user;
  }
  
  deleteUser(id: number) {
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      const user = this.users.splice(index, 1)[0];
      this.emit(Events.USER_DELETED, user);
      return user;
    }
  }
}

// Email service (listens and emits)
@Assemblage({
  inject: [[UserService]],
  events: [Events.EMAIL_SENT],
})
export class EmailService 
  extends EventManager 
  implements AbstractAssemblage 
{
  constructor(
    @Context() private context: AssemblerContext,
    private userService: UserService
  ) {
    super(Events.EMAIL_SENT);
    
    // Listen to user events
    context.on(Events.USER_CREATED, this.onUserCreated.bind(this));
    context.on(Events.USER_UPDATED, this.onUserUpdated.bind(this));
    context.on(Events.USER_DELETED, this.onUserDeleted.bind(this));
  }
  
  private async onUserCreated(user: User) {
    console.log(`📧 Sending welcome email to ${user.email}`);
    await this.sendEmail(user.email, 'Welcome!', 'Thanks for joining!');
    this.emit(Events.EMAIL_SENT, { type: 'welcome', to: user.email });
  }
  
  private async onUserUpdated(user: User) {
    console.log(`📧 Sending profile update email to ${user.email}`);
    await this.sendEmail(user.email, 'Profile Updated', 'Your profile has been updated.');
    this.emit(Events.EMAIL_SENT, { type: 'update', to: user.email });
  }
  
  private async onUserDeleted(user: User) {
    console.log(`📧 Sending goodbye email to ${user.email}`);
    await this.sendEmail(user.email, 'Account Deleted', 'Sorry to see you go!');
    this.emit(Events.EMAIL_SENT, { type: 'goodbye', to: user.email });
  }
  
  private async sendEmail(to: string, subject: string, body: string) {
    // Simulate email sending
    console.log(`Sending email: ${subject} to ${to}`);
  }
  
  onDispose() {
    // Cleanup listeners
    this.context.off(Events.USER_CREATED);
    this.context.off(Events.USER_UPDATED);
    this.context.off(Events.USER_DELETED);
  }
}

// Analytics service (listens)
@Assemblage({ inject: [[UserService], [EmailService]] })
export class AnalyticsService implements AbstractAssemblage {
  private stats = {
    usersCreated: 0,
    usersUpdated: 0,
    usersDeleted: 0,
    emailsSent: 0,
  };
  
  constructor(@Context() private context: AssemblerContext) {
    // Track all events
    context.on(Events.USER_CREATED, () => this.stats.usersCreated++);
    context.on(Events.USER_UPDATED, () => this.stats.usersUpdated++);
    context.on(Events.USER_DELETED, () => this.stats.usersDeleted++);
    context.on(Events.EMAIL_SENT, () => this.stats.emailsSent++);
  }
  
  getStats() {
    return this.stats;
  }
  
  onDispose() {
    this.context.off(Events.USER_CREATED);
    this.context.off(Events.USER_UPDATED);
    this.context.off(Events.USER_DELETED);
    this.context.off(Events.EMAIL_SENT);
  }
}

// Application
@Assemblage({
  inject: [[UserService], [EmailService], [AnalyticsService]],
})
class Application implements AbstractAssemblage {
  constructor(
    private users: UserService,
    private analytics: AnalyticsService,
    @Dispose() public dispose: () => void
  ) {}
  
  async run() {
    // Create users
    this.users.createUser('Alice', 'alice@example.com');
    this.users.createUser('Bob', 'bob@example.com');
    
    // Update user
    const alice = this.users.users[0];
    this.users.updateUser(alice.id, 'Alice Smith');
    
    // Delete user
    this.users.deleteUser(alice.id);
    
    // Show stats
    console.log('Analytics:', this.analytics.getStats());
  }
}

// Run
const app = Assembler.build(Application);
await app.run();
await app.dispose();
```

## Abstraction Pattern: Data Store

Complete abstraction pattern with multiple implementations.

```typescript
// Abstractions
abstract class AbstractDataStore implements AbstractAssemblage {
  abstract save(key: string, value: any): Promise<void>;
  abstract load(key: string): Promise<any>;
  abstract delete(key: string): Promise<void>;
}

abstract class AbstractCache implements AbstractAssemblage {
  abstract get(key: string): any;
  abstract set(key: string, value: any): void;
  abstract clear(): void;
}

// Concrete implementations
@Assemblage()
class FileDataStore implements AbstractDataStore {
  async save(key: string, value: any) {
    console.log(`Saving ${key} to file`);
    // Save to file system
  }
  
  async load(key: string) {
    console.log(`Loading ${key} from file`);
    // Load from file system
    return { data: 'from file' };
  }
  
  async delete(key: string) {
    console.log(`Deleting ${key} from file`);
  }
}

@Assemblage()
class MemoryCache implements AbstractCache {
  private cache = new Map();
  
  get(key: string) {
    return this.cache.get(key);
  }
  
  set(key: string, value: any) {
    this.cache.set(key, value);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Data service using abstractions
@Assemblage({
  inject: [
    [AbstractDataStore, FileDataStore],
    [AbstractCache, MemoryCache],
  ],
})
class DataService implements AbstractAssemblage {
  constructor(
    private store: AbstractDataStore,
    private cache: AbstractCache
  ) {}
  
  async getData(key: string) {
    // Try cache first
    let data = this.cache.get(key);
    if (!data) {
      data = await this.store.load(key);
      this.cache.set(key, data);
    }
    return data;
  }
  
  async saveData(key: string, value: any) {
    await this.store.save(key, value);
    this.cache.set(key, value);
  }
  
  async deleteData(key: string) {
    await this.store.delete(key);
    this.cache.clear();
  }
}

// Easy to swap implementations
@Assemblage({
  inject: [
    [AbstractDataStore, DatabaseStore],  // Swap FileDataStore
    [AbstractCache, RedisCache],         // Swap MemoryCache
  ],
})
class ProductionDataService implements AbstractAssemblage {
  constructor(
    private store: AbstractDataStore,
    private cache: AbstractCache
  ) {}
}
```

## Next Steps

- [Core Concepts](../core-concepts/assemblage.md) - Understand the fundamentals
- [Features](../features/events.md) - Explore event system
- [Tree-Shaking](./tree-shaking.md) - Optimize bundle size
- [Benchmarks](../performance/benchmarks.md) - Performance metrics & best practices
- [API Reference](../api/assembler.md) - Detailed API documentation
