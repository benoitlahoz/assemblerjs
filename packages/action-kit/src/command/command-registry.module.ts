import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { HistoryRegistry } from '@/history';

/** Returned by a `Command.execute()` that can be undone. */
export interface UndoableResult {
  undo(): void;
  label?: string;
}

export type CommandExecuteResult = void | UndoableResult;

export interface Command<TMetadata = unknown> {
  id: string;
  title?: string;
  category?: string;
  execute: (...args: unknown[]) => CommandExecuteResult | Promise<CommandExecuteResult>;
  metadata?: TMetadata;
}

@Assemblage()
export class CommandRegistry implements AbstractAssemblage {
  private commands = new Map<string, Command>();

  constructor(private readonly history: HistoryRegistry) {}

  /** Registers a command, returns a handle to unregister it. */
  public register(command: Command): () => void {
    this.commands.set(command.id, command);

    return () => this.unregister(command.id);
  }

  public unregister(id: string): void {
    this.commands.delete(id);
  }

  public get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  public has(id: string): boolean {
    return this.commands.has(id);
  }

  public getAll(): Command[] {
    return [...this.commands.values()];
  }

  public async execute(id: string, ...args: unknown[]): Promise<void> {
    const command = this.commands.get(id);

    if (!command) {
      throw new Error(`Unknown command: ${id}`);
    }

    const result = await command.execute(...args);

    if (result) {
      // Redo re-executes the command via its id/args; the action already ran above.
      this.history.getActiveManager()?.push({
        execute: () => void this.execute(id, ...args),
        undo: result.undo,
        label: result.label ?? command.title,
      });
    }
  }
}
