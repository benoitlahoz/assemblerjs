export interface IpcReturnType<T = any> {
  data: T | null;
  err: Error | null;
}
