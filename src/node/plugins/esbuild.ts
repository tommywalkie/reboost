import esbuild, { Target, Loader } from 'esbuild';

import { ReboostPlugin } from '../index';

interface esbuildOptions {
  /**
   * Factory function to use with JSX
   * @default React.createElement
   */
  jsxFactory?: string;
  /**
   * JSX fragment
   * @default React.Fragment
   */
  jsxFragment?: string;
  /** ECMAScript version to target */
  target?: Target;
}

let esbuildService: esbuild.Service;

export const PluginName = 'core-esbuild-plugin';
export const esbuildPlugin = (options: esbuildOptions = {}): ReboostPlugin => {
  const loaderMap = {
    js: 'jsx',
    jsx: 'jsx',
    mjs: 'jsx',
    ts: 'tsx',
    tsx: 'tsx'
  } as Record<string, Loader>;
  const compatibleTypes = Object.keys(loaderMap);

  return {
    name: PluginName,
    async setup() {
      esbuildService = await esbuild.startService();
    },
    async transformContent(data, filePath) {
      if (compatibleTypes.includes(data.type)) {
        try {
          const { js, jsSourceMap } = await esbuildService.transform(data.code, {
            sourcemap: true,
            loader: loaderMap[data.type],
            jsxFactory: options.jsxFactory,
            jsxFragment: options.jsxFragment,
            target: options.target
          });

          const generatedMap = JSON.parse(jsSourceMap);
          generatedMap.sources = [filePath];

          return {
            code: js,
            map: generatedMap,
            type: 'js'
          }
        } catch (e) {
          console.log('esbuild error', e);
        }
      }

      return null;
    }
  }
}
