var path = require('path');
var testHelperPath = path.resolve('src/testHelper.js')

var timeoutArg = process.argv.filter((arg) => arg.indexOf('jasmine-timeout') > 0);
var timeout = timeoutArg.length > 0
  ? parseInt(timeoutArg[0].split('=')[1], 10)
  : 5000;

process.env.BABEL_ENV = 'development';

module.exports = function(config) {
  config.set({

    // https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      testHelperPath
    ],

    preprocessors: {
      [testHelperPath]: [ 'webpack', 'sourcemap' ]
    },

    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            oneOf: [
              // Process application JS with Babel.
              // The preset includes JSX, Flow, TypeScript, and some ESnext features.
              {
                test: /\.(js|mjs|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                  presets: ['react-app']
                },
              },
              {
                test: /\.svg$/,
                // Load SVG as ReactComponent
                use: ['@svgr/webpack', 'url-loader'],
              },
              {
                test: /\.scss$/,
                use: [
                  "style-loader", // creates style nodes from JS strings
                  "css-loader", // translates CSS into CommonJS
                  "sass-loader" // compiles Sass to CSS, using Node Sass by default
                ]
              }
            ]
          }
        ]
      }
    },

    webpackMiddleware: {
      // only output webpack error messages
      // stats: 'errors-only'
      noInfo: true //please don't spam the console when running in karma!
    },

    // Jasmine configuration
    client: {
      jasmine: {
        random: true,
        failFast: false,
        timeoutInterval: timeout
      }
    },

    // TODO Enable Instanbul coverage reporting

    junitReporter: {
      outputDir: './test-results/karma',
      outputFile: 'junit.xml',
      useBrowserName: true
    },

    browserConsoleLogOptions: {
      level: 'disable'
    }
  })
};
