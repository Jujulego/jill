import { Workspace } from '@jujulego/jill-core';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import { createContext, useContext, useEffect, useState } from 'react';

import { commandWrapper } from '../wrapper';
import { useProject } from './project.wrapper';
import logSymbols from 'log-symbols';

// Context
const WorkspaceContext = createContext<Workspace | null>(null);

// Hooks
export function useWorkspace(): Workspace {
  const wks = useContext(WorkspaceContext);

  if (!wks) {
    throw new Error('To use the useWorkspace hook you must wrap your command with the withWorkspace wrapper');
  }

  return wks;
}

// Wrapper
export const withWorkspace = commandWrapper(
  'withWorkspace',
  (yargs) => yargs
    .option('workspace', {
      alias: 'w',
      type: 'string',
      desc: 'Workspace to use'
    }),
  (props, useArgs, Wrapped) => {
    const { workspace } = useArgs();
    const project = useProject();

    // State
    const [wks, setWks] = useState<Workspace | null>();

    // Effects
    useEffect(() => void (async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWks(await (workspace ? project.workspace(workspace) : project.currentWorkspace()));
    })(), [workspace]);

    // Render
    if (wks === undefined) {
      return (
        <Text>
          <Spinner /> Loading "{workspace || '.'}" workspace
        </Text>
      );
    }

    if (wks === null) {
      return (
        <Text color="red">
          {logSymbols.error} Workspace "{workspace || '.'}" not found
        </Text>
      );
    }

    return (
      <WorkspaceContext.Provider value={wks}>
        <Wrapped {...props} />
      </WorkspaceContext.Provider>
    );
  }
);
