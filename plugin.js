module.exports = {
  builder(yargs) {
    yargs.command('test', 'toto', {}, () => console.log('this is a test plugin !'));
  }
};
