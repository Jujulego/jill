import { command } from '../command';
import { withProject } from '../wrappers/project.wrapper';
import { useWorkspace, withWorkspace } from '../wrappers/workspace.wrapper';
import { WorkspaceTree } from '../components/WorkspaceTree';

// Command
const { wrapper } = withProject(withWorkspace(command({
  name: 'tree',
  description: 'Print workspace dependency tree',
  builder: (yargs) => yargs
})));

// Component
export const TreeCommand = wrapper(function InfoCommand() {
  const wks = useWorkspace();

  // Render
  return (
    <WorkspaceTree workspace={wks} />
  );
});
