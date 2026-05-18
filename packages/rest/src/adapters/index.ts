export * from './adapter.abstract';
export * from './http-adapter.decorator';
export * from './http-adapter-configuration';
// Concrete adapters are exported via sub-path entry points:
// @assemblerjs/rest/express  → ExpressAdapter
// @assemblerjs/rest/fastify  → FastifyAdapter
