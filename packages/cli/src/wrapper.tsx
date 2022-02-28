import { PackageManager, Project } from '@jujulego/jill-core';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import { createContext, FC, useContext, useEffect, useState } from 'react';

import { GlobalArgs } from './application';
import { Command, useArgs } from './application.context';
import { CommandUtils } from './command';

// Types
export interface ProjectArgs {
  project: string | undefined;
  'package-manager': PackageManager | undefined;
}

// Context
const ProjectContext = createContext<Project | null>(null);

// Hooks
export function useProject(): Project {
  return useContext(ProjectContext)!;
}

// Wrapper
export function withProject<A>(utils: CommandUtils<A>): CommandUtils<A & ProjectArgs> {
  return {
    useArgs: () => useArgs<A & ProjectArgs & GlobalArgs>(),
    wrapper: function <P>(Component: FC<P>) {
      const Wrapped = utils.wrapper(Component);

      // Update builder
      const command: Command<A & ProjectArgs> = {
        ...Wrapped.command,
        builder: (yargs) => Wrapped.command.builder(yargs)
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
          })
      };

      // Component wrapper
      const Wrapper: FC<P> = (props) => {
        const args = useArgs<ProjectArgs>();

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
          return (
            <Text>
              <Spinner />
              {' '} Loading project ...
            </Text>
          );
        }

        return (
          <ProjectContext.Provider value={project}>
            <Wrapped {...props} />
          </ProjectContext.Provider>
        );
      };

      Wrapper.displayName = `withProject(${Wrapped.displayName || Wrapped.name})`;

      return Object.assign(Wrapper, { command });
    }
  };
}
