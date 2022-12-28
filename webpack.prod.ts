import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

// Config
const prodConfig = merge(commonConfig, {
  mode: 'production',
});

export default prodConfig;
