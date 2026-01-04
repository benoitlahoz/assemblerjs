# Singleton vs Transient

Control how instances are created and shared across your application.

## Singleton (Default)

**One instance shared** across the application. The instance is created once and reused for all injections.

```typescript
// Singleton (default) - One instance shared
@Assemblage({ singleton: true })
class SingletonService implements AbstractAssemblage {
  private counter = 0;
  
  increment() {
    this.counter++;
  }
  
  getCount() {
    return this.counter;
  }
}

@Assemblage({ inject: [[SingletonService]] })
class ServiceA implements AbstractAssemblage {
  constructor(private singleton: SingletonService) {
    singleton.increment(); // counter = 1
  }
}

@Assemblage({ inject: [[SingletonService]] })
class ServiceB implements AbstractAssemblage {
  constructor(private singleton: SingletonService) {
    singleton.increment(); // counter = 2 (same instance!)
    console.log(singleton.getCount()); // 2
  }
}
```

**Benefits:**
- ✅ Shared state across the application
- ✅ Memory efficient (only one instance)
- ✅ Good for services, managers, repositories

**Use cases:**
- Database connections
- Configuration managers
- Logging services
- Cache managers
- API clients

## Transient

**New instance created** each time it's injected.

```typescript
// Transient - New instance each time
@Assemblage({ singleton: false })
class TransientService implements AbstractAssemblage {
  private counter = 0;
  
  increment() {
    this.counter++;
  }
  
  getCount() {
    return this.counter;
  }
}

@Assemblage({ inject: [[TransientService]] })
class ServiceA implements AbstractAssemblage {
  constructor(private transient: TransientService) {
    transient.increment(); // counter = 1
  }
}

@Assemblage({ inject: [[TransientService]] })
class ServiceB implements AbstractAssemblage {
  constructor(private transient: TransientService) {
    transient.increment(); // counter = 1 (different instance!)
    console.log(transient.getCount()); // 1
  }
}
```

**Benefits:**
- ✅ Isolated state per instance
- ✅ No shared state bugs
- ✅ Good for stateful operations, commands

**Use cases:**
- HTTP request handlers
- Commands/operations
- Tasks/jobs
- Stateful processors
- Data models

## Factory Pattern with Transient

Use transient with `@Context()` to create a factory:

```typescript
// Transient service - new instance each time
@Assemblage({ singleton: false })
class Task implements AbstractAssemblage {
  execute(data: any) {
    // Process task
    console.log('Processing:', data);
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

@Assemblage({ inject: [[TaskFactory]] })
class TaskRunner implements AbstractAssemblage {
  constructor(private factory: TaskFactory) {}
  
  runMany(count: number) {
    for (let i = 0; i < count; i++) {
      const task = this.factory.createTask(); // New instance each time
      task.execute({ id: i });
    }
  }
}

const runner = Assembler.build(TaskRunner);
runner.runMany(5); // Creates 5 separate Task instances
```

## Choosing Between Singleton and Transient

| Aspect | Singleton | Transient |
|--------|-----------|-----------|
| **Instance** | One shared | New each time |
| **State** | Shared | Isolated |
| **Memory** | Efficient | More usage |
| **Thread-safe** | Needs care | Naturally safe |
| **Use for** | Services, managers | Commands, handlers |

## Common Patterns

### Configuration Service (Singleton)

```typescript
@Assemblage({ singleton: true })
class ConfigService implements AbstractAssemblage {
  private config: Record<string, any> = {};
  
  set(key: string, value: any) {
    this.config[key] = value;
  }
  
  get(key: string) {
    return this.config[key];
  }
}

// All services share the same configuration
@Assemblage({ inject: [[ConfigService]] })
class ServiceA implements AbstractAssemblage {
  constructor(private config: ConfigService) {
    config.set('feature', true);
  }
}

@Assemblage({ inject: [[ConfigService]] })
class ServiceB implements AbstractAssemblage {
  constructor(private config: ConfigService) {
    console.log(config.get('feature')); // true (shared state)
  }
}
```

### HTTP Request Handler (Transient)

```typescript
@Assemblage({ singleton: false })
class RequestHandler implements AbstractAssemblage {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  handle(req: Request) {
    // Each request gets its own handler with isolated state
    console.log(`Request started at ${this.startTime}`);
  }
  
  getElapsedTime() {
    return Date.now() - this.startTime;
  }
}
```

### Command Pattern (Transient)

```typescript
@Assemblage({ singleton: false })
class CreateUserCommand implements AbstractAssemblage {
  constructor(
    @Use('db') private db: Database
  ) {}
  
  async execute(userData: UserData) {
    // Each command execution is isolated
    const user = await this.db.insert('users', userData);
    return user;
  }
}

@Assemblage({ inject: [[CreateUserCommand]] })
class UserController implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}
  
  async createUser(data: UserData) {
    // Get a fresh command instance
    const command = this.context.require(CreateUserCommand);
    return command.execute(data);
  }
}
```

## Lifecycle Hooks

Both singleton and transient instances have the same lifecycle hooks:

```typescript
@Assemblage({ singleton: false })
class TransientService implements AbstractAssemblage {
  static onRegister() {
    // Called once when registered (even for transient)
  }
  
  constructor() {
    // Called for each new instance
  }
  
  onInit() {
    // Called for each instance after construction
  }
  
  onDispose() {
    // Called for each instance during disposal
  }
}
```

**Important:** For transient services:
- `onRegister()` is called **once** (class-level)
- `constructor`, `onInit`, `onDispose` are called **per instance**

## Memory Management

### Singleton

```typescript
// ✅ Good - One instance, efficient
@Assemblage({ singleton: true })
class DatabaseService implements AbstractAssemblage {
  private connection: Connection;
  
  async onInit() {
    this.connection = await createConnection();
  }
  
  async onDispose() {
    await this.connection.close();
  }
}
```

### Transient

```typescript
// ⚠️ Careful - Multiple instances, manage cleanup
@Assemblage({ singleton: false })
class FileProcessor implements AbstractAssemblage {
  private fileHandle: FileHandle;
  
  async process(filePath: string) {
    this.fileHandle = await open(filePath);
    // ... process file
  }
  
  async onDispose() {
    // Important: cleanup each instance
    if (this.fileHandle) {
      await this.fileHandle.close();
    }
  }
}
```

## Testing

### Singleton - Shared state affects tests

```typescript
// ⚠️ Tests may interfere with each other
@Assemblage({ singleton: true })
class Counter implements AbstractAssemblage {
  count = 0;
  increment() { this.count++; }
}

// Test 1
const app1 = Assembler.build(Counter);
app1.increment(); // count = 1

// Test 2 - shares same instance!
const app2 = Assembler.build(Counter);
console.log(app2.count); // 1 (not 0!)
```

### Transient - Isolated for testing

```typescript
// ✅ Tests are isolated
@Assemblage({ singleton: false })
class Counter implements AbstractAssemblage {
  count = 0;
  increment() { this.count++; }
}

// Test 1
const app1 = Assembler.build(Counter);
app1.increment(); // count = 1

// Test 2 - fresh instance
const app2 = Assembler.build(Counter);
console.log(app2.count); // 0 (isolated!)
```

## Next Steps

- [Assemblage](../core-concepts/assemblage.md) - Configure singleton/transient
- [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md) - Instance lifecycle
- [Advanced Examples](../guides/advanced-examples.md) - Real-world patterns
- [Events](./events.md) - Event system for communication
