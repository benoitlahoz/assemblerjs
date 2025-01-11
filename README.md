# assembler.js

---

[![npm version](https://badge.fury.io/js/assemblerjs.svg)](https://badge.fury.io/js/assemblerjs)

![Statements](https://img.shields.io/badge/statements-84.3%25-yellow.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-74.58%25-red.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-81.48%25-yellow.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-83.9%25-yellow.svg?style=flat)

<br />

`assembler.js` name is a tribute to Gilles Deleuze and Felix Guattari concept of [_Agencement_](<https://fr.wikipedia.org/wiki/Agencement_(philosophie)>) (in french) that can be translated into [Assemblage](<https://en.wikipedia.org/wiki/Assemblage_(philosophy)>).

## Install

```sh
yarn add assemblerjs
```

```sh
npm install assemblerjs
```

## Usage

### Order of execution

- `onRegister` Static hook called when registering the assemblage.
- `constructor` Build the instance.
- `onInit` Called on every dependency when all dependencies have been built.

- `onDispose` Called when disposing the assembler via `dispose` method injected by the `@Context` decorator.
