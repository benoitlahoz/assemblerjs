import { Assemblage, AbstractAssemblage, Configuration } from 'assemblerjs';
import { OpenApiGenerator } from '../generator/openapi-generator';
import type { OpenApiGeneratorOptions } from '../generator/openapi-generator';
import { OpenApiController } from '../controller/openapi.controller';

export abstract class AbstractOpenApiModule implements AbstractAssemblage {}

@Assemblage({
  provide: [
    [OpenApiController],
    [OpenApiGenerator],
  ],
})
export class OpenApiModule implements AbstractOpenApiModule {
  constructor(
    @Configuration() private readonly config: OpenApiGeneratorOptions,
    private readonly generator: OpenApiGenerator,
    protected readonly controller: OpenApiController
  ) {}

  public onInit(): void {
    this.generator.configure(this.config);
  }
}
