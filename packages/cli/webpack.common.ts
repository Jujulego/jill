import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

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
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
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
  externals: {
    '@jujulego/jill-core': 'commonjs2 @jujulego/jill-core',
    '@jujulego/jill-common': 'commonjs2 @jujulego/jill-common',
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin()
  ],
};

export default config;
