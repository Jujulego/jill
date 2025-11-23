import { Newline, Text, type TextProps } from 'ink';
import Spinner from 'ink-spinner';
import { filter$, once$, pipe$, var$ } from 'kyrielle';
import { type ReactElement, Suspense, use, useCallback, useEffect, useRef } from 'react';
import type { Workspace } from '../projects/workspace.js';

// Component
export function WorkspaceTree(props: WorkspaceTreeProps) {
  const { workspace, dev = false, level = '' } = props;

  // Render
  const style = workspaceStyle(dev);

  return (
    <Text>
      <Text {...style}>{workspace.name}</Text>
      {workspace.version && <Text color="grey">@{workspace.version}</Text>}

      <Suspense fallback={
        <>
          <Newline/>
          <Text>{level}<Text {...style} dimColor>└─ Loading tree<Spinner type="simpleDots" /></Text></Text>
        </>
      }>
        <WorkspaceDependencies {...props} />
      </Suspense>
    </Text>
  );
}

function WorkspaceDependencies(props: WorkspaceTreeProps) {
  const { workspace, dev = false, level = '', onLoaded } = props;
  const deps = use(workspaceDeps(workspace));

  const count = useRef(var$(deps.length));
  const handleLoaded = useCallback(() => {
    const cnt = count.current.defer();

    if (cnt > 0) {
      count.current.mutate(cnt - 1);
    }
  }, [count]);
  useEffect(() => {
    if (!onLoaded) return;

    if (count.current.defer() === 0) {
      onLoaded();
    } else {
      const sub = once$(pipe$(count.current, filter$((v) => v === 0)), onLoaded);
      return sub.unsubscribe;
    }
  }, [count, onLoaded]);

  // Render
  if (!deps.length) {
    return null;
  }

  const style = workspaceStyle(dev);

  return (<>
    <Newline />
    { deps.map(([dep, isDev], idx) => (
      <Text key={dep.name}>
        {level}<Text {...style}>{idx === deps.length - 1 ? '└' : '├'}─{' '}</Text>
        <WorkspaceTree
          workspace={dep}
          dev={isDev ?? dev}
          level={<>{level}<Text {...style}>{idx === deps.length - 1 ? ' ' : '│'}{'  '}</Text></>}
          onLoaded={handleLoaded}
        />
        {(idx < deps.length - 1) && <Newline/>}
      </Text>
    )) }
  </>);
}

// Types
export interface WorkspaceTreeProps {
  readonly workspace: Workspace;
  readonly dev?: boolean;
  readonly level?: ReactElement;
  readonly onLoaded?: () => void;
}

type WorkspaceDep = [Workspace, boolean | null];

// Utils
const WORKSPACE_DEPS = new Map<string, Promise<WorkspaceDep[]>>;

async function _workspaceDeps(workspace: Workspace): Promise<WorkspaceDep[]> {
  const deps: WorkspaceDep[] = [];

  for await (const dep of workspace.dependencies()) {
    deps.push([dep, null]);
  }

  for await (const dep of workspace.devDependencies()) {
    deps.push([dep, true]);
  }

  return deps;
}

function workspaceDeps(workspace: Workspace): Promise<WorkspaceDep[]> {
  let prom = WORKSPACE_DEPS.get(workspace.root);

  if (!prom) {
    prom = _workspaceDeps(workspace);
    WORKSPACE_DEPS.set(workspace.root, prom);
  }

  return prom;
}

function workspaceStyle(dev: boolean): TextProps {
  return ({ color: dev ? 'blue' : '' });
}
