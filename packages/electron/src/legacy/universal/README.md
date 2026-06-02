# Legacy Universal Layer

This folder contains transition-only compatibility artifacts.

Rules:

- Keep legacy artifacts isolated from current runtime/decorator implementations.
- Mirror the active package structure when moving legacy code.
- New code must target src/main, src/renderer, src/universal.
