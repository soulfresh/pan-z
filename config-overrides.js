module.exports = function override(config, env) {
  if (env !== 'production') {
    // cheap-module-eval-source-map
    // not always working
    //
    // eval-source-map
    // not always working
    //
    // source-map
    // also not always working
    //
    // inline-module-source-map
    // also not always working
    //
    // cheap-module-inline-source-map
    config = { ...config, ...{ devtool: 'cheap-module-inline-source-map' } };
  }
  return config;
};
