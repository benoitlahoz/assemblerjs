# @assemblerjs/fetch

Lightweight TypeScript decorators to attach HTTP request behavior to class methods for AssemblerJS.

This package provides a single method decorator `Fetch` plus a few parameter decorators and a `Parse` method decorator. The `Fetch` decorator builds a request URL using parameter decorators, resolves dynamic headers and body (functions are supported), performs a `fetch` call, parses the response (using an optional `@Parse` hint), and finally calls the original method with the network result appended to the arguments.

This README documents the public behaviour implemented in `src/decorators/*` and illustrated by the tests in `src/decorators/decorator.spec.ts`.

## Install

```bash
npm install @assemblerjs/fetch
# or
yarn add @assemblerjs/fetch
```

## Public API

All exports are re-exported from `src/decorators/index.ts`.

- `Fetch(method: string, path: string, options?: FetchOptions, debug?: boolean): MethodDecorator`
- `Query(name: string | symbol): ParameterDecorator`
- `Param(name: string | symbol): ParameterDecorator`
- `Placeholder(token: string | symbol): ParameterDecorator`
- `Body(): ParameterDecorator`
- `Parse(type: ResponseMethod): MethodDecorator`

Types (high level):

- `FetchOptions` — same as `RequestInit` except:
  - `headers?: HeadersInit | ((target: any) => HeadersInit | Promise<HeadersInit>)`
  - `body?: FetchResult['body'] | ((target: any) => FetchResult['body'] | Promise<FetchResult['body']>)`
- `ResponseMethod` — string union for response parsers: `'text' | 'json' | 'blob' | 'arrayBuffer' | 'bytes' | 'formData'` (see `Parse` decorator)
- `FetchStatus` — { code: number; text: string }

See the source types in `src/decorators/fetch.decorator.ts` for full definitions.

## Behaviour overview

- `Fetch` constructs a request pipeline composed of small transformation steps:
  1. Resolve initial body: if `options.body` is provided it is used (and may be a function invoked with the class instance), otherwise the body is taken from the method arguments after all decorated parameters.
  2. Resolve placeholders (`@Placeholder`) — these are replaced before param substitution.
  3. Resolve path parameters (`@Param`) — `:name` tokens are replaced by the corresponding argument value.
  4. Resolve query parameters (`@Query`) — the library serializes decorated arguments into the URL query string.
  5. Resolve headers: if `options.headers` is a function it is invoked with the class instance and awaited.
  6. Await `body` if it is async, then call global `fetch(resolvedPath, { ...options, method, body })`.
  7. If the response is not `ok`, an `Error` is attached to the result (but the decorator still continues to parse the body).
  8. Parse the response body using either the `@Parse` hint (registered `ResponseMethod`) or the unknown-type parser. The helpers used by the decorator are `parseResponseWithType` and `parseResponseWithUnknownType` (implementation in `src/utils`).
  9. Finally the original method implementation is invoked with the original arguments (with `undefined` inserted for missing optional decorated params) and the following extra arguments appended: `data, error, status, finalPath`.

Important notes derived from the implementation and tests:

- `@Body` can be used to explicitly select which method argument becomes the request body.
- If `@Body` is not used, the body is either:
  - Provided via `options.body` when applying `@Fetch` (value or function), or
  - Inferred from the method arguments: the first non-decorated argument after all decorated parameters is used as the body for methods that typically carry a body (POST, UPDATE, PATCH, PUT).
- `@Param` values are replaced into the path; if you pass a parameter name without a leading `:`, the decorator ensures it matches `:name` in the path.
- `@Placeholder` accepts arbitrary tokens (e.g. `%kind`) and replaces them before `@Param` substitution; when the argument is `undefined`, the placeholder token is removed from the path.
- `@Query` accepts a name and maps the argument at the decorated index to a query parameter. Arrays are joined with commas.
- Headers and body may be synchronous values or functions that receive the class instance; functions may return a Promise.
- The decorator uses the global `fetch` available at runtime. There is no built-in dependency injection for an alternate fetch implementation in the code — for Node you should polyfill `global.fetch` (e.g. `node-fetch` or `undici`) before using the decorator.

## Examples (taken from tests)

```ts
import { Body, Fetch, Query, Param, Placeholder, Parse } from '@assemblerjs/fetch';

const apiHost = 'https://dummyjson.com';

class MyDummyUsersService {
  @Fetch('get', `${apiHost}/users`, { mode: 'no-cors' })
  @Parse('json')
  public async getUsers(
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    @Query('select') select?: string[],
    data?: any,
    err?: Error
  ) {
    // Decorator will append parsed `data` and `err` to call.
    if (data && !err) return data;
    throw err;
  }

  @Fetch('get', `${apiHost}/users/:id/carts`)
  public async getUserCart(@Param('id') id: number, data?: any) {
    if (data) return data;
  }

  @Fetch('get', `${apiHost}/users/:id/%kind`)
  public async getSomethingFromUser(
    @Param(':id') id: number,
    @Placeholder('%kind') kind?: string,
    data?: any
  ) {
    return data;
  }

  @Fetch('post', `${apiHost}/users/add`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } })
  public addUser(body: string, data?: any) {
    if (data) return data;
  }

  @Fetch('post', `${apiHost}/users/add`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } })
  public addUserWithBodyDecorator(@Body() body: string, data?: any) {
    if (data) return data;
  }

  @Fetch('post', `${apiHost}/users/add`, {
    headers: (target) => ({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Random-Number': String(target.getRandomNumber()),
    }),
    body: (target) => JSON.stringify({ firstName: 'Dynamic', lastName: 'Header', age: 42 })
  })
  public async addDynamicUser(data?: any) {
    return data;
  }
}

const svc = new MyDummyUsersService();
await svc.getUsers(10, 0); // query params appended
await svc.getUserCart(6); // path param replaced
await svc.addUser(JSON.stringify({ firstName: 'Owen' })); // body inferred
await svc.addUserWithBodyDecorator(JSON.stringify({ firstName: 'Body' })); // body selected with @Body
```

## Return/invocation shape

When the decorator invokes the original method it appends four additional arguments at the end of the call:

1. `data` — parsed response body (any)
2. `error` — Error instance if `fetch` returned non-ok status or if an internal error occurred
3. `status` — `{ code: number, text: string }`
4. `finalPath` — the final resolved URL used for the request

So if your original method signature is `(...args)`, the decorator will call `original.apply(this, [...resolvedArgs, data, error, status, finalPath])`.

## Error handling

- If `fetch` returns a non-ok response, the decorator will set an `Error` on the `error` variable but still attempt to parse the response body.
- The decorated method can either throw the `error` or return `data` if appropriate (see tests for examples).

## Tests & utilities

- The tests under `src/decorators/decorator.spec.ts` illustrate expected behaviour and provide usage examples against `https://dummyjson.com`.
- Utility functions used by the decorator (response parsers and method registration) are in `src/utils` and are referenced by the tests (e.g. registering response method names for mime types).

## Contributing

- Open a PR with tests for new behaviour in `src/decorators/decorator.spec.ts`.
- Keep the parameter decorators and `Fetch` behaviour consistent: parameter decorators (`Query`, `Param`, `Placeholder`) must continue to populate the parameter metadata used by `Fetch`.

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
