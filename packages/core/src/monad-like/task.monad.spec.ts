import { describe, it, expect } from 'vitest';
import { Task } from './task.monad';
import { Lens } from './lens.monad';

// SEE ALSO https://www.linkedin.com/pulse/mapping-future-values-javascript-avoid-promise-nesting-eric-rey

const add = (x: number) =>
  new Promise((resolve) => setTimeout(() => resolve(x + 2), 100));
const multBy2 = (x: number) =>
  new Promise((resolve) => setTimeout(() => resolve(x * 2), 100));
const divBy4 = (x: number) =>
  new Promise((resolve) => setTimeout(() => resolve(x / 4), 100));

const addF = (x: number) =>
  Task.of<number>(
    () => new Promise((resolve) => setTimeout(() => resolve(x + 2), 100))
  );
const multBy2F = () =>
  Task.of<number>(
    (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x * 2), 100))
  );
const divBy4F = () =>
  Task.of<number>(
    (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x / 4), 100))
  );

const fetchJoke = (n: number) => async (): Promise<Response> =>
  await fetch(`https://v2.jokeapi.dev/joke/Any?idRange=${n}`);
const toJson = async (res: Response) => await res.json();
const parseJoke = (json: Record<string, any>) => Lens.of('joke').get(json); // or prop(json)('joke')

const expectedJoke =
  'The glass is neither half-full nor half-empty, the glass is twice as big as it needs to be.';

describe('Task', () => {
  it('should run async functions bound with `map`.', async () => {
    const compute = (value: number) =>
      Task.of(() => add(value))
        .map(multBy2)
        .map(divBy4)
        .fork();

    expect((await compute(1)).unwrap()).toBe(1.5);
  });

  it('should run functions returning `Task` bound with `flatMap`.', async () => {
    const compute = (value: number) =>
      addF(value).flatMap(multBy2F).timeout(250).flatMap(divBy4F).fork();

    expect((await compute(1)).unwrap()).toBe(1.5);
  });

  it('should fetch data from API and abort if timeout was reached.', async () => {
    const getJoke = (
      value: number,
      timeout: number,
      mustInclude: string,
      wait: number
    ) =>
      Task.of(fetchJoke(value))
        .timeout(500)
        .map(toJson)
        // Throw if timeout is reached.
        .timeout(timeout, 'Timeout reached for `toJson`.')
        .map(parseJoke)
        // Throw if the condition is not met.
        .throw(
          (joke: string) => joke.includes(mustInclude),
          `Joke doesn't include '${mustInclude}'`
        )
        .fork(5, wait); // Will retry 5 times, waiting `wait` value between each.

    expect((await getJoke(23, 500, 'glass', 0)).unwrap()).toBe(expectedJoke);
    expect((await getJoke(23, 50, 'glass', 0)).unwrap()).toBeInstanceOf(Error);
    // We wait 500ms between each retry, so data is finally fetched.
    expect((await getJoke(23, 50, 'glass', 500)).unwrap()).toBe(expectedJoke);
    expect((await getJoke(23, 50, 'foo', 0)).unwrap()).toBeInstanceOf(Error);
  });

  it('should compose tasks.', async () => {
    const jsonJoke = Task.of(toJson);
    const pJoke = Task.of(parseJoke);

    const getJoke = (num: number) =>
      Task.compose(Task.of(fetchJoke(num)).timeout(500), jsonJoke, pJoke);

    expect((await getJoke(23).fork()).unwrap()).toBe(expectedJoke);
  });
});
