const fs = require('fs');

const fpath = require.resolve('./bundle.meta.js');
const version = require('./package.json').version;
const reg = /^\/\/ @version(\s+)(\d+\.\d+\.\d+)/m;

const oldContents = fs.readFileSync(fpath, 'utf8');
const newContents = oldContents.replace(reg, `// @version$1${version}`);

if (newContents !== oldContents) {
  fs.writeFileSync(fpath, newContents);
}
