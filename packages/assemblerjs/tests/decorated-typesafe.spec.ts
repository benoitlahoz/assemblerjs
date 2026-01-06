import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  type AssemblerContext,
  Context,
  createConstructorDecorator,
} from '../src';

describe('Type-Safe Constructor Decorator', () => {
  it('should provide full type safety for custom properties and configuration', () => {
    // 1. Define typed configuration interface
    interface LoggerConfig {
      prefix: string;
      level: 'info' | 'debug' | 'error';
      timestamp: boolean;
    }

    // 2. Define interface for extended properties
    interface WithLogger {
      logPrefix: string;
      logLevel: string;
      log(message: string): void;
    }

    // 3. Create type-safe decorator with both generics
    const Logger = createConstructorDecorator<MyService & WithLogger, LoggerConfig>(
      function (config) {
        // `this` is typed as MyService & WithLogger
        // `config` is typed as LoggerConfig | undefined
        
        // Type-safe assignments
        this.logPrefix = config?.prefix ?? 'LOG';
        this.logLevel = config?.level ?? 'info';

        // Type-safe method implementation
        this.log = (message: string) => {
          const timestamp = config?.timestamp ? `[${new Date().toISOString()}] ` : '';
          console.log(`${timestamp}[${this.logPrefix}:${this.logLevel}] ${message}`);
        };

        // TypeScript knows about all properties
        expect(this.context).toBeDefined();
        expect(this.logPrefix).toBe('APP');
        expect(this.logLevel).toBe('debug');
        expect(typeof this.log).toBe('function');
      }
    );

    @Logger({
      prefix: 'APP',
      level: 'debug',
      timestamp: true,
    })
    @Assemblage()
    class MyService implements AbstractAssemblage {
      // Explicitly declare extended properties for full type safety
      logPrefix!: string;
      logLevel!: string;
      log!: (message: string) => void;

      constructor(@Context() public context: AssemblerContext) {
        // Constructor body
      }

      doWork() {
        // Type-safe access to custom properties
        this.log('Starting work');
        expect(this.logPrefix).toBe('APP');
        expect(this.logLevel).toBe('debug');
      }
    }

    const service = Assembler.build(MyService);
    service.doWork();

    // Type-safe access from outside
    expect(service.logPrefix).toBe('APP');
    expect(service.logLevel).toBe('debug');
    expect(typeof service.log).toBe('function');
  });

  it('should handle multiple type-safe decorators stacked together', () => {
    interface TrackerConfig {
      trackConstructor: boolean;
      trackInit: boolean;
    }

    interface WithTracker {
      constructorCalled: boolean;
      initCalled: boolean;
      getTrackingInfo(): { constructor: boolean; init: boolean };
    }

    interface MetadataConfig {
      author: string;
      version: string;
    }

    interface WithMetadata {
      metadata: { author: string; version: string };
    }

    const Tracker = createConstructorDecorator<App & WithTracker, TrackerConfig>(
      function (config) {
        this.constructorCalled = config?.trackConstructor ?? false;
        this.initCalled = false;

        this.getTrackingInfo = () => ({
          constructor: this.constructorCalled,
          init: this.initCalled,
        });

        if (config?.trackInit) {
          const originalOnInit = this.onInit?.bind(this);
          this.onInit = async function () {
            this.initCalled = true;
            if (originalOnInit) await originalOnInit.call(this);
          };
        }
      }
    );

    const Metadata = createConstructorDecorator<App & WithMetadata, MetadataConfig>(
      function (config) {
        this.metadata = {
          author: config?.author ?? 'Unknown',
          version: config?.version ?? '0.0.0',
        };
      }
    );

    @Tracker({ trackConstructor: true, trackInit: true })
    @Metadata({ author: 'John Doe', version: '1.0.0' })
    @Assemblage()
    class App implements AbstractAssemblage {
      // Type-safe property declarations
      constructorCalled!: boolean;
      initCalled!: boolean;
      getTrackingInfo!: () => { constructor: boolean; init: boolean };
      metadata!: { author: string; version: string };

      async onInit() {
        // Original implementation
        expect(this.metadata.author).toBe('John Doe');
        expect(this.metadata.version).toBe('1.0.0');
      }
    }

    const app = Assembler.build(App);

    // Type-safe access to all decorated properties
    expect(app.constructorCalled).toBe(true);
    expect(app.initCalled).toBe(true);
    expect(app.metadata.author).toBe('John Doe');
    expect(app.metadata.version).toBe('1.0.0');

    const info = app.getTrackingInfo();
    expect(info.constructor).toBe(true);
    expect(info.init).toBe(true);
  });

  it('should enforce type safety for configuration objects', () => {
    interface StrictConfig {
      requiredField: string;
      optionalField?: number;
    }

    interface WithConfig {
      configValue: string;
    }

    const StrictDecorator = createConstructorDecorator<Service & WithConfig, StrictConfig>(
      function (config) {
        // TypeScript enforces that if config is provided, it must have requiredField
        this.configValue = config ? config.requiredField : 'default';
      }
    );

    // This would cause a TypeScript error if requiredField is missing:
    // @StrictDecorator({ optionalField: 42 }) // ❌ Error: Property 'requiredField' is required
    
    @StrictDecorator({
      requiredField: 'test',
      optionalField: 42,
    }) // ✅ Valid
    @Assemblage()
    class Service implements AbstractAssemblage {
      configValue!: string;
    }

    const service = Assembler.build(Service);
    expect(service.configValue).toBe('test');
  });

  it('should provide type inference for decorator functions', () => {
    interface SimpleConfig {
      name: string;
    }

    const SimpleDecorator = createConstructorDecorator<any, SimpleConfig>(
      function (config) {
        (this as any).decoratorName = config?.name;
      }
    );

    // Type inference works: config parameter is typed as SimpleConfig | undefined
    const decorator = SimpleDecorator({ name: 'test' });
    
    // decorator is typed as ClassDecorator
    expect(typeof decorator).toBe('function');
  });
});
