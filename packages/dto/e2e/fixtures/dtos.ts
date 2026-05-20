import { IsInt, IsString } from 'class-validator';
import { Dto } from '../../src';

@Dto()
export class CreateUserDto {
  @IsString()
  name!: string;

  @IsInt()
  age!: number;
}

@Dto()
export class ExternalCreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  age!: number;
}

@Dto()
export class DomainCreateUserDto {
  @IsString()
  fullName!: string;

  @IsInt()
  age!: number;
}
