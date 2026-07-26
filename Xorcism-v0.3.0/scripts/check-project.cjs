const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "manifest.json");
const packagePath = path.join(root, "package.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, packageJson.version);

const referencedFiles = [
  manifest.background?.service_worker,
  manifest.side_panel?.default_path,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {}),
  ...(manifest.content_scripts || []).flatMap((entry) => [
    ...(entry.js || []),
    ...(entry.css || [])
  ])
].filter(Boolean);

for (const relativePath of new Set(referencedFiles)) {
  assert.ok(
    fs.existsSync(path.join(root, relativePath)),
    `Missing manifest resource: ${relativePath}`
  );
}

const javascriptFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && /\.(?:js|cjs)$/.test(entry.name)) {
      javascriptFiles.push(fullPath);
    }
  }
}

walk(path.join(root, "src"));
walk(path.join(root, "scripts"));
walk(path.join(root, "tests"));

for (const file of javascriptFiles) {
  execFileSync(process.execPath, ["--check", file], {
    stdio: "pipe"
  });
}

console.log(
  `Project check passed: ${referencedFiles.length} manifest references and ${javascriptFiles.length} JavaScript files.`
);
