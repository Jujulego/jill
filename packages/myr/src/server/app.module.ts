import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { ControlModule } from './control/control.module';
import { TasksModule } from './tasks/tasks.module';

// Module
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: process.env.NODE_ENV !== 'development' || 'schema.gql',
      buildSchemaOptions: {
        dateScalarMode: 'isoDate',
        numberScalarMode: 'integer',
      },
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    ControlModule,
    TasksModule
  ]
})
export class AppModule {}
