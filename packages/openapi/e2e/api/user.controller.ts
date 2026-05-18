import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Controller, Get, Post, Delete, Param, Body, HttpStatus } from '@assemblerjs/rest';
import { Hidden, Returns, Throws, Operation } from '../../src';
import { UserDto } from './user.dto';
import { CreateUserDto } from './create-user.dto';

const Users: Array<{ id: number; name: string; gender: string }> = [
  { id: 1, name: 'Alice', gender: 'female' },
  { id: 2, name: 'Bob', gender: 'male' },
];

@Controller({ path: '/users' })
@Assemblage()
export class UserController implements AbstractAssemblage {
  public path!: string | RegExp;

  @Get('/')
  @Operation({ summary: 'List all users' })
  @Returns(200, UserDto, 'Array of users')
  public findAll(): any[] {
    return Users;
  }

  @Get('/:id')
  @Operation({ summary: 'Get a user by id' })
  @Returns(200, UserDto)
  @Throws(404, 'User not found')
  public findById(@Param('id') id: string): any {
    return Users.find((u) => u.id === Number(id)) ?? null;
  }

  @Post('/')
  @HttpStatus(201)
  @Operation({ summary: 'Create a user', description: 'Creates a new user entry.' })
  @Returns(201, UserDto, 'Created user')
  @Throws(400, 'Bad request')
  public create(@Body() body: CreateUserDto): any {
    const newUser = { id: Users.length + 1, ...body };
    Users.push(newUser);
    return newUser;
  }

  @Delete('/:id')
  @Operation({ summary: 'Delete a user' })
  @Returns(200, UserDto, 'Deleted user')
  @Throws(404, 'User not found')
  public remove(@Param('id') id: string): any {
    const idx = Users.findIndex((u) => u.id === Number(id));
    if (idx === -1) return null;
    const [deleted] = Users.splice(idx, 1);
    return deleted;
  }

  @Get('/hidden')
  @Hidden()
  public internalEndpoint(): string {
    return 'not in spec';
  }
}
