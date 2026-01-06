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

## Aspect-Oriented Programming (AOP)

Real-world examples using Transversals for cross-cutting concerns.

### Comprehensive Logging System

```typescript
import { Transversal, Before, After, Around, AbstractTransversal, type AdviceContext } from 'assemblerjs';

// Logging levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

@Transversal()
class LoggingTransversal implements AbstractTransversal {
  private logs: Array<{ level: LogLevel; message: string; timestamp: Date }> = [];
  private level: LogLevel = LogLevel.INFO;

  constructor(@Configuration('logging') config?: { level?: string }) {
    if (config?.level) {
      this.level = LogLevel[config.level.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO;
    }
  }

  onInit() {
    console.log(`Logging initialized at level: ${LogLevel[this.level]}`);
  }

  @Before('execution(*.*)', 100)
  logMethodEntry(context: AdviceContext) {
    if (this.level <= LogLevel.DEBUG) {
      const message = `→ Entering ${context.target.constructor.name}.${context.methodName}`;
      this.log(LogLevel.DEBUG, message, context.args);
    }
  }

  @After('execution(*.*)', 100)
  logMethodExit(context: AdviceContext) {
    if (this.level <= LogLevel.DEBUG) {
      const message = `← Exiting ${context.target.constructor.name}.${context.methodName}`;
      this.log(LogLevel.DEBUG, message, context.result);
    }
  }

  @Around('execution(*.save*)', 50)
  async logDataOperations(context: AdviceContext) {
    const { methodName, args } = context;
    
    this.log(LogLevel.INFO, `Saving data via ${methodName}`, args[0]);
    
    try {
      const result = await context.proceed!();
      this.log(LogLevel.INFO, `Successfully saved`, result);
      return result;
    } catch (error) {
      this.log(LogLevel.ERROR, `Failed to save`, error);
      throw error;
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    this.logs.push({ level, message, timestamp: new Date() });
    
    const prefix = `[${LogLevel[level]}]`;
    if (data !== undefined) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  getLogs(minLevel: LogLevel = LogLevel.INFO) {
    return this.logs.filter(log => log.level >= minLevel);
  }
}

// Usage
@Assemblage({
  inject: [[UserService]],
  engage: [[LoggingTransversal]],
})
class App implements AbstractAssemblage {
  constructor(
    private userService: UserService,
    public logger: LoggingTransversal
  ) {}
}

const app = Assembler.build(App, { logging: { level: 'DEBUG' } });
```

### Performance Monitoring & Alerting

```typescript
@Transversal()
class PerformanceTransversal implements AbstractTransversal {
  private metrics = new Map<string, { count: number; totalTime: number; max: number; min: number }>();
  private slowOperations: Array<{ method: string; duration: number; timestamp: Date }> = [];

  constructor(
    @Configuration('performance') private config?: {
      threshold?: number;
      alertCallback?: (method: string, duration: number) => void;
    }
  ) {
    this.config = {
      threshold: 100,
      ...config
    };
  }

  @Around('execution(*.*)')
  async measurePerformance(context: AdviceContext) {
    const start = performance.now();
    const methodKey = `${context.target.constructor.name}.${context.methodName}`;
    
    try {
      const result = await context.proceed!();
      const duration = performance.now() - start;
      
      this.recordMetric(methodKey, duration);
      
      // Check threshold from @Affect config or default
      const threshold = context.config?.threshold ?? this.config?.threshold ?? 100;
      
      if (duration > threshold) {
        this.slowOperations.push({
          method: methodKey,
          duration,
          timestamp: new Date()
        });
        
        console.warn(`⚠️ Slow operation: ${methodKey} took ${duration.toFixed(2)}ms`);
        
        if (this.config?.alertCallback) {
          this.config.alertCallback(methodKey, duration);
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(methodKey, duration);
      throw error;
    }
  }

  private recordMetric(method: string, duration: number) {
    const existing = this.metrics.get(method);
    
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.max = Math.max(existing.max, duration);
      existing.min = Math.min(existing.min, duration);
    } else {
      this.metrics.set(method, {
        count: 1,
        totalTime: duration,
        max: duration,
        min: duration
      });
    }
  }

  getMetrics() {
    const results: any[] = [];
    
    this.metrics.forEach((metric, method) => {
      results.push({
        method,
        calls: metric.count,
        avgTime: (metric.totalTime / metric.count).toFixed(2),
        maxTime: metric.max.toFixed(2),
        minTime: metric.min.toFixed(2)
      });
    });
    
    return results.sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime));
  }

  getSlowOperations() {
    return this.slowOperations.sort((a, b) => b.duration - a.duration);
  }
}

// Usage with different thresholds per method
@Assemblage()
class DataService {
  @Affect(PerformanceTransversal, { threshold: 50 })  // Stricter for queries
  async query(sql: string) {
    // Implementation
  }

  @Affect(PerformanceTransversal, { threshold: 200 }) // Relaxed for reports
  async generateReport() {
    // Implementation
  }
}
```

