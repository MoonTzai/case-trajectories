#!/usr/bin/env node
'use strict';

/**
 * Case Trajectories: publish a single, self-contained HTML from the
 * exact files in this repository. No remote requests and no npm install.
 * Run: node build-release.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const root = __dirname;
function file(rel) {return path.join(root, rel);}
function sha(buf) {return crypto.createHash('sha256').update(buf).digest('hex');}
function fail(message) {throw new Error('[Case Trajectories] ' + message);}
const output = spawnSync(process.execPath,[file('build.mjs')],{
  cwd:root,encoding:'utf8',timeout:180000,windowsHide:true
});
if (output.error || output.status !== 0) {
  if (output.stdout) process.stdout.write(output.stdout);
  if (output.stderr) process.stderr.write(output.stderr);
  fail('The original standalone build failed: '+String(output.error?.message||output.status));
}
if (output.stdout) process.stdout.write(output.stdout);
const aliases = ['dist/index.html','dist/立论星轨.html','dist/出论工作台.html'];
const docs = aliases.map(x=>fs.readFileSync(file(x)));
if (docs.some(x=>!x.equals(docs[0]))) fail('Built single-page aliases are not byte-identical.');
const html = docs[0].toString('utf8');
for (const marker of ['Case Trajectories','立论星轨','data:image/png;base64,','data:font/woff2;base64,']) {
  if (!html.includes(marker)) fail('Required embedded marker absent: '+marker);
}
if (/INJECT_(?:THEME|STYLE|I18N|ENGINE|APP|BUILD)|__ATLAS_(?:HERO|PAGE)_(?:LIGHT|DARK)__|__BRAND_/.test(html)) {
  fail('There is an unresolved standalone build marker.');
}
const suspicious = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,})\b/,
  /\bsk-proj-[A-Za-z0-9_-]{30,}\b/
];
if (suspicious.some(re=>re.test(html))) fail('Possible embedded credential. Refusing to publish.');
const sourceFiles = fs.readdirSync(file('src'),{withFileTypes:true})
  .filter(x=>x.isFile()).map(x=>'src/'+x.name)
  .concat(fs.readdirSync(file('src/assets'),{withFileTypes:true})
    .filter(x=>x.isFile()).map(x=>'src/assets/'+x.name))
  .concat(['.gitattributes','build.mjs','build-release.cjs','README.md','LICENSE','LICENSE-NOTICE.md','FONT-LICENSE.txt','THIRD-PARTY-NOTICES.md','package.json']);
sourceFiles.sort();
for(const item of sourceFiles) {
  if (!fs.statSync(file(item)).isFile()) fail('Unexpected source path: '+item);
}
const dest=file('index.html');
const tmp=file('index.html.tmp');
try {
  fs.writeFileSync(tmp,docs[0],{flag:'w'});
  fs.renameSync(tmp,dest);
} finally {
  if(fs.existsSync(tmp))fs.unlinkSync(tmp);
}
if (!fs.readFileSync(dest).equals(docs[0])) fail('Published index differs from built HTML.');
const manifest = {
  name:'Case Trajectories',
  version:'0.1.0',
  titleZh:'立论星轨',
  license:'CC-BY-NC-SA-4.0',
  fontLicense:'OFL-1.1',
  standalone:{path:'index.html',bytes:docs[0].length,sha256:sha(docs[0])},
  builtFiles:aliases.map(rel=>({path:rel,sha256:sha(fs.readFileSync(file(rel)))})),
  source:sourceFiles.map(rel=>({path:rel,sha256:sha(fs.readFileSync(file(rel)))}))
};
fs.writeFileSync(file('RELEASE-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Case Trajectories release ready: index.html '+docs[0].length+' bytes, SHA256 '+manifest.standalone.sha256);
console.log('This check validates build/integrity; it does not claim live API or browser QA.');
