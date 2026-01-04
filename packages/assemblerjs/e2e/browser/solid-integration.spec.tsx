/**
 * Solid.js Integration Tests
 * Tests assemblerjs working with Solid.js signals and fine-grained reactivity
 * 
 * Note: These tests demonstrate the patterns without requiring actual Solid.js
 * In real implementation, you would use @solidjs/testing-library
 */
import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, AssemblerContext } from '../../src';

describe('Solid.js Integration', () => {
  describe('Signal-like Reactivity', () => {
    it('should work with signal-based state', () => {
      // Simulate Solid signals
      class Signal<T> {
        private value: T;
        private subscribers: Array<(value: T) => void> = [];

        constructor(initialValue: T) {
          this.value = initialValue;
        }

        get(): T {
          return this.value;
        }

        set(newValue: T) {
          this.value = newValue;
          this.subscribers.forEach(fn => fn(newValue));
        }

        subscribe(fn: (value: T) => void) {
          this.subscribers.push(fn);
        }
      }

      @Assemblage()
      class CounterStore implements AbstractAssemblage {
        private countSignal = new Signal(0);

        getCount() {
          return this.countSignal.get();
        }

        increment() {
          this.countSignal.set(this.countSignal.get() + 1);
        }

        decrement() {
          this.countSignal.set(this.countSignal.get() - 1);
        }

        subscribe(fn: (count: number) => void) {
          this.countSignal.subscribe(fn);
        }
      }

      @Assemblage({
        inject: [[CounterStore]],
      })
      class Counter implements AbstractAssemblage {
        private renderCount = 0;

        constructor(private store: CounterStore) {
          // Subscribe to changes
          store.subscribe(() => {
            this.renderCount++;
          });
        }

        increment() {
          this.store.increment();
        }

        getCount() {
          return this.store.getCount();
        }

        getRenderCount() {
          return this.renderCount;
        }
      }

      const counter = Assembler.build(Counter);

      expect(counter.getCount()).toBe(0);
      expect(counter.getRenderCount()).toBe(0);

      counter.increment();
      expect(counter.getCount()).toBe(1);
      expect(counter.getRenderCount()).toBe(1);

      counter.increment();
      counter.increment();
      expect(counter.getCount()).toBe(3);
      expect(counter.getRenderCount()).toBe(3);
    });
  });

  describe('Store Pattern', () => {
    it('should implement Solid store-like nested reactivity', () => {
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      interface TodoState {
        todos: Todo[];
        filter: 'all' | 'active' | 'completed';
      }

      @Assemblage({
        events: ['state:changed'],
      })
      class TodoStore implements AbstractAssemblage {
        private state: TodoState = {
          todos: [],
          filter: 'all',
        };
        private nextId = 1;

        constructor(@Context() private context: AssemblerContext) {}

        // Immutable updates like Solid stores
        addTodo(text: string) {
          const newTodo: Todo = {
            id: this.nextId++,
            text,
            completed: false,
          };
          this.state = {
            ...this.state,
            todos: [...this.state.todos, newTodo],
          };
          this.context.emit('state:changed', this.state);
        }

        toggleTodo(id: number) {
          this.state = {
            ...this.state,
            todos: this.state.todos.map(todo =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            ),
          };
          this.context.emit('state:changed', this.state);
        }

        setFilter(filter: 'all' | 'active' | 'completed') {
          this.state = {
            ...this.state,
            filter,
          };
          this.context.emit('state:changed', this.state);
        }

        getState(): Readonly<TodoState> {
          return this.state;
        }

        getFilteredTodos(): readonly Todo[] {
          const { todos, filter } = this.state;
          switch (filter) {
            case 'active':
              return todos.filter(t => !t.completed);
            case 'completed':
              return todos.filter(t => t.completed);
            default:
              return todos;
          }
        }
      }

      @Assemblage({
        inject: [[TodoStore]],
      })
      class TodoList implements AbstractAssemblage {
        private updateCount = 0;

        constructor(
          @Context() private context: AssemblerContext,
          private store: TodoStore
        ) {}

        onInit() {
          this.context.on('state:changed', () => {
            this.updateCount++;
          });
        }

        addTodo(text: string) {
          this.store.addTodo(text);
        }

        toggleTodo(id: number) {
          this.store.toggleTodo(id);
        }

        setFilter(filter: 'all' | 'active' | 'completed') {
          this.store.setFilter(filter);
        }

        getTodos() {
          return this.store.getFilteredTodos();
        }

        getUpdateCount() {
          return this.updateCount;
        }
      }

      const list = Assembler.build(TodoList);

      list.addTodo('Learn Solid');
      list.addTodo('Use assemblerjs');
      
      expect(list.getTodos()).toHaveLength(2);
      expect(list.getUpdateCount()).toBe(2);

      list.toggleTodo(1);
      expect(list.getUpdateCount()).toBe(3);

      list.setFilter('active');
      expect(list.getTodos()).toHaveLength(1);
      expect(list.getTodos()[0].text).toBe('Use assemblerjs');
    });
  });

  describe('Resource Pattern', () => {
    it('should handle async resources like Solid createResource', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      @Assemblage()
      class ApiService implements AbstractAssemblage {
        async fetchUser(id: number): Promise<User> {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                id,
                name: `User ${id}`,
                email: `user${id}@example.com`,
              });
            }, 10);
          });
        }

        async fetchUsers(): Promise<User[]> {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve([
                { id: 1, name: 'Alice', email: 'alice@example.com' },
                { id: 2, name: 'Bob', email: 'bob@example.com' },
              ]);
            }, 10);
          });
        }
      }

      @Assemblage({
        inject: [[ApiService]],
      })
      class UserResource implements AbstractAssemblage {
        private loading = false;
        private error: Error | null = null;
        private data: User | null = null;

        constructor(private api: ApiService) {}

        async load(userId: number) {
          this.loading = true;
          this.error = null;

          try {
            this.data = await this.api.fetchUser(userId);
          } catch (err) {
            this.error = err as Error;
            this.data = null;
          } finally {
            this.loading = false;
          }
        }

        get state() {
          if (this.loading) return { state: 'loading' as const };
          if (this.error) return { state: 'error' as const, error: this.error };
          if (this.data) return { state: 'ready' as const, data: this.data };
          return { state: 'idle' as const };
        }

        refetch(userId: number) {
          return this.load(userId);
        }
      }

      const resource = Assembler.build(UserResource);

      expect(resource.state.state).toBe('idle');

      await resource.load(42);

      const state = resource.state;
      expect(state.state).toBe('ready');
      if (state.state === 'ready') {
        expect(state.data.id).toBe(42);
        expect(state.data.name).toBe('User 42');
      }
    });
  });

  describe('Context API Pattern', () => {
    it('should simulate Solid context with assemblerjs', () => {
      // Theme context
      @Assemblage()
      class ThemeContext implements AbstractAssemblage {
        private currentTheme: 'light' | 'dark' = 'light';

        getTheme() {
          return this.currentTheme;
        }

        setTheme(theme: 'light' | 'dark') {
          this.currentTheme = theme;
        }

        toggleTheme() {
          this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        }
      }

      // Component that uses theme
      @Assemblage({
        inject: [[ThemeContext]],
      })
      class ThemedButton implements AbstractAssemblage {
        constructor(private theme: ThemeContext) {}

        render(text: string) {
          const currentTheme = this.theme.getTheme();
          return {
            text,
            className: `btn btn-${currentTheme}`,
            backgroundColor: currentTheme === 'light' ? '#fff' : '#333',
            color: currentTheme === 'light' ? '#000' : '#fff',
          };
        }
      }

      @Assemblage({
        inject: [[ThemeContext], [ThemedButton]],
      })
      class App implements AbstractAssemblage {
        constructor(
          private theme: ThemeContext,
          private button: ThemedButton
        ) {}

        toggleTheme() {
          this.theme.toggleTheme();
        }

        renderButton(text: string) {
          return this.button.render(text);
        }
      }

      const app = Assembler.build(App);

      let button = app.renderButton('Click me');
      expect(button.className).toBe('btn btn-light');
      expect(button.backgroundColor).toBe('#fff');

      app.toggleTheme();
      button = app.renderButton('Click me');
      expect(button.className).toBe('btn btn-dark');
      expect(button.backgroundColor).toBe('#333');
    });
  });

  describe('Effect-like Behavior', () => {
    it('should implement createEffect pattern', () => {
      const effects: string[] = [];

      @Assemblage({
        events: ['count:changed', 'doubled:changed'],
      })
      class CounterWithEffects implements AbstractAssemblage {
        private count = 0;
        private doubled = 0;

        constructor(@Context() private context: AssemblerContext) {}

        onInit() {
          // Effect: keep doubled in sync with count
          this.context.on('count:changed', (newCount: number) => {
            effects.push(`effect: count changed to ${newCount}`);
            this.doubled = newCount * 2;
            this.context.emit('doubled:changed', this.doubled);
          });

          // Effect: log when doubled changes
          this.context.on('doubled:changed', (newDoubled: number) => {
            effects.push(`effect: doubled changed to ${newDoubled}`);
          });
        }

        increment() {
          this.count++;
          this.context.emit('count:changed', this.count);
        }

        getCount() {
          return this.count;
        }

        getDoubled() {
          return this.doubled;
        }
      }

      const counter = Assembler.build(CounterWithEffects);

      expect(counter.getCount()).toBe(0);
      expect(counter.getDoubled()).toBe(0);
      expect(effects).toHaveLength(0);

      counter.increment();
      expect(counter.getCount()).toBe(1);
      expect(counter.getDoubled()).toBe(2);
      expect(effects).toEqual([
        'effect: count changed to 1',
        'effect: doubled changed to 2',
      ]);

      counter.increment();
      expect(counter.getDoubled()).toBe(4);
      expect(effects).toHaveLength(4);
    });
  });

  describe('Derived State (Memo)', () => {
    it('should implement createMemo pattern', () => {
      interface Product {
        id: number;
        name: string;
        price: number;
        quantity: number;
      }

      @Assemblage()
      class CartStore implements AbstractAssemblage {
        private products: Product[] = [];

        addProduct(product: Product) {
          this.products.push(product);
        }

        updateQuantity(id: number, quantity: number) {
          const product = this.products.find(p => p.id === id);
          if (product) product.quantity = quantity;
        }

        getProducts() {
          return [...this.products];
        }

        // Memoized computation
        getTotalPrice() {
          return this.products.reduce(
            (sum, p) => sum + p.price * p.quantity,
            0
          );
        }

        // Memoized computation
        getTotalItems() {
          return this.products.reduce((sum, p) => sum + p.quantity, 0);
        }

        // Memoized computation
        getAvgPrice() {
          const total = this.getTotalPrice();
          const items = this.getTotalItems();
          return items > 0 ? total / items : 0;
        }
      }

      @Assemblage({
        inject: [[CartStore]],
      })
      class Cart implements AbstractAssemblage {
        constructor(private store: CartStore) {}

        addProduct(name: string, price: number, quantity: number) {
          this.store.addProduct({
            id: Date.now(),
            name,
            price,
            quantity,
          });
        }

        getSummary() {
          return {
            totalPrice: this.store.getTotalPrice(),
            totalItems: this.store.getTotalItems(),
            avgPrice: this.store.getAvgPrice(),
          };
        }
      }

      const cart = Assembler.build(Cart);

      cart.addProduct('Book', 10, 2);
      cart.addProduct('Pen', 5, 3);

      const summary = cart.getSummary();
      expect(summary.totalPrice).toBe(35); // 10*2 + 5*3
      expect(summary.totalItems).toBe(5);  // 2 + 3
      expect(summary.avgPrice).toBe(7);    // 35 / 5
    });
  });

  describe('Component Lifecycle', () => {
    it('should match Solid component lifecycle', () => {
      const lifecycle: string[] = [];

      @Assemblage()
      class DataService implements AbstractAssemblage {
        onRegister() {
          lifecycle.push('service:created');
        }

        onInit() {
          lifecycle.push('service:mounted');
        }

        fetchData() {
          return { message: 'Data loaded' };
        }

        onDispose() {
          lifecycle.push('service:cleanup');
        }
      }

      @Assemblage({
        inject: [[DataService]],
      })
      class SolidComponent implements AbstractAssemblage {
        private data: any = null;

        constructor(private service: DataService) {
          lifecycle.push('component:created');
        }

        onInit() {
          lifecycle.push('component:mounted');
          // onMount equivalent
          this.data = this.service.fetchData();
        }

        render() {
          return this.data;
        }

        onDispose() {
          lifecycle.push('component:cleanup');
          // onCleanup equivalent
          this.data = null;
        }
      }

      const component = Assembler.build(SolidComponent);
      expect(component.render().message).toBe('Data loaded');

      expect(lifecycle).toEqual([
        'component:created',
        'service:mounted',
        'component:mounted',
      ]);

      // Cleanup is tested in lifecycle tests
      expect(lifecycle).toHaveLength(3);
    });
  });

  describe('Nested Reactivity', () => {
    it('should handle deeply nested reactive objects', () => {
      interface NestedState {
        user: {
          profile: {
            name: string;
            settings: {
              theme: string;
              notifications: boolean;
            };
          };
          stats: {
            posts: number;
            followers: number;
          };
        };
      }

      @Assemblage({
        events: ['state:changed'],
      })
      class NestedStore implements AbstractAssemblage {
        private state: NestedState = {
          user: {
            profile: {
              name: 'Anonymous',
              settings: {
                theme: 'light',
                notifications: true,
              },
            },
            stats: {
              posts: 0,
              followers: 0,
            },
          },
        };

        constructor(@Context() private context: AssemblerContext) {}

        setName(name: string) {
          this.state = {
            ...this.state,
            user: {
              ...this.state.user,
              profile: {
                ...this.state.user.profile,
                name,
              },
            },
          };
          this.context.emit('state:changed', this.state);
        }

        setTheme(theme: string) {
          this.state = {
            ...this.state,
            user: {
              ...this.state.user,
              profile: {
                ...this.state.user.profile,
                settings: {
                  ...this.state.user.profile.settings,
                  theme,
                },
              },
            },
          };
          this.context.emit('state:changed', this.state);
        }

        incrementPosts() {
          this.state = {
            ...this.state,
            user: {
              ...this.state.user,
              stats: {
                ...this.state.user.stats,
                posts: this.state.user.stats.posts + 1,
              },
            },
          };
          this.context.emit('state:changed', this.state);
        }

        getState() {
          return this.state;
        }
      }

      const store = Assembler.build(NestedStore);

      expect(store.getState().user.profile.name).toBe('Anonymous');

      store.setName('Alice');
      expect(store.getState().user.profile.name).toBe('Alice');

      store.setTheme('dark');
      expect(store.getState().user.profile.settings.theme).toBe('dark');
      expect(store.getState().user.profile.name).toBe('Alice'); // Still Alice

      store.incrementPosts();
      expect(store.getState().user.stats.posts).toBe(1);
      expect(store.getState().user.profile.name).toBe('Alice'); // Still Alice
    });
  });
});
