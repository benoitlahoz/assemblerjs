import mongoose from 'mongoose';
// @ts-ignore
import MongooseDelete from 'mongoose-delete';
import { Prop } from './prop.decorator';
import { Schema } from './schema.decorator';
import { ModelFactory } from './factories/model.factory';
import { isMongoRunning, startMongo, stopMongo, whichMongo } from '@/utils';
import { create } from 'domain';

@Schema({
  timestamps: true,
  plugins: [
    {
      package: MongooseDelete,
      options: { deletedBy: true },
    },
  ],
  index: {
    fields: { name: 1, email: 1 },
    options: { unique: true, partialFilterExpression: { name: true } },
  },
})
export class Pattern {
  @Prop()
  public name: string;

  @Prop()
  public email: string;

  @Prop({ type: String, required: true })
  public description: string;

  @Prop({ unique: true, default: false })
  public default: boolean;
}

const PatternModel = ModelFactory.createForClass(Pattern);

const STOP_AT_END = true;
const CLEAR_AT_END = true;

const HOST = '127.0.0.1';
const PORT = 33333;
const DB_NAME = 'assemblerjs-mongo-test';
const DB = `${process.cwd()}/test-db/${DB_NAME}/data`;
const LOGS = `${process.cwd()}/test-db/${DB_NAME}/logs/mongo/mongo.log`;

describe('Schema', () => {
  it('checks if we can decorate a model and create a schema.', async () => {
    // Check if Mongo is installed.
    if ((await whichMongo()) === null)
      throw new Error(`Mongo is not installed.`);

    let runningOrError = await isMongoRunning();
    if (runningOrError instanceof Error) throw runningOrError;

    if (runningOrError) {
      // If Mongo is running, we stop it.
      const stoppedOrError: boolean | Error = await stopMongo();
      if (stoppedOrError instanceof Error) {
        throw stoppedOrError;
      }
      expect(stoppedOrError).toBeTruthy();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      expect(await isMongoRunning()).toBeFalsy();
      runningOrError = false;
    }

    if (!runningOrError) {
      const runOrError: string | Error = await startMongo({
        bindIp: [HOST],
        port: PORT,
        dbPath: DB,
        logPath: LOGS,
        purgeLogs: true,
      });

      if (runOrError instanceof Error) {
        throw runOrError;
      }
    }
    await mongoose.connect(`mongodb://${HOST}:${PORT}/${DB_NAME}`);

    const created = await PatternModel.create({
      description: 'An user.',
      name: 'John Doe',
      email: 'john@doe.com',
      default: true,
    });
    expect(created).toBeDefined();

    const result = await PatternModel.findById(created._id);
    if (result) expect(result._id.toString()).toBe(created._id.toString());

    // Create fake user id.
    const idUser = new mongoose.Types.ObjectId('53da93b16b4a6670076b16bf');
    await created.delete(idUser);

    const deleted = await PatternModel.findById(created._id);
    expect(deleted.deletedBy.toString()).toBe(idUser.toString());

    deleted.restore();
    const restored = await PatternModel.findById(created._id);
    expect(restored.deleted).toBeFalsy;

    if (CLEAR_AT_END) {
      await PatternModel.deleteMany();
      expect(await PatternModel.countDocuments()).toBe(0);
    }

    if (STOP_AT_END) {
      // Stop Mongo.

      const stoppedOrError: boolean | Error = await stopMongo();
      if (stoppedOrError instanceof Error) {
        throw stoppedOrError;
      }
      expect(stoppedOrError).toBeTruthy();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      expect(await isMongoRunning()).toBeFalsy();
    }
  }, 10000);
});
