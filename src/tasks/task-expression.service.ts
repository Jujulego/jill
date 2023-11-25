import { Logger } from '@jujulego/logger';
import { FallbackGroup, type GroupTask, ParallelGroup, SequenceGroup, type Task } from '@jujulego/tasks';
import { inject } from 'inversify';
import moo from 'moo';

import { Service } from '@/src/modules/service.ts';
import { type Workspace, type WorkspaceRunOptions } from '@/src/project/workspace.ts';
import { TaskExpressionError, TaskSyntaxError } from './errors.ts';

// Interfaces
export interface TaskNode {
  script: string;
  args: string[];
}

export interface GroupNode {
  operator: string;
  tasks: (TaskNode | GroupNode)[];
}

export interface TaskTree {
  roots: (TaskNode | GroupNode)[];
}

// Service
@Service()
export class TaskExpressionService {
  // Statics
  static isTaskNode(node: TaskNode | GroupNode): node is TaskNode {
    return 'script' in node;
  }

  private static _sequenceOperatorWarn = true;

  // Constructor
  constructor(
    @inject(Logger)
    private readonly _logger: Logger
  ) {}

  // Methods
  private _lexer(): moo.Lexer {
    return moo.states({
      task: {
        lparen: '(',
        whitespace: /[ \t]+/,
        script: { match: /[-_:a-zA-Z0-9]+/, push: 'operatorOrArgument' },
        string: [
          { // single cotted
            match: /'(?:\\['\\]|[^\r\n'\\])+'/,
            push: 'operator',
            value: x => x.slice(1, -1).replace(/\\(['\\])/g, '$1')
          },
          { // double cotted
            match: /"(?:\\["\\]|[^\r\n"\\])+"/,
            push: 'operator',
            value: x => x.slice(1, -1).replace(/\\(["\\])/g, '$1')
          }
        ],
      },
      operator: {
        rparen: ')',
        whitespace: /[ \t]+/,
        operator: { match: ['->', '&&', '//', '||'], pop: 1 },
      },
      operatorOrArgument: {
        rparen: ')',
        whitespace: /[ \t]+/,
        operator: { match: ['->', '&&', '//', '||'], pop: 1 },
        argument: [
          { match: /[-_:a-zA-Z0-9]+/ },
          { // single cotted
            match: /'(?:\\['\\]|[^\r\n'\\])+'/,
            value: x => x.slice(1, -1).replace(/\\(['\\])/g, '$1')
          },
          { // double cotted
            match: /"(?:\\["\\]|[^\r\n"\\])+"/,
            value: x => x.slice(1, -1).replace(/\\(["\\])/g, '$1')
          }
        ],
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

      // Handle argument
      if (token.type === 'argument') {
        if (!node) {
          throw new TaskSyntaxError(lexer.formatError(token, 'Unexpected argument'));
        } else if (TaskExpressionService.isTaskNode(node)) {
          node.args.push(token.value);
        } else {
          const lastTask = node.tasks[node.tasks.length - 1];

          if (!lastTask || !TaskExpressionService.isTaskNode(lastTask)) {
            throw new TaskSyntaxError(lexer.formatError(token, 'Unexpected argument'));
          } else {
            lastTask.args.push(token.value);
          }
        }

        continue;
      }

      // Handle operator
      if (token.type === 'operator') {
        const operator = token.value;

        if (!node) {
          throw new TaskSyntaxError(lexer.formatError(token, 'Unexpected operator'));
        } else if (TaskExpressionService.isTaskNode(node)) {
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

      if (token.type === 'script') {
        child = { script: token.value, args: [] };
      } else if (token.type === 'string') {
        const [script, ...args] = token.value.split(/ +/);
        child = { script, args };
      } else if (token.type === 'lparen') {
        const res = this._nextNode(lexer, i+1);

        if (!res) {
          throw new TaskSyntaxError(lexer.formatError(token, 'Empty group found'));
        }

        child = res;
      } else {
        throw new TaskSyntaxError(lexer.formatError(token, 'Unexpected token'));
      }

      if (!node) {
        node = child;
      } else if (TaskExpressionService.isTaskNode(node)) {
        throw new TaskSyntaxError(lexer.formatError(token, 'Unexpected token, expected an operator'));
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

  *extractScripts(node: TaskTree | TaskNode | GroupNode): Generator<string> {
    if ('roots' in node) {
      for (const child of node.roots) {
        yield* this.extractScripts(child);
      }
    } else if (TaskExpressionService.isTaskNode(node)) {
      yield node.script;
    } else {
      for (const child of node.tasks) {
        yield* this.extractScripts(child);
      }
    }
  }

  async buildTask(node: TaskNode | GroupNode, workspace: Workspace, opts?: WorkspaceRunOptions): Promise<Task> {
    if (TaskExpressionService.isTaskNode(node)) {
      const task = await workspace.run(node.script, node.args, opts);

      if (!task) {
        throw new TaskExpressionError(`Workspace ${workspace.name} have no ${node.script} script`);
      }

      return task;
    } else {
      let group: GroupTask;

      if (node.operator === '//') {
        group = new ParallelGroup('In parallel', { workspace }, {
          logger: this._logger,
        });
      } else if (node.operator === '||') {
        group = new FallbackGroup('Fallbacks', { workspace }, {
          logger: this._logger,
        });
      } else {
        if (node.operator === '->' && TaskExpressionService._sequenceOperatorWarn) {
          this._logger.warn('Sequence operator -> is deprecated in favor of &&. It will be removed in a next major release.');
          TaskExpressionService._sequenceOperatorWarn = true;
        }

        group = new SequenceGroup('In sequence', { workspace }, {
          logger: this._logger,
        });
      }

      for (const child of node.tasks) {
        group.add(await this.buildTask(child, workspace, opts));
      }

      return group;
    }
  }
}
