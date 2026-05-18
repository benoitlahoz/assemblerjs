export * from './adapter.abstract';
export * from './http-adapter.decorator';
// Concrete adapters are exported via sub-path entry points:
// @assemblerjs/rest/express  → ExpressAdapter
// @assemblerjs/rest/fastify  → FastifyAdapter
