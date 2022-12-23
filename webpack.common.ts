import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import type { Configuration, Entry } from 'webpack';
import nodeExternals from 'webpack-node-externals';
import fs from 'node:fs/promises';
import path from 'node:path';

// Config
const commonConfig: Configuration = {
  devtool: 'source-map',
  target: 'node',
  entry: async () => {
    const entry: Entry = {
      main: './src/main',
    };

    const commands = await fs.readdir('./src/commands', { withFileTypes: true });

    for (const command of commands) {
      if (!command.isFile()) continue;

      const filename = path.parse(command.name);

      entry[`commands-${filename.name}`] = {
        import: `./src/commands/${filename.base}`,
        filename: `commands/${filename.name}.js`,
        library: { type: 'commonjs2' },
      };
    }

    return entry;
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist'),
    enabledLibraryTypes: ['commonjs2'],
  },
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /[\\/]node_modules[\\/]/,
        use: 'swc-loader',
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  externals: [
    nodeExternals({
      modulesFromFile: {
        includeInBundle: 'devDependencies',
        excludeFromBundle: 'dependencies',
      } as any
    }),
  ],
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ]
};

export default commonConfig;
