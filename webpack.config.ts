import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

// Config
const devConfig = merge(commonConfig, {
  mode: 'development',
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ]
});

export default devConfig;
