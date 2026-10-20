import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
let html=await readFile(path.join(root,'src/index.html'),'utf8');
for(const [marker,file] of [['THEME','theme.js'],['STYLE','style.css'],['I18N','i18n.js'],['TELEMETRY','telemetry.js'],['ENGINE','engine.js'],['ATLAS_IDEAS','atlas-ideas.js'],['ATLAS_IMPORT','atlas-import.js'],['DEMO','demo.js'],['COURSE_DEMO','course-demo.js'],['HISTORY','history.js'],['HISTORY_UI','history-ui.js'],['PROVIDERS','providers.js'],['SETTINGS','settings.js'],['FRAMING_DEMO','framing-demo.js'],['WORKFLOW','workflow.js'],['EXPORT_IO','export-io.js'],['REPORT','report.js'],['DIAGNOSTICS','diagnostics.js'],['REFERENCES','references.js'],['APP','app.js'],['NAVIGATION','navigation.js']]){
  let content=await readFile(path.join(root,'src',file),'utf8');
  if(marker==='STYLE'){
    content+='\n'+await readFile(path.join(root,'src/light-theme.css'),'utf8');
    content+='\n'+await readFile(path.join(root,'src/brand.css'),'utf8');
    content+='\n'+await readFile(path.join(root,'src/star-view.css'),'utf8');
    for(const theme of ['light','dark'])for(const name of ['hero','page']){
      const bytes=await readFile(path.join(root,'src/assets/atlas-'+name+'-'+theme+'.png'));
      content=content.replace('__ATLAS_'+name.toUpperCase()+'_'+theme.toUpperCase()+'__','data:image/png;base64,'+bytes.toString('base64'));
    }
    content=content.replace('__BRAND_FONT__','data:font/woff2;base64,'+(await readFile(path.join(root,'src/assets/SourceHanSerifSC-Heavy-brand.woff2'))).toString('base64'));
  }
  if(marker!=='STYLE')content=content.replace(/<\/script/gi,'<\\/script');
  html=html.replace('/* INJECT_'+marker+' */',()=>content);
}
html=html.replace('__BRAND_LOGO__','data:image/png;base64,'+(await readFile(path.join(root,'src/assets/coach-mascot.png'))).toString('base64'));
const starView=(await readFile(path.join(root,'src/star-view.js'),'utf8')).replace(/<\/script/gi,'<\\/script');
html=html.replace('/* INJECT_STARVIEW */',()=>starView);
const sourceHash=createHash('sha256').update(html).digest('hex');
html=html.replace('/* INJECT_BUILD */','window.DUG_BUILD='+JSON.stringify({sourceHash,builtAt:new Date().toISOString()})+';');
if(/INJECT_|__ATLAS_(?:HERO|PAGE)_(?:LIGHT|DARK)__|__BRAND_/.test(html))throw Error('Unresolved build marker');
await mkdir(path.join(root,'dist'),{recursive:true});
for(const file of ['index.html','出论工作台.html','立论星轨.html'])await writeFile(path.join(root,'dist',file),html,'utf8');
console.log('Built standalone HTML ('+Buffer.byteLength(html)+' bytes)');