### Security & Authorization

```typescript
@Transversal()
class SecurityTransversal implements AbstractTransversal {
  private currentUser: { id: string; roles: string[] } | null = null;

  constructor(private authService: AuthService) {}

  setCurrentUser(user: { id: string; roles: string[] }) {
    this.currentUser = user;
  }

  @Before('execution(*.delete*)', 200)  // High priority
  checkDeletePermission(context: AdviceContext) {
    if (!this.currentUser) {
      throw new Error('Authentication required');
    }

    const requiredRole = context.config?.requireRole || 'admin';
    
    if (!this.currentUser.roles.includes(requiredRole)) {
      throw new Error(`Access denied. Required role: ${requiredRole}`);
    }

    console.log(`✓ User ${this.currentUser.id} authorized for ${context.methodName}`);
  }

  @Before('execution(*.create*)', 150)
  checkCreatePermission(context: AdviceContext) {
    if (!this.currentUser) {
      throw new Error('Authentication required');
    }

    const requiredRole = context.config?.requireRole || 'user';
    
    if (!this.currentUser.roles.includes(requiredRole)) {
      throw new Error(`Access denied. Required role: ${requiredRole}`);
    }
  }

  @Around('execution(*.find*)', 100)
  async filterByPermissions(context: AdviceContext) {
    const result = await context.proceed!();
    
    // Filter results based on user permissions
    if (Array.isArray(result)) {
      return result.filter(item => this.canAccess(item));
    }
    
    return this.canAccess(result) ? result : null;
  }

  private canAccess(item: any): boolean {
    if (!item) return false;
    
    // Custom access logic
    if (item.ownerId === this.currentUser?.id) {
      return true;
    }
    
    if (this.currentUser?.roles.includes('admin')) {
      return true;
    }
    
    return false;
  }
}

// Usage
@Assemblage()
class DocumentService {
  @Affect(SecurityTransversal, { requireRole: 'admin' })
  deleteDocument(id: string) {
    // Only admins can delete
  }

  @Affect(SecurityTransversal, { requireRole: 'editor' })
  createDocument(data: any) {
    // Editors and above can create
  }

  findDocuments() {
    // Results filtered by permissions
  }
}
```

### Caching with Invalidation

