import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';
import path from 'node:path';
import url from 'node:url';

/**
 * Config
 * @type import('webpack').Configuration
 */
const commonConfig = {
  devtool: 'source-map',
  target: 'browserslist:node 16',
  experiments: {
    outputModule: true,
  },
  entry: {
    index: {
      import: './src/index'
    },
    main: {
      import: './src/main',
    },
  },
  output: {
    module: true,
    path: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'dist'),
    library: {
      type: 'module'
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
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx']
  },
  externals: [
    'react-devtools-core',
    'ws', // used only by ink for devtools
  ],
  externalsPresets: {
    node: true,
  },
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
