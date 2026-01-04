import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, EventManager } from '../src';

// Global event services for realistic benchmarking
@Assemblage({
  events: ['test', 'data', 'async'],
})
class EmitterService extends EventManager implements AbstractAssemblage {
  constructor() {
    super();
  }
}

// Listener services with different numbers of listeners
@Assemblage({
  inject: [[EmitterService]],
})
class SingleListenerService implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {
    this.emitter.on('test', () => { /* listener */ });
  }
}

@Assemblage({
  inject: [[EmitterService]],
})
class TenListenersService implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {
    for (let i = 0; i < 10; i++) {
      this.emitter.on('test', () => { /* listener */ });
    }
  }
}

@Assemblage({
  inject: [[EmitterService]],
})
class FiftyListenersService implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {
    for (let i = 0; i < 50; i++) {
      this.emitter.on('test', () => { /* listener */ });
    }
  }
}

@Assemblage({
  inject: [[EmitterService]],
})
class HundredListenersService implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {
    for (let i = 0; i < 100; i++) {
      this.emitter.on('test', () => { /* listener */ });
    }
  }
}

// Applications with different listener configurations
@Assemblage({
  inject: [[EmitterService], [SingleListenerService]],
})
class SingleListenerApp implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {}

  emitTest() {
    this.emitter.emit('test');
  }
}

@Assemblage({
  inject: [[EmitterService], [TenListenersService]],
})
class TenListenersApp implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {}

  emitTest() {
    this.emitter.emit('test');
  }
}

@Assemblage({
  inject: [[EmitterService], [FiftyListenersService]],
})
class FiftyListenersApp implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {}

  emitTest() {
    this.emitter.emit('test');
  }
}

@Assemblage({
  inject: [[EmitterService], [HundredListenersService]],
})
class HundredListenersApp implements AbstractAssemblage {
  constructor(private emitter: EmitterService) {}

  emitTest() {
    this.emitter.emit('test');
  }
}

