import 'reflect-metadata';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  AbstractAssemblage,
  AbstractTransversal,
  After,
  Assemblage,
  Assembler,
  Before,
  Dispose,
  Transversal,
  type AdviceContext,
} from 'assemblerjs';
import {
  Body,
  Fetch,
  Header,
  Parse,
  Query,
  type FetchDebugFn,
  type FetchStatus,
} from '../src';

const debugLogs: string[] = [];
const customDebugFn: FetchDebugFn = (reason) => {
  debugLogs.push(String(reason));
};

@Assemblage()
class TestHttpServer implements AbstractAssemblage {
  private server;
  private unstableCalls = 0;
  public baseUrl = '';

  constructor() {
    this.server = createServer((req, res) => {
      void this.route(req, res);
    });
  }

  private route = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/users') {
      const limit = Number(url.searchParams.get('limit') || '2');
      const traceId = req.headers['x-trace-id'];
      const payload = {
        users: [
          { id: 1, firstName: 'John' },
          { id: 2, firstName: 'Jane' },
        ].slice(0, limit),
        traceId,
      };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/users') {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk: string) => {
        body += chunk;
      });
      req.on('end', () => {
        const parsed = body ? JSON.parse(body) : {};
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ...parsed, created: true }));
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/unstable') {
      this.unstableCalls += 1;

      if (this.unstableCalls === 1) {
        res.writeHead(503, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ message: 'temporary failure' }));
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, attempts: this.unstableCalls }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/slow') {
      setTimeout(() => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }, 60);
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'not found' }));
  };

  public async start(): Promise<void> {
    if (this.baseUrl) return;

    await new Promise<void>((resolve) => {
      this.server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = this.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Could not resolve test server address');
    }

    this.baseUrl = `http://127.0.0.1:${address.port}`;
  }

  public async onDispose(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.server.close(() => resolve());

      // Ensure keep-alive sockets do not block close in tests.
      const closeAllConnections = (this.server as any).closeAllConnections;
      if (typeof closeAllConnections === 'function') {
        closeAllConnections.call(this.server);
      }

      setTimeout(resolve, 200);
    });

    this.baseUrl = '';
    this.unstableCalls = 0;
  }
}

@Assemblage()
class FetchClient implements AbstractAssemblage {
  constructor(public server: TestHttpServer) {}

  @Fetch('get', (target: FetchClient) => `${target.server.baseUrl}/users`)
  @Parse('json')
  async getUsers(
    @Query('limit') limit: number,
    @Header('x-trace-id') traceId: string,
    data?: any,
    error?: Error,
    status?: FetchStatus,
    path?: string
  ) {
    if (error) throw error;
    return { data, status, path, traceId };
  }

  @Fetch('post', (target: FetchClient) => `${target.server.baseUrl}/users`, {
    headers: { 'content-type': 'application/json' },
  })
  @Parse('json')
  async createUser(@Body() body: string, data?: any, error?: Error) {
    if (error) throw error;
    return data;
  }

  @Fetch('get', (target: FetchClient) => `${target.server.baseUrl}/unstable`, {
    retry: 1,
    retryDelay: 1,
  })
  @Parse('json')
  async getFromUnstable(data?: any, error?: Error) {
    if (error) throw error;
    return data;
  }

  @Fetch('get', (target: FetchClient) => `${target.server.baseUrl}/slow`, {
    timeout: 10,
  })
  @Parse('json')
  async getSlow(data?: any, error?: Error) {
    if (error) throw error;
    return data;
  }

  @Fetch('get', (target: FetchClient) => `${target.server.baseUrl}/users`, undefined, customDebugFn)
  @Parse('json')
  async getUsersWithCustomDebug(@Query('limit') limit: number, data?: any, error?: Error) {
    if (error) throw error;
    return data;
  }
}

@Transversal()
class FetchClientTransversal implements AbstractTransversal {
  public calls: string[];

  constructor() {
    this.calls = [];
  }

  @Before('execution(FetchClient.*)')
  beforeCall(context: AdviceContext) {
    if (!this.calls) this.calls = [];
    this.calls.push(`before:${context.methodName}`);
  }

  @After('execution(FetchClient.*)')
  afterCall(context: AdviceContext) {
    if (!this.calls) this.calls = [];
    this.calls.push(`after:${context.methodName}`);
  }
}

@Assemblage({
  provide: [[TestHttpServer], [FetchClient]],
  engage: [[FetchClientTransversal]],
})
class App implements AbstractAssemblage {
  constructor(
    public server: TestHttpServer,
    public client: FetchClient,
    public interceptor: FetchClientTransversal,
    @Dispose() public dispose: () => Promise<void>
  ) {}
}

describe('@assemblerjs/fetch e2e with assemblage and transversals', () => {
  beforeEach(() => {
    debugLogs.length = 0;
  });

  it('should execute fetch decorators with header/query/body and transversal interception', async () => {
    const app = Assembler.build(App);
    await app.server.start();

    const usersResult = await app.client.getUsers(1, 'trace-e2e');
    expect(usersResult.data.users).toHaveLength(1);
    expect(usersResult.data.traceId).toBe('trace-e2e');
    expect(usersResult.status?.code).toBe(200);
    expect(usersResult.path).toContain('/users?limit=1');

    const created = await app.client.createUser(
      JSON.stringify({ firstName: 'Alice', age: 30 })
    );
    expect(created.created).toBe(true);
    expect(created.firstName).toBe('Alice');

    expect(app.interceptor.calls).toContain('before:getUsers');
    expect(app.interceptor.calls).toContain('after:getUsers');
    expect(app.interceptor.calls).toContain('before:createUser');
    expect(app.interceptor.calls).toContain('after:createUser');

    await app.dispose();
  });

  it('should retry on non-ok responses and then succeed', async () => {
    const app = Assembler.build(App);
    await app.server.start();

    const result = await app.client.getFromUnstable();
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);

    await app.dispose();
  });

  it('should fail on timeout', async () => {
    const app = Assembler.build(App);
    await app.server.start();

    await expect(app.client.getSlow()).rejects.toBeTruthy();

    await app.dispose();
  });

  it('should support custom debug function', async () => {
    const app = Assembler.build(App);
    await app.server.start();

    const data = await app.client.getUsersWithCustomDebug(1);
    expect(data.users).toHaveLength(1);
    expect(debugLogs.length).toBeGreaterThan(0);
    expect(debugLogs.some((msg) => msg.includes("Begin '@Fetch' task"))).toBe(true);

    await app.dispose();
  });
});
