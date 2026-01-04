/**
 * Vanilla JavaScript Browser Tests
 * Tests assemblerjs working in a browser environment without any framework
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, AssemblerContext, EventManager } from '../../src';

describe('Vanilla JS - Browser Environment', () => {
  describe('Basic Dependency Injection', () => {
    it('should create and inject services in browser context', () => {
      @Assemblage()
      class ApiService implements AbstractAssemblage {
        fetchData() {
          return { data: 'Hello from API' };
        }
      }

      @Assemblage({
        inject: [[ApiService]],
      })
      class App implements AbstractAssemblage {
        constructor(private api: ApiService) {}

        render() {
          const data = this.api.fetchData();
          return `<div>${data.data}</div>`;
        }
      }

      const app = Assembler.build(App);
      expect(app.render()).toBe('<div>Hello from API</div>');
    });

    it('should work with DOM manipulation', () => {
      @Assemblage()
      class DOMService implements AbstractAssemblage {
        createElement(tag: string, content: string): string {
          return `<${tag}>${content}</${tag}>`;
        }
      }

      @Assemblage({
        inject: [[DOMService]],
      })
      class UIComponent implements AbstractAssemblage {
        constructor(private dom: DOMService) {}

        render() {
          return this.dom.createElement('div', 'Hello World');
        }
      }

      const component = Assembler.build(UIComponent);
      expect(component.render()).toBe('<div>Hello World</div>');
    });
  });

  describe('Event System in Browser', () => {
    it('should handle browser-like events', () => {
      const eventLog: string[] = [];

      @Assemblage({
        events: ['click', 'submit'],
      })
      class EventBus extends EventManager implements AbstractAssemblage {
        constructor() {
          super('click', 'submit');
        }

        onInit(@Context() context: AssemblerContext) {
          context.on('click', (data: any) => {
            eventLog.push(`clicked: ${data.element}`);
          });

          context.on('submit', (data: any) => {
            eventLog.push(`submitted: ${data.form}`);
          });
        }

        simulateClick(element: string) {
          this.emit('click', { element });
        }

        simulateSubmit(form: string) {
          this.emit('submit', { form });
        }
      }

      @Assemblage({
        inject: [[EventBus]],
      })
      class App implements AbstractAssemblage {
        constructor(private events: EventBus) {}

        handleClick() {
          this.events.simulateClick('button#submit');
        }

        handleSubmit() {
          this.events.simulateSubmit('form#login');
        }
      }

      const app = Assembler.build(App);
      app.handleClick();
      app.handleSubmit();

      expect(eventLog).toEqual([
        'clicked: button#submit',
        'submitted: form#login',
      ]);
    });
  });

  describe('State Management', () => {
    it('should manage application state', () => {
      interface State {
        count: number;
        user: { name: string } | null;
      }

      @Assemblage()
      class StateManager implements AbstractAssemblage {
        private state: State = {
          count: 0,
          user: null,
        };

        getState(): State {
          return { ...this.state };
        }

        setState(partial: Partial<State>): void {
          this.state = { ...this.state, ...partial };
        }

        increment() {
          this.state.count++;
        }

        setUser(name: string) {
          this.state.user = { name };
        }
      }

      @Assemblage({
        inject: [[StateManager]],
      })
      class App implements AbstractAssemblage {
        constructor(private state: StateManager) {}

        incrementCounter() {
          this.state.increment();
          return this.state.getState().count;
        }

        login(username: string) {
          this.state.setUser(username);
          return this.state.getState().user;
        }
      }

      const app = Assembler.build(App);
      
      expect(app.incrementCounter()).toBe(1);
      expect(app.incrementCounter()).toBe(2);
      expect(app.login('John')).toEqual({ name: 'John' });
    });
  });

  describe('HTTP Service Simulation', () => {
    it('should simulate fetch API calls', async () => {
      @Assemblage()
      class HttpService implements AbstractAssemblage {
        async get(url: string): Promise<any> {
          // Simulate fetch
          return {
            url,
            data: { id: 1, title: 'Test' },
            status: 200,
          };
        }

        async post(url: string, body: any): Promise<any> {
          return {
            url,
            body,
            status: 201,
          };
        }
      }

      @Assemblage({
        inject: [[HttpService]],
      })
      class ApiClient implements AbstractAssemblage {
        constructor(private http: HttpService) {}

        async getUsers() {
          return this.http.get('/api/users');
        }

        async createUser(name: string) {
          return this.http.post('/api/users', { name });
        }
      }

      const client = Assembler.build(ApiClient);
      
      const users = await client.getUsers();
      expect(users.status).toBe(200);
      expect(users.data).toEqual({ id: 1, title: 'Test' });

      const created = await client.createUser('Alice');
      expect(created.status).toBe(201);
      expect(created.body).toEqual({ name: 'Alice' });
    });
  });

  describe('Component Pattern', () => {
    it('should implement component-based architecture', () => {
      @Assemblage()
      class ButtonComponent implements AbstractAssemblage {
        render(text: string, onClick: string): string {
          return `<button onclick="${onClick}">${text}</button>`;
        }
      }

      @Assemblage()
      class InputComponent implements AbstractAssemblage {
        render(placeholder: string, value: string = ''): string {
          return `<input type="text" placeholder="${placeholder}" value="${value}" />`;
        }
      }

      @Assemblage({
        inject: [[ButtonComponent], [InputComponent]],
      })
      class FormComponent implements AbstractAssemblage {
        constructor(
          private button: ButtonComponent,
          private input: InputComponent
        ) {}

        render(): string {
          const input = this.input.render('Enter your name', '');
          const button = this.button.render('Submit', 'handleSubmit()');
          return `<form>${input}${button}</form>`;
        }
      }

      const form = Assembler.build(FormComponent);
      const html = form.render();
      
      expect(html).toContain('<input');
      expect(html).toContain('placeholder="Enter your name"');
      expect(html).toContain('<button');
      expect(html).toContain('Submit');
    });
  });

  describe('Router Simulation', () => {
    it('should handle routing logic', () => {
      interface Route {
        path: string;
        component: string;
      }

      @Assemblage()
      class Router implements AbstractAssemblage {
        private routes: Route[] = [];
        private currentPath = '/';

        addRoute(path: string, component: string) {
          this.routes.push({ path, component });
        }

        navigate(path: string) {
          this.currentPath = path;
        }

        getCurrentRoute(): Route | undefined {
          return this.routes.find(r => r.path === this.currentPath);
        }
      }

      @Assemblage({
        inject: [[Router]],
      })
      class App implements AbstractAssemblage {
        constructor(private router: Router) {}

        onInit() {
          this.router.addRoute('/', 'HomeComponent');
          this.router.addRoute('/about', 'AboutComponent');
          this.router.addRoute('/contact', 'ContactComponent');
        }

        navigateTo(path: string) {
          this.router.navigate(path);
          return this.router.getCurrentRoute();
        }
      }

      const app = Assembler.build(App);
      
      expect(app.navigateTo('/')).toEqual({ path: '/', component: 'HomeComponent' });
      expect(app.navigateTo('/about')).toEqual({ path: '/about', component: 'AboutComponent' });
      expect(app.navigateTo('/contact')).toEqual({ path: '/contact', component: 'ContactComponent' });
    });
  });

  describe('LocalStorage Service', () => {
    it('should simulate localStorage operations', () => {
      @Assemblage()
      class StorageService implements AbstractAssemblage {
        private storage = new Map<string, string>();

        setItem(key: string, value: any): void {
          this.storage.set(key, JSON.stringify(value));
        }

        getItem<T>(key: string): T | null {
          const item = this.storage.get(key);
          return item ? JSON.parse(item) : null;
        }

        removeItem(key: string): void {
          this.storage.delete(key);
        }

        clear(): void {
          this.storage.clear();
        }
      }

      @Assemblage({
        inject: [[StorageService]],
      })
      class UserPreferences implements AbstractAssemblage {
        constructor(private storage: StorageService) {}

        saveTheme(theme: 'light' | 'dark') {
          this.storage.setItem('theme', theme);
        }

        getTheme(): string | null {
          return this.storage.getItem<string>('theme');
        }

        saveUserData(user: { id: number; name: string }) {
          this.storage.setItem('user', user);
        }

        getUserData() {
          return this.storage.getItem<{ id: number; name: string }>('user');
        }
      }

      const prefs = Assembler.build(UserPreferences);
      
      prefs.saveTheme('dark');
      expect(prefs.getTheme()).toBe('dark');

      prefs.saveUserData({ id: 1, name: 'Alice' });
      expect(prefs.getUserData()).toEqual({ id: 1, name: 'Alice' });
    });
  });
});
