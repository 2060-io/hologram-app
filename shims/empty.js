// Empty shim for Node-only built-in modules referenced by libraries
// that target both Node and the browser. Used by metro.config.js
// `extraNodeModules` to satisfy bundler imports of `https`, `http`, etc.
module.exports = {}
