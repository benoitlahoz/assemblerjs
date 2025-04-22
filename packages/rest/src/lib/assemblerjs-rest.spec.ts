import 'reflect-metadata';
import { assemblerjsRest } from './assemblerjs-rest.js';

describe('assemblerjsRest', () => {
  it('should work', () => {
    expect(assemblerjsRest()).toEqual('assemblerjs-rest');
  });
});
