/**
 * Custom webpack plugin to fix esbuild concatenation issues
 * This plugin processes the generated bundles and fixes syntax errors
 * caused by improper concatenation during the build process.
 */
class FixConcatenationPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('FixConcatenationPlugin', (compilation, callback) => {
      // Process all JavaScript assets
      Object.keys(compilation.assets).forEach((filename) => {
        if (filename.endsWith('.js')) {
          const asset = compilation.assets[filename];
          let source = asset.source();
          
          // Fix the specific concatenation issues
          const originalSource = source;
          
          // Fix MAX_BF_CACHEglobalThis pattern
          source = source.replace(/MAX_BF_CACHEglobalThis/g, 'MAX_BF_CACHE; globalThis');
          
          // Fix other similar concatenation patterns with constants + globalThis
          source = source.replace(/([A-Z_]{3,})globalThis\./g, '$1; globalThis.');
          
          // Fix concatenated variable names followed by globalThis
          source = source.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)globalThis\./g, '$1; globalThis.');
          
          // Fix any remaining globalThis concatenation issues
          source = source.replace(/([a-zA-Z0-9_$]+)globalThis/g, '$1; globalThis');
          
          // If changes were made, update the asset
          if (source !== originalSource) {
            compilation.assets[filename] = {
              source: () => source,
              size: () => source.length
            };
            console.log(`Fixed concatenation issues in: ${filename}`);
          }
        }
      });
      
      callback();
    });
  }
}

module.exports = FixConcatenationPlugin;