# jill
![Licence](https://img.shields.io/github/license/jujulego/jill)
![Language](https://img.shields.io/github/languages/top/jujulego/jill)
[![Publish](https://github.com/Jujulego/jill/actions/workflows/publish.yml/badge.svg)](https://github.com/Jujulego/jill/actions/workflows/publish.yml)

## Description
Zero-config monorepo cli

Jill uses the `workspaces` attribute of your root package.json manifest to build your workspaces dependency tree.
That done it can offer you various utilities:
- `jill info` prints data about the current workspace, including name, version and local dependency tree
- `jill list` prints a list of all your workspaces, with many useful filters
- `jill run` build all workspace's local dependencies before run a given script
- `jill each` do the same as `run` but for a list of workspaces, optimizing builds. Supports the same filters as `list`.

It supports both `npm` and `yarn`.

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

## Packages
- [@jujulego/jill](https://github.com/Jujulego/jill/tree/master/packages/cli)
- [@jujulego/jill-common](https://github.com/Jujulego/jill/tree/master/packages/common)
- [@jujulego/jill-core](https://github.com/Jujulego/jill/tree/master/packages/core)
- [@jujulego/jill-myr](https://github.com/Jujulego/jill/tree/master/packages/myr)
