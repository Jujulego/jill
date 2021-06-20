import { Project } from '@jujulego/jill-core';

(async () => {
  const project = new Project('../..');

  for await (const wks of project.workspaces()) {
    console.log(wks.name);
  }
})();
