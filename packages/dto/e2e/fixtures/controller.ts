import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Body, Controller, Get, Post } from '@assemblerjs/rest';
import {
  AdaptBody,
  DtoMetadataKeys,
  DtoSchemaExtractor,
  ValidateBody,
  createDtoSafe,
  type DtoDecoratorHooks,
} from '../../src';
import {
  CreateUserDto,
  DomainCreateUserDto,
  ExternalCreateUserDto,
} from './dtos';

@Controller({ path: '/dto-e2e' })
@Assemblage()
export class DtoE2EController implements AbstractAssemblage {
  public static hookCalls: Array<{ type: string; context: unknown }> = [];

  static makeHooks(scope: string): DtoDecoratorHooks {
    return {
      onValidateStart: (context) => {
        DtoE2EController.hookCalls.push({
          type: `${scope}:onValidateStart`,
          context,
        });
      },
      onValidateSuccess: (context) => {
        DtoE2EController.hookCalls.push({
          type: `${scope}:onValidateSuccess`,
          context,
        });
      },
      onValidateFailure: (context) => {
        DtoE2EController.hookCalls.push({
          type: `${scope}:onValidateFailure`,
          context,
        });
      },
      onAdaptStart: (context) => {
        DtoE2EController.hookCalls.push({ type: `${scope}:onAdaptStart`, context });
      },
      onAdaptSuccess: (context) => {
        DtoE2EController.hookCalls.push({
          type: `${scope}:onAdaptSuccess`,
          context,
        });
      },
      onAdaptFailure: (context) => {
        DtoE2EController.hookCalls.push({
          type: `${scope}:onAdaptFailure`,
          context,
        });
      },
    };
  }

  @Post('/validate')
  @ValidateBody(CreateUserDto, {
    hooks: DtoE2EController.makeHooks('validate'),
  })
  async validate(@Body() body: CreateUserDto) {
    return body;
  }

  @Post('/adapt')
  @AdaptBody(
    ExternalCreateUserDto,
    DomainCreateUserDto,
    (source) => ({
      fullName: `${source.firstName} ${source.lastName}`,
      age: source.age,
    }),
    {
      hooks: DtoE2EController.makeHooks('adapt'),
    }
  )
  async adapt(@Body() body: ExternalCreateUserDto) {
    return body;
  }

  @Post('/safe')
  async safe(@Body() payload: unknown) {
    return createDtoSafe(CreateUserDto, payload);
  }

  @Get('/hooks')
  async hooks() {
    const hooks = [...DtoE2EController.hookCalls];
    DtoE2EController.hookCalls.length = 0;
    return hooks;
  }

  @Get('/metadata')
  async metadata() {
    return {
      isCreateUserDto: Reflect.getMetadata(DtoMetadataKeys.IsDto, CreateUserDto) === true,
      isExternalCreateUserDto:
        Reflect.getMetadata(DtoMetadataKeys.IsDto, ExternalCreateUserDto) === true,
    };
  }

  @Get('/schema')
  async schema() {
    return DtoSchemaExtractor.extract(CreateUserDto);
  }
}
