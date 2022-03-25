import { AffectedFilter, Filter, Pipeline } from '@jujulego/jill-common';
import { Workspace } from '@jujulego/jill-core';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import * as path from 'path';
import { useEffect, useMemo, useState } from 'react';
import slugify from 'slugify';

import { command } from '../command';
import { useProject, withProject } from '../wrappers/project.wrapper';
import { List } from '../components/List';

// Types
export type Attribute = 'name' | 'version' | 'root' | 'slug';
export type Data = Partial<Record<Attribute, string>>;

type Extractor<T> = (wks: Workspace, json: boolean) => T;

// Constants
const LONG_ATTRIBUTES: Attribute[] = ['name', 'version', 'root'];
const JSON_ATTRIBUTES: Attribute[] = ['name', 'version', 'slug', 'root'];
const DEFAULT_ATTRIBUTES: Attribute[] = ['name'];

const EXTRACTORS: Record<Attribute, Extractor<string | undefined>> = {
  name: wks => wks.name,
  version: wks => wks.manifest.version || undefined,
  root: (wks, json) =>  json ? wks.cwd : path.relative(process.cwd(), wks.cwd) || '.',
  slug: wks => slugify(wks.name)
};

// Utils
function buildExtractor(attrs: Attribute[]): Extractor<Data> {
  return (wks, json) => {
    const data: Data = {};

    for (const attr of attrs) {
      data[attr] = EXTRACTORS[attr](wks, json);
    }

    return data;
  };
}

// Command
const { wrapper, useArgs } = withProject(command({
  name: ['list', 'ls'],
  description: 'List workspaces',
  builder: (yargs) => yargs
    .option('private', {
      type: 'boolean',
      group: 'Filters:',
      desc: 'Print only private workspaces',
    })
    .option('with-script', {
      type: 'array',
      string: true,
      group: 'Filters:',
      desc: 'Print only workspaces having the given script',
    })
    .option('affected', {
      alias: 'a',
      type: 'string',
      coerce: (rev: string) => rev === '' ? 'master' : rev,
      group: 'Affected:',
      desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master.\n' +
        'Replaces %name by workspace name.',
    })
    .option('affected-rev-sort', {
      type: 'string',
      group: 'Affected:',
      desc: 'Sort applied to git tag / git branch command',
    })
    .option('affected-rev-fallback', {
      type: 'string',
      default: 'master',
      group: 'Affected:',
      desc: 'Fallback revision, used if no revision matching the given format is found',
    })
    .option('attrs', {
      type: 'array',
      choices: ['name', 'version', 'root', 'slug'],
      default: [] as Attribute[],
      group: 'Format:',
      desc: 'Select printed attributes'
    })
    .option('headers', {
      type: 'boolean',
      group: 'Format:',
      desc: 'Prints columns headers'
    })
    .option('long', {
      alias: 'l',
      type: 'boolean',
      group: 'Format:',
      desc: 'Prints name, version and root of all workspaces',
    })
    .option('json', {
      type: 'boolean',
      group: 'Format:',
      desc: 'Prints data as a JSON array',
    }),
}));

// Component
export const ListCommand = wrapper(function ListComponent() {
  const args = useArgs();
  const project = useProject();

  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>();

  // Memo
  const attrs = useMemo(() => {
    let attrs = args.attrs;

    if (args.attrs.length === 0) {
      if (args.long) {
        attrs = LONG_ATTRIBUTES;
      } else if (args.json) {
        attrs = JSON_ATTRIBUTES;
      } else {
        attrs = DEFAULT_ATTRIBUTES;
      }
    }

    return attrs;
  }, [args]);

  const data = useMemo(() => {
    return workspaces?.map(wks => buildExtractor(attrs)(wks, args.json ?? false));
  }, [attrs, args, workspaces]);

  // Effects
  useEffect(() => void (async () => {
    // Setup pipeline
    const pipeline = new Pipeline();

    if (args.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(args.private));
    }

    if (args.withScript !== undefined) {
      pipeline.add(Filter.scripts(args.withScript));
    }

    if (args.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        args.affected,
        args.affectedRevFallback,
        args.affectedRevSort
      ));
    }

    // Filter
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(project.workspaces())) {
      workspaces.push(wks);
    }

    setWorkspaces(workspaces);
  })(), [args]);

  // Render
  if (!data) {
    return <Text><Spinner /> Load workspaces</Text>;
  }

  return (
    <List
      attrs={attrs}
      data={data}
      json={args.json}
      withoutHeaders={!(args.headers ?? (attrs.length > 1))}
    />
  );
});
