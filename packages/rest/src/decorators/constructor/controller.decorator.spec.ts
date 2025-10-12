import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  AssemblerContext,
} from 'assemblerjs';
import { wait } from '@assemblerjs/core';
import { Dto } from '@assemblerjs/dto';
import { IsString, IsInt } from 'class-validator';
import express, {
  type Request,
  type NextFunction,
  type Response,
} from 'express';
import cookieParser from 'cookie-parser';
import { Controller } from './controller.decorator';
import { Get, Post } from '../methods/http-methods.decorators';
import { ExpressAdapter, WebFrameworkAdapter } from '@/adapters';
import { HttpStatus, Middleware, Redirect } from '../methods';
import {
  Body,
  Cookie,
  Cookies,
  Param,
  Params,
  Path,
  Queries,
  Query,
  Headers,
  Res,
  Req,
  Next,
} from '../parameters/parameters.decorators';
import { NotFoundError } from '@/errors';
import { HttpHeaders } from '../methods/http-headers.decorator';
import { createCustomParameterDecorator } from '../parameters/create-custom-parameter-decorator';

const beforeMiddleware = vi.fn(
  (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  }
);

const afterMiddleware = vi.fn((result: any, req: Request, res: Response) => {
  expect(result.message).toBe('User created successfully');
  expect(req.method).toBe('POST');
  expect(req.url).toBe('/user/create-user');
  expect(res.statusCode).toBe(201);
  expect(res.getHeader('Content-Type')).toContain('application/json');
});

const OriginalUrl = createCustomParameterDecorator(
  (
    req: Request,
    _res: Response,
    _context: AssemblerContext,
    _identifier?: string
  ) => {
    return req.originalUrl;
  }
);

const CustomParam = createCustomParameterDecorator(
  (
    req: Request,
    _res: Response,
    _context: AssemblerContext,
    identifier: string | undefined
  ) => {
    return req.params[identifier!];
  }
);

const UserById = createCustomParameterDecorator(
  async (
    req: Request,
    _res: Response,
    _context: AssemblerContext,
    identifier: string | undefined
  ) => {
    const userId = req.params[identifier!];

    // Simulate fetching user data from a database or service.
    // In a real application, you would replace this with actual data fetching logic.

    await wait(100); // Simulate a delay for fetching user data.

    return {
      id: userId,
      name: `User ${userId}`,
    };
  }
);

@Dto()
class UserDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}

@Controller({
  path: '/user',
})
@Assemblage()
class MyController implements AbstractAssemblage {
  public path!: string | RegExp;

  constructor() {
    // @Controller decorator wasn't called yet.
    expect(this.path).toBeUndefined();
  }

  public onInited(): void {
    expect(this.path).toBe('/user');
  }

  @Get('/by/:id/:name')
  public getUser(
    @Param('id') id: number,
    @Param('name') name: string
  ): { id: number; name: string } {
    return {
      id,
      name,
    };
  }

  @Get('/non-existent')
  public getNonExistent(): Error {
    throw new NotFoundError('User was not found');
  }

  @Get('/not-modified')
  @HttpStatus(304)
  @HttpHeaders({
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': 'http://localhost:9998',
  })
  @Middleware(beforeMiddleware)
  public getNotModified(@Req() req: Request): any {
    expect(req.method).toBe('GET');
    expect(req.url).toBe('/user/not-modified');

    return { id: 1, name: 'John Doe' };
  }

  @Get('/foo/:bar')
  public getFoo(
    @Param('bar') bar: string,
    @Params() params: Record<string, string>,
    @Query('baz') baz: string,
    @Query('qux') qux: string,
    @Queries() queries: Record<string, string>
  ): { message: string } {
    expect(queries).toStrictEqual({
      baz: 'qux',
      qux: 'ack',
    });

    expect(params).toStrictEqual({
      bar: 'bar',
    });
    return {
      message: `Hello from /foo?bar=${bar}&baz=${baz}&qux=${qux}`,
    };
  }

  @Post('/create-user')
  @Middleware(afterMiddleware, 'after')
  public async createUser(
    @Body() body: Record<string, any>,
    @Path() path: string
  ): Promise<{ message: string }> {
    expect(path).toBe('/user/create-user');
    expect(body).toStrictEqual({ name: 'Jane Doe', age: 30 });
    return { message: 'User created successfully' };
  }

