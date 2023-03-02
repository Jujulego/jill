import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Config
const commonConfig = {
  devtool: 'source-map',
  target: 'node',
  entry: {
    index: {
      import: './src/index'
    },
    main: {
      import: './src/main',
    },
  },
  output: {
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist'),
    library: {
      type: 'commonjs2'
    },
    clean: {
      keep: /(\.d\.ts|\.tsbuildinfo)$/
    },
  },
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      chunks: 'all'
    }
  },
  experiments: {
    topLevelAwait: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /[\\/]node_modules[\\/]/,
        use: 'swc-loader',
      },
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    },
  },
  externals: [
    'react-devtools-core',
    'ws', // used only by ink for devtools
  ],
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        build: true,
        configFile: './tsconfig.build.json',
        mode: 'write-dts'
      }
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^import-fresh$/
    })
  ]
};

export default commonConfig;
