# Tags

Tags allow grouping and retrieving assemblages by category. This is useful for plugin systems, feature management, and dynamic dependency resolution.

## Basic Usage

```typescript
@Assemblage({ tags: ['plugin', 'auth'] })
class AuthPlugin implements AbstractAssemblage {}

@Assemblage({ tags: ['plugin', 'storage'] })
class StoragePlugin implements AbstractAssemblage {}

@Assemblage({ inject: [[AuthPlugin], [StoragePlugin]] })
class PluginManager implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Get all plugins
    const plugins = context.tagged('plugin');
    console.log(plugins); // [AuthPlugin instance, StoragePlugin instance]
    
    // Get only auth plugins
    const authPlugins = context.tagged('auth', 'plugin');
    console.log(authPlugins); // [AuthPlugin instance]
  }
}
```

## AssemblerContext.tagged()

The `tagged()` method retrieves assemblages by tags:

```typescript
// Get assemblages with ANY of the tags
context.tagged('tag1', 'tag2', 'tag3');
```

**Returns:** Array of assemblage instances that have **at least one** of the specified tags.

## Use Cases

### Plugin System

```typescript
// Define plugin interface
abstract class Plugin implements AbstractAssemblage {
  abstract name: string;
  abstract init(): void;
}

// Create plugins with tags
@Assemblage({ tags: ['plugin'] })
class LoggerPlugin extends Plugin {
  name = 'Logger';
  init() { console.log('Logger initialized'); }
}

@Assemblage({ tags: ['plugin'] })
class CachePlugin extends Plugin {
  name = 'Cache';
  init() { console.log('Cache initialized'); }
}

// Plugin manager
@Assemblage({
  inject: [[LoggerPlugin], [CachePlugin]],
})
class PluginSystem implements AbstractAssemblage {
  private plugins: Plugin[] = [];
  
  constructor(@Context() private context: AssemblerContext) {}
  
  onInit() {
    // Dynamically load all plugins
    this.plugins = this.context.tagged('plugin');
    this.plugins.forEach(plugin => plugin.init());
  }
  
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.find(p => p.name === name);
  }
}
```

### Module Organization

```typescript
@Assemblage({ tags: ['module', 'database'] })
class DatabaseModule implements AbstractAssemblage {}

@Assemblage({ tags: ['module', 'api'] })
class ApiModule implements AbstractAssemblage {}

@Assemblage({ tags: ['module', 'auth'] })
class AuthModule implements AbstractAssemblage {}

@Assemblage({
  inject: [[DatabaseModule], [ApiModule], [AuthModule]],
})
class Application implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Get all modules
    const modules = context.tagged('module');
    console.log(`Loaded ${modules.length} modules`);
  }
}
```

### Feature Flags

```typescript
@Assemblage({ tags: ['feature', 'beta'] })
class BetaFeature implements AbstractAssemblage {}

@Assemblage({ tags: ['feature', 'experimental'] })
class ExperimentalFeature implements AbstractAssemblage {}

@Assemblage({ tags: ['feature', 'stable'] })
class StableFeature implements AbstractAssemblage {}

@Assemblage({
  inject: [[BetaFeature], [ExperimentalFeature], [StableFeature]],
})
class FeatureManager implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Get only stable features
    const stableFeatures = context.tagged('stable');
    
    // Get beta + experimental features
    const unstableFeatures = context.tagged('beta', 'experimental');
  }
}
```

### Service Discovery

```typescript
@Assemblage({ tags: ['service', 'http'] })
class HttpService implements AbstractAssemblage {}

@Assemblage({ tags: ['service', 'websocket'] })
class WebSocketService implements AbstractAssemblage {}

@Assemblage({ tags: ['service', 'grpc'] })
class GrpcService implements AbstractAssemblage {}

@Assemblage({
  inject: [[HttpService], [WebSocketService], [GrpcService]],
})
class ServiceRegistry implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Get all services
    const services = context.tagged('service');
    console.log(`Registered ${services.length} services`);
  }
  
  getHttpServices() {
    return this.context.tagged('http');
  }
}
```

## Multiple Tags

Assemblages can have multiple tags:

