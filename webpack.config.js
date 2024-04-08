// webpack.config.js
const path = require('path');

module.exports = {
  entry: './app.js',
  output: {
    filename: 'app.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
