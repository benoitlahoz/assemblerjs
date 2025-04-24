import { describe, it, expect } from 'vitest';
import { fail } from 'assert';
import { Either } from './either.monad';
import { Result } from './result.monad';

const errors: Error[] = [];

interface User {
  name: string;
  age?: number;
}
const users: User[] = [
  {
    name: 'Alice',
    age: 35,
  },
  {
    name: 'Bob',
  },
];

const userByName = (name: string): User => {
  const found = users.find((user: User) => user.name === name);
  if (found) return found;
  throw new Error(`No user with name '${name}'`);
};

const userAgePassingParam = (prefix: string) => (user: User) => {
  if (typeof user.age !== 'undefined') return `${prefix} ${user.age}`;
  throw new Error(`User age is not defined.`);
};

const getUserByName = (value: string): Result<User> =>
  // Will call a try... catch... on this function.
  Result.of(userByName)(value);

const getUserAgePassingParam =
  (prefix: string) =>
  (user: User): Result<string> =>
    Result.of(userAgePassingParam(prefix))(user);

const leftIfError = (result: string): Either<Error, string> => {
  return Either.of<Error, string>(result);
};

describe('Result', () => {
  it('should define a `Result`, catch errors and recover (fold).', () => {
    const resultThrowing = Result.of(() => {
      throw new Error('The result is an error.');
    });
    expect(resultThrowing().isFailure()).toBeTruthy();

    resultThrowing().fold(
      (err: Error) => {
        expect(err).toBeInstanceOf(Error);
        errors.push(err);
      },
      (_: any) => fail('Should not be called.')
    );
    expect(errors[0]).toBeInstanceOf(Error);
    expect(errors.map((e: Error) => e.message)).toContain(
      'The result is an error.'
    );

    const resultNotThrowing = Result.of((): boolean => false);
    expect(resultNotThrowing().isSuccess()).toBeTruthy();

    resultNotThrowing().fold(
      (_: any) => fail('Should not be called.'),
      (value: boolean) => expect(value).toBeFalsy()
    );
  });

  it('should compose functions and return a `Result`.', () => {
    const resultIfTrue = (value: boolean) => {
      if (value === true) return true;
      throw new Error('Not true.');
    };
    const output = (): string => 'success';

    const resultWithValue = Result.compose(resultIfTrue, output);
    expect(resultWithValue(true).isSuccess()).toBeTruthy();
    expect(resultWithValue(true).unwrap()).toBe('success');
    expect(resultWithValue(false).isFailure).toBeTruthy();
  });

  it('should map and flatMap `Result` from a function to another.', () => {
    expect(
      getUserByName('Alice')
        .flatMap(getUserAgePassingParam('User age is'))
        .unwrap()
    ).toBe('User age is 35');

    // Unflatten map passed with a function returning a primitive value or throwing.
    expect(
      getUserByName('Alice').map(userAgePassingParam('User age is')).unwrap()
    ).toBe('User age is 35');

    // Using flatMap, we get the final error: age is undefined on Bob.
    expect(
      getUserByName('Bob')
        .flatMap(getUserAgePassingParam('User age is'))
        .isSuccess()
    ).toBeFalsy();

    // map: the first call returned `true`: Bob exists.
    // Error on age is nested in the result.
    expect(
      getUserByName('Bob')
        .map(getUserAgePassingParam('User age is'))
        .isSuccess()
    ).toBeTruthy();

    // When flatten, we find the last error.
    expect(
      getUserByName('Bob')
        .map(getUserAgePassingParam('User age is'))
        .flatten()
        .unwrap()
    ).toBeInstanceOf(Error);

    expect(
      getUserByName('Bob')
        .flatMap(getUserAgePassingParam('User age is'))
        .unwrap()
    ).toBeInstanceOf(Error);

    const formatAge = (name: string, prefix: string) =>
      getUserByName(name).flatMap(getUserAgePassingParam(prefix));

    expect(formatAge('Alice', 'Alice age is').isSuccess()).toBeTruthy();
    expect(formatAge('Alice', 'Alice age is').unwrap()).toBe('Alice age is 35');
    expect(formatAge('Bob', 'Bob age is').isSuccess()).toBeFalsy();
  });

  it('should convert to `Maybe` and  `Either`.', () => {
    // Folds a `Result` as an `Either`.
    getUserByName('Alice')
      .flatMap(getUserAgePassingParam('User age is'))
      .toEither()
      .fold(
        (_: unknown) => fail('Should not be called'),
        (result: string) => expect(result).toBe('User age is 35')
      );

    // Calls intermediate function to demonstrate we work on `Either` after `toEither` has been called.
    getUserByName('Alice')
      .flatMap(getUserAgePassingParam('User age is'))
      .toEither()
      .flatMap(leftIfError)
      .fold(
        (_: unknown) => fail('Should not be called'),
        (result: string) => expect(result).toBe('User age is 35')
      );

    // User age is undefined.
    getUserByName('Bob')
      .flatMap(getUserAgePassingParam('User age is'))
      .toEither()
      .flatMap(leftIfError)
      .fold(
        (err: unknown) => expect(err).toBeInstanceOf(Error),
        (_: unknown) => fail('Should not be called')
      );

    // User age is undefined.
    getUserByName('Bob')
      .flatMap(getUserAgePassingParam('User age is'))
      .toEither()
      .fold(
        (err: unknown) => expect(err).toBeInstanceOf(Error),
        (_: unknown) => fail('Should not be called')
      );

    // User doesn't exist.
    getUserByName('Jack')
      .flatMap(getUserAgePassingParam('User age is'))
      .toEither()
      .fold(
        (err: unknown) => expect(err).toBeInstanceOf(Error),
        (_: unknown) => fail('Should not be called')
      );

    expect(
      getUserByName('Alice')
        .flatMap(getUserAgePassingParam('User age is'))
        .toMaybe()
        .isSome()
    ).toBeTruthy();

    expect(
      getUserByName('Bob')
        .flatMap(getUserAgePassingParam('User age is'))
        .toMaybe()
        .isNone()
    ).toBeTruthy();
  });
});
