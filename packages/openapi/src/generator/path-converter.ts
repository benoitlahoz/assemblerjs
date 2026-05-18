/**
 * Converts an Express-style route path (`:param`) to an OpenAPI-style path (`{param}`).
 *
 * @example
 * toOpenApiPath('/users/:id/posts/:postId') // '/users/{id}/posts/{postId}'
 */
export function toOpenApiPath(path: string): string {
  return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
}
