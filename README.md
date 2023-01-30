# @jujulego/jill
[![Version](https://img.shields.io/npm/v/@jujulego/jill)](https://www.npmjs.com/package/@jujulego/jill)
![Licence](https://img.shields.io/github/license/jujulego/jill)
![Language](https://img.shields.io/github/languages/top/jujulego/jill)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=jujulego_jill&metric=alert_status)](https://sonarcloud.io/dashboard?id=jujulego_jill)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=jujulego_jill&metric=coverage)](https://sonarcloud.io/dashboard?id=jujulego_jill)

## Description
Zero-config monorepo cli

Jill uses the `workspaces` attribute of your root package.json manifest to build your workspaces dependency tree.
That done it can offer you various utilities:
- `jill list` prints a list of all your workspaces, with many useful filters
- `jill run` build all workspace's local dependencies before run a given script
- `jill each` do the same as `run` but for a list of workspaces, optimizing builds. Supports the same filters as `list`.
- `jill tree` prints current workspace's local dependency tree

It supports both `npm` and `yarn`.

### Experimental features
- `jill group` same as `run` but allows to run multiple scripts in sequence or in parallel using the task syntax

#### Task syntax _(only supported by `jill group` command yet)_
Allows to instruct multiple tasks with the given orchestration. The orchetraction is given by the following operators:
- `->` in sequence
- `//` in parallel

##### Examples:
The following will run scripts **taskA**, **taskB** and **taskC** in order, one after another.
```shell
jill group 'taskA -> taskB -> taskC'
```

The following will run scripts **taskA**, **taskB** and **taskC** in parallel.
```shell
jill group 'taskA // taskB // taskC'
```

And you can create more complex flows:
```shell
jill group '(taskA // taskB) -> taskC'
```
This will run **taskA** and **taskB** in parallel, and then **taskC** when both tasks are ended

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
