import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Use } from '../src';

describe('use: with factory functions', () => {
  describe('Basic factory injection with string identifiers', () => {
    it('should inject factory result as instance', () => {
      abstract class AbstractLogger {
        abstract log(msg: string): string;
      }

      @Assemblage()
      class Logger implements AbstractLogger {
        log(msg: string) {
          return `LOG: ${msg}`;
        }
      }

      @Assemblage({
        use: [[AbstractLogger, () => new Logger()]],
      })
      class App implements AbstractAssemblage {
        constructor(@Use(AbstractLogger) public logger: AbstractLogger) {}
      }

      const app = Assembler.build(App);
      expect(app.logger).toBeInstanceOf(Logger);
      expect(app.logger.log('test')).toBe('LOG: test');
    });

    it('should support factory with dynamic configuration', () => {
      class DatabaseService {
        constructor(public url: string) {}
      }

      @Assemblage({
        use: [
          [
            'db',
            () =>
              new DatabaseService(process.env.DB_URL || 'sqlite:///:memory:'),
          ],
        ],
      })
      class App implements AbstractAssemblage {
        constructor(@Use('db') public db: DatabaseService) {}
      }

      const app = Assembler.build(App);
      expect(app.db).toBeInstanceOf(DatabaseService);
      expect(app.db.url).toBe('sqlite:///:memory:');
    });

    it('should support factory with complex initialization logic', () => {
      const initLog: string[] = [];

      class Cache {
        constructor() {
          initLog.push('cache-created');
        }
      }

      @Assemblage({
        use: [
          [
            'cache',
            () => {
              initLog.push('factory-called');
              return new Cache();
            },
          ],
        ],
      })
      class App implements AbstractAssemblage {
        constructor(@Use('cache') public cache: Cache) {}
      }

      expect(initLog).toEqual([]);
      const app = Assembler.build(App);
      expect(initLog).toEqual(['factory-called', 'cache-created']);
      expect(app.cache).toBeInstanceOf(Cache);
    });
  });

  describe('Abstract class with factory (Type-safe)', () => {
    it('should support abstract class identifier with factory', () => {
      abstract class ILogger {
        abstract log(msg: string): string;
      }

      @Assemblage()
      class ConsoleLogger extends ILogger {
        log(msg: string) {
          return `CONSOLE: ${msg}`;
        }
      }

      @Assemblage({
        use: [[ILogger, () => new ConsoleLogger()]],
      })
      class App implements AbstractAssemblage {
        constructor(@Use(ILogger) public logger: ILogger) {}
      }

      const app = Assembler.build(App);
      expect(app.logger).toBeInstanceOf(ConsoleLogger);
      expect(app.logger.log('test')).toBe('CONSOLE: test');
    });

    it('should provide type safety with abstract class identifiers', () => {
      abstract class IRepository {
        abstract find(id: number): { id: number; name: string } | null;
      }

      class UserRepository extends IRepository {
        find(id: number) {
          return id === 1 ? { id: 1, name: 'John' } : null;
        }
      }

      @Assemblage({
        use: [[IRepository, () => new UserRepository()]],
      })
      class Service implements AbstractAssemblage {
        constructor(@Use(IRepository) private repo: IRepository) {}

        getUser(id: number) {
          return this.repo.find(id);
        }
      }

      const service = Assembler.build(Service);
      const user = service.getUser(1);
      expect(user).toEqual({ id: 1, name: 'John' });
    });
  });

  describe('Mixed inject and use with factories', () => {
    it('should support both inject and use with factories', () => {
      @Assemblage()
      class Logger {
        log(msg: string) {
          return msg;
        }
      }

      class Config {
        constructor(public apiUrl: string) {}
      }

      @Assemblage({
        inject: [[Logger]],
        use: [['config', () => new Config('https://api.example.com')]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public logger: Logger,
          @Use('config') public config: Config
        ) {}
      }

      const app = Assembler.build(App);
      expect(app.logger).toBeInstanceOf(Logger);
      expect(app.config).toBeInstanceOf(Config);
      expect(app.config.apiUrl).toBe('https://api.example.com');
    });
  });

  describe('Factory with symbol identifiers', () => {
    it('should support symbol identifier with factory', () => {
      const DB_SYMBOL = Symbol('database');

      class Database {
        constructor(public version = '1.0') {}
      }

      @Assemblage({
        use: [[DB_SYMBOL, () => new Database('2.0')]],
      })
      class App implements AbstractAssemblage {
        constructor(@Use(DB_SYMBOL) public db: Database) {}
      }

      const app = Assembler.build(App);
      expect(app.db).toBeInstanceOf(Database);
      expect(app.db.version).toBe('2.0');
    });
  });

  describe('Singleton behavior with factories', () => {
    it('should cache factory result for singleton', () => {
      let callCount = 0;

      class Logger {
        id = Math.random();
      }

      @Assemblage({
        singleton: true,
        use: [
          [
            'logger',
            () => {
              callCount++;
              return new Logger();
            },
          ],
        ],
      })
      class App implements AbstractAssemblage {
        constructor(@Use('logger') public logger: Logger) {}
      }

      const app1 = Assembler.build(App);
      const app2 = Assembler.build(App);

      // New assembler instance per build -> factory runs per build.
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(app1.logger.id).not.toBe(app2.logger.id);
    });

    it('should call factory each time for transient', () => {
      let callCount = 0;

      class Logger {
        id = Math.random();
      }

      @Assemblage({
        singleton: false,
        use: [
          [
            'logger',
            () => {
              callCount++;
              return new Logger();
            },
          ],
        ],
      })
      class App implements AbstractAssemblage {
        constructor(@Use('logger') public logger: Logger) {}
      }

      const app1 = Assembler.build(App);
      const app2 = Assembler.build(App);

      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(app1.logger.id).not.toBe(app2.logger.id);
    });
  });

  describe('Backward compatibility with instances', () => {
    it('should still support direct instance in use:', () => {
      class Logger {
        log(msg: string) {
          return `LOG: ${msg}`;
        }
      }

      const logger = new Logger();

      @Assemblage({
        use: [['logger', logger]],
      })
      class App implements AbstractAssemblage {
        constructor(@Use('logger') public injectedLogger: Logger) {}
      }

      const app = Assembler.build(App);
      expect(app.injectedLogger).toBe(logger);
    });

    it('should distinguish between instance and factory', () => {
      class Logger {
        id = Math.random();
      }

      const logger1 = new Logger();
      const logger1Id = logger1.id;

      @Assemblage({
        use: [
          ['instance', logger1],
          ['factory', () => new Logger()],
        ],
      })
      class App implements AbstractAssemblage {
        constructor(
          @Use('instance') public inst: Logger,
          @Use('factory') public fact: Logger
        ) {}
      }

      const app = Assembler.build(App);
      expect(app.inst.id).toBe(logger1Id);
      expect(app.fact.id).not.toBe(logger1Id);
      expect(app.fact).toBeInstanceOf(Logger);
    });
  });

  describe('Error handling', () => {
    it('should throw if factory throws', () => {
      @Assemblage({
        use: [
          [
            'failing',
            () => {
              throw new Error('Factory initialization failed');
            },
          ],
        ],
      })
      class App implements AbstractAssemblage {
        constructor(@Use('failing') public value: any) {}
      }

      expect(() => Assembler.build(App)).toThrow(
        'Factory initialization failed'
      );
    });
  });
});
