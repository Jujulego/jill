import { merge } from 'webpack-merge';

import common from './webpack.common';

// Config
export default merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
});
