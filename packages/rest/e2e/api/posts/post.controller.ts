import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Body,
  Post,
} from '../../../src';
import { NotFoundError } from '../../../src/errors';
import { PostRepository } from './post.repository';

@Controller({ path: '/post' })
@Assemblage({
  provide: [[PostRepository]],
})
export class PostController implements AbstractAssemblage {
  public path!: string | RegExp;

  constructor(private repository: PostRepository) {}

  @Get('/')
  public findAll(): any[] {
    return this.repository.findAll();
  }

  @Get('/sender/:id')
  public findBySender(@Param('id') id: string): any[] {
    return this.repository.findBySender(Number(id));
  }

  @Get('/receiver/:id')
  public findByReceiver(@Param('id') id: string): any[] {
    return this.repository.findByReceiver(Number(id));
  }

  @Post('/')
  @HttpStatus(201)
  public create(
    @Body() body: { sender: number; receiver: number; content: string }
  ): any {
    return this.repository.create(body);
  }

  @Delete('/delete/:id')
  public delete(@Param('id') id: string): any {
    const deleted = this.repository.delete(Number(id));
    if (!deleted) throw new NotFoundError('Post not found');
    return deleted;
  }
}
