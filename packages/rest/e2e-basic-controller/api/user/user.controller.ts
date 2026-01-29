import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { Request, Response } from 'express';
import { BasicController, Get, Post, Put, Patch, Head } from '../../../src';
import { UserRepository } from './user.repository';

@BasicController({
  path: '/user',
})
@Assemblage({
  inject: [[UserRepository]],
})
export class UserController implements AbstractAssemblage {
  constructor(private repository: UserRepository) {}

  @Get('/')
  public findAll(_req: Request, res: Response) {
    const users = this.repository.findAll();
    res.status(200).json(Array.isArray(users) ? users : []);
  }

  @Head('/headers')
  public getApiHeaders(_req: Request, res: Response) {
    res
      .set({
        'x-powered-by': 'My Super Application',
      })
      .sendStatus(200);
  }

  @Get('/id/:id')
  public findById(req: Request, res: Response) {
    const id = String(req.params.id).trim();
    const user = this.repository.findById(id);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.status(200).json(user);
  }

  @Get('/gender/:gender')
  public findByGender(req: Request, res: Response) {
    const gender = String(req.params.gender).trim();
    const user = this.repository.findByGender(gender);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.status(200).json(user);
  }

  @Post('/')
  public create(req: Request, res: Response) {
    const user = this.repository.create(req.body);
    res.status(201).json(user);
  }

  @Put('/replace/:id')
  public replace(req: Request, res: Response) {
    const id = String(req.params.id).trim();
    const user = this.repository.modify(id, req.body);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.status(200).json(user);
  }

  @Patch('/modify/:id')
  public modify(req: Request, res: Response) {
    const id = String(req.params.id).trim();
    const user = this.repository.modify(id, req.body);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.status(200).json(user);
  }
  /*
  @All('/')
  public unsupportedMethod(req: Request, res: Response) {
    console.log('Unsupported', req.method);
    res.sendStatus(405);
  }
  */
}