  @Post('/create-user-with-cookie')
  public async createUserWithCookie(
    @Body() body: Record<string, any>,
    @Path() path: string,
    @Cookies() cookies: Record<string, string>,
    @Cookie('sessionId') sessionId: string,
    @Headers() headers: Record<string, string>
  ): Promise<{ message: string }> {
    expect(path).toBe('/user/create-user-with-cookie');
    expect(body).toStrictEqual({ name: 'Jane Doe', age: 30 });
    expect(cookies).toStrictEqual({ sessionId: '12345' });
    expect(sessionId).toBe('12345');
    expect(Object.keys(headers)).toContain('access-control-allow-credentials');
    return {
      message: 'User created successfully with cookie',
    };
  }

  @Post('/create-user-with-dto')
  public async createUserWithDto(
    @Body() body: UserDto,
    @Path() path: string
  ): Promise<{ message: string }> {
    expect(path).toBe('/user/create-user-with-dto');
    expect(body).toBeInstanceOf(UserDto);
    expect(body.name).toBe('Jane Doe');
    expect(body.age).toBe(30);
    return {
      message: 'User created successfully with DTO',
    };
  }

  @Get('/with-response-decorator')
  @HttpHeaders({
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': 'http://localhost:9998',
  })
  public getWithResponseDecorator(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction
  ): void {
    res.on('finish', () => {
      expect(res.statusCode).toBe(200);
      expect(res.getHeader('Content-Type')).toContain('application/json');
    });
    const headers = res.getHeaders();
    expect(headers['access-control-allow-credentials']).toBe('true');
    expect(headers['access-control-allow-origin']).toBe(
      'http://localhost:9998'
    );

    res.json({
      message: `Hello from /with-response-decorator, with: ${req.method} ${
        req.url
      }, ${res.statusCode}, ${typeof next}`,
    });
  }

  @Redirect('/non-existent')
  @Get('/redirect-to-non-existent')
  public redirectToNonExistent() {
    return;
  }

  @Redirect()
  @Get('/redirect-without-location')
  public redirectWithoutLocation(): string {
    return '/non-existent';
  }

  @Redirect('/by/:id/:name')
  @Get('/redirect-with-dynamic-path')
  public redirectWithDynamicPath() {
    return {
      id: 1,
      name: 'John Doe',
    };
  }

  @Get('/custom-decorator')
  public customDecorator(@OriginalUrl() originalUrl: string): {
    message: string;
  } {
    return { message: `Custom decorator called with value: ${originalUrl}` };
  }

  @Get('/custom-param/:id')
  public customParam(
    @CustomParam('id') id: string,
    @OriginalUrl() originalUrl: string,
    @CustomParam('id') id2: string
  ): { message: string } {
    expect(id).toBe('10');
    expect(id2).toBe('10');
    return {
      message: `Custom parameter called with value: ${id}, originalUrl: ${originalUrl}`,
    };
  }

  @Get('/user-by-id/:id')
  public userById(@UserById('id') user: { id: string; name: string }): {
    id: string;
    name: string;
  } {
    expect(user.id).toBe('1');
    expect(user.name).toBe('User 1');
    return user;
  }
}

@Assemblage({
  inject: [[WebFrameworkAdapter, ExpressAdapter], [MyController]],
  global: {
    '@assemblerjs/rest': {
      adapter: WebFrameworkAdapter,
    },
  },
})
class App {
  constructor(
    public server: WebFrameworkAdapter,
    public myController: MyController
  ) {}
  public async onInit(): Promise<void> {
    this.server.app.use(cookieParser());
    this.server.app.use(express.urlencoded({ extended: true }));
    this.server.app.use(express.json());
  }
  public async onInited(): Promise<void> {
    this.server.listen(9998);
  }
}

