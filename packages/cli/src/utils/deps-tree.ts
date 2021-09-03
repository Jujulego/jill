import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

// Functions
async function printTree(wks: Workspace, level: string, dev: boolean, printed: Set<string>) {
  const workspaces: [Workspace, boolean][] = [];

  for await (const dep of wks.dependencies()) {
    workspaces.push([dep, dev]);
  }

  for await (const dep of wks.devDependencies()) {
    workspaces.push([dep, true]);
  }

  for (let i = 0; i < workspaces.length; ++i) {
    const [dep, isDev] = workspaces[i];
    const isPrinted = printed.has(dep.cwd);
    const isLast = i === workspaces.length - 1;

    // Format
    let name = dep.name;
    if (isDev) name = chalk.grey(`${name} (dev)`);
    if (isPrinted) name = chalk.italic(name);

    const branchFmt = dev ? chalk.grey : (s: string) => s;

    console.log(`${level}${branchFmt(`${isLast ? '└' : '├' }─ `)}${name}`);

    // Print deps of dep
    if (!isPrinted) {
      printed.add(dep.cwd);
      await printTree(dep, level + (isLast ? '   ' : branchFmt('│  ')), isDev, printed);
    }
  }
}

export async function printDepsTree(wks: Workspace): Promise<void> {
  console.log(chalk`{bold Dependencies:}`);
  const printed = new Set([wks.name]);

  await printTree(wks, '', false, printed);

  if (printed.size === 1) {
    console.log(chalk.grey(`   No dependencies for ${wks.name}`));
  }
}