```typescript
@Transversal()
class CachingTransversal implements AbstractTransversal {
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();

  constructor(
    @Configuration() private config?: {
      defaultTtl?: number;
      maxSize?: number;
    }
  ) {
    this.config = {
      defaultTtl: 5000,
      maxSize: 100,
      ...config
    };
  }

  @Around('execution(*.find*)', 50)
  async cacheRead(context: AdviceContext) {
    const cacheKey = this.generateKey(context);
    const ttl = context.config?.ttl ?? this.config?.defaultTtl ?? 5000;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return cached.value;
    }
    
    // Cache miss - proceed
    console.log(`[CACHE MISS] ${cacheKey}`);
    const result = await context.proceed!();
    
    // Store in cache
    this.cache.set(cacheKey, {
      value: result,
      timestamp: Date.now(),
      ttl
    });
    
    // Enforce max size
    if (this.cache.size > (this.config?.maxSize ?? 100)) {
      this.evictOldest();
    }
    
    return result;
  }

  @After('execution(*.save*)', 50)
  @After('execution(*.update*)', 50)
  @After('execution(*.delete*)', 50)
  invalidateCache(context: AdviceContext) {
    // Invalidate related cache entries
    const pattern = `${context.target.constructor.name}.find`;
    
    let invalidated = 0;
    this.cache.forEach((_, key) => {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        invalidated++;
      }
    });
    
    if (invalidated > 0) {
      console.log(`[CACHE INVALIDATED] ${invalidated} entries`);
    }
  }

  private generateKey(context: AdviceContext): string {
    return `${context.target.constructor.name}.${context.methodName}:${JSON.stringify(context.args)}`;
  }

  private evictOldest() {
    let oldest: { key: string; timestamp: number } | null = null;
    
    this.cache.forEach((value, key) => {
      if (!oldest || value.timestamp < oldest.timestamp) {
        oldest = { key, timestamp: value.timestamp };
      }
    });
    
    if (oldest) {
      this.cache.delete(oldest.key);
      console.log(`[CACHE EVICTED] ${oldest.key}`);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.config?.maxSize ?? 100,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Usage
@Assemblage()
class ProductService {
  @Affect(CachingTransversal, { ttl: 10000 })  // 10 second cache
  async findAll() {
    // Expensive query
  }

  @Affect(CachingTransversal, { ttl: 60000 })  // 1 minute cache
  async findById(id: string) {
    // Cache longer for single items
  }

  async save(product: any) {
    // Automatically invalidates findAll and findById caches
  }
}
```

### Validation with Custom Rules

```typescript
interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
}

@Transversal()
class ValidationTransversal implements AbstractTransversal {
  private rules = new Map<string, ValidationRule[]>();

  registerRule(methodPattern: string, rule: ValidationRule) {
    const existing = this.rules.get(methodPattern) || [];
    existing.push(rule);
    this.rules.set(methodPattern, existing);
  }

  @Before('execution(*.create)', 150)
  @Before('execution(*.update)', 150)
  validateInput(context: AdviceContext) {
    const [data] = context.args;
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid input: data object required');
    }

    // Get rules from config or registered rules
    const rules: ValidationRule[] = context.config?.rules || this.getMatchingRules(context);
    
    const errors: string[] = [];
    
    for (const rule of rules) {
      const value = data[rule.field];
      
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }
  }

  private getMatchingRules(context: AdviceContext): ValidationRule[] {
    const methodKey = `${context.target.constructor.name}.${context.methodName}`;
    return this.rules.get(methodKey) || [];
  }
}

// Usage
@Assemblage({
  inject: [[ProductService]],
  engage: [[ValidationTransversal]],
})
class App implements AbstractAssemblage {
  constructor(
    private products: ProductService,
    private validation: ValidationTransversal
  ) {
    // Register validation rules
    this.validation.registerRule('ProductService.create', {
      field: 'name',
      validator: (v) => typeof v === 'string' && v.length > 0,
      message: 'Product name is required'
    });
    
    this.validation.registerRule('ProductService.create', {
      field: 'price',
      validator: (v) => typeof v === 'number' && v > 0,
      message: 'Price must be a positive number'
    });
  }
}

// Or use @Affect with inline rules
@Assemblage()
class UserService {
  @Affect(ValidationTransversal, {
    rules: [
      {
        field: 'email',
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Invalid email format'
      },
      {
        field: 'age',
        validator: (v: number) => v >= 18,
        message: 'Must be 18 or older'
      }
    ]
  })
  createUser(data: any) {
    // Validated before execution
  }
}
```

### Error Handling & Retry Logic

