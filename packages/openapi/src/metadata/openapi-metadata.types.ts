export type ResponseMeta =
  | { kind: 'returns'; status: number; dtoClass?: Function; description?: string }
  | { kind: 'throws'; status: number; description?: string };

export interface OperationMeta {
  summary?: string;
  description?: string;
  deprecated?: boolean;
}
