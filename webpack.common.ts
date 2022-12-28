import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Configuration } from 'webpack';
import path from 'node:path';

// Config
const commonConfig: Configuration = {
  devtool: 'source-map',
  target: 'node',
  entry: './src/main',
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist')
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
    'ws', // used only by ink for devtools
  ],
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ]
};

export default commonConfig;
