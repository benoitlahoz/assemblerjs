export enum RouteMethods {
  All = 'all',
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Delete = 'delete',
  Patch = 'patch',
  Options = 'options',
  Head = 'head',
  Trace = 'trace',
  Connect = 'connect',
}

export interface RouteDefinition {
  method: RouteMethods;
  path: string;
  handlerName: string | symbol;
  info: string;
  type: string;
}
