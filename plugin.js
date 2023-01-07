module.exports = {
  builder(parser) {
    parser.command('test', 'toto', {}, () => console.log('this is a test plugin !'));
  }
};
