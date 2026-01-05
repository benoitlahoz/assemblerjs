import type { AssemblerContext, AssemblerPrivateContext } from '../model/types';
import type { Assembler } from './assembler';

export class ContextProvider {
  constructor(private assembler: Assembler) {}

  public createPublicContext(): AssemblerContext {
    return {
      has: this.assembler.has.bind(this.assembler),
      require: this.assembler.require.bind(this.assembler),
      concrete: this.assembler.concrete.bind(this.assembler),
      tagged: this.assembler.tagged.bind(this.assembler),
      dispose: this.assembler.dispose.bind(this.assembler),
      global: this.assembler.global.bind(this.assembler),
      on: this.assembler.on.bind(this.assembler),
      once: this.assembler.once.bind(this.assembler),
      off: this.assembler.off.bind(this.assembler),
      events: this.assembler.channels,
    };
  }

  public createPrivateContext(publicContext: AssemblerContext): AssemblerPrivateContext {
    return {
      ...publicContext,
      register: this.assembler.register.bind(this.assembler),
      use: this.assembler.use.bind(this.assembler),
      addGlobal: this.assembler.addGlobal.bind(this.assembler),
      prepareInitHook: this.assembler.prepareInitHook.bind(this.assembler),
      emit: this.assembler.emit.bind(this.assembler),
      addChannels: this.assembler.addChannels.bind(this.assembler),
      removeChannels: this.assembler.removeChannels.bind(this.assembler),
    };
  }
}