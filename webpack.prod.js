import webpack from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common.js';

// Config
const prodConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new webpack.EnvironmentPlugin({
      DEV: false, // enforce remove of ink devtools
    })
  ]
});

export default prodConfig;
