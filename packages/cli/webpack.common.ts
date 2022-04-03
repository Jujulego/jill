import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import WebpackNodeExternals from 'webpack-node-externals';

// Config
const config: webpack.Configuration = {
  entry: {
    main: './src/main'
  },
  output: {
    clean: true,
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    moduleIds: 'deterministic',
  },
  performance: {
    maxAssetSize: 500000,
    maxEntrypointSize: 1000000,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules|mocks/,
        use: 'babel-loader',
      }
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  externalsPresets: {
    node: true
  },
  externals: [
    WebpackNodeExternals({
      modulesFromFile: {
        fileName: path.join(__dirname, 'package.json'),
        includeInBundle: ['devDependencies'],
        excludeFromBundle: ['dependencies']
      } as never
    }),
  ],
  plugins: [
    new ForkTsCheckerWebpackPlugin()
  ],
};

export default config;
