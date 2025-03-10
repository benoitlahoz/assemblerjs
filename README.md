# assembler.js

A general purpose and zero-dependency [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) library for node and browser.

![Statements](https://img.shields.io/badge/statements-90.65%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-81.25%25-yellow.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-87.23%25-yellow.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-90.25%25-brightgreen.svg?style=flat)

---

`assembler.js` is inspired by both DIOD and Nestjs.

`assembler.js` name is a tribute to Gilles Deleuze and Felix Guattari concept of [_Agencement_](<https://fr.wikipedia.org/wiki/Agencement_(philosophie)>) (in french) that can be translated into [Assemblage](<https://en.wikipedia.org/wiki/Assemblage_(philosophy)>).

## Install

```sh
yarn add assemblerjs
```

```sh
npm install assemblerjs
```

## Usage

The main block of `assembler.js` is the **Assemblage**. It is created by decorating classes with the `@Assemblage` decorator. To keep everything type-safe, classes may implement `AbstractAssemblage` abstract class or define their own abstract class that extends it.
These abstract classes are used as identifiers to inject dependencies.

## Order of execution

Dependencies are registered and built recursively from the entry assemblage resolved by `Assembler.build`.

##### `onRegister`

Static hook called when registering the assemblage.
Other dependencies may or may not have been registered at this point, and dependency tree is not built yet.

##### `constructor`

Build the instance and requires an instance of each dependency passed to the constructor.
If the dependency is not a singleton a new instance is returned, meaning the same dependency required in another assemblage will be another object, as when using the `require` method of the `AssemblerContext` passed to hooks or injected by the `@Context` decorator.

##### `onInit`

Called on every dependency when the dependency tree is ready.
Except for the entry assemblage (i.e. the one built on bootstrap by `Assembler.build`) the hook is called according to the latter.
The entry point assemblage is called last.

##### `onDispose`

Called when disposing the assembler via the `dispose` method injected by the `@Dispose` decorator.
This will be called like the `onInit` method, walking through the dependency tree, except for the entry point assemblage, called last.

## Events

`assembler.js` provides an `EventManager` that can be subclassed by any assemblage.

Because all events **are forwarded by `AssemblerContext`** the `EventManager` is quite strict on which events can be broadcasted and they must be registered explicitly using the `events` property of the `AssemblageDefinition`. To avoid collision between events channels, user is strongly encouraged to create _strong_ channels names, e.g.: `com.domain.app.assemblage-name:init`.

```typescript
const prefix = 'com.domain.app.emitter-assemblage';

export enum EmitterAssemblageEvents {
  Init = `${prefix}:init`,
}

@Assemblage({
  events: Object.values(EmitterAssemblageEvents),
})
export class EmitterAssemblage
  extends EventManager
  implements AbstractEventAssemblage
{
  constructor() {
    super();
  }

  public async onInit(): Promise<void> {
    this.emit(EmitterAssemblageEvents.Init, true);
  }
}

@Assemblage()
export class SubcriberAssemblage implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    context.on(EmitterAssemblageEvents.Init, (value: boolean) => {
      console.log(value); // true.
    });

    context.on('*', (value: boolean) => {
      console.log(value); // true.
    });
  }
}

Assembler.build(SubcriberAssemblage);
```
