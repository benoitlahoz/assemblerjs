import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { EventManager } from '../src';

// Simple emitter for benchmarking
class EmitterService extends EventManager {
  constructor() {
    super();
  }
}

describe('Event Emission Performance', () => {
  describe('Simple Event Emission', () => {
    bench('Emit with 1 listener', () => {
      // Create emitter and add 1 listener
      const emitter = new EmitterService();
      emitter.on('test', () => { /* listener */ });

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test');
      }
    });

    bench('Emit with 10 listeners', () => {
      // Create emitter and add 10 listeners
      const emitter = new EmitterService();
      for (let j = 0; j < 10; j++) {
        emitter.on('test', () => { /* listener */ });
      }

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test');
      }
    });

    bench('Emit with 50 listeners', () => {
      // Create emitter and add 50 listeners
      const emitter = new EmitterService();
      for (let j = 0; j < 50; j++) {
        emitter.on('test', () => { /* listener */ });
      }

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test');
      }
    });

    bench('Emit with 100 listeners', () => {
      // Create emitter and add 100 listeners
      const emitter = new EmitterService();
      for (let j = 0; j < 100; j++) {
        emitter.on('test', () => { /* listener */ });
      }

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test');
      }
    });
  });

  describe('Wildcard Listeners', () => {
    bench('Emit with 5 wildcard + 5 specific listeners', () => {
      // Create emitter and add 5 wildcard + 5 specific listeners
      const emitter = new EmitterService();
      // 5 wildcard listeners
      for (let i = 0; i < 5; i++) {
        emitter.on('test:*', () => { /* wildcard listener */ });
      }
      // 5 specific listeners
      for (let i = 0; i < 5; i++) {
        emitter.on('data', () => { /* specific listener */ });
      }

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test:event');
      }
    });

    bench('Emit with 20 wildcard listeners', () => {
      // Create emitter and add 20 wildcard listeners
      const emitter = new EmitterService();
      for (let i = 0; i < 20; i++) {
        emitter.on('test:*', () => { /* wildcard listener */ });
      }

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test:event');
      }
    });
  });

  describe('Once vs On Listeners', () => {
    bench('Emit with 10 "on" listeners', () => {
      // Create emitter and add 10 "on" listeners
      const emitter = new EmitterService();
      for (let i = 0; i < 10; i++) {
        emitter.on('test', () => { /* on listener */ });
      }

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test');
      }
    });

    bench('Emit with 10 "once" listeners', () => {
      // Create emitter and add 10 "once" listeners (will only fire once each)
      const emitter = new EmitterService();
      for (let i = 0; i < 10; i++) {
        emitter.once('test', () => { /* once listener */ });
      }

      // Measure 10k emissions (only first emission will trigger listeners)
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test');
      }
    });

    bench('Emit with mixed 5 "on" + 5 "once" listeners', () => {
      // Create emitter and add mixed listeners
      const emitter = new EmitterService();
      for (let i = 0; i < 5; i++) {
        emitter.on('test', () => { /* on listener */ });
      }
      for (let i = 0; i < 5; i++) {
        emitter.once('test', () => { /* once listener */ });
      }

      // Measure 10k emissions
      for (let i = 0; i < 10000; i++) {
        emitter.emit('test');
      }
    });
  });

  describe('Multiple Channels', () => {
    bench('Emit across 10 different channels', () => {
      // Create emitter and add listeners on 10 different channels
      const emitter = new EmitterService();
      for (let i = 1; i <= 10; i++) {
        emitter.on(`chan${i}`, () => { /* listener */ });
      }

      // Measure 10k rounds of emissions across all channels (100k total emissions)
      for (let j = 0; j < 1000; j++) {
        for (let i = 1; i <= 10; i++) {
          emitter.emit(`chan${i}`);
        }
      }
    });
  });
});