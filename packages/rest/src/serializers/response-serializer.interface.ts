import type { HttpResponse } from '@/http.types';

export interface ResponseSerializer {
  canHandle(result: unknown): boolean;
  serialize(result: any, res: HttpResponse, status: number): void;
}
