# React with assembler.js

Integrate assembler.js with React for type-safe dependency injection in your React applications.

## Installation

```sh
npm install assemblerjs reflect-metadata react react-dom
```

### Entry Point Setup

```typescript
// src/main.tsx
import 'reflect-metadata'; // ← Important: must be first!
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Basic Pattern

### Service Injection

```typescript
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
import { useEffect, useState } from 'react';

// Define your service
@Assemblage()
class UserService implements AbstractAssemblage {
  getUsers() {
    return [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
  }

  getUser(id: number) {
    return this.getUsers().find(u => u.id === id);
  }
}

// Use in React component
function UserList() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Get service instance
    const userService = Assembler.require(UserService);
    setUsers(userService.getUsers());
  }, []);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Custom Hook Pattern

Create a reusable `useService` hook:

```typescript
import { useMemo } from 'react';
import { Assembler } from 'assemblerjs';

export function useService<T>(ServiceClass: new (...args: any[]) => T): T {
  return useMemo(() => Assembler.require(ServiceClass), [ServiceClass]);
}

// Usage
function UserProfile({ userId }: { userId: number }) {
  const userService = useService(UserService);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(userService.getUser(userId));
  }, [userId, userService]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

## Context Provider Pattern

Create a provider for assembler.js services:

```typescript
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Assembler, AssemblerContext, Assemblage, Context, AbstractAssemblage } from 'assemblerjs';

// Create React Context
const AssemblerReactContext = createContext<AssemblerContext | null>(null);

// Provider component
@Assemblage()
class AppRoot implements AbstractAssemblage {
  constructor(@Context() public context: AssemblerContext) {}
}

export function AssemblerProvider({ children }: { children: ReactNode }) {
  const context = useMemo(() => {
    const app = Assembler.build(AppRoot);
    return app.context;
  }, []);

  return (
    <AssemblerReactContext.Provider value={context}>
      {children}
    </AssemblerReactContext.Provider>
  );
}

// Hook to use the context
export function useAssemblerContext() {
  const context = useContext(AssemblerReactContext);
  if (!context) {
    throw new Error('useAssemblerContext must be used within AssemblerProvider');
  }
  return context;
}

// Hook to get services from context
export function useContextService<T>(ServiceClass: new (...args: any[]) => T): T {
  const context = useAssemblerContext();
  return useMemo(() => context.require(ServiceClass), [context, ServiceClass]);
}

// Usage in App
function App() {
  return (
    <AssemblerProvider>
      <UserProfile userId={1} />
    </AssemblerProvider>
  );
}

function UserProfile({ userId }: { userId: number }) {
  const userService = useContextService(UserService);
  // ... rest of component
}
```

## State Management

### Redux-like Pattern

```typescript
interface AppState {
  counter: number;
  user: { name: string } | null;
}

type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_USER'; payload: { name: string } }
  | { type: 'LOGOUT' };

@Assemblage({
  events: ['state:changed'],
})
class Store implements AbstractAssemblage {
  private state: AppState = {
    counter: 0,
    user: null,
  };

  constructor(@Context() private context: AssemblerContext) {}

  dispatch(action: Action) {
    switch (action.type) {
      case 'INCREMENT':
        this.state = { ...this.state, counter: this.state.counter + 1 };
        break;
      case 'DECREMENT':
        this.state = { ...this.state, counter: this.state.counter - 1 };
        break;
      case 'SET_USER':
        this.state = { ...this.state, user: action.payload };
        break;
      case 'LOGOUT':
        this.state = { ...this.state, user: null };
        break;
    }
    this.context.emit('state:changed', this.state);
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(callback: (state: AppState) => void) {
    return this.context.on('state:changed', callback);
  }
}

// Custom hook for store
function useStore() {
  const store = useService(Store);
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  const dispatch = useCallback((action: Action) => {
    store.dispatch(action);
  }, [store]);

  return [state, dispatch] as const;
}

// Usage
function Counter() {
  const [state, dispatch] = useStore();

  return (
    <div>
      <p>Count: {state.counter}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
    </div>
  );
}
```

## Async Data Fetching

```typescript
interface Post {
  id: number;
  title: string;
  body: string;
}

@Assemblage()
class ApiService implements AbstractAssemblage {
  async fetchPosts(): Promise<Post[]> {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    return response.json();
  }

