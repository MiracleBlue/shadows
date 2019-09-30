const {
  createConfig,
  typescript,
  setMode,
  entryPoint,
  setOutput,
  sourceMaps,
  customConfig
} = require('webpack-blocks');
const nodeExternals = require('webpack-node-externals');

const mode = setMode(process.env.NODE_ENV || 'development');

const libraryOutput = (filename) => setOutput({
  path: __dirname,
  filename,
  library: '@valkyrie-js/shadows',
  libraryTarget: 'umd'
})

module.exports = createConfig([
  mode,
  customConfig({ target: 'node' }),
  typescript(),
  entryPoint('./src/index.ts'),
  libraryOutput('lib/node/index.js'),
  customConfig({
    externals: [nodeExternals({
      // modulesFromFile: true
    })]
  }),
  sourceMaps('source-maps')
])
