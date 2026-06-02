# @assemblerjs/common

Workspace-only shared package for cross-package conventions.

This package is intentionally internal and not intended for publishing.

Current scope:

- Metadata key conventions used by decorators across packages.
- Key builder helpers used directly in libraries (for example `buildMetadataKey` and `buildDecoratorParameterKey`).
- Generic metadata storage utilities shared by packages (class/method/parameter metadata helpers).
- Scoped metadata storage creation via `createScopedMetadataStore(scope)` to enforce `assemblerjs:<scope>:<name>` keys.
