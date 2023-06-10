import { Newline, Text, type TextProps } from 'ink';
import { type ReactElement, useEffect, useState } from 'react';

import { type Workspace } from '@/src/project/workspace';

// Types
export interface WorkspaceTreeProps {
  workspace: Workspace;
  dev?: boolean;
  level?: ReactElement;
}

// Utils
const style = (dev: boolean): TextProps => ({ color: dev ? 'blue' : '' });

// Component
export default function WorkspaceTree(props: WorkspaceTreeProps) {
  const { workspace: wks, dev = false, level = '' } = props;

  // State
  const [deps, setDeps] = useState<[Workspace, boolean | null][]>([]);

  // Effects
  useEffect(() => void (async () => {
    const deps: [Workspace, boolean | null][] = [];

    for await (const dep of wks.dependencies()) {
      deps.push([dep, null]);
    }

    for await (const dep of wks.devDependencies()) {
      deps.push([dep, true]);
    }

    setDeps(deps);
  })(), [wks]);

  // Render
  return (
    <Text>
      <Text {...style(dev)}>{wks.name}</Text>
      {wks.version && <Text color="grey">@{wks.version}</Text>}
      {(deps.length > 0) && <Newline/>}

      {deps.map(([dep, isDev], idx) => (
        <Text key={dep.name}>
          {level}<Text {...style(dev)}>{idx === deps.length - 1 ? '└' : '├'}─{' '}</Text>
          <WorkspaceTree
            workspace={dep}
            dev={isDev ?? dev}
            level={<>{level}<Text {...style(dev)}>{idx === deps.length - 1 ? ' ' : '│'}{'  '}</Text></>}
          />
          {(idx < deps.length - 1) && <Newline/>}
        </Text>
      ))}
    </Text>
  );
}
