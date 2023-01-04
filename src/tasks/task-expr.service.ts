import { GroupTask, ParallelGroup, SequenceGroup, Task } from '@jujulego/tasks';
import { injectable } from 'inversify';
import moo from 'moo';

import { Workspace, WorkspaceRunOptions } from '@/src/project/workspace';

import { container } from '../inversify.config';
import { Logger } from '../logger.service';

// Interfaces
export interface TaskNode {
  script: string;
}

export interface GroupNode {
  operator: string;
  tasks: (TaskNode | GroupNode)[];
}

export interface TaskTree {
  roots: (TaskNode | GroupNode)[];
}

// Service
@injectable()
export class TaskExprService {
  // Statics
  static isTaskNode(node: TaskNode | GroupNode): node is TaskNode {
    return 'script' in node;
  }

  // Methods
  private _lexer(): moo.Lexer {
    return moo.states({
      task: {
        lparen: '(',
        whitespace: /[ \t]+/,
        string: [
          // inline
          { match: /[:a-zA-Z0-9]+/, push: 'operator' },
          // single cotted
          {
            match: /'(?:\\['\\]|[^\n'\\])+'/,
            push: 'operator',
            value: x => x.slice(1, -1).replace(/\\(['\\])/g, '$1')
          },
          // double cotted
          {
            match: /"(?:\\["\\]|[^\n"\\])+"/,
            push: 'operator',
            value: x => x.slice(1, -1).replace(/\\(["\\])/g, '$1')
          }
        ],
      },
      operator: {
        whitespace: /[ \t]+/,
        rparen: ')',
        operator: { match: ['->', '//'], pop: 1 },
      }
    });
  }

  private _nextNode(lexer: moo.Lexer, i = 0): TaskNode | GroupNode | null {
    let node: TaskNode | GroupNode | null = null;

    for (const token of lexer) {
      // Ignore whitespaces
      if (token.type === 'whitespace') {
        continue;
      }

      // rparen = end of group
      if (token.type === 'rparen') {
        break;
      }

      // Handle operator
      if (token.type === 'operator') {
        const operator = token.value;

        if (!node) {
          throw new Error(lexer.formatError(token, 'Unexpected operator'));
        } else if (TaskExprService.isTaskNode(node)) {
          node = { operator, tasks: [node] };

          continue;
        } else {
          if (node.operator !== operator) {
            node = { operator, tasks: [node] };
          }

          continue;
        }
      }

      // Build "child"
      let child: TaskNode | GroupNode;

      if (token.type === 'string') {
        child = { script: token.value };
      } else if (token.type === 'lparen') {
        const res = this._nextNode(lexer, i+1);

        if (!res) {
          throw new Error(lexer.formatError(token, 'Empty group found'));
        }

        child = res;
      } else {
        throw new Error(lexer.formatError(token, 'Unexpected token'));
      }

      if (!node) {
        node = child;
      } else if (TaskExprService.isTaskNode(node)) {
        throw new Error(lexer.formatError(token, 'Unexpected token, expected an operator'));
      } else {
        node.tasks.push(child);
      }
    }

    return node;
  }

  parse(expr: string): TaskTree {
    const lexer = this._lexer().reset(expr);

    const tree: TaskTree = {
      roots: [],
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const node = this._nextNode(lexer);

      if (node) {
        tree.roots.push(node);
      } else {
        break;
      }
    }

    return tree;
  }

  async buildTask(node: TaskNode | GroupNode, workspace: Workspace, opts?: WorkspaceRunOptions): Promise<Task> {
    if (TaskExprService.isTaskNode(node)) {
      return workspace.run(node.script, [], opts);
    } else {
      let group: GroupTask;

      if (node.operator === '//') {
        group = new ParallelGroup('In parallel', {}, {
          logger: container.get(Logger),
        });
      } else {
        group = new SequenceGroup('In sequence', {}, {
          logger: container.get(Logger),
        });
      }

      for (const child of node.tasks) {
        group.add(await this.buildTask(child, workspace, opts));
      }

      return group;
    }
  }
}

container.bind(TaskExprService).toSelf().inSingletonScope();
