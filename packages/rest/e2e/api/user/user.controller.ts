import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  Controller,
  Delete,
  Get,
  Head,
  HttpHeaders,
  HttpStatus,
  Param,
  Body,
  Patch,
  Post,
  Put,
} from '../../../src';
import { NotFoundError } from '../../../src/errors';
import { UserRepository } from './user.repository';

@Controller({ path: '/user' })
@Assemblage({
  provide: [[UserRepository]],
})
export class UserController implements AbstractAssemblage {
  public path!: string | RegExp;

  constructor(private repository: UserRepository) {}

  @Get('/')
  public findAll(): any[] {
    return this.repository.findAll();
  }

  @Head('/headers')
  @HttpHeaders({ 'x-powered-by': 'My Super Application' })
  public getApiHeaders(): void {
    // Headers set via @HttpHeaders, body is empty (HEAD).
  }

  @Get('/id/:id')
  public findById(@Param('id') id: string): any {
    const user = this.repository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  @Get('/gender/:gender')
  public findByGender(@Param('gender') gender: string): any[] {
    return this.repository.findByGender(gender);
  }

  @Post('/')
  @HttpStatus(201)
  public create(
    @Body() body: { name: string; gender: string }
  ): any {
    return this.repository.create(body);
  }

  @Put('/replace/:id')
  public replace(
    @Param('id') id: string,
    @Body() body: { name: string; gender: string }
  ): any {
    const user = this.repository.modify(id, body);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  @Patch('/modify/:id')
  public modify(
    @Param('id') id: string,
    @Body() body: { name?: string; gender?: string }
  ): any {
    const user = this.repository.modify(id, body);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  @Delete('/:id')
  public remove(@Param('id') id: string): any {
    const user = this.repository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
