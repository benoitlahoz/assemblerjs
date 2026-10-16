import { Assembler } from 'assemblerjs';
import { ActionKit as ActionKitAssemblage } from '.';

class ActionKitClass {
  constructor(debug = false) {
    Assembler.enableDebug({
      enabled: debug,
      logPhases: {
        hooks: false,
        registration: false,
      },
      detectCycles: true,
    });
    return Assembler.build(ActionKitAssemblage);
  }
}

export const ActionKit = ActionKitClass as unknown as new (debug?: boolean) => ActionKitAssemblage;
