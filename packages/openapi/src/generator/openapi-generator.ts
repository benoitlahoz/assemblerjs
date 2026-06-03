import { Assemblage } from 'assemblerjs';
import { MetadataStorage } from '@assemblerjs/rest';
import { DtoSchemaExtractor } from '@assemblerjs/dto';
import { OpenApiMetadataStorage } from '../metadata/openapi-metadata-storage';
import { toOpenApiPath } from './path-converter';

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiGeneratorOptions {
  info: OpenApiInfo;
  servers?: OpenApiServer[];
}

/** Structural type describing what the generator needs from the REST metadata storage. */
export interface RestMetadataStorage {
  getAllControllers(): Function[];
  getControllerPath(cls: Function): string | undefined;
  getRoutesForClass(
    cls: Function,
  ): Array<{
    method: string;
    path: string;
    handlerName: string | symbol;
    summary: string;
  }>;
}

@Assemblage()
export class OpenApiGenerator {
  private options: OpenApiGeneratorOptions | null = null;

  // Default to the global singletons; replaceable in tests via _setStorages().
  private _restStorage: RestMetadataStorage =
    MetadataStorage as unknown as RestMetadataStorage;
  private _openApiStorage: OpenApiMetadataStorage = OpenApiMetadataStorage;
  private _dtoExtractor: { extract(cls: Function): object } =
    DtoSchemaExtractor;

  /**
   * Override storage objects for unit testing.
   * @internal
   */
  public _setStorages(
    rest: RestMetadataStorage,
    openApi: OpenApiMetadataStorage,
    dto?: { extract(cls: Function): object },
  ): void {
    this._restStorage = rest;
    this._openApiStorage = openApi;
    if (dto) this._dtoExtractor = dto;
  }

  public configure(options: OpenApiGeneratorOptions): void {
    this.options = options;
  }

  public generate(): object {
    if (!this.options) {
      throw new Error(
        '[assemblerjs/openapi] OpenApiGenerator.generate() called before configure(). ' +
          'Make sure OpenApiModule is properly initialized before calling generate().',
      );
    }

    const paths: Record<string, any> = {};
    const schemas: Record<string, any> = {};

    for (const controllerClass of this._restStorage.getAllControllers()) {
      if (this._openApiStorage.isIgnored(controllerClass)) continue;

      const basePath =
        this._restStorage.getControllerPath(controllerClass) ?? '/';
      const tag = this.deriveTag(basePath, controllerClass);
      const routes = this._restStorage.getRoutesForClass(controllerClass);

      for (const route of routes) {
        const {
          method,
          path: routePath,
          handlerName,
          summary: routeSummary,
        } = route;

        if (this._openApiStorage.isIgnored(controllerClass, handlerName))
          continue;

        const fullPath = toOpenApiPath(this.joinPaths(basePath, routePath));

        if (!paths[fullPath]) paths[fullPath] = {};

        const operation = this._openApiStorage.getOperation(
          controllerClass,
          handlerName,
        );
        const responses = this._openApiStorage.getResponsesForHandler(
          controllerClass,
          handlerName,
        );

        const summary = operation?.summary ?? (routeSummary || undefined);
        const description = operation?.description;
        const deprecated = operation?.deprecated;

        const responsesObj: Record<string, any> = {};
        for (const resp of responses) {
          if (resp.kind === 'returns') {
            const responseEntry: any = {
              description: resp.description ?? 'Success',
            };
            if (resp.dtoClass) {
              const schema = this._dtoExtractor.extract(resp.dtoClass);
              const schemaName = resp.dtoClass.name;
              schemas[schemaName] = schema;
              responseEntry.content = {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaName}` },
                },
              };
            }
            responsesObj[String(resp.status)] = responseEntry;
          } else {
            responsesObj[String(resp.status)] = {
              description: resp.description ?? 'Error',
            };
          }
        }

        // Default 200 if no response decorators declared.
        if (Object.keys(responsesObj).length === 0) {
          responsesObj['200'] = { description: 'Success' };
        }

        const operationObj: any = {
          tags: [tag],
          responses: responsesObj,
        };
        if (summary !== undefined) operationObj.summary = summary;
        if (description !== undefined) operationObj.description = description;
        if (deprecated) operationObj.deprecated = deprecated;

        paths[fullPath][method.toLowerCase()] = operationObj;
      }
    }

    const spec: any = {
      openapi: '3.0.3',
      info: this.options.info,
      paths,
    };

    if (this.options.servers?.length) {
      spec.servers = this.options.servers;
    }

    if (Object.keys(schemas).length > 0) {
      spec.components = { schemas };
    }

    return spec;
  }

  private joinPaths(base: string, route: string): string {
    if (!route || route === '/') return base || '/';
    if (!base || base === '/') return `/${route}`.replace(/\/+/g, '/');
    return `${base}/${route}`.replace(/\/+/g, '/');
  }

  private deriveTag(basePath: string, controllerClass: Function): string {
    // First non-empty segment of the base path: '/users/admin' → 'users'
    const segment = basePath.split('/').filter(Boolean)[0];
    if (segment) return segment;
    // Fallback: strip 'Controller' suffix from class name
    return controllerClass.name.replace(/Controller$/i, '') || 'default';
  }
}
