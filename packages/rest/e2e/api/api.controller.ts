import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Controller } from '../../src';
import { UserController } from './user/user.controller';
import { PostController } from './posts/post.controller';

@Controller({ path: '/api' })
@Assemblage({
  provide: [[UserController], [PostController]],
})
export class ApiController implements AbstractAssemblage {
  public path!: string | RegExp;

  constructor(
    public users: UserController,
    public posts: PostController
  ) {}
}