describe('Event Emission Performance', () => {
  describe('Simple Event Emission', () => {
    bench('Emit with 1 listener', () => {
      const app = Assembler.build(SingleListenerApp);
      app.emitTest();
    });

    bench('Emit with 10 listeners', () => {
      const app = Assembler.build(TenListenersApp);
      app.emitTest();
    });

    bench('Emit with 50 listeners', () => {
      const app = Assembler.build(FiftyListenersApp);
      app.emitTest();
    });

    bench('Emit with 100 listeners', () => {
      const app = Assembler.build(HundredListenersApp);
      app.emitTest();
    });
  });

  describe('Wildcard Listeners', () => {
    bench('Emit with 5 wildcard + 5 specific listeners', () => {
      // Create services with wildcard listeners for this specific test
      @Assemblage({
        events: ['test:*', 'data'],
      })
      class WildcardEmitterService extends EventManager implements AbstractAssemblage {
        constructor() {
          super();
        }
      }

      @Assemblage({
        inject: [[WildcardEmitterService]],
      })
      class WildcardListenerService implements AbstractAssemblage {
        constructor(private emitter: WildcardEmitterService) {
          // 5 wildcard listeners
          for (let i = 0; i < 5; i++) {
            this.emitter.on('test:*', () => { /* wildcard listener */ });
          }
          // 5 specific listeners
          for (let i = 0; i < 5; i++) {
            this.emitter.on('data', () => { /* specific listener */ });
          }
        }
      }

      @Assemblage({
        inject: [[WildcardEmitterService], [WildcardListenerService]],
      })
      class WildcardApp implements AbstractAssemblage {
        constructor(private emitter: WildcardEmitterService) {}

        emitTest() {
          this.emitter.emit('test:event');
        }
      }

      const app = Assembler.build(WildcardApp);
      app.emitTest();
    });

    bench('Emit with 20 wildcard listeners', () => {
      @Assemblage({
        events: ['test:*'],
      })
      class WildcardEmitterService extends EventManager implements AbstractAssemblage {
        constructor() {
          super();
        }
      }

      @Assemblage({
        inject: [[WildcardEmitterService]],
      })
      class ManyWildcardListenersService implements AbstractAssemblage {
        constructor(private emitter: WildcardEmitterService) {
          for (let i = 0; i < 20; i++) {
            this.emitter.on('test:*', () => { /* wildcard listener */ });
          }
        }
      }

      @Assemblage({
        inject: [[WildcardEmitterService], [ManyWildcardListenersService]],
      })
      class ManyWildcardApp implements AbstractAssemblage {
        constructor(private emitter: WildcardEmitterService) {}

        emitTest() {
          this.emitter.emit('test:event');
        }
      }

      const app = Assembler.build(ManyWildcardApp);
      app.emitTest();
    });
  });

  describe('Once vs On Listeners', () => {
    bench('Emit with 10 "on" listeners', () => {
      @Assemblage({
        events: ['test'],
      })
      class OnEmitterService extends EventManager implements AbstractAssemblage {
        constructor() {
          super();
        }
      }

      @Assemblage({
        inject: [[OnEmitterService]],
      })
      class OnListenersService implements AbstractAssemblage {
        constructor(private emitter: OnEmitterService) {
          for (let i = 0; i < 10; i++) {
            this.emitter.on('test', () => { /* on listener */ });
          }
        }
      }

      @Assemblage({
        inject: [[OnEmitterService], [OnListenersService]],
      })
      class OnApp implements AbstractAssemblage {
        constructor(private emitter: OnEmitterService) {}

        emitTest() {
          this.emitter.emit('test');
        }
      }

      const app = Assembler.build(OnApp);
      app.emitTest();
    });

    bench('Emit with 10 "once" listeners', () => {
      @Assemblage({
        events: ['test'],
      })
      class OnceEmitterService extends EventManager implements AbstractAssemblage {
        constructor() {
          super();
        }
      }

      @Assemblage({
        inject: [[OnceEmitterService]],
      })
      class OnceListenersService implements AbstractAssemblage {
        constructor(private emitter: OnceEmitterService) {
          for (let i = 0; i < 10; i++) {
            this.emitter.once('test', () => { /* once listener */ });
          }
        }
      }

      @Assemblage({
        inject: [[OnceEmitterService], [OnceListenersService]],
      })
      class OnceApp implements AbstractAssemblage {
        constructor(private emitter: OnceEmitterService) {}

        emitTest() {
          this.emitter.emit('test');
        }
      }

      const app = Assembler.build(OnceApp);
      app.emitTest();
    });

    bench('Emit with mixed 5 "on" + 5 "once" listeners', () => {
      @Assemblage({
        events: ['test'],
      })
      class MixedEmitterService extends EventManager implements AbstractAssemblage {
        constructor() {
          super();
        }
      }

      @Assemblage({
        inject: [[MixedEmitterService]],
      })
      class MixedListenersService implements AbstractAssemblage {
        constructor(private emitter: MixedEmitterService) {
          for (let i = 0; i < 5; i++) {
            this.emitter.on('test', () => { /* on listener */ });
            this.emitter.once('test', () => { /* once listener */ });
          }
        }
      }

      @Assemblage({
        inject: [[MixedEmitterService], [MixedListenersService]],
      })
      class MixedApp implements AbstractAssemblage {
        constructor(private emitter: MixedEmitterService) {}

        emitTest() {
          this.emitter.emit('test');
        }
      }

      const app = Assembler.build(MixedApp);
      app.emitTest();
    });
  });

  describe('Multiple Channels', () => {
    bench('Emit across 10 different channels', () => {
      @Assemblage({
        events: ['chan1', 'chan2', 'chan3', 'chan4', 'chan5', 'chan6', 'chan7', 'chan8', 'chan9', 'chan10'],
      })
      class MultiChannelEmitterService extends EventManager implements AbstractAssemblage {
        constructor() {
          super();
        }
      }

      @Assemblage({
        inject: [[MultiChannelEmitterService]],
      })
      class MultiChannelListenersService implements AbstractAssemblage {
        constructor(private emitter: MultiChannelEmitterService) {
          for (let i = 1; i <= 10; i++) {
            this.emitter.on(`chan${i}`, () => { /* listener */ });
          }
        }
      }

      @Assemblage({
        inject: [[MultiChannelEmitterService], [MultiChannelListenersService]],
      })
      class MultiChannelApp implements AbstractAssemblage {
        constructor(private emitter: MultiChannelEmitterService) {}

        emitTest() {
          for (let i = 1; i <= 10; i++) {
            this.emitter.emit(`chan${i}`);
          }
        }
      }

      const app = Assembler.build(MultiChannelApp);
      app.emitTest();
    });
  });
});