module.exports = (api) => ({
  presets: [
    ['@babel/preset-env', {
      bugfixes: true,
      modules: api.env('esm') ? false : 'cjs'
    }]
  ],
  plugins: [
    '@babel/proposal-class-properties'
  ]
});
