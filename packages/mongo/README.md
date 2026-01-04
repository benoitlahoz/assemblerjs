# @assemblerjs/mongo

MongoDB integration for AssemblerJS using Mongoose with decorators for schema definition and model creation.

## Overview

`@assemblerjs/mongo` provides a decorator-based approach to working with MongoDB in AssemblerJS applications. It wraps Mongoose with TypeScript decorators for defining schemas, models, and repository patterns.

## Features

- 🎯 **Schema Decorators** - Define MongoDB schemas with TypeScript decorators
- 🏭 **Model Factory** - Automatic model creation from decorated classes
- 🔒 **Type-Safe** - Full TypeScript support for schemas and queries
- 🔌 **AssemblerJS Integration** - Works seamlessly with dependency injection
- ♻️ **Lifecycle Management** - Connection and cleanup handled by AssemblerJS
- 📦 **Mongoose Power** - Full access to Mongoose features

## Installation

```bash
npm install @assemblerjs/mongo assemblerjs mongoose reflect-metadata
# or
yarn add @assemblerjs/mongo assemblerjs mongoose reflect-metadata
```

## Quick Start

### Define a Schema

```typescript
import 'reflect-metadata';
import { Schema, Prop, Model } from '@assemblerjs/mongo';
import { IsString, IsEmail } from 'class-validator';

@Schema()
class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  @IsEmail()
  email: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt?: Date;
}

// Create Mongoose model
const UserModel = Model(User);
```

### Use with AssemblerJS

```typescript
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
import mongoose from 'mongoose';

@Assemblage()
class Database implements AbstractAssemblage {
  async onInit() {
    await mongoose.connect('mongodb://localhost:27017/myapp');
    console.log('✓ Connected to MongoDB');
  }

  async onDispose() {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

@Assemblage({
  inject: [[Database]]
})
class UserRepository implements AbstractAssemblage {
  private model = UserModel;

  constructor(private db: Database) {}

  async findById(id: string) {
    return this.model.findById(id);
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email });
  }

  async create(data: { name: string; email: string }) {
    const user = new this.model(data);
    return user.save();
  }

  async update(id: string, data: Partial<{ name: string; email: string }>) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}

@Assemblage({
  inject: [[UserRepository]]
})
class App implements AbstractAssemblage {
  constructor(private userRepo: UserRepository) {}

  async onInit() {
    // Create a user
    const user = await this.userRepo.create({
      name: 'John Doe',
      email: 'john@example.com'
    });
    console.log('Created user:', user);

    // Find by email
    const found = await this.userRepo.findByEmail('john@example.com');
    console.log('Found user:', found);
  }
}

const app = Assembler.build(App);
```

## API

### `@Schema(options?)` Decorator

Define a Mongoose schema:

```typescript
@Schema({
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users' // Custom collection name
})
class User {
  @Prop()
  name: string;
}
```

### `@Prop(options?)` Decorator

Define schema properties:

```typescript
@Schema()
class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  price: number;

  @Prop({ type: String, enum: ['active', 'inactive'] })
  status: string;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}
```

### `Model(schema)` Factory

Create a Mongoose model:

```typescript
const UserModel = Model(User);

// Use like a regular Mongoose model
const user = await UserModel.findOne({ email: 'test@example.com' });
```

## Advanced Examples

### Nested Schemas

```typescript
@Schema()
class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  zipCode: string;
}

@Schema()
class User {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Address })
  address: Address;
}
```

### References

```typescript
import { Types } from 'mongoose';

@Schema()
class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  author: Types.ObjectId;
}

const PostModel = Model(Post);

// Populate reference
const post = await PostModel.findById(id).populate('author');
```

### Virtual Properties and Methods

```typescript
@Schema()
class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;
}

const UserModel = Model(User);

// Add virtuals
UserModel.schema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Add methods
UserModel.schema.methods.getInitials = function() {
  return `${this.firstName[0]}${this.lastName[0]}`;
};
```

### Repository Pattern

```typescript
@Assemblage()
class BaseRepository<T> implements AbstractAssemblage {
  constructor(private model: mongoose.Model<T>) {}

  async findAll() {
    return this.model.find();
  }

  async findById(id: string) {
    return this.model.findById(id);
  }

  async create(data: Partial<T>) {
    const doc = new this.model(data);
    return doc.save();
  }

  async update(id: string, data: Partial<T>) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}

@Assemblage()
class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email });
  }
}
```

## Connection Management

```typescript
import mongoose from 'mongoose';

@Assemblage()
class MongoConnection implements AbstractAssemblage {
  async onInit() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydb';
    
    await mongoose.connect(uri, {
      // Connection options
    });

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    console.log('✓ MongoDB connected');
  }

  async onDispose() {
    await mongoose.disconnect();
  }
}
```

## Requirements

- **Node.js:** ≥ 18.12.0
- **MongoDB:** ≥ 4.0
- **Mongoose:** ≥ 8.0
- **TypeScript:** ≥ 5.0
- **reflect-metadata:** Required

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}
```

## For Contributors

### Development

```bash
# Build the package
npx nx build mongo

# Run tests (requires MongoDB running)
npx nx test mongo

# E2E tests
npx nx e2e mongo
```

## TODO

- [ ] Refactor and simplify (functional programming approach)
- [ ] Add more decorators for advanced Mongoose features
- [ ] Improve type inference for queries
- [ ] Add transaction support utilities

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
