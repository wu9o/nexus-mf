const { Compilation, sources } = require('webpack');

class RemoteManifestPlugin {
  constructor(remotes) {
    this.remotes = remotes;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('RemoteManifestPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'RemoteManifestPlugin', stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS },
        () => {
          compilation.emitAsset(
            'remote-manifest.json',
            new sources.RawSource(JSON.stringify({
              schemaVersion: 1,
              remotes: this.remotes,
            }, null, 2)),
          );
        },
      );
    });
  }
}

module.exports = { RemoteManifestPlugin };
