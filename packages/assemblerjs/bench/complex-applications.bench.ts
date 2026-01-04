import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage } from '../src';

describe('Complex Application Performance', () => {
  describe('Large Scale Applications', () => {
    bench('Build very large application (50 services)', () => {
      // Create 49 services with complex dependencies
      const services: any[] = [];
      for (let i = 0; i < 49; i++) {
        @Assemblage()
        class Service implements AbstractAssemblage {}
        services.push(Service);
      }

      @Assemblage({
        inject: services.map(S => [S]),
      })
      class VeryLargeApp implements AbstractAssemblage {
        constructor(...deps: any[]) {
          if (deps.length !== 49) throw new Error('Wrong dependency count');
        }
      }

      for (let i = 0; i < 10; i++) {
        const app = Assembler.build(VeryLargeApp);
        if (!app) throw new Error('Build failed');
      }
    });

    bench('Build massive application (100 services)', () => {
      // Create 99 services
      const services: any[] = [];
      for (let i = 0; i < 99; i++) {
        @Assemblage()
        class Service implements AbstractAssemblage {}
        services.push(Service);
      }

      @Assemblage({
        inject: services.map(S => [S]),
      })
      class MassiveApp implements AbstractAssemblage {
        constructor(...deps: any[]) {
          if (deps.length !== 99) throw new Error('Wrong dependency count');
        }
      }

      for (let i = 0; i < 5; i++) {
        const app = Assembler.build(MassiveApp);
        if (!app) throw new Error('Build failed');
      }
    });

    bench('Build extreme application (200 services)', () => {
      // Create 199 services
      const services: any[] = [];
      for (let i = 0; i < 199; i++) {
        @Assemblage()
        class Service implements AbstractAssemblage {}
        services.push(Service);
      }

      @Assemblage({
        inject: services.map(S => [S]),
      })
      class ExtremeApp implements AbstractAssemblage {
        constructor(...deps: any[]) {
          if (deps.length !== 199) throw new Error('Wrong dependency count');
        }
      }

      for (let i = 0; i < 3; i++) {
        const app = Assembler.build(ExtremeApp);
        if (!app) throw new Error('Build failed');
      }
    });
  });

  describe('Complex Dependency Trees', () => {
    bench('Build very deep dependency tree (10 levels)', () => {
      @Assemblage()
      class Level10 implements AbstractAssemblage {
        value = 'level-10';
      }

      @Assemblage({ inject: [[Level10]] })
      class Level9 implements AbstractAssemblage {
        constructor(private l10: Level10) {}
        getValue() { return `level-9-${this.l10.value}`; }
      }

      @Assemblage({ inject: [[Level9]] })
      class Level8 implements AbstractAssemblage {
        constructor(private l9: Level9) {}
        getValue() { return `level-8-${this.l9.getValue()}`; }
      }

      @Assemblage({ inject: [[Level8]] })
      class Level7 implements AbstractAssemblage {
        constructor(private l8: Level8) {}
        getValue() { return `level-7-${this.l8.getValue()}`; }
      }

      @Assemblage({ inject: [[Level7]] })
      class Level6 implements AbstractAssemblage {
        constructor(private l7: Level7) {}
        getValue() { return `level-6-${this.l7.getValue()}`; }
      }

      @Assemblage({ inject: [[Level6]] })
      class Level5 implements AbstractAssemblage {
        constructor(private l6: Level6) {}
        getValue() { return `level-5-${this.l6.getValue()}`; }
      }

      @Assemblage({ inject: [[Level5]] })
      class Level4 implements AbstractAssemblage {
        constructor(private l5: Level5) {}
        getValue() { return `level-4-${this.l5.getValue()}`; }
      }

      @Assemblage({ inject: [[Level4]] })
      class Level3 implements AbstractAssemblage {
        constructor(private l4: Level4) {}
        getValue() { return `level-3-${this.l4.getValue()}`; }
      }

      @Assemblage({ inject: [[Level3]] })
      class Level2 implements AbstractAssemblage {
        constructor(private l3: Level3) {}
        getValue() { return `level-2-${this.l3.getValue()}`; }
      }

      @Assemblage({ inject: [[Level2]] })
      class VeryDeepApp implements AbstractAssemblage {
        constructor(private l2: Level2) {}
        getValue() { return `level-1-${this.l2.getValue()}`; }
      }

      for (let i = 0; i < 50; i++) {
        const app = Assembler.build(VeryDeepApp);
        const expected = 'level-1-level-2-level-3-level-4-level-5-level-6-level-7-level-8-level-9-level-10';
        if (app.getValue() !== expected) throw new Error('Deep chain validation failed');
      }
    });

    bench('Build complex dependency graph (multi-level branching)', () => {
      // Level 3 services (leaf nodes)
      @Assemblage() class L3A implements AbstractAssemblage { data = 'A'; }
      @Assemblage() class L3B implements AbstractAssemblage { data = 'B'; }
      @Assemblage() class L3C implements AbstractAssemblage { data = 'C'; }
      @Assemblage() class L3D implements AbstractAssemblage { data = 'D'; }
      @Assemblage() class L3E implements AbstractAssemblage { data = 'E'; }

      // Level 2 services (intermediate nodes)
      @Assemblage({ inject: [[L3A], [L3B]] })
      class L2AB implements AbstractAssemblage {
        constructor(private a: L3A, private b: L3B) {}
        combine() { return this.a.data + this.b.data; }
      }

      @Assemblage({ inject: [[L3C], [L3D]] })
      class L2CD implements AbstractAssemblage {
        constructor(private c: L3C, private d: L3D) {}
        combine() { return this.c.data + this.d.data; }
      }

      @Assemblage({ inject: [[L3E]] })
      class L2E implements AbstractAssemblage {
        constructor(private e: L3E) {}
        combine() { return this.e.data; }
      }

      // Level 1 services (aggregators)
      @Assemblage({ inject: [[L2AB], [L2CD]] })
      class L1ABCD implements AbstractAssemblage {
        constructor(private ab: L2AB, private cd: L2CD) {}
        combine() { return this.ab.combine() + this.cd.combine(); }
      }

      @Assemblage({ inject: [[L2E]] })
      class L1E implements AbstractAssemblage {
        constructor(private e: L2E) {}
        combine() { return this.e.combine(); }
      }

      // Root service
      @Assemblage({ inject: [[L1ABCD], [L1E]] })
      class ComplexGraphApp implements AbstractAssemblage {
        constructor(private abcd: L1ABCD, private e: L1E) {}
        getResult() { return this.abcd.combine() + this.e.combine(); }
      }

      for (let i = 0; i < 100; i++) {
        const app = Assembler.build(ComplexGraphApp);
        if (app.getResult() !== 'ABCD E') throw new Error('Complex graph validation failed');
      }
    });

    bench('Build diamond dependency pattern', () => {
      // Base services
      @Assemblage() class BaseA implements AbstractAssemblage { value = 1; }
      @Assemblage() class BaseB implements AbstractAssemblage { value = 2; }

      // Middle layer - both depend on both bases
      @Assemblage({ inject: [[BaseA], [BaseB]] })
      class Middle1 implements AbstractAssemblage {
        constructor(private a: BaseA, private b: BaseB) {}
        sum() { return this.a.value + this.b.value; }
      }

      @Assemblage({ inject: [[BaseA], [BaseB]] })
      class Middle2 implements AbstractAssemblage {
        constructor(private a: BaseA, private b: BaseB) {}
        product() { return this.a.value * this.b.value; }
      }

      // Top layer - depends on both middle services
      @Assemblage({ inject: [[Middle1], [Middle2]] })
      class DiamondApp implements AbstractAssemblage {
        constructor(private m1: Middle1, private m2: Middle2) {}
        compute() { return this.m1.sum() + this.m2.product(); }
      }

      for (let i = 0; i < 200; i++) {
        const app = Assembler.build(DiamondApp);
        if (app.compute() !== 5) throw new Error('Diamond pattern validation failed');
      }
    });
  });

  describe('Real-world Complex Scenarios', () => {
    bench('Build enterprise-like application (layered architecture)', () => {
      // Data layer
      @Assemblage() class DatabaseConnection implements AbstractAssemblage {
        connect() { return 'connected'; }
      }

      @Assemblage() class UserRepository implements AbstractAssemblage {
        constructor(private db: DatabaseConnection) {}
        findUser(id: number) { return { id, name: `User${id}` }; }
      }

      @Assemblage() class ProductRepository implements AbstractAssemblage {
        constructor(private db: DatabaseConnection) {}
        findProduct(id: number) { return { id, name: `Product${id}` }; }
      }

      // Service layer
      @Assemblage({ inject: [[UserRepository]] })
      class UserService implements AbstractAssemblage {
        constructor(private repo: UserRepository) {}
        getUser(id: number) { return this.repo.findUser(id); }
      }

      @Assemblage({ inject: [[ProductRepository]] })
      class ProductService implements AbstractAssemblage {
        constructor(private repo: ProductRepository) {}
        getProduct(id: number) { return this.repo.findProduct(id); }
      }

      @Assemblage({ inject: [[UserService], [ProductService]] })
      class OrderService implements AbstractAssemblage {
        constructor(private users: UserService, private products: ProductService) {}
        createOrder(userId: number, productId: number) {
          const user = this.users.getUser(userId);
          const product = this.products.getProduct(productId);
          return { user, product, orderId: Date.now() };
        }
      }

      // Infrastructure layer
      @Assemblage() class Logger implements AbstractAssemblage {
        log(message: string) { return `logged: ${message}`; }
      }

      @Assemblage() class Cache implements AbstractAssemblage {
        get(key: string) { return `cached-${key}`; }
        set(key: string, value: any) {
          // Simulate storing the value
          return value !== undefined;
        }
      }

      // Application layer
      @Assemblage({
        inject: [
          [OrderService],
          [Logger],
          [Cache],
          [UserService],
          [ProductService]
        ]
      })
      class EnterpriseApp implements AbstractAssemblage {
        constructor(
          private orders: OrderService,
          private logger: Logger,
          private cache: Cache,
          private users: UserService,
          private products: ProductService
        ) {}

        processOrder(userId: number, productId: number) {
          const order = this.orders.createOrder(userId, productId);
          this.logger.log(`Order created: ${order.orderId}`);
          this.cache.set(`order-${order.orderId}`, order);
          return order;
        }
      }

      for (let i = 0; i < 50; i++) {
        const app = Assembler.build(EnterpriseApp);
        const order = app.processOrder(1, 1);
        if (!order.orderId) throw new Error('Enterprise app validation failed');
      }
    });
  });
});