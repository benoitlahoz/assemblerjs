import { IsNotEmpty, IsString } from 'class-validator';
import { Dto } from '@assemblerjs/dto';

@Dto()
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  gender!: string;
}
