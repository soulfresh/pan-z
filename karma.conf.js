const merge = require('webpack-merge');

const webpackConfig = merge([
  {
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
    devtool: '#inline-source-map',
    mode: 'none'
  },
  require('./webpack.parts').loadJS({
    exclude: /node_modules/
  })
]);

var timeoutArg = process.argv.filter((arg) => arg.indexOf('jasmine-timeout') > 0);
var timeout = timeoutArg.length > 0
  ? parseInt(timeoutArg[0].split('=')[1], 10)
  : 5000;

process.env.BABEL_ENV = 'development';

const debug = process.argv.indexOf('debug') > 0;
const reporters = ['mocha'];
if (debug) reporters.push('coverage');

module.exports = config => {
  const src = './src/testHelper.js';
  const tests = './src/**/*.spec.js';

  process.env.BABEL_ENV = 'karma';

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: reporters,

    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'lcov' },
        { type: 'text-summary' }
      ]
    },

    // list of files / patterns to load in the browser
    files: [
      src
    ],

    // list of files to exclude
    exclude: [
      './src/**/*.story.js',
      './lib'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      [src]: ['webpack', 'sourcemap']
    },

    webpack: webpackConfig,

    plugins: [
      'karma-mocha-reporter',
      'karma-coverage',
      'karma-webpack',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-sourcemap-loader',
      'karma-jasmine'
    ],

    webpackMiddleware: {
      // only output webpack error messages
      // stats: 'errors-only'
      noInfo: true //please don't spam the console when running in karma!
    },

    browserConsoleLogOptions: {
      level: 'disable'
    },

    // Jasmine configuration
    client: {
      jasmine: {
        random: true,
        failFast: false,
        timeoutInterval: timeout
      }
    },

    // web server port
    port: 9876,

    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
