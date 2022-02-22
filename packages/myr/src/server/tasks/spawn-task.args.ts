import { ArgsType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsHash, IsNotEmpty } from 'class-validator';
import path from 'path';

import { ISpawnTaskArgs, SpawnTaskMode } from '../../common';

// Enums
registerEnumType(SpawnTaskMode, {
  name: 'SpawnTaskMode',
  description: 'Task management mode',
  valuesMap: {
    AUTO: {
      description: 'Managed by myr'
    },
    MANAGED: {
      description: 'Managed by the client'
    }
  }
});

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

  @Field(() => SpawnTaskMode, { defaultValue: SpawnTaskMode.MANAGED })
  mode: SpawnTaskMode;

  @Field(() => [ID], { defaultValue: [] })
  @IsHash('md5', { each: true })
  watchOn: string[];
}

