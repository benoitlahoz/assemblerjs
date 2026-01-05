# Performance Benchmarks

This document provides comprehensive performance benchmarks for assemblerjs, demonstrating its efficiency across various scenarios and workloads.

## Performance Metrics

![assembler building](https://img.shields.io/badge/assembler%20building-14k%20ops%2Fsec-green.svg?style=flat)
![singleton cache](https://img.shields.io/badge/singleton%20cache-183k%20ops%2Fsec-brightgreen.svg?style=flat)
![event emit](https://img.shields.io/badge/event%20emit-582k%20ops%2Fsec-brightgreen.svg?style=flat)
![decorators](https://img.shields.io/badge/decorators-685k%20ops%2Fsec-brightgreen.svg?style=flat)

These metrics represent real-world operations measured with Vitest benchmarks:
- **Assembler Building**: Complete build of a medium application (10 services with dependencies)
- **Singleton Cache**: Resolution and access to a singleton service without dependencies
- **Event Emit**: Single event emission with 1 registered listener
- **Decorators**: Application of the `@Assemblage()` decorator on a class

## Computational Complexity (Big O Notation)

Throughout this document, we use **Big O notation** to describe the algorithmic complexity of operations:

- **O(1)** - Constant time: Operation completes in the same time regardless of input size
- **O(n)** - Linear time: Time grows proportionally with input size
- **O(n²)** - Quadratic time: Time grows with the square of input size
- **O(log n)** - Logarithmic time: Time grows slowly as input increases
- **O(n * d)** - Product complexity: Combination of two factors (e.g., services × depth)

**Key Variables:**
- `n` = Number of services/items
- `d` = Dependency depth/hierarchy levels
- `L` = Number of event listeners
- `p` = Number of parameters
- `t` = Number of tags
- `k` = Number of context keys

These complexities help you predict how performance scales as your application grows.

## Benchmark Categories

Our benchmark suite covers all critical aspects of the library:

### 1. **Assembler Building** ([Source](../../../packages/assemblerjs/bench/assembler-building.bench.ts))

Measures the performance of building applications of different sizes.

**Complexity:** O(n) where n is the number of services + O(d) where d is dependency depth

- **Application Size Scaling**
  - Tiny application (1 service) - **O(1)**
  - Small application (3 services) - **O(n)**
  - Medium application (10 services) - **O(n)**
  - Large application (50 services) - **O(n)**
  - Extra-large application (100 services) - **O(n)**

- **Dependency Depth Scaling**
  - Flat dependencies (no hierarchy) - **O(n)**
  - Shallow hierarchy (2-3 levels) - **O(n * d)** where d ≈ 2-3
  - Deep hierarchy (5-10 levels) - **O(n * d)** where d ≈ 5-10

### 2. **Injectable Resolution** ([Source](../../../packages/assemblerjs/bench/injectable-resolution.bench.ts))

**Complexity:** O(1) for singleton (cached), O(n) for transient

- **Singleton Resolution** - **O(1)** (cached after first resolution)
  - Simple singleton injection
  - Singleton with dependencies
  - Multiple singleton dependencies
  - Deep singleton chains

- **Transient Resolution** - **O(n)** (created on each request)
  - Simple transient injection
  - Transient with dependencies
  - Mixed singleton/transient scenarios

- **Context Injection** - **O(1)** (direct reference)nsient scenarios

- **Context Injection**
  - Context parameter injection
  - Context with dependencies
  - Mixed context and service injection

### 3. **Decorators** ([Source](../../../packages/assemblerjs/bench/decorators.bench.ts))

**Complexity:** O(1) per decorator application, O(p) where p is parameter count

- **@Assemblage() Decorator** - **O(1)**
  - Basic decorator application
  - Complex configuration overhead
  - Decorator with multiple options

- **Parameter Decorators** - **O(p)** where p = number of parameters
  - @Context() injection
  - @Dispose() callback injection
  - Multiple parameter decorators
  - Custom parameter decorators

### 4. **Event System** ([Source](../../../packages/assemblerjs/bench/event-emission.bench.ts))

**Complexity:** O(L) where L is the number of listeners per event

- **Event Emission** - **O(L)** linear with listener count
  - Emit with 1 listener - **O(1)**
  - Emit with 10 listeners - **O(10)**
  - Emit with 50 listeners - **O(50)**
  - Emit with 100 listeners - **O(100)**
  - Emit with data payload (small, medium, large)
  - High-frequency emission (10k+ events)

- **Listener Management** - **O(1)** for add, **O(L)** for remove
  - Adding listeners - **O(1)**
  - Removing listeners - **O(L)**
  - Once listeners - **O(1)** add + **O(L)** remove after trigger

### 5. **Context Management** ([Source](../../../packages/assemblerjs/bench/context-management.bench.ts))

**Complexity:** O(1) for Map-based operations

- **Context Operations** - **O(1)** (uses Map internally)
  - Get/set values - **O(1)**
  - Check key existence - **O(1)**
  - Clear context - **O(k)** where k = number of keys
  - Multiple context instances

- **Context with Dependencies** - **O(1)** injection
  - Context injection in constructors
  - Context access in lifecycle hooks

### 6. **Lifecycle Hooks** ([Source](../../../packages/assemblerjs/bench/lifecycle-hooks.bench.ts))

**Complexity:** O(n) where n is the number of services with hooks

- **Hook Invocation** - **O(1)** per hook
  - onRegister() overhead - **O(1)**
  - onInit() overhead - **O(1)** per service, **O(n)** total
  - onDispose() overhead - **O(1)** per service, **O(n)** total
  - Multiple hooks per service - **O(h)** where h = hooks per service

- **Hook Chains** - **O(n)** for sequential execution
  - Sequential hook execution - **O(n)**
  - Asynchronous hooks - **O(1)** individual, **O(n)** awaited chain

### 7. **Object Management** ([Source](../../../packages/assemblerjs/bench/object-management.bench.ts))

**Complexity:** O(1) for simple objects, O(d) where d is dependency count

- **Instance Creation**
  - Simple object instantiation - **O(1)**
  - Object with dependencies - **O(d)** where d = dependency count
  - Complex object graphs - **O(n * d)** where n = nodes, d = avg dependencies

- **Memory Management**
  - Dispose operations - **O(1)** per service, **O(n)** total
  - Reference cleanup - **O(r)** where r = reference count
  - Garbage collection impact - **O(n)** (runtime-dependent)

### 8. **Complex Applications** ([Source](../../../packages/assemblerjs/bench/complex-applications.bench.ts))

**Complexity:** Composite of all operations - O(n * d * L)

- **Multi-Service Applications** - **O(n * d)** where n = services, d = depth
  - Microservice-style architectures
  - Event-driven systems - **O(n * L)** where L = listeners
  - Layered architectures (Controller → Service → Repository) - **O(d)** where d = layer depth

- **Advanced Patterns**
  - Factory patterns - **O(1)** factory resolution + **O(n)** instance creation
  - Strategy patterns - **O(1)** strategy resolution
  - Observer patterns with DI - **O(n + L)** where n = services, L = listeners

### 9. **Advanced Features** ([Source](../../../packages/assemblerjs/bench/advanced-features.bench.ts))

**Complexity:** Varies by feature

- **Tags System**
  - Tagged service registration - **O(t)** where t = tag count
  - Tag-based resolution - **O(n)** where n = services with tag
  - Multiple tags per service - **O(t * n)** where t = tags, n = services

- **Custom Decorators**
  - Custom parameter decorators - **O(p)** where p = parameter count
  - Custom class decorators - **O(1)** per decorator
  - Decorator composition - **O(d)** where d = decorator chain length

## Running Benchmarks

To run the benchmarks locally:

```bash
# From workspace root
npx nx bench assemblerjs

# Or from the package directory
cd packages/assemblerjs
yarn bench
```

### Viewing Results

Benchmarks use Vitest's built-in bench functionality. Results are displayed in the terminal with:
- Operations per second (ops/s)
- Average execution time
- Statistical variance
- Comparison between scenarios

## Interpreting Results

### What to Look For

- **Throughput**: Higher ops/s is better
- **Consistency**: Lower variance indicates more predictable performance
- **Scaling**: Linear scaling is ideal; watch for exponential degradation
- **Memory**: Monitor memory usage for large applications

### Typical Performance Characteristics

✅ **Excellent** (>100k ops/s)
- Simple decorator application
- Singleton resolution
- Basic event emission

✅ **Good** (10k-100k ops/s)
- Medium application building
- Transient resolution
- Context operations
- Lifecycle hooks

✅ **Acceptable** (1k-10k ops/s)
- Large application building (50+ services)
- Complex dependency graphs
- High-frequency events with many listeners

⚠️ **Watch** (<1k ops/s)
- Extra-large applications (100+ services)
- Very deep dependency hierarchies (10+ levels)
- Intensive event systems (100+ listeners)

## Performance Best Practices

Based on benchmark results:

### 1. Prefer Singletons for Stateless Services

Singleton resolution is significantly faster than transient:

```typescript
// ✅ Fast - Singleton (default)
@Assemblage()
class FastService {}

// ⚠️ Slower - Transient
@Assemblage({ singleton: false })
class SlowerService {}
```

### 2. Keep Dependency Graphs Shallow

Flat or shallow hierarchies perform better:

```typescript
// ✅ Good - Flat dependencies
@Assemblage({ inject: [[ServiceA], [ServiceB]] })
class GoodApp {
  constructor(private a: ServiceA, private b: ServiceB) {}
}

// ⚠️ Slower - Deep chain
// ServiceA → ServiceB → ServiceC → ServiceD → ServiceE
```

### 3. Minimize Event Listeners

Keep listener counts reasonable:

```typescript
// ✅ Good - Few targeted listeners
emitter.on('critical:event', handler);

// ⚠️ Slower - Many listeners
for (let i = 0; i < 100; i++) {
  emitter.on('event', handler);
}
```

### 4. Use Lazy Initialization

Defer expensive operations to onInit():

```typescript
@Assemblage()
class OptimizedService {
  private heavyResource?: HeavyResource;

  onInit() {
    // Load heavy resources after construction
    this.heavyResource = new HeavyResource();
  }
}
```

### 5. Batch Context Operations

Group related service resolutions:

```typescript
// ✅ Better - Batch resolutions
const service1 = context.require(Service1);
const service2 = context.require(Service2);
const service3 = context.require(Service3);

// Instead of interleaved require/use patterns
```

## Continuous Monitoring

We continuously monitor performance across versions to:

- Detect regressions early
- Validate optimization efforts
- Ensure consistent performance

### Contributing Benchmarks

When adding new features, include relevant benchmarks:

1. Create a new `.bench.ts` file or add to existing
2. Follow the naming convention: `feature-name.bench.ts`
3. Include realistic scenarios
4. Document what you're measuring
5. Compare with baseline operations

## Environment

Benchmark results vary by environment. Our reference configuration:

- **Runtime**: Node.js 18+
- **CPU**: Modern multi-core processor
- **Memory**: 8GB+ RAM
- **OS**: macOS/Linux (CI uses Ubuntu)

## Related Documentation

- [Tree-Shaking Guide](../guides/tree-shaking.md) - Bundle optimization
- [Advanced Examples](../guides/advanced-examples.md) - Real-world patterns
- [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md) - Hook best practices

---

**Note:** Benchmarks are synthetic tests designed to measure specific operations in isolation. Real-world performance depends on your application architecture, usage patterns, and runtime environment.
