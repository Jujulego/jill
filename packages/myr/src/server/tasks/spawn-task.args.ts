import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsHash, IsNotEmpty } from 'class-validator';
import path from 'path';

import { ISpawnTaskArgs } from '../../common';

// Args
@ArgsType()
export class SpawnTaskArgs implements ISpawnTaskArgs {
  // Attributes
  @Field()
  @IsNotEmpty()
  @Transform(({ value }) => path.resolve(value))
  cwd: string;

  @Field()
  @IsNotEmpty()
  cmd: string;

  @Field(() => [String], { defaultValue: [] })
  args: string[];

  @Field(() => [ID], { defaultValue: [] })
  @IsHash('md5', { each: true })
  watchOn: string[];
}

