module.exports = function override(config, env) {
  if (env !== 'production') {
    config = { ...config, ...{ devtool: 'cheap-module-eval-source-map' } };
  }
  return config;
}
