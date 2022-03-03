import { AffectedFilter, Filter, Pipeline } from '@jujulego/jill-common';
import { TaskSet, WorkspaceDepsMode } from '@jujulego/jill-core';
import { useApp } from 'ink';
import { useEffect, useRef } from 'react';

import { command } from '../command';
import { TaskSetSpinner } from '../components/TaskSetSpinner';
import { useProject, withProject } from '../wrappers/project.wrapper';

// Command
const { wrapper, useArgs } = withProject(command({
  name: 'each <script>',
  description: 'Run script on selected workspaces',
  builder: yargs => yargs
    .positional('script', { type: 'string', demandOption: true })
    .option('deps-mode', {
      choice: ['all', 'prod', 'none'],
      default: 'all' as WorkspaceDepsMode,
      desc: 'Dependency selection mode:\n' +
        ' - all = dependencies AND devDependencies\n' +
        ' - prod = dependencies\n' +
        ' - none = nothing'
    })
    .option('private', {
      type: 'boolean',
      group: 'Filters:',
      desc: 'Print only private workspaces',
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
}));

// Component
export const EachCommand = wrapper(function EachCommand() {
  const args = useArgs();
  const project = useProject();
  const { exit } = useApp();

  // Refs
  const tasks = useRef(new TaskSet());

  // Effects
  useEffect(() => void (async () => {
    // Setup pipeline
    const pipeline = new Pipeline();
    pipeline.add(Filter.scripts([args.script]));

    if (args.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(args.private));
    }

    if (args.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        args.affected,
        args.affectedRevFallback,
        args.affectedRevSort
      ));
    }

    // Filter and create tasks
    for await (const wks of pipeline.filter(project.workspaces())) {
      tasks.current.add(await wks.run(args.script, args['--']?.map(arg => arg.toString()), {
        buildDeps: args.depsMode
      }));
    }

    tasks.current.start();

    // Result end code
    const [result] = await tasks.current.waitFor('finished');

    if (result.failed) {
      exit(new Error('Some tasks has failed'));
    }
  })(), [args]);

  // Render
  return (
    <TaskSetSpinner taskSet={tasks.current} />
  );
});
