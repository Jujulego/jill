import { PackageManager, Project } from '@jujulego/jill-core';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import { createContext, useContext, useEffect, useState } from 'react';

import { commandWrapper } from '../wrapper';

// Context
const ProjectContext = createContext<Project | null>(null);

// Hooks
export function useProject(): Project {
  const prj = useContext(ProjectContext);

  if (!prj) {
    throw new Error('To use the useProject hook you must wrap your command with the withProject wrapper');
  }

  return prj;
}

// Wrapper
export const withProject = commandWrapper(
  'withProject',
  (yargs) => yargs
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory'
    })
    .option('package-manager', {
      choices: ['yarn', 'npm'],
      default: undefined as PackageManager | undefined,
      type: 'string',
      description: 'Force package manager'
    }),
  (props, useArgs, Wrapped) => {
    const args = useArgs();

    // State
    const [project, setProject] = useState<Project>();

    // Effects
    useEffect(() => void (async () => {
      const dir = args.project ?? await Project.searchProjectRoot(process.cwd());

      setProject(await new Project(dir, {
        packageManager: args['package-manager']
      }));
    })(), [args]);

    // Render
    if (!project) {
      return <Text><Spinner /> Loading project ...</Text>;
    }

    return (
      <ProjectContext.Provider value={project}>
        <Wrapped {...props} />
      </ProjectContext.Provider>
    );
  }
);
