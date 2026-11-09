const { getDefaultConfig } = require("expo/metro-config");
// .npmrc installs the local shared package as a copy, so native dependencies
// resolve inside this app instead of the Next.js project's React installation.
module.exports = getDefaultConfig(__dirname);
