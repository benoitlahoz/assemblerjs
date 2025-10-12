import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { BasicController } from '../../src';
import { UserController } from './user/user.controller';
import { PostController } from './posts/post.controller';

@BasicController({
  path: 'api',
})
@Assemblage({
  inject: [[UserController], [PostController]],
})
export class ApiController implements AbstractAssemblage {
  constructor(public users: UserController, public posts: PostController) {}
}
