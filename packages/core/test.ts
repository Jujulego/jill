import { Git } from './src/git';

(async () => {
  console.log(await Git.listBranches());
})();
