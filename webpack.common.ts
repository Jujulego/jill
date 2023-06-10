import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { type Configuration, IgnorePlugin } from 'webpack';
import path from 'node:path';

// Config
const commonConfig: Configuration = {
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
    path: path.resolve(__dirname, 'dist'),
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
    new IgnorePlugin({
      resourceRegExp: /^import-fresh$/
    })
  ]
};

export default commonConfig;
