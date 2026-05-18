import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Dto } from '@assemblerjs/dto';

@Dto()
export class UserDto {
  @IsNumber()
  id!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  gender!: string;
}
