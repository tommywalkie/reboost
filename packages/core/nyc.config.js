const baseConfig = require('../../nyc.config');

module.exports = {
  ...baseConfig,
  include: [
    'src/**/*.ts'
  ]
}
