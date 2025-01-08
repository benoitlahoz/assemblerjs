export abstract class AbstractAssemblage {
  [key: string]: any;

  public abstract onInit?(): void | Promise<void>;
  public abstract onDispose?(): void;
}