```typescript
@Transversal()
class ErrorHandlingTransversal implements AbstractTransversal {
  private errorLog: Array<{ method: string; error: any; timestamp: Date }> = [];

  constructor(@Configuration('errorHandling') private config?: {
    maxRetries?: number;
    retryDelay?: number;
    fallbackValue?: any;
  }) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  @Around('execution(*.fetch*)', 100)
  @Around('execution(*.api*)', 100)
  async retryOnFailure(context: AdviceContext) {
    const maxRetries = context.config?.maxRetries ?? this.config?.maxRetries ?? 3;
    const retryDelay = context.config?.retryDelay ?? this.config?.retryDelay ?? 1000;
    
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await context.proceed!();
      } catch (error) {
        lastError = error;
        
        this.errorLog.push({
          method: `${context.target.constructor.name}.${context.methodName}`,
          error,
          timestamp: new Date()
        });
        
        if (attempt < maxRetries) {
          console.log(`[RETRY] Attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms...`);
          await this.sleep(retryDelay * attempt);
        }
      }
    }
    
    console.error(`[ERROR] All ${maxRetries} attempts failed for ${context.methodName}`);
    
    // Return fallback value if provided
    if (context.config?.fallbackValue !== undefined) {
      return context.config.fallbackValue;
    }
    
    throw lastError;
  }

  @Around('execution(*.*)', 50)
  async catchAndLog(context: AdviceContext) {
    try {
      return await context.proceed!();
    } catch (error) {
      this.errorLog.push({
        method: `${context.target.constructor.name}.${context.methodName}`,
        error,
        timestamp: new Date()
      });
      
      console.error(`[ERROR] ${context.methodName}:`, error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getErrorLog() {
    return this.errorLog;
  }

  clearErrorLog() {
    this.errorLog = [];
  }
}

// Usage
@Assemblage()
class ApiService {
  @Affect(ErrorHandlingTransversal, { maxRetries: 5, retryDelay: 2000 })
  async fetchCriticalData(endpoint: string) {
    // Will retry up to 5 times with 2s delay
  }

  @Affect(ErrorHandlingTransversal, { fallbackValue: [] })
  async fetchOptionalData(endpoint: string) {
    // Returns [] if all retries fail
  }
}
```

### Complete AOP Application

```typescript
// Combine all transversals
@Assemblage({
  inject: [[UserService], [ProductService]],
  engage: [
    [SecurityTransversal],
    [ValidationTransversal],
    [PerformanceTransversal, { threshold: 100 }],
    [LoggingTransversal, { level: 'INFO' }],
    [CachingTransversal, { defaultTtl: 5000 }],
    [ErrorHandlingTransversal, { maxRetries: 3 }]
  ]
})
class Application implements AbstractAssemblage {
  constructor(
    @Context() private context: AssemblerContext,
    private users: UserService,
    private products: ProductService,
    private security: SecurityTransversal,
    private performance: PerformanceTransversal,
    private cache: CachingTransversal,
    @Dispose() public dispose: () => void
  ) {}

  async run() {
    // Set user
    this.security.setCurrentUser({ id: 'user1', roles: ['admin'] });

    // All operations are automatically:
    // - Secured (authorization checks)
    // - Validated (input validation)
    // - Monitored (performance tracking)
    // - Logged (method calls and results)
    // - Cached (read operations)
    // - Error handled (retry on failure)

    await this.users.createUser({ name: 'Alice', email: 'alice@example.com' });
    await this.products.findAll();
    
    // Get metrics
    console.log('Performance Metrics:', this.performance.getMetrics());
    console.log('Cache Stats:', this.cache.getCacheStats());
  }
}

// Bootstrap
const app = Assembler.build(Application);
await app.run();
await app.dispose();
```

## Next Steps

- [Transversals (AOP)](../core-concepts/transversals-aop.md) - Aspect-Oriented Programming
- [Core Concepts](../core-concepts/assemblage.md) - Understand the fundamentals
- [Features](../features/events.md) - Explore event system
- [Tree-Shaking](./tree-shaking.md) - Optimize bundle size
- [Benchmarks](../performance/benchmarks.md) - Performance metrics & best practices
- [API Reference](../api/assembler.md) - Detailed API documentation
