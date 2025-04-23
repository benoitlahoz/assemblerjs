import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { Request, Response } from 'express';
import { Controller, Get, Post } from '../../../src';
import { UserRepository } from './user.repository';

@Controller({
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
    res.status(200).send(JSON.stringify(users || []));
  }

  @Get('/id/:id')
  public findById(req: Request, res: Response) {
    const user = this.repository.findById(req.params.id);
    if (!user) {
      res.sendStatus(404);
    }
    res.status(200).send(JSON.stringify(user));
  }

  @Get('/gender/:gender')
  public findByGender(req: Request, res: Response) {
    const user = this.repository.findByGender(req.params.gender);
    if (!user) {
      res.sendStatus(404);
    }
    res.status(200).send(JSON.stringify(user));
  }

  @Post('/')
  public create(req: Request, res: Response) {
    const user = this.repository.create(req.body);
    res.status(200).send(JSON.stringify(user));
  }
}