describe('Controller', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const app = Assembler.build(App);
  it('should initialize controller with correct path', () => {
    expect(app.myController.path).toBe('/user');
  });

  it('should return user data', async () => {
    const user = await fetch('http://localhost:9998/user/by/1/John Doe');
    expect(user.ok).toBeTruthy();

    const data = await user.json();
    expect(data).toStrictEqual({ id: '1', name: 'John Doe' });
  });

  it('should return foo data', async () => {
    const foo = await fetch(
      'http://localhost:9998/user/foo/bar?baz=qux&qux=ack'
    );
    expect(foo.ok).toBeTruthy();

    const data = await foo.json();
    expect(data).toStrictEqual({
      message: 'Hello from /foo?bar=bar&baz=qux&qux=ack',
    });
  });

  it('should create user with body data', async () => {
    const response = await fetch('http://localhost:9998/user/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Jane Doe', age: 30 }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toStrictEqual({ message: 'User created successfully' });
    expect(afterMiddleware).toHaveBeenCalledOnce();
  });

  it('should create user with cookie', async () => {
    const response = await fetch(
      'http://localhost:9998/user/create-user-with-cookie',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': 'http://localhost:9998',
          Cookie: 'sessionId=12345',
        },
        body: JSON.stringify({ name: 'Jane Doe', age: 30 }),
      }
    );

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toStrictEqual({
      message: 'User created successfully with cookie',
    });
  });

  it('should create and validate a user with DTO as expected type', async () => {
    const response = await fetch(
      'http://localhost:9998/user/create-user-with-dto',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Jane Doe',
          age: 30,
        }),
      }
    );

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toStrictEqual({
      message: 'User created successfully with DTO',
    });
  });

  it('should fail with user-friendly error when a DTO is requested', async () => {
    const response = await fetch(
      'http://localhost:9998/user/create-user-with-dto',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Jane Doe',
          age: 'thirty',
        }),
      }
    );

    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData.message).toContain('age must be an integer number');
  });

  it('should handle errors gracefully', async () => {
    const response = await fetch('http://localhost:9998/user/non-existent');
    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(404);
    const errorData = await response.json();
    expect(errorData.message).toBe('User was not found');
  });

  it('should return 304 for not modified', async () => {
    const response = await fetch('http://localhost:9998/user/not-modified');
    expect(beforeMiddleware).toHaveBeenCalledOnce();
    expect(response.status).toBe(304);
    expect(response.ok).toBeFalsy();
  });

  it('should handle response decorator', async () => {
    const response = await fetch(
      'http://localhost:9998/user/with-response-decorator'
    );
    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toStrictEqual({
      message:
        'Hello from /with-response-decorator, with: GET /user/with-response-decorator, 200, function',
    });
  });

  it('should redirect to non-existent route with hard-coded path', async () => {
    const response = await fetch(
      'http://localhost:9998/user/redirect-to-non-existent'
    );

    expect(response.redirected).toBeTruthy();
    expect(response.url).toBe('http://localhost:9998/user/non-existent');
    expect(response.status).toBe(404);
  });

  it('should redirect to non-existent route with dynamic path', async () => {
    const response = await fetch(
      'http://localhost:9998/user/redirect-without-location'
    );

    expect(response.redirected).toBeTruthy();
    expect(response.url).toBe('http://localhost:9998/user/non-existent');
    expect(response.status).toBe(404);
  });

  it('should redirect with dynamic path', async () => {
    const response = await fetch(
      'http://localhost:9998/user/redirect-with-dynamic-path'
    );

    expect(response.redirected).toBeTruthy();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toStrictEqual({
      id: '1',
      name: 'John Doe',
    });
  });

  it('should call custom parameter decorator', async () => {
    const response = await fetch('http://localhost:9998/user/custom-decorator');
    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toStrictEqual({
      message: 'Custom decorator called with value: /user/custom-decorator',
    });
  });

  it('should call custom parameter with identifier', async () => {
    const response = await fetch('http://localhost:9998/user/custom-param/10');
    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toStrictEqual({
      message:
        'Custom parameter called with value: 10, originalUrl: /user/custom-param/10',
    });
  });

  it('should call user by id with identifier in custom decorator', async () => {
    const response = await fetch('http://localhost:9998/user/user-by-id/1');
    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toStrictEqual({
      id: '1',
      name: 'User 1',
    });
  });
});
