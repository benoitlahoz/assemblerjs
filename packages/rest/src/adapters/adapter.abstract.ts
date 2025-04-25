import { AbstractAssemblage } from 'assemblerjs';

export interface FrameworkConfiguration {
  https?: {
    cert: string;
    key: string;
  };
}

export abstract class FrameworkAdapter extends AbstractAssemblage {
  public abstract all(...args: any[]): any;
  public abstract use(...args: any[]): any;
  public abstract get(...args: any[]): any;
  public abstract post(...args: any[]): any;
  public abstract delete(...args: any[]): any;
  public abstract put(...args: any[]): any;
  public abstract patch(...args: any[]): any;
  public abstract options(...args: any[]): any;
  public abstract head(...args: any[]): any;
  public abstract trace(...args: any[]): any;
  public abstract connect(...args: any[]): any;

  public abstract listen(...args: any[]): any;
  public abstract close(): void;
}
