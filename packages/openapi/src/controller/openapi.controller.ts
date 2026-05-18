import { Assemblage } from 'assemblerjs';
import type { AbstractAssemblage } from 'assemblerjs';
import { Controller, Get } from '@assemblerjs/rest';
import { Hidden } from '../decorators/hidden.decorator';
import { OpenApiGenerator } from '../generator/openapi-generator';

@Hidden()
@Controller({ path: '/openapi' })
@Assemblage()
export class OpenApiController implements AbstractAssemblage {
  constructor(private readonly generator: OpenApiGenerator) {}

  @Get('/json', 'OpenAPI specification (JSON)')
  public getJson(): object {
    return this.generator.generate();
  }
}
