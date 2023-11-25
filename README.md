# @jujulego/jill
[![Version](https://img.shields.io/npm/v/@jujulego/jill)](https://www.npmjs.com/package/@jujulego/jill)
![Licence](https://img.shields.io/github/license/jujulego/jill)
![Language](https://img.shields.io/github/languages/top/jujulego/jill)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=jujulego_jill&metric=alert_status)](https://sonarcloud.io/dashboard?id=jujulego_jill)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=jujulego_jill&metric=coverage)](https://sonarcloud.io/dashboard?id=jujulego_jill)

Zero-config monorepo cli

## Description
Jill uses the `workspaces` attribute of your root package.json manifest to build your workspaces dependency tree.
That done it can offer you various utilities:
- `jill list` prints a list of all your workspaces, with many useful filters
- `jill run` Run a task expression in a workspace, after having built all its dependencies.
- `jill group` Deprecated in favor of run
- `jill each` Run a task expression in many workspace, after having built all theirs dependencies.
- `jill tree` prints current workspace's local dependency tree

It supports both `npm` and `yarn`.

### Hook scripts
Jill will run hook script like npm do, for both npm and yarn. As npm, when you type `jill run test`, it will first run
`pretest` if it exists, then `test` and finally `posttest`.

This feature can be disabled using the `--no-hooks` option: `jill run --no-hooks test`.

#### Task expression syntax
Allows to instruct multiple tasks with the given orchestration. The orchestration is given by the following operators:
- `&&` in sequence
- `||` fallbacks
- `//` in parallel

##### Examples:
- This will run scripts **taskA**, **taskB** and **taskC** in order, one after another.
  ```shell
  jill run 'taskA && taskB && taskC'
  ```

- This will run first **taskA**, if it fails it will run **taskB**, then **taskC** in order, until one succeed.
  ```shell
  jill run 'taskA || taskB || taskC'
  ```

- This will run scripts **taskA**, **taskB** and **taskC** in parallel.
  ```shell
  jill run 'taskA // taskB // taskC'
  ```

- And you can create more complex flows: this will run **taskA** and **taskB** in parallel, and then **taskC** when both tasks are ended
  ```shell
  jill run '(taskA // taskB) && taskC'
  ```

## Installation
Just install jill as a dev dependency:
```shell
npm install --save-dev @jujulego/jill
```

Or if you're using yarn
```shell
yarn add --dev @jujulego/jill
```

## Configuration
Almost nothing ;)

To work, jill only needs the `workspaces` attribute (see [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) or [yarn workspace](https://yarnpkg.com/features/workspaces)).

To build a workspaces, jill will try to run it's `build` script. If no `build` script is found, jill will just warn and continue.
