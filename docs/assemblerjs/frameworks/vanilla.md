# Vanilla JavaScript with assembler.js

Use assembler.js in pure JavaScript applications without any framework. Perfect for:
- Landing pages with interactive components
- Browser extensions
- Web Components
- Progressive Web Apps (PWAs)

## Installation

```sh
npm install assemblerjs reflect-metadata
```

Import at your application entry point:

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler } from 'assemblerjs';
```

## Basic Usage

### Simple Service

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

@Assemblage()
class GreetingService implements AbstractAssemblage {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}

@Assemblage({
  inject: [[GreetingService]],
})
class App implements AbstractAssemblage {
  constructor(private greeting: GreetingService) {}

  run() {
    document.body.innerHTML = this.greeting.greet('World');
  }
}

// Bootstrap
const app = Assembler.build(App);
app.run();
```

## DOM Manipulation

### Component System

Build a simple component system:

```typescript
@Assemblage()
class DOMService implements AbstractAssemblage {
  createElement(tag: string, attrs: Record<string, string> = {}, content?: string): HTMLElement {
    const element = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    if (content) {
      element.textContent = content;
    }
    
    return element;
  }

  append(parent: HTMLElement, ...children: HTMLElement[]): void {
    children.forEach(child => parent.appendChild(child));
  }

  on(element: HTMLElement, event: string, handler: EventListener): void {
    element.addEventListener(event, handler);
  }
}

@Assemblage({
  inject: [[DOMService]],
})
class ButtonComponent implements AbstractAssemblage {
  constructor(private dom: DOMService) {}

  create(text: string, onClick: () => void): HTMLElement {
    const button = this.dom.createElement('button', { class: 'btn' }, text);
    this.dom.on(button, 'click', onClick);
    return button;
  }
}

@Assemblage({
  inject: [[ButtonComponent], [DOMService]],
})
class App implements AbstractAssemblage {
  private count = 0;
  private counterDisplay: HTMLElement | null = null;

  constructor(
    private button: ButtonComponent,
    private dom: DOMService
  ) {}

  render() {
    const container = this.dom.createElement('div', { class: 'app' });
    
    this.counterDisplay = this.dom.createElement('p', {}, `Count: ${this.count}`);
    const incrementBtn = this.button.create('Increment', () => this.increment());
    
    this.dom.append(container, this.counterDisplay, incrementBtn);
    document.body.appendChild(container);
  }

  private increment() {
    this.count++;
    if (this.counterDisplay) {
      this.counterDisplay.textContent = `Count: ${this.count}`;
    }
  }
}

const app = Assembler.build(App);
app.render();
```

## Event System

Use assembler.js built-in event system:

```typescript
@Assemblage({
  events: ['user:login', 'user:logout', 'notification:show'],
})
class EventBus implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}

  onInit() {
    this.context.on('user:login', (user: any) => {
      console.log('User logged in:', user);
    });

    this.context.on('notification:show', (message: string) => {
      this.showNotification(message);
    });
  }

  login(username: string) {
    this.context.emit('user:login', { username, timestamp: Date.now() });
    this.context.emit('notification:show', `Welcome, ${username}!`);
  }

  logout() {
    this.context.emit('user:logout');
    this.context.emit('notification:show', 'Goodbye!');
  }

  private showNotification(message: string) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }
}

@Assemblage({
  inject: [[EventBus]],
})
class LoginForm implements AbstractAssemblage {
  constructor(private events: EventBus) {}

  render() {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Username';
    
    const button = document.createElement('button');
    button.textContent = 'Login';
    
    form.appendChild(input);
    form.appendChild(button);
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.events.login(input.value);
    });
    
    document.body.appendChild(form);
  }
}

const form = Assembler.build(LoginForm);
form.render();
```

## HTTP Service

Create a reusable HTTP service:

```typescript
@Assemblage()
class HttpService implements AbstractAssemblage {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.example.com';
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}

interface User {
  id: number;
  name: string;
  email: string;
}

@Assemblage({
  inject: [[HttpService]],
})
class UserList implements AbstractAssemblage {
  private container: HTMLElement | null = null;

  constructor(private http: HttpService) {}

  async render(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.container.innerHTML = '<p>Loading...</p>';

    try {
      const users = await this.http.get<User[]>('/users');
      this.displayUsers(users);
    } catch (error) {
      this.container.innerHTML = `<p class="error">Error: ${(error as Error).message}</p>`;
    }
  }

  private displayUsers(users: User[]) {
    if (!this.container) return;

    this.container.innerHTML = '';
    const ul = document.createElement('ul');

    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = `${user.name} (${user.email})`;
      ul.appendChild(li);
    });

    this.container.appendChild(ul);
  }
}
```

## State Management

Implement simple state management:

```typescript
interface AppState {
  user: { name: string; email: string } | null;
  theme: 'light' | 'dark';
  notifications: string[];
}

@Assemblage({
  events: ['state:changed'],
})
class Store implements AbstractAssemblage {
  private state: AppState = {
    user: null,
    theme: 'light',
    notifications: [],
  };

  private subscribers: Array<(state: AppState) => void> = [];

  constructor(@Context() private context: AssemblerContext) {}

  onInit() {
    this.context.on('state:changed', (newState: AppState) => {
      this.subscribers.forEach(fn => fn(newState));
    });
  }

  getState(): AppState {
    return { ...this.state };
  }

  setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.context.emit('state:changed', this.state);
  }

  subscribe(fn: (state: AppState) => void): () => void {
    this.subscribers.push(fn);
    fn(this.state); // Call immediately
    return () => {
      const index = this.subscribers.indexOf(fn);
      if (index > -1) this.subscribers.splice(index, 1);
    };
  }
}

@Assemblage({
  inject: [[Store]],
})
class ThemeToggle implements AbstractAssemblage {
  private button: HTMLButtonElement | null = null;

  constructor(private store: Store) {}

  render() {
    this.button = document.createElement('button');
    this.updateButton();

    this.button.addEventListener('click', () => this.toggle());

    // Subscribe to state changes
    this.store.subscribe(state => {
      this.updateButton();
    });

    document.body.appendChild(this.button);
  }

  private toggle() {
    const { theme } = this.store.getState();
    this.store.setState({ theme: theme === 'light' ? 'dark' : 'light' });
  }

  private updateButton() {
    if (!this.button) return;
    const { theme } = this.store.getState();
    this.button.textContent = `Theme: ${theme}`;
    document.body.className = theme;
  }
}
```

