import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
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
    library: {
      type: 'module'
    },
    path: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'dist'),
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
  externalsType: 'node-commonjs',
  externalsPresets: {
    node: true,
  },
  externals: [
    nodeExternals({
      importType: (name) => `${['@jujulego/event-tree', '@jujulego/tasks', 'avj', 'inversify-inject-decorators', 'slugify'].includes(name) ? 'node-commonjs' : 'module'} ${name}`,
      modulesFromFile: {
        include: ['dependencies']
      },
    }),
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
