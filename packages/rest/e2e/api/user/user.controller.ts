import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { NextFunction, Request, Response } from 'express';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Head,
  Middleware,
} from '../../../src';
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
    const user = this.repository.findById(req.params.id);
    if (!user) {
      res.sendStatus(404);
    }
    res.status(200).send(JSON.stringify(user));
  }

  @Middleware((req: Request, res: Response, next?: NextFunction) => {
    // Add a test property to the request to check if the middleware was executed.
    (req as any).__test__ = true;
    if (next) next();
  })
  @Get('/gender/:gender')
  public findByGender(req: Request, res: Response) {
    const user = this.repository.findByGender(req.params.gender);
    if (!user) {
      res.sendStatus(404);
    }
    res.status(200).send(
      JSON.stringify({
        ...user,
        test: (req as any).__test__, // This should be true if the middleware was executed.
      })
    );
  }

  @Post('/')
  public create(req: Request, res: Response) {
    const user = this.repository.create(req.body);
    res.status(201).send(JSON.stringify(user));
  }

  @Put('/replace/:id')
  public replace(req: Request, res: Response) {
    const user = this.repository.modify(req.params.id, req.body);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(JSON.stringify(user));
  }

  @Patch('/modify/:id')
  public modify(req: Request, res: Response) {
    const user = this.repository.modify(req.params.id, req.body);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(JSON.stringify(user));
  }
  /*
  @All('/')
  public unsupportedMethod(req: Request, res: Response) {
    console.log('Unsupported', req.method);
    res.sendStatus(405);
  }
  */
}
