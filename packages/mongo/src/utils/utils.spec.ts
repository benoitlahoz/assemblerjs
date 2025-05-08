import { describe, it, expect } from 'vitest';
import { whichMongo, whichMongoSync } from './which.utils';

describe('Which', () => {
  it('should check where Mongo is installed.', async () => {
    expect(async () => await whichMongo()).not.toThrow();
    expect(
      typeof whichMongoSync() === 'string' || whichMongoSync() === null
    ).toBeTruthy();
  });
});
