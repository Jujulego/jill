import { EnvironmentPlugin } from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

// Config
const prodConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new EnvironmentPlugin({
      DEV: false
    })
  ]
});

export default prodConfig;
