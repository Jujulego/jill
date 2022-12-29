import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

// Config
const statsConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new BundleAnalyzerPlugin() as never
  ]
});

export default statsConfig;
