import { describe, expect, it } from 'vitest';

import { ListenerCollection } from './listener-collection';

let collection: ListenerCollection;
const channel = 'my.channel';
const listener = () => {};

describe('ListenerCollection.', () => {
  it('should instantiate collection.', () => {
    collection = new ListenerCollection();
    expect(collection).toBeDefined();
  });

  it('should manipulate collection.', () => {
    const ret = collection.add(channel, listener);
    expect(collection.length).toBe(1);
    expect(ret).toEqual(collection);

    collection.clear();
    expect(collection.length).toBe(0);

    collection.add([channel, listener]);
    expect(collection.length).toBe(1);

    collection.clear();
    expect(collection.length).toBe(0);

    collection.add([channel, listener]);
    expect(collection.length).toBe(1);

    collection.remove(channel, listener);
    expect(collection.length).toBe(0);

    collection.add([channel, listener]);
    expect(collection.length).toBe(1);

    expect(collection.has(channel)).toBeTruthy();

    expect(collection.has(listener)).toBeTruthy();
    expect(collection[channel].includes(listener)).toBeTruthy();

    for (const registeredChannel of collection) {
      expect([channel].includes(registeredChannel)).toBeTruthy();
      expect(collection[channel].length).toBe(1);
    }

    collection.remove(channel);
    expect(collection.length).toBe(0);

    collection.add(channel, listener);
    collection.add([channel, listener]);
    expect(collection.length).toBe(2);

    collection.remove(channel, listener);
    expect(collection.length).toBe(1);
    collection.remove(channel, listener);
    expect(collection.length).toBe(0);
  });

  it('should dispose collection.', () => {
    collection.dispose();
    expect(() => console.log(collection.length)).toThrowError();
  });
});
