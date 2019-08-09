const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

exports.lintJS = ({ include, exclude, options }) => ({
  module: {
    rules: [
      {
        test: /\.js$/,
        include,
        exclude,
        enforce: 'pre',
        loader: 'eslint-loader',
        options,
      },
    ],
  },
});

exports.loadJS = ({ include, exclude, options } = {}) => ({
  module: {
    rules: [
      {
        test: /\.js$/,

        include,
        exclude,

        loader: 'babel-loader',
        options,
      },
    ],
  },
});

exports.loadImages = () => ({
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  }
});

exports.minifyJS = options => ({
  optimization: {
    minimizer: [
      new TerserPlugin(options)
    ],
  },
});

// module.storybookCode = () => ({
//   module: {
//     rules: [{
//       test: /\.Examples\.js?$/,
//       loaders: [require.resolve('@storybook/addon-storysource/loader')],
//       include: path.resolve(__dirname, './src'),
//       enforce: 'pre',
//     }]
//   }
// });
