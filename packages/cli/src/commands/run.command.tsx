import { TaskSetSpinner } from '@jujulego/jill-common';
import { TaskSet, WorkspaceDepsMode } from '@jujulego/jill-core';
import { useEffect, useRef } from 'react';

import { command } from '../command';
import { withProject } from '../wrappers/project.wrapper';
import { useWorkspace, withWorkspace } from '../wrappers/workspace.wrapper';

// Command
const { wrapper, useArgs } = withProject(withWorkspace(command({
  name: 'run <script>',
  description: 'Run script inside workspace',
  builder: (yargs) => yargs
    .positional('script', { type: 'string', demandOption: true })
    .option('deps-mode', {
      choice: ['all', 'prod', 'none'],
      default: 'all' as WorkspaceDepsMode,
      desc: 'Dependency selection mode:\n' +
        ' - all = dependencies AND devDependencies\n' +
        ' - prod = dependencies\n' +
        ' - none = nothing'
    })
})));

// Component
export const RunCommand = wrapper(function InfoCommand() {
  const { script, depsMode, '--': rest = [] } = useArgs();
  const wks = useWorkspace();

  // Refs
  const tasks = useRef(new TaskSet());

  // Effects
  useEffect(() => void (async () => {
    const task = await wks.run(script, rest.map(arg => arg.toString()), {
      buildDeps: depsMode
    });

    tasks.current.add(task);
    tasks.current.start();
  })(), [script, depsMode, rest, wks]);

  // Render
  return (
    <TaskSetSpinner taskSet={tasks.current} />
  );
});
