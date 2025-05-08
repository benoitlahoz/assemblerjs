import { Schema, Prop } from '../../src';

@Schema({
  timestamps: true,
})
export class User {
  @Prop()
  public firstname: string;

  @Prop()
  public lastname: string;
}
