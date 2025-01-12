import { AbstractAssemblage, Assemblage } from '../../../src';

@Assemblage({
  controller: true,
  path: '/api/user',
})
export class UserController implements AbstractAssemblage {}
