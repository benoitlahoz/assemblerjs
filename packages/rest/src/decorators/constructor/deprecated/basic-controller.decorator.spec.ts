import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { AbstractAssemblage, Assemblage, Assembler } from 'assemblerjs';
import { BasicController } from './basic-controller.decorator';
import { Get } from '../../methods/http-methods.decorators';
import { ExpressAdapter, WebFrameworkAdapter } from '@/adapters';

@BasicController({
  path: '/user',
})
@Assemblage({
  singleton: false, // Will be overridden: controllers are singletons.
})
class LeafController implements AbstractAssemblage {
  public path!: string | RegExp;

  constructor() {
    // @Controller decorator wasn't called yet.
    expect(this.path).toBeUndefined();
  }

  public onInit(): void {
    // Path is not inserted yet in the whole dependency tree.
    expect(this.path).toBe('/user');
  }

  public onInited(): void {
    // This controller is a dependency of subcontroller with path '/api/info'.
    expect(this.path).toBe('/api/info/user');
  }

  @Get('/')
  public getUserFromInfo() {
    console.log('Get user');
  }
}

@BasicController({
  path: '///info',
})
@Assemblage({
  inject: [[LeafController]],
})
class SubController implements AbstractAssemblage {
  public path!: string | RegExp;

  constructor(public leafController: LeafController) {
    // @Controller decorator wasn't called yet.
    expect(this.path).toBeUndefined();
  }

  public onInit(): void {
    // Path is not inserted yet in the whole dependency tree.
    expect(this.path).toBe('/info');
    expect(this.path).not.toBe('////info');
  }

  public onInited(): void {
    // This controller is a dependency of main controller with path '/api'.
    expect(this.path).toBe('/api/info');
  }

  @Get('/')
  public getAllInfo() {
    console.log('Get all info');
  }
}

@BasicController({
  path: 'api   ',
})
@Assemblage({
  inject: [[SubController]],
})
class MainController implements AbstractAssemblage {
  public path!: string | RegExp;

  constructor(public subController: SubController) {
    // @Controller decorator wasn't called yet.
    expect(this.path).toBeUndefined();
    // SubController was already instantiated.
    expect(subController.path).toBeDefined();
  }

  public onInited(): void {
    // Decorator will clean the path and add a leading slash.
    expect(this.path).toBe('/api');
    expect(this.path).not.toBe('api');
  }

  @Get('/')
  public getApi() {
    console.log('Get root API');
  }
}

describe('ControllerDecorator', () => {
  it('should create controllers on top of assemblages. ', () => {
    @Assemblage({
      inject: [[MainController], [WebFrameworkAdapter, ExpressAdapter]],
      global: {
        '@assemblerjs/rest': {
          // This is the default adapter, so it can be omitted.
          // If you want to use a different adapter, you can specify it here.
          adapter: WebFrameworkAdapter,
        },
      },
    })
    class App implements AbstractAssemblage {
      constructor(public mainController: MainController) {}
    }

    Assembler.build(App);
  });
});
