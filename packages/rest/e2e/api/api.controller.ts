import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Controller } from '../../src';
import { UserController } from './user/user.controller';

@Controller({
  path: 'api',
})
@Assemblage({
  inject: [[UserController]],
})
export class ApiController implements AbstractAssemblage {
  constructor(public users: UserController) {}
}
