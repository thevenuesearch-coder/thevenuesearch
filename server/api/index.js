const fs = require("fs");
const path = require("path");
const Module = require("module");

// Load the existing Express application without starting a long-lived listener.
// Vercel provides the HTTP server around the exported Express app.
const serverFile = path.join(__dirname, "..", "server.js");
let source = fs.readFileSync(serverFile, "utf8");

// The local development entry point calls app.listen(...). Replace that final
// listener with an export so the same application can run as a Vercel function.
source = source.replace(/app\.listen\(PORT,\(\)=>console\.log\(`Venue Search API running on http:\/\/localhost:\$\{PORT\}`\)\);\s*$/, "module.exports = app;");

if (source.includes("app.listen(")) {
  throw new Error("Unable to convert server.js to a Vercel function safely.");
}

const loaded = new Module(serverFile, module);
loaded.filename = serverFile;
loaded.paths = Module._nodeModulePaths(path.dirname(serverFile));
loaded._compile(source, serverFile);

module.exports = loaded.exports;
