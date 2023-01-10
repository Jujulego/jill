import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata';

// Container
export const container = new Container();

// Utilities
export const { lazyInject, lazyInjectNamed } = getDecorators(container);
