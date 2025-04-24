import { describe, it, expect } from 'vitest';
import { IO } from './io.monad';

describe('IO', () => {
  it('should perform IO actions on a simulated DOM input element.', () => {
    let inputField = 'foo';

    const read = (field: string) => field; // (id: string) => getElementById(id).value
    const toUpperCase = (value: string) => value.toUpperCase();

    // For this test we simulate an id in the DOM was passed.
    const write = (_: string) => (value: string) =>
      IO.of(() => (inputField = value)); // (id: string) => (value: string) => getElementById(id).value = value

    // Our IO.
    const inputToUpper = IO.of(read)
      .map(toUpperCase)
      .flatMap(write(inputField));

    expect(inputToUpper.eval(inputField)).toBe('FOO');
    expect(inputField).toBe('FOO');
  });

  it('should compose and perform IO actions on a simulated DOM input element.', () => {
    let inputField = 'foo';

    const read = (field: string) => IO.of(() => field); // (id: string) => getElementById(id).value
    const toUpperCase = IO.of((value: string) => value.toUpperCase());

    // For this test we simulate an id in the DOM was passed.
    const write = (_: string) => IO.of((value: string) => (inputField = value)); // (id: string) => (value: string) => getElementById(id).value = value

    // Our IO.
    const inputToUpper = IO.compose(
      read(inputField),
      toUpperCase,
      write(inputField)
    );

    expect(inputToUpper.eval(inputField)).toBe('FOO');
    expect(inputField).toBe('FOO');
  });
});