## Router

Simple client-side router:

```typescript
interface Route {
  path: string;
  handler: () => void;
}

@Assemblage({
  events: ['route:changed'],
})
class Router implements AbstractAssemblage {
  private routes: Route[] = [];
  private currentPath = '/';

  constructor(@Context() private context: AssemblerContext) {}

  onInit() {
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.hasAttribute('data-route')) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) this.navigate(href);
      }
    });
  }

  addRoute(path: string, handler: () => void): void {
    this.routes.push({ path, handler });
  }

  navigate(path: string): void {
    window.history.pushState({}, '', path);
    this.currentPath = path;
    this.handleRoute();
  }

  private handleRoute(): void {
    const route = this.routes.find(r => r.path === this.currentPath);
    if (route) {
      route.handler();
      this.context.emit('route:changed', this.currentPath);
    }
  }
}

@Assemblage({
  inject: [[Router]],
})
class App implements AbstractAssemblage {
  constructor(private router: Router) {}

  onInit() {
    this.router.addRoute('/', () => this.renderHome());
    this.router.addRoute('/about', () => this.renderAbout());
    this.router.addRoute('/contact', () => this.renderContact());
  }

  private renderHome() {
    document.getElementById('app')!.innerHTML = '<h1>Home Page</h1>';
  }

  private renderAbout() {
    document.getElementById('app')!.innerHTML = '<h1>About Page</h1>';
  }

  private renderContact() {
    document.getElementById('app')!.innerHTML = '<h1>Contact Page</h1>';
  }
}
```

## LocalStorage Integration

```typescript
@Assemblage()
class StorageService implements AbstractAssemblage {
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

@Assemblage({
  inject: [[StorageService]],
})
class UserPreferences implements AbstractAssemblage {
  constructor(private storage: StorageService) {}

  saveTheme(theme: 'light' | 'dark'): void {
    this.storage.setItem('theme', theme);
  }

  getTheme(): 'light' | 'dark' {
    return this.storage.getItem<'light' | 'dark'>('theme') || 'light';
  }

  saveUser(user: { name: string; email: string }): void {
    this.storage.setItem('user', user);
  }

  getUser(): { name: string; email: string } | null {
    return this.storage.getItem('user');
  }
}
```

## Complete Example: Todo App

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@Assemblage()
class TodoService implements AbstractAssemblage {
  private todos: Todo[] = [];
  private nextId = 1;

  addTodo(text: string): Todo {
    const todo: Todo = { id: this.nextId++, text, completed: false };
    this.todos.push(todo);
    return todo;
  }

  toggleTodo(id: number): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.completed = !todo.completed;
  }

  removeTodo(id: number): void {
    this.todos = this.todos.filter(t => t.id !== id);
  }

  getTodos(): Todo[] {
    return [...this.todos];
  }

  getActiveTodos(): Todo[] {
    return this.todos.filter(t => !t.completed);
  }

  getCompletedTodos(): Todo[] {
    return this.todos.filter(t => t.completed);
  }
}

@Assemblage({
  inject: [[TodoService]],
  events: ['todos:updated'],
})
class TodoApp implements AbstractAssemblage {
  private container: HTMLElement | null = null;

  constructor(
    @Context() private context: AssemblerContext,
    private todoService: TodoService
  ) {}

  render(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.renderUI();
  }

  private renderUI() {
    if (!this.container) return;

    this.container.innerHTML = '';

    // Input form
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'What needs to be done?';
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';

    form.appendChild(input);
    form.appendChild(addBtn);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim()) {
        this.todoService.addTodo(input.value);
        input.value = '';
        this.renderUI();
        this.context.emit('todos:updated', this.todoService.getTodos());
      }
    });

    // Todo list
    const list = document.createElement('ul');
    list.className = 'todo-list';

    this.todoService.getTodos().forEach(todo => {
      const li = document.createElement('li');
      li.className = todo.completed ? 'completed' : '';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.addEventListener('change', () => {
        this.todoService.toggleTodo(todo.id);
        this.renderUI();
        this.context.emit('todos:updated', this.todoService.getTodos());
      });

      const text = document.createElement('span');
      text.textContent = todo.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => {
        this.todoService.removeTodo(todo.id);
        this.renderUI();
        this.context.emit('todos:updated', this.todoService.getTodos());
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });

    // Stats
    const stats = document.createElement('div');
    stats.className = 'stats';
    const active = this.todoService.getActiveTodos().length;
    stats.textContent = `${active} item${active !== 1 ? 's' : ''} left`;

    this.container.appendChild(form);
    this.container.appendChild(list);
    this.container.appendChild(stats);
  }
}

// Bootstrap
const app = Assembler.build(TodoApp);
app.render('app');
```

## Next Steps

- [Framework Integration Overview](./index.md)
- [React Integration](./react.md)
- [Vue Integration](./vue.md)
- [Example Tests](../../../../packages/assemblerjs/e2e/browser/vanilla-basic.spec.ts)
