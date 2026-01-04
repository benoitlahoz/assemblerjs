# Event System

`assembler.js` includes a built-in event system via the `EventManager` class. Any assemblage can extend `EventManager` to emit events.

## Basic Usage

```typescript
import { EventManager, Assemblage, AbstractAssemblage } from 'assemblerjs';

// Define event channels
const Events = {
  USER_CREATED: 'app:user:created',
  USER_DELETED: 'app:user:deleted',
};

@Assemblage({
  events: Object.values(Events), // Register event channels
})
export class UserService 
  extends EventManager 
  implements AbstractAssemblage 
{
  constructor() {
    super(...Object.values(Events)); // Pass allowed channels
  }

  createUser(name: string) {
    const user = { id: 1, name };
    this.emit(Events.USER_CREATED, user); // Emit event
    return user;
  }
}

@Assemblage({ inject: [[UserService]] })
export class NotificationService implements AbstractAssemblage {
  constructor(
    @Context() private context: AssemblerContext,
    private userService: UserService
  ) {
    // Listen to events via context
    context.on(Events.USER_CREATED, (user) => {
      console.log('Send notification for user:', user.name);
    });

    // Listen to all events on wildcard channel
    context.on('*', (data) => {
      console.log('Event received:', data);
    });
  }
}
```

## Event Manager API

```typescript
class EventManager {
  // Add event channels
  addChannels(...channels: string[]): EventManager;
  
  // Remove event channels
  removeChannels(...channels: string[]): EventManager;
  
  // Register event listener
  on(channel: string, callback: Listener): EventManager;
  
  // Register one-time listener
  once(channel: string, callback: Listener): EventManager;
  
  // Remove event listener
  off(channel: string, callback?: Listener): EventManager;
  
  // Emit event (only on registered channels)
  emit(channel: string, ...args: any[]): EventManager;
  
  // Cleanup
  dispose(): void;
}
```

### addChannels(...channels)

Add event channels to the manager:

```typescript
const manager = new EventManager();
manager.addChannels('channel1', 'channel2');
```

### removeChannels(...channels)

Remove event channels:

```typescript
manager.removeChannels('channel1');
```

### on(channel, callback)

Register an event listener:

```typescript
manager.on('user:created', (user) => {
  console.log('User created:', user);
});
```

### once(channel, callback)

Register a one-time event listener:

```typescript
manager.once('app:ready', () => {
  console.log('App is ready');
});
```

### off(channel, callback?)

Remove event listener(s):

```typescript
// Remove specific listener
const handler = (data) => console.log(data);
manager.on('event', handler);
manager.off('event', handler);

// Remove all listeners for a channel
manager.off('event');
```

### emit(channel, ...args)

Emit an event (only on registered channels):

```typescript
manager.emit('user:created', { id: 1, name: 'John' });
```

⚠️ **Important:** You can only emit events on channels that were registered via `addChannels()` or the constructor.

### dispose()

Cleanup all listeners:

```typescript
manager.dispose();
```

## Event Context Forwarding

All events are automatically forwarded through `AssemblerContext`, allowing any assemblage to listen to events emitted by others:

```typescript
@Assemblage()
class ObserverService implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Listen to any registered event channel
    context.on('app:user:created', (user) => {
      // React to event
    });
  }
}
```

This means:
- Events emitted by any assemblage are forwarded to the global context
- Any assemblage can listen to these events via `@Context()`
- No direct reference to the emitter is needed

## Wildcard Channel

Use the wildcard channel `'*'` to listen to all events:

```typescript
@Assemblage()
class LoggingService implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Listen to ALL events
    context.on('*', (data) => {
      console.log('Event received:', data);
    });
  }
}
```

## Event Channel Best Practices

To avoid collisions, use strong channel names with namespacing:

```typescript
// ❌ Bad - Too generic
const Events = { 
  INIT: 'init', 
  ERROR: 'error' 
};

// ✅ Good - Namespaced and specific
const Events = {
  INIT: 'com.myapp.service.user:init',
  ERROR: 'com.myapp.service.user:error',
  CREATED: 'com.myapp.service.user:created',
};
```

**Recommended naming convention:**
- Use reverse domain notation: `com.myapp.module.service:event`
- Include module/service name for context
- Use lowercase with colons separating namespace from event name

## Complete Example: User & Notification Services

```typescript
// Event channels
const UserEvents = {
  CREATED: 'app.users:created',
  UPDATED: 'app.users:updated',
  DELETED: 'app.users:deleted',
};

// Service that emits events
@Assemblage({
  events: Object.values(UserEvents),
})
export class UserService 
  extends EventManager 
  implements AbstractAssemblage 
{
  private users: User[] = [];
  
  constructor() {
    super(...Object.values(UserEvents));
  }
  
  createUser(name: string) {
    const user = { id: Date.now(), name };
    this.users.push(user);
    this.emit(UserEvents.CREATED, user);
    return user;
  }
  
  updateUser(id: number, name: string) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.name = name;
      this.emit(UserEvents.UPDATED, user);
    }
    return user;
  }
  
  deleteUser(id: number) {
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      const user = this.users.splice(index, 1)[0];
      this.emit(UserEvents.DELETED, user);
      return user;
    }
  }
}

// Service that listens to events
@Assemblage({ inject: [[UserService]] })
export class NotificationService implements AbstractAssemblage {
  constructor(
    @Context() private context: AssemblerContext,
    private userService: UserService
  ) {
    // Listen to user events
    context.on(UserEvents.CREATED, this.onUserCreated.bind(this));
    context.on(UserEvents.UPDATED, this.onUserUpdated.bind(this));
    context.on(UserEvents.DELETED, this.onUserDeleted.bind(this));
  }
  
  private onUserCreated(user: User) {
    console.log(`📧 Send welcome email to ${user.name}`);
  }
  
  private onUserUpdated(user: User) {
    console.log(`📧 Send profile update notification to ${user.name}`);
  }
  
  private onUserDeleted(user: User) {
    console.log(`📧 Send account deletion confirmation to ${user.name}`);
  }
  
  onDispose() {
    // Cleanup listeners
    this.context.off(UserEvents.CREATED);
    this.context.off(UserEvents.UPDATED);
    this.context.off(UserEvents.DELETED);
  }
}
```

## Async Event Handlers

Event handlers can be async:

```typescript
context.on('data:save', async (data) => {
  await database.save(data);
  console.log('Data saved');
});
```

⚠️ **Note:** Events are emitted synchronously. Async handlers run in the background without blocking.

## Error Handling

Wrap event handlers with try-catch for safety:

```typescript
context.on('user:created', async (user) => {
  try {
    await sendEmail(user);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
});
```

## Cleanup

Always cleanup event listeners in `onDispose`:

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  private handler = (data) => console.log(data);
  
  constructor(@Context() private context: AssemblerContext) {
    context.on('event', this.handler);
  }
  
  onDispose() {
    this.context.off('event', this.handler);
  }
}
```

## Next Steps

- [Tags](./tags.md) - Group assemblages by category
- [AssemblerContext API](../api/context.md) - Full context documentation
- [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md) - Setup listeners in `onInit`
- [Advanced Examples](../guides/advanced-examples.md) - Real-world event patterns
