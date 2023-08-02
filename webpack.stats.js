import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common.js';

// Config
const statsConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new BundleAnalyzerPlugin()
  ]
});

export default statsConfig;
