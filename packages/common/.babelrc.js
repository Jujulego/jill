module.exports = (api) => ({
  presets: [
    ['@babel/preset-env', {
      bugfixes: true,
      modules: api.env('esm') ? false : 'cjs'
    }],
    ["@babel/preset-react", {
      "runtime": "automatic"
    }]
  ],
  plugins: [
    '@babel/proposal-class-properties'
  ]
});
