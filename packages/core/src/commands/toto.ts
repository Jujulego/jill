import { Git } from '../git';
import { defineCommand } from '../utils';

// Command
export default defineCommand({
  command: 'toto',
  describe: 'toto',
  builder: (yargs) => yargs
    .option('query', {
      alias: 'q',
      type: 'string'
    }),
  async handler(args) {
    const branches = await Git.listBranches(args.query ? [args.query] : []);

    for (const branch of branches) {
      console.log(branch);
    }
  }
});
