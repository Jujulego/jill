import { EnvironmentPlugin } from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

// Config
const prodConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new EnvironmentPlugin({
      DEV: false, // enforce remove of ink devtools
    })
  ]
});

export default prodConfig;
