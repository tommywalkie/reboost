const {
  start,
  ReplacePlugin,
  FilePlugin,
  SassPlugin,
  UsePlugin
} = require('reboost');

start({
  entries: [
    ['./src/index.js', './public/dist/main.js', 'coolLib']
  ],
  contentServer: {
    root: './public'
  },
  plugins: [
    UsePlugin({
      test: /.png$/,
      use: FilePlugin()
    }),
    SassPlugin({
      sassOptions: {
        indentWidth: 4
      }
    }),
    ReplacePlugin({
      ADJECTIVE: JSON.stringify('cool')
    })
  ],
  // showResponseTime: true,

  // Don't use these options, these are only for debugging
  dumpCache: true,
  debugMode: true,
});