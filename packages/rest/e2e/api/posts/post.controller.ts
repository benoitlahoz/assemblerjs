import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { Request, Response } from 'express';
import { BasicController, Delete, Get, Post } from '../../../src';
import { PostRepository } from './post.repository';

@BasicController({
  path: '/post',
})
@Assemblage({
  inject: [[PostRepository]],
})
export class PostController implements AbstractAssemblage {
  constructor(private repository: PostRepository) {}

  @Get('/')
  public findAll(_req: Request, res: Response) {
    const posts = this.repository.findAll();
    res.status(200).send(JSON.stringify(posts || []));
  }

  @Get('/sender/:id')
  public findBySender(req: Request, res: Response) {
    const posts = this.repository.findBySender(Number(req.params.id));
    if (!posts) {
      res.sendStatus(404);
    }
    res.status(200).send(JSON.stringify(posts));
  }

  @Get('/receiver/:id')
  public findByReceiver(req: Request, res: Response) {
    const posts = this.repository.findByReceiver(Number(req.params.id));
    if (!posts) {
      res.sendStatus(404);
    }
    res.status(200).send(JSON.stringify(posts));
  }

  @Post('/')
  public create(req: Request, res: Response) {
    const post = this.repository.create(req.body);
    res.status(201).send(JSON.stringify(post));
  }

  @Delete('/delete/:id')
  public delete(req: Request, res: Response) {
    const deleted = this.repository.delete(Number(req.params.id));
    if (deleted) {
      res.status(200).send(JSON.stringify(deleted));
    }
    res.sendStatus(404);
  }
}
