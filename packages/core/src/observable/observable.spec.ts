import { describe, it, expect, vitest } from 'vitest';
import { observable } from './observable.module';

describe('Observable', () => {
  it('should react to primitive value changes', () => {
    const foo = observable('foo');
    foo.watch((value: string) => {
      expect(value).toBe('bar');
    });

    setTimeout(() => {
      foo.value = 'bar';
    }, 200);
  });

  it('should react to whole object changes', () => {
    const foo = observable({
      foo: 'bar',
    });

    foo.watch((value: any) => {
      expect(value.foo).toBe('baz');
    });

    setTimeout(() => {
      foo.value = { foo: 'baz' };
    }, 200);
  });

  it('should react to call to object method with `patch`', () => {
    const foo = observable({
      tracks: <string[]>[],
      addTrack(value: string) {
        this.tracks.push(value);
        expect(this.tracks.includes(value)).toBeTruthy();
      },
    }).patch('addTrack');

    const callback = vitest.fn().mockImplementation((value: any) => {
      expect(value.tracks.includes('bar')).toBeTruthy();
    });
    foo.watch(callback);

    foo.value.addTrack('bar');
    expect(callback).toHaveBeenCalledOnce();
    /*
    setTimeout(() => {
      console.log('SET IT');
      foo.value = { foo: 'baz' } as any;
    }, 200);
    */
  });
});
