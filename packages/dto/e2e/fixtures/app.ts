import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Dispose,
} from 'assemblerjs';
import { AbstractHttpAdapter } from '@assemblerjs/rest';
import { ExpressAdapter } from '@assemblerjs/rest/express';
import { DtoE2EController } from './controller';
import { DtoE2EClient } from './client';

export const DTO_E2E_PORT = 10032;

@Assemblage({
  provide: [[AbstractHttpAdapter, ExpressAdapter], [DtoE2EController], [DtoE2EClient]],
})
class DtoE2EApp implements AbstractAssemblage {
  constructor(
    public server: AbstractHttpAdapter,
    public controller: DtoE2EController,
    public client: DtoE2EClient,
    @Dispose() public dispose: () => Promise<void>
  ) {}

  async onInited(): Promise<void> {
    this.server.listen(DTO_E2E_PORT);
    this.client.baseUrl = `http://localhost:${DTO_E2E_PORT}`;
  }
}

export const buildDtoE2EApp = () => Assembler.build(DtoE2EApp);

export const waitForDtoE2EServer = async () => {
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 150);
  });
};
