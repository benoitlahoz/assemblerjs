import { describe, it, expect } from 'vitest';
import { fail } from 'assert';
import { Either } from '@/monad-like/either.monad';
import { Maybe } from '@/monad-like/maybe.monad';

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

const findUserByName = (name: string): Maybe<User> => {
  return Maybe.of(users.find((user: User) => user.name === name));
};

const findUserAge = (name: string): Maybe<number> => {
  const mayBePerson = findUserByName(name);
  return mayBePerson.map((user: User) => user.age);
};

describe('Maybe', () => {
  it('should instantiate new Maybe object.', () => {
    const mayBeString: Maybe<string> = Maybe.Some('Hello world!');

    expect(mayBeString).toBeDefined();
    expect(mayBeString.isSome()).toBeTruthy();
    expect(mayBeString.isNone()).toBeFalsy();

    const mayBeNone: Maybe<string | null> = Maybe.Some(null);

    expect(mayBeNone).toBeDefined();
    expect(mayBeNone.isSome()).toBeFalsy();
    expect(mayBeNone.isNone()).toBeTruthy();

    const maybeStringFrom: Maybe<string | null> = Maybe.of('Hello world!');
    expect(maybeStringFrom).toBeDefined();
    expect(maybeStringFrom.isSome()).toBeTruthy();
    expect(maybeStringFrom.isNone()).toBeFalsy();

    const maybeNoneFrom: Maybe<string | null> = Maybe.of(null);
    expect(maybeNoneFrom).toBeDefined();
    expect(maybeNoneFrom.isSome()).toBeFalsy();
    expect(maybeNoneFrom.isNone()).toBeTruthy();
  });

  it('should map a function if value in present or return `None`.', () => {
    // Alice has an age.
    expect(findUserAge('Alice').isSome()).toBeTruthy();
    expect(findUserAge('Alice').unwrap()).toBe(35);
    // No age.
    expect(findUserAge('Bob').isNone()).toBeTruthy();
    // No user, no age.
    expect(findUserAge('Jack').isNone()).toBeTruthy();

    const userIsOlderThan =
      (name: string) =>
      (old: number): Maybe<boolean> => {
        const mayBeAge = findUserAge(name);
        return mayBeAge.map((age: number) => age > old);
      };

    const aliceIsOlder = userIsOlderThan('Alice');
    expect(aliceIsOlder(40).isSome()).toBeTruthy();
    expect(aliceIsOlder(40).unwrap()).toBe(false);
    expect(aliceIsOlder(20).isSome()).toBeTruthy();
    expect(aliceIsOlder(20).unwrap()).toBe(true);

    const bobIsOlder = userIsOlderThan('Bob');
    expect(bobIsOlder(40).isNone()).toBeTruthy();
    expect(bobIsOlder(40).unwrap()).toBeInstanceOf(Error);
  });

  it('should compose functions using only chaining.', () => {
    const mayBeAge = (name: string) =>
      findUserByName(name).flatMap((user: User) => Maybe.of(user.age));

    expect(mayBeAge('Alice').unwrapOr(-1)).toBe(users[0].age);
    expect(mayBeAge('Bob').unwrapOr(-1)).toBe(-1);
    expect(mayBeAge('Jack').unwrapOr(-1)).toBe(-1);
  });

  it('should apply default functions or get default value if Maybe is `None`.', () => {
    const maybe = Maybe.of(null);
    expect(maybe.orElse(() => true).isSome()).toBeTruthy();
    expect(maybe.unwrapOr('foo')).toBe('foo');
  });

  it('should convert the `Maybe` to an `Either`.', () => {
    const mayBeString: Maybe<string> = Maybe.Some('Hello world!');
    const mayBeNone: Maybe<string | null> = Maybe.Some(null);

    const eitherString = mayBeString.toEither();
    const resString = eitherString.fold(
      (_) => fail('Should not be called.'),
      (value: string) => {
        expect(value).toBe('Hello world!');
        return value;
      }
    );
    expect(resString).toBe('Hello world!');

    const eitherUndefined = mayBeNone.toEither();
    expect(eitherUndefined.isLeft()).toBeTruthy();
    const resNone = eitherUndefined.fold(
      (err: unknown) => {
        expect(err).toBeDefined();
        return err;
      },
      (_) => fail('Should not be called.')
    );
    expect(resNone).toBeInstanceOf(Error);
    expect(Either.fromMaybe(mayBeNone).isLeft()).toBeTruthy();
  });
});
