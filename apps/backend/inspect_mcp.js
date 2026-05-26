const fs = require('fs');
const path = require('path');

const ssePath = path.join(__dirname, '../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/sse.js');
const sseMjsPath = path.join(__dirname, '../../node_modules/@modelcontextprotocol/sdk/dist/esm/server/sse.js');

if (fs.existsSync(ssePath)) {
  console.log("CJS:", fs.readFileSync(ssePath, 'utf8'));
} else if (fs.existsSync(sseMjsPath)) {
  console.log("ESM:", fs.readFileSync(sseMjsPath, 'utf8'));
} else {
  console.log("Not found in node_modules directly. Trying another path.");
  try {
    const resolvedPath = require.resolve('@modelcontextprotocol/sdk/server/sse.js');
    console.log("Resolved:", fs.readFileSync(resolvedPath, 'utf8'));
  } catch (e) {
    console.log("Error:", e);
  }
}
