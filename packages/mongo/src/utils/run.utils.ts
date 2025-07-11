import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { parse } from 'node:path';
import os from 'node:os';
import { Task } from '@assemblerjs/core';
import { whichMongoSync } from './which.utils';

const platform = os.platform();

export interface StartMongoOptions {
  port?: number;
  bindIp?: string[];
  // Absolute path.
  dbPath: string;
  // Absolute path with file.
  logPath: string;
  purgeLogs?: boolean;
}

export interface StartMongoTaskObject {
  options: StartMongoOptions;
  cmd?: string;
  result?: string;
}

// Tasks.

const findMongoPid = Task.of(() => {
  return platform === 'win32'
    ? // TODO: Test this!
      execSync(`tasklist | FIND "mongod.exe"`, { encoding: 'utf-8' })
    : execSync(`pgrep mongod`, { encoding: 'utf-8' });
});

const errorOrFalse = (err: any) => {
  const error = err as Error;
  if (error.message.toLowerCase().includes('command failed')) return false;
  return error;
};

const createDataDirectory = (res: StartMongoTaskObject) => {
  const result = { ...res };
  createDirectory(res.options.dbPath);
  return result;
};

const createLogsDirectory = (res: StartMongoTaskObject) => {
  const result = { ...res };
  createDirectory(res.options.logPath, true);
  return result;
};

const purge = (res: StartMongoTaskObject) => {
  const result = { ...res };
  if (res.options.purgeLogs) {
    purgeLogs(res.options.logPath);
  }
  return result;
};

const buildMongoCmd = (res: StartMongoTaskObject) => {
  const result = { ...res };

  const exe =
    platform === 'win32'
      ? // TODO: Test this.
        whichMongoSync() || 'mongod.exe'
      : 'mongod';
  const port = res.options.port || 27017;
  const bindIp = res.options.bindIp?.join(',') || 'localhost';
  const dbPath = `--dbpath=${res.options.dbPath} `;
  const logPath = `--logpath=${res.options.logPath} `;

  result.cmd = `${exe} ${dbPath}${logPath}--port=${String(
    port
  )} --bind_ip=${bindIp} --fork`;

  return result;
};

const execProcess = (res: StartMongoTaskObject) => {
  const result = { ...res };
  if (!res.cmd) {
    throw new Error(`An error occurred while building Mongo process command.`);
  }
  result.result = execSync(res.cmd, { encoding: 'utf-8' });
  return result;
};

/**
 * Start the Mongo process.
 *
 * @param { options: StartMongoOptions } Mandatory options object.
 * @returns { Promise<string | Error> } The process stdout string or an `Error`.
 */
export const startMongo = async (
  options: StartMongoOptions
): Promise<string | Error> => {
  const task = (op: StartMongoOptions) =>
    Task.of(() => {
      return { options: op };
    })
      .map(createDataDirectory)
      .map(createLogsDirectory)
      .map(purge)
      .map(buildMongoCmd)
      .map(execProcess);

  const taskResult = await task(options).fork();

  return taskResult.fold(
    (err: unknown) => err as Error,
    (res: StartMongoTaskObject) => {
      if (res.result) return res.result;
      return new Error(
        `An unknown error occurred while trying to start Mongo.`
      );
    }
  );
};

/**
 * Check if MongoDB is running.
 *
 * @returns  { boolean | Error } `true` or `false` according to Mongo running or not, or an `Error`.
 * @todo For Windows (replace pgrep)
 */
export const isMongoRunning = async (): Promise<boolean | Error> => {
  const taskResult = await findMongoPid.fork();
  return taskResult.fold<boolean | Error>(errorOrFalse, () => true);
};

/**
 * Stop the Mongo process.
 *
 * @todo For Windows (replace pgrep)
 */
export const stopMongo = async (): Promise<boolean | Error> => {
  const task = findMongoPid.map((pid: string) =>
    execSync(`kill ${pid}`, { encoding: 'utf-8' })
  );
  const taskResult = await task.fork();
  return taskResult.fold<boolean | Error>(
    (err: unknown) => errorOrFalse(err),
    () => true
  );
};

/**
 * Purge logs at path.
 *
 * @param { string } path The path to Mongo logs.
 */
export const purgeLogs = (path: string): true => {
  try {
    const withoutFilepart = parse(path).dir;
    if (!existsSync(withoutFilepart))
      throw new Error(
        `Logs directory doesn't exist at path '${withoutFilepart}'. No logs to purge.`
      );

    readdirSync(withoutFilepart).forEach((file: string) =>
      rmSync(`${withoutFilepart}/${file}`)
    );
    return true;
  } catch (err: unknown) {
    throw err as Error;
  }
};

export const createDirectory = (path: string, withFile = false): true => {
  try {
    const withoutFilepart = withFile ? parse(path).dir : path;
    if (existsSync(withoutFilepart)) return true;
    mkdirSync(withoutFilepart, { recursive: true });
    return true;
  } catch (err: unknown) {
    throw err as Error;
  }
};
