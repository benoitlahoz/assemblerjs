import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { Shortcut } from './types/shortcut';
import { getPlatform, type Platform } from './types/platform';
import { ShortcutRegistry, ShortcutFormatter, ShortcutMatcher, ShortcutParser } from './services';

export type ShortcutExecuteHandler = (shortcut: Shortcut) => void | Promise<void>;

/** Where the browser owns the keyboard: text fields and code editors. */
const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"], .cm-editor') !== null
  );
};

@Assemblage({
  provide: [[ShortcutRegistry], [ShortcutFormatter], [ShortcutMatcher], [ShortcutParser]],
})
export class ShortcutManager implements AbstractAssemblage {
  private eventTarget?: EventTarget;

  private scopes: string[] = [];

  private executeHandler?: ShortcutExecuteHandler;

  private readonly platform: Platform;

  constructor(
    private readonly registry: ShortcutRegistry,
    private readonly formatter: ShortcutFormatter,
    private readonly matcher: ShortcutMatcher,
    private readonly parser: ShortcutParser,
  ) {
    this.platform = getPlatform();
  }

  public attach(eventTarget: EventTarget = window): void {
    if (this.eventTarget) {
      this.detach();
    }

    this.eventTarget = eventTarget;

    this.eventTarget.addEventListener('keydown', this.handleKeyDown);
  }

  public detach(): void {
    if (!this.eventTarget) {
      return;
    }

    this.eventTarget.removeEventListener('keydown', this.handleKeyDown);

    this.eventTarget = undefined;
  }

  public onExecute(handler: ShortcutExecuteHandler): () => void {
    this.executeHandler = handler;

    return () => {
      if (this.executeHandler === handler) {
        this.executeHandler = undefined;
      }
    };
  }

  /** Registers a shortcut, returns a handle to unregister it. */
  public register(shortcut: Shortcut): () => void {
    this.registry.register(shortcut);

    return () => this.registry.unregister(shortcut.id);
  }

  public unregister(id: string): void {
    this.registry.unregister(id);
  }

  public pushScope(scope: string): void {
    this.scopes = this.scopes.filter((current) => current !== scope);

    this.scopes.push(scope);
  }

  public popScope(scope: string): void {
    this.scopes = this.scopes.filter((current) => current !== scope);
  }

  public setScopes(scopes: string[]): void {
    this.scopes = [...scopes];
  }

  public getScopes(): string[] {
    return [...this.scopes];
  }

  /**
   * Pushes `scope` while `element` (or a descendant) has focus, pops it on
   * blur. Lets a component's shortcuts only apply while it is focused.
   */
  public bindFocusScope(element: HTMLElement, scope: string): () => void {
    const handleFocusIn = (): void => this.pushScope(scope);

    const handleFocusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget;
      if (next instanceof Node && element.contains(next)) {
        return;
      }
      // The focused element was destroyed rather than blurred (a deleted item, a swapped view):
      // focus falls back to <body> with no follow-up focusin, which would strand the scope popped
      // and silently kill every shortcut bound to it.
      if (event.target instanceof Node && !event.target.isConnected) {
        return;
      }
      this.popScope(scope);
    };

    element.addEventListener('focusin', handleFocusIn);
    element.addEventListener('focusout', handleFocusOut);

    return () => {
      element.removeEventListener('focusin', handleFocusIn);
      element.removeEventListener('focusout', handleFocusOut);
      this.popScope(scope);
    };
  }

  public format(accelerator: string): string {
    return this.formatter.format(accelerator);
  }

  /**
   * Runs what `accelerator` is bound to in the scopes in front, as a key press would: for what
   * receives the keys before the page does (a native menu) and hands them over. `false` when
   * nothing is bound to it.
   */
  public async dispatch(accelerator: string): Promise<boolean> {
    const wanted = accelerator.toLowerCase();
    const shortcuts = this.registry.getAll();

    for (const scope of [...this.scopes.toReversed(), undefined]) {
      const shortcut = shortcuts.find(
        (candidate) => candidate.scope === scope && candidate.accelerator.toLowerCase() === wanted,
      );
      if (shortcut) {
        await this.execute(shortcut);
        return true;
      }
    }
    return false;
  }

  /** Finds the shortcut bound to a command id, preferring one matching `scope` if given. */
  public findByCommand(commandId: string, scope?: string): Shortcut | undefined {
    const matches = this.registry.getAll().filter((shortcut) => shortcut.command === commandId);

    if (scope !== undefined) {
      const scoped = matches.find((shortcut) => shortcut.scope === scope);
      if (scoped) return scoped;
    }

    return matches.find((shortcut) => shortcut.scope === undefined) ?? matches[0];
  }

  private readonly handleKeyDown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    const shortcut = this.findShortcut(event);

    if (!shortcut) {
      return;
    }

    // Typing in a field must keep its native keys (paste, undo, select-all): swallowing them here
    // would leave the user unable to paste external text into an input.
    if (!shortcut.allowInEditable && isEditableTarget(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    void this.execute(shortcut);
  };

  private findShortcut(event: KeyboardEvent): Shortcut | undefined {
    const shortcuts = this.registry.getAll();

    /*
     * Contexts are checked from the most specific to the
     * least specific one.
     *
     * The last pushed context is considered the most specific.
     */
    const scopes = [...this.scopes.toReversed(), undefined];

    for (const scope of scopes) {
      const candidates = shortcuts.filter((shortcut) => shortcut.scope === scope);

      for (const shortcut of candidates) {
        const chords = this.parser.parse(shortcut.accelerator);

        /*
         * The parser already supports chord sequences:
         *
         *   CmdOrCtrl+K CmdOrCtrl+P
         *
         * Sequence handling can be added later using a
         * state machine.
         */
        if (chords.length !== 1) {
          continue;
        }

        if (this.matcher.matches(event, chords[0], this.platform)) {
          return shortcut;
        }
      }
    }

    return undefined;
  }

  private async execute(shortcut: Shortcut): Promise<void> {
    if (!this.executeHandler) {
      return;
    }

    await this.executeHandler(shortcut);
  }
}
