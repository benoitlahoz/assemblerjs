import type { ServerOptions as TlsServerOptions } from 'node:https';

/**
 * Configuration for `ExpressAdapter` and `FastifyAdapter`.
 *
 * Pass this as the third element of a `provide` tuple to enable HTTPS:
 *
 * ```ts
 * import { readFileSync } from 'node:fs';
 *
 * @Assemblage({
 *   provide: [
 *     [
 *       AbstractHttpAdapter,
 *       FastifyAdapter,
 *       {
 *         tls: {
 *           key:  readFileSync('server.key'),
 *           cert: readFileSync('server.crt'),
 *         },
 *       },
 *     ],
 *   ],
 * })
 * class App implements AbstractAssemblage { ... }
 * ```
 *
 * When `tls` is omitted or the configuration is not provided at all, the
 * adapter starts a plain HTTP server.
 */
export interface HttpAdapterConfiguration {
  tls?: TlsServerOptions;
}
