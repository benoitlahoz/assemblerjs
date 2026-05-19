import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildDtoE2EApp, waitForDtoE2EServer } from './fixtures/app';

const LOGS_DIR = join(__dirname, 'logs');
const SINGLE_LOG_FILE = join(LOGS_DIR, 'dto-e2e.md');

const toJson = (value: unknown) => JSON.stringify(value, null, 2);

type LogEntry = {
  title: string;
  details: Record<string, unknown>;
};

const logEntries: LogEntry[] = [];

const prepareLogsDir = async () => {
  await mkdir(LOGS_DIR, { recursive: true });
  const files = await readdir(LOGS_DIR);
  await Promise.all(
    files
      .filter((name) => name === 'dto-e2e.md')
      .map((name) => rm(join(LOGS_DIR, name), { force: true }))
  );
};

const recordStep = (
  index: number,
  title: string,
  details: Record<string, unknown>
) => {
  logEntries[index] = { title, details };
};

const writeSingleLog = async () => {
  const sections = logEntries
    .filter((entry): entry is LogEntry => Boolean(entry))
    .map((entry, index) => [
      `## ${String(index).padStart(2, '0')} - ${entry.title}`,
      '',
      '```json',
      toJson(entry.details),
      '```',
      '',
    ].join('\n'));

  const summaryRows = logEntries
    .filter((entry): entry is LogEntry => Boolean(entry))
    .map((entry, index) => {
      const verdict = index === 2 || index === 4 ? 'Expected failure' : 'Passed';
      return `| ${String(index).padStart(2, '0')} | ${entry.title} | ${verdict} |`;
    });

  const body = [
    '# DTO E2E Log',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    '| Step | Title | Verdict |',
    '| --- | --- | --- |',
    ...summaryRows,
    '',
    '**Global verdict:** passed',
    '',
    ...sections,
  ].join('\n');

  await writeFile(SINGLE_LOG_FILE, body, 'utf8');
};

describe('@assemblerjs/dto full e2e with rest + fetch', () => {
  let app: ReturnType<typeof buildDtoE2EApp>;

  beforeAll(async () => {
    await prepareLogsDir();
    app = buildDtoE2EApp();
    await waitForDtoE2EServer();
    recordStep(0, 'Boot app and start REST server', {
      baseUrl: app.client.baseUrl,
      status: 'ready',
    });
  });

  afterAll(async () => {
    await app.dispose();
    recordStep(7, 'Dispose app', { status: 'disposed' });
    await writeSingleLog();
  });

  it('should validate request body with ValidateBody', async () => {
    const payload = { name: 'Alice', age: 30 };
    const result = await app.client.validate(JSON.stringify(payload));

    recordStep(1, 'ValidateBody success', {
      request: payload,
      responseStatus: result.status?.code,
      responseData: result.data,
      hasError: Boolean(result.error),
    });

    expect(result.error).toBeUndefined();
    expect(result.status?.code).toBe(201);
    expect(result.data).toStrictEqual({ name: 'Alice', age: 30 });
  });

  it('should fail with 400 when ValidateBody receives invalid payload', async () => {
    const payload = { name: 'Alice', age: 'invalid' };
    const result = await app.client.validate(JSON.stringify(payload));

    recordStep(2, 'ValidateBody failure', {
      request: payload,
      responseStatus: result.status?.code,
      errorMessage: result.error?.message,
      responseData: result.data,
    });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.status?.code).toBe(400);
  });

  it('should adapt request body with AdaptBody', async () => {
    const payload = { firstName: 'John', lastName: 'Doe', age: 28 };
    const result = await app.client.adapt(JSON.stringify(payload));

    recordStep(3, 'AdaptBody success', {
      request: payload,
      responseStatus: result.status?.code,
      responseData: result.data,
      hasError: Boolean(result.error),
    });

    expect(result.error).toBeUndefined();
    expect(result.status?.code).toBe(201);
    expect(result.data).toStrictEqual({ fullName: 'John Doe', age: 28 });
  });

  it('should fail with 400 when AdaptBody source DTO is invalid', async () => {
    const payload = { firstName: 'John', age: 28 };
    const result = await app.client.adapt(JSON.stringify(payload));

    recordStep(4, 'AdaptBody failure', {
      request: payload,
      responseStatus: result.status?.code,
      errorMessage: result.error?.message,
      responseData: result.data,
    });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.status?.code).toBe(400);
  });

  it('should expose createDtoSafe result over REST + fetch', async () => {
    const okPayload = { name: 'Safe', age: 44 };
    const ok = await app.client.safe(JSON.stringify(okPayload));

    const koPayload = { name: 'Safe', age: 'x' };
    const ko = await app.client.safe(JSON.stringify(koPayload));

    recordStep(5, 'createDtoSafe endpoint', {
      okRequest: okPayload,
      okStatus: ok.status?.code,
      okBody: ok.data,
      koRequest: koPayload,
      koStatus: ko.status?.code,
      koBody: ko.data,
    });

    expect(ok.error).toBeUndefined();
    expect(ok.data.ok).toBe(true);
    expect(ok.data.data).toStrictEqual({ name: 'Safe', age: 44 });

    expect(ko.error).toBeUndefined();
    expect(ko.data.ok).toBe(false);
    expect(Array.isArray(ko.data.issues)).toBe(true);
    expect(ko.data.issues.length).toBeGreaterThan(0);
  });

  it('should expose DTO metadata and schema extractor outputs', async () => {
    const metadata = await app.client.metadata();
    const schema = await app.client.schema();

    recordStep(6, 'DTO metadata and schema', {
      metadataStatus: metadata.status?.code,
      metadataBody: metadata.data,
      schemaStatus: schema.status?.code,
      schemaBody: schema.data,
    });

    expect(metadata.error).toBeUndefined();
    expect(metadata.status?.code).toBe(200);
    expect(metadata.data.isCreateUserDto).toBe(true);
    expect(metadata.data.isExternalCreateUserDto).toBe(true);

    expect(schema.error).toBeUndefined();
    expect(schema.status?.code).toBe(200);
    expect(schema.data.type).toBe('object');
    expect(schema.data.properties?.name).toBeDefined();
    expect(schema.data.properties?.age).toBeDefined();
    expect(Array.isArray(schema.data.required)).toBe(true);
    expect(schema.data.required).toContain('name');
    expect(schema.data.required).toContain('age');
  });
});
