import { describe, it, expect } from 'vitest';
import { State } from './state.monad';

describe('State', () => {
  it('should create a `State` with a value, modify it and get it back.', () => {
    const store = State.of(1);

    expect(store.get()).toStrictEqual({
      value: 1,
      stack: [1],
      cursor: 0,
    });

    expect(store.modify(2).get()).toStrictEqual({
      value: 2,
      stack: [2, 1],
      cursor: 0,
    });

    expect(store.modify(4).get()).toStrictEqual({
      value: 4,
      stack: [4, 1],
      cursor: 0,
    });
  });

  it('should chain modification on a `State`.', () => {
    const store = State.of(1);

    expect(store.modify(2).modify(4).get()).toStrictEqual({
      value: 4,
      stack: [4, 2, 1],
      cursor: 0,
    });

    expect(store.modify(2).modify(4).unwrap()).toBe(4);
  });

  it('should map modification on a `State`.', () => {
    const store = State.of(1);

    expect(store.map((value: number) => value * 2).get()).toStrictEqual({
      value: 2,
      stack: [2, 1],
      cursor: 0,
    });
  });

  it('should flatMap modification on a `State`.', () => {
    const store = State.of(1);
    const mapStore = (value: number, stack: number[]) =>
      State.of(value * 2, stack);

    expect(store.flatMap(mapStore).unwrap()).toBe(2);
    expect(store.flatMap(mapStore).get()).toStrictEqual({
      value: 2,
      stack: [2, 1],
      cursor: 0,
    });
  });

  it('should purge state of old values.', () => {
    const store = State.of(1);

    expect(store.modify(2).modify(4).get()).toStrictEqual({
      value: 4,
      stack: [4, 2, 1],
      cursor: 0,
    });

    // Will purge the stack (i.e. return an array with only the current state value as stack).
    expect(store.modify(2).modify(4).purge().get()).toStrictEqual({
      value: 4,
      stack: [4],
      cursor: 0,
    });
  });

  it('should go forward and backward in the state stack.', () => {
    const store = State.of(1);

    expect(store.modify(2).modify(4).backward().get()).toStrictEqual({
      value: 2,
      stack: [4, 2, 1],
      cursor: 1,
    });

    expect(store.modify(2).modify(4).backward().forward().get()).toStrictEqual({
      value: 4,
      stack: [4, 2, 1],
      cursor: 0,
    });

    expect(
      store.modify(2).modify(4).modify(12).modify(24).backward().get()
    ).toStrictEqual({
      value: 12,
      stack: [24, 12, 4, 2, 1],
      cursor: 1,
    });

    expect(
      store.modify(2).modify(4).modify(12).modify(24).backward().unwrap()
    ).toBe(12);

    expect(
      store.modify(2).modify(4).modify(12).modify(24).backward(2).unwrap()
    ).toBe(4);

    // Undo too large in steps: get the first value.
    expect(
      store.modify(2).modify(4).modify(12).modify(24).backward(124).unwrap()
    ).toBe(1);

    // Undo to initial (124 is over the length of the stack) then redo to last value (124 is over the length of the stack):
    // get the last value.
    expect(
      store
        .modify(2)
        .modify(4)
        .modify(12)
        .modify(24)
        .backward(124)
        .forward(124)
        .unwrap()
    ).toBe(24);
  });
});