```typescript
@Assemblage({ 
  tags: ['plugin', 'auth', 'oauth', 'external'] 
})
class OAuthPlugin implements AbstractAssemblage {}

// Retrieve by any tag
context.tagged('plugin');    // ✓ Includes OAuthPlugin
context.tagged('auth');      // ✓ Includes OAuthPlugin
context.tagged('oauth');     // ✓ Includes OAuthPlugin
context.tagged('external');  // ✓ Includes OAuthPlugin

// Retrieve by multiple tags (OR logic)
context.tagged('auth', 'oauth'); // ✓ Includes OAuthPlugin (has at least one)
```

## Tag Naming Best Practices

Use descriptive, hierarchical tag names:

```typescript
// ❌ Bad - Too generic
{ tags: ['service', 'plugin'] }

// ✅ Good - Specific and hierarchical
{ tags: ['service:database', 'service:cache', 'plugin:auth'] }

// ✅ Good - Categorized
{ tags: ['module', 'module:core', 'feature:authentication'] }
```

**Recommended conventions:**
- Use lowercase
- Use colons or hyphens for hierarchy: `category:subcategory`
- Be specific and descriptive
- Avoid overly generic terms

## Type Safety

Define tag constants for type safety:

```typescript
// Define tags as constants
export const Tags = {
  PLUGIN: 'plugin',
  MODULE: 'module',
  SERVICE: 'service',
  AUTH: 'auth',
  STORAGE: 'storage',
} as const;

// Use in assemblages
@Assemblage({ tags: [Tags.PLUGIN, Tags.AUTH] })
class AuthPlugin implements AbstractAssemblage {}

// Use in retrieval
const plugins = context.tagged(Tags.PLUGIN);
const authServices = context.tagged(Tags.AUTH);
```

## Complete Example: Extensible Application

```typescript
// Tag definitions
const Tags = {
  PLUGIN: 'plugin',
  MIDDLEWARE: 'middleware',
  HANDLER: 'handler',
} as const;

// Plugin interface
abstract class Plugin implements AbstractAssemblage {
  abstract name: string;
  abstract version: string;
  abstract init(): void | Promise<void>;
}

// Plugins
@Assemblage({ tags: [Tags.PLUGIN] })
class AuthPlugin extends Plugin {
  name = 'auth';
  version = '1.0.0';
  async init() {
    console.log('Auth plugin initialized');
  }
}

@Assemblage({ tags: [Tags.PLUGIN] })
class LoggingPlugin extends Plugin {
  name = 'logging';
  version = '1.0.0';
  async init() {
    console.log('Logging plugin initialized');
  }
}

// Middleware
@Assemblage({ tags: [Tags.MIDDLEWARE] })
class CorsMiddleware implements AbstractAssemblage {
  handle() {
    console.log('CORS middleware');
  }
}

// Application
@Assemblage({
  inject: [[AuthPlugin], [LoggingPlugin], [CorsMiddleware]],
})
class Application implements AbstractAssemblage {
  private plugins: Plugin[] = [];
  private middleware: any[] = [];
  
  constructor(@Context() private context: AssemblerContext) {}
  
  async onInit() {
    // Load and initialize plugins
    this.plugins = this.context.tagged(Tags.PLUGIN);
    console.log(`Loading ${this.plugins.length} plugins...`);
    
    for (const plugin of this.plugins) {
      await plugin.init();
      console.log(`✓ ${plugin.name} v${plugin.version}`);
    }
    
    // Load middleware
    this.middleware = this.context.tagged(Tags.MIDDLEWARE);
    console.log(`Loaded ${this.middleware.length} middleware`);
  }
  
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.find(p => p.name === name);
  }
}
```

## Tags in Definition

Access tags via `@Definition()` decorator:

```typescript
@Assemblage({ tags: ['service', 'api'] })
class ApiService implements AbstractAssemblage {
  constructor(@Definition() private def: AssemblageDefinition) {
    console.log(def.tags); // ['service', 'api']
  }
}
```

## Next Steps

- [Events](./events.md) - Event system for inter-assemblage communication
- [Singleton vs Transient](./singleton-transient.md) - Control instance lifecycle
- [AssemblerContext API](../api/context.md) - Full context documentation
- [Advanced Examples](../guides/advanced-examples.md) - Real-world tag patterns
