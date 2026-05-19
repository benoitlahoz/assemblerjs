import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Body, Controller, Get, Post } from '@assemblerjs/rest';
import {
  AdaptBody,
  DtoMetadataKeys,
  DtoSchemaExtractor,
  ValidateBody,
  createDtoSafe,
} from '../../src';
import {
  CreateUserDto,
  DomainCreateUserDto,
  ExternalCreateUserDto,
} from './dtos';

@Controller({ path: '/dto-e2e' })
@Assemblage()
export class DtoE2EController implements AbstractAssemblage {
  @Post('/validate')
  @ValidateBody(CreateUserDto)
  async validate(@Body() body: CreateUserDto) {
    return body;
  }

  @Post('/adapt')
  @AdaptBody(ExternalCreateUserDto, DomainCreateUserDto, (source) => ({
    fullName: `${source.firstName} ${source.lastName}`,
    age: source.age,
  }))
  async adapt(@Body() body: ExternalCreateUserDto) {
    return body;
  }

  @Post('/safe')
  async safe(@Body() payload: unknown) {
    return createDtoSafe(CreateUserDto, payload);
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
