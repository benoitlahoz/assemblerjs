import { AbstractAssembler } from './abstract';

export class AssemblerContext {
  /**
   * User-defined data. Can be used to add properties to context after creation.
   */
  public readonly userData: Record<string, any> = {};

  public register: AbstractAssembler['register'];
  public has: AbstractAssembler['has'];
  public require: AbstractAssembler['require'];
  public tagged: AbstractAssembler['tagged'];

  constructor(assembler: AbstractAssembler) {
    this.register = assembler.register.bind(assembler);
    this.has = assembler.has.bind(assembler);
    this.require = assembler.require.bind(assembler);
    this.tagged = assembler.tagged.bind(assembler);
  }

  /**
   * Add a value to user-defined data.
   *
   * @param { string } key The key to add.
   * @param { any } value The value to add.
   * @returns { this } This context.
   */
  public set(key: string, value: any): this {
    if (this.userData[key]) {
      throw new Error(
        `Key '${key}' is already defined in context's user data.`
      );
    }
    this.userData[key] = value;
    return this;
  }

  /**
   * Get a value in user-defined data for given key.
   *
   * @param { string } key The key to get from user-defined data.
   * @returns { any } The result.
   */
  public get(key: string): any {
    return this.userData[key];
  }
}