  async fetchPost(id: number): Promise<Post> {
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
    return response.json();
  }
}

function PostList() {
  const api = useService(ApiService);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.fetchPosts()
      .then(setPosts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
        </li>
      ))}
    </ul>
  );
}
```

## Form Handling

```typescript
interface FormErrors {
  email?: string;
  password?: string;
}

@Assemblage()
class ValidationService implements AbstractAssemblage {
  validateEmail(email: string): string | null {
    if (!email) return 'Email is required';
    if (!email.includes('@')) return 'Invalid email format';
    return null;
  }

  validatePassword(password: string): string | null {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  }
}

function LoginForm() {
  const validator = useService(ValidationService);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    const emailError = validator.validateEmail(email);
    const passwordError = validator.validatePassword(password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', { email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>
      <button type="submit">Login</button>
    </form>
  );
}
```

## Event System Integration

```typescript
@Assemblage({
  events: ['notification:show', 'notification:hide'],
})
class NotificationService implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.context.emit('notification:show', { message, type, id: Date.now() });
  }

  hide(id: number) {
    this.context.emit('notification:hide', id);
  }

  onNotification(callback: (data: any) => void) {
    return this.context.on('notification:show', callback);
  }

  onHide(callback: (id: number) => void) {
    return this.context.on('notification:hide', callback);
  }
}

function Notifications() {
  const notifications = useService(NotificationService);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const unsubShow = notifications.onNotification((data) => {
      setItems(prev => [...prev, data]);
    });

    const unsubHide = notifications.onHide((id) => {
      setItems(prev => prev.filter(item => item.id !== id));
    });

    return () => {
      unsubShow();
      unsubHide();
    };
  }, [notifications]);

  return (
    <div className="notifications">
      {items.map(item => (
        <div key={item.id} className={`notification ${item.type}`}>
          {item.message}
          <button onClick={() => notifications.hide(item.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// Usage in another component
function SomeComponent() {
  const notifications = useService(NotificationService);

  const handleAction = async () => {
    try {
      await someAsyncOperation();
      notifications.show('Operation successful!', 'success');
    } catch (error) {
      notifications.show('Operation failed!', 'error');
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
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

  getTodos(): Todo[] {
    return [...this.todos];
  }

  addTodo(text: string): Todo {
    const todo = { id: this.nextId++, text, completed: false };
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

  getStats() {
    return {
      total: this.todos.length,
      active: this.todos.filter(t => !t.completed).length,
      completed: this.todos.filter(t => t.completed).length,
    };
  }
}

function TodoApp() {
  const todoService = useService(TodoService);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const refreshTodos = () => setTodos(todoService.getTodos());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      todoService.addTodo(inputValue);
      setInputValue('');
      refreshTodos();
    }
  };

  const handleToggle = (id: number) => {
    todoService.toggleTodo(id);
    refreshTodos();
  };

  const handleRemove = (id: number) => {
    todoService.removeTodo(id);
    refreshTodos();
  };

  const stats = todoService.getStats();

  return (
    <div className="todo-app">
      <h1>Todos</h1>
      
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => handleRemove(todo.id)}>×</button>
          </li>
        ))}
      </ul>

      <div className="stats">
        {stats.active} item{stats.active !== 1 ? 's' : ''} left
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Create Service Hooks

```typescript
// hooks/useUserService.ts
export function useUserService() {
  return useService(UserService);
}

// Usage
function Component() {
  const users = useUserService();
  // ...
}
```

### 2. Memoize Service Instances

```typescript
function Component() {
  const service = useMemo(() => Assembler.require(MyService), []);
  // ...
}
```

### 3. Clean Up Event Listeners

```typescript
useEffect(() => {
  const service = Assembler.require(EventService);
  const unsubscribe = service.on('event', handler);
  
  return () => unsubscribe(); // Cleanup
}, []);
```

### 4. TypeScript Types

```typescript
// Define service interfaces
interface IUserService {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User>;
}

@Assemblage()
class UserService implements AbstractAssemblage, IUserService {
  // implementation
}
```

## Next Steps

- [Framework Integration Overview](./index.md)
- [Vue Integration](./vue.md)
- [Example Tests](../../../../packages/assemblerjs/e2e/browser/react-integration.spec.tsx)
