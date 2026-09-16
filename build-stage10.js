const fs = require('fs');

const sourcePath = process.argv[2] || 'index.html';
const outPath = process.argv[3] || 'public/index.html';
let html = fs.readFileSync(sourcePath, 'utf8');

const oldMarker = '/* STAGE10_SPROUT_FROM_MAIN_EYE_V2 */';
const stage10Marker = '/* STAGE10_SPROUT_SVG_V3 */';
const pageCssMarker = '/* PAGE_EVOLUTION_REFLECT_V1 */';
const pageBootstrapMarker = 'PAGE_STAGE_BOOTSTRAP_V1';
const pageRenderMarker = 'PAGE_EVOLUTION_RENDER_V1';
const roomTapMarker = '/* EYE_ROOM_NO_DOUBLE_TAP_ZOOM_V10 */';

// 1) Keep the room's level-10 form isolated in SVG so generic CSS cannot break the page.
if (!html.includes(stage10Marker)) {
  if (!html.includes(oldMarker)) throw new Error('old stage10 marker not found');

  const cssPattern = /\/\* STAGE10_SPROUT_FROM_MAIN_EYE_V2 \*\/[\s\S]*?(?=\.orbit-line\{)/;
  const css = `/* STAGE10_SPROUT_SVG_V3 */
.stage-10 .room-evolution{top:50%;width:220px;height:160px;overflow:visible}
.eye-room .room-sprouts{display:block;width:100%;height:100%;overflow:visible}
.eye-room .room-sprout-stem{stroke:#111;stroke-width:4;stroke-linecap:round}
.eye-room .room-sprout-eye .outer{fill:#fff;stroke:#111;stroke-width:3}
.eye-room .room-sprout-eye .iris{fill:var(--room-blue);stroke:#111;stroke-width:2}
.eye-room .room-sprout-eye .pupil{fill:#111}
.eye-room .room-sprout-eye .shine{fill:#fff}
`;
  html = html.replace(cssPattern, css);

  // Five balanced sprouts. Each stem starts just behind the upper half of the main eye,
  // so only the outward segment is visible and it reads as growing directly from the eye.
  const sprouts = [
    {sx:31, sy:72, x:24,  y:72, r:-15},
    {sx:70, sy:39, x:62,  y:27, r:-9},
    {sx:110,sy:27, x:110, y:15, r:0},
    {sx:150,sy:39, x:158, y:27, r:9},
    {sx:189,sy:72, x:196, y:72, r:15}
  ];
  let svg = '<svg class="room-sprouts" viewBox="0 0 220 160" aria-hidden="true">';
  for (const p of sprouts) svg += `<line class="room-sprout-stem" x1="${p.sx}" y1="${p.sy}" x2="${p.x}" y2="${p.y}"/>`;
  for (const p of sprouts) {
    svg += `<g class="room-sprout-eye" transform="translate(${p.x} ${p.y}) rotate(${p.r})"><ellipse class="outer" rx="20" ry="12.5"/><circle class="iris" r="7.5"/><circle class="pupil" r="3.1"/><circle class="shine" cx="2.8" cy="-2.8" r="1.5"/></g>`;
  }
  svg += '</svg>';

  const stage10Pattern = /if\(stage===10\)\{evolution\.innerHTML=[\s\S]*?pet\.setAttribute\('aria-label','大きな目玉から小さな目玉がにょきにょき生えた目玉'\);\}/;
  const stage10 = `if(stage===10){evolution.innerHTML='${svg}';status.textContent='なんだか、よくみえる。';help.innerHTML='たくさん食べて、進化したみたい。<br>目玉から、にょきにょき生えてきた。';next.textContent='20こで次の進化。';pet.setAttribute('aria-label','大きな目玉から小さな目玉がにょきにょき生えた目玉');}`;
  if (!stage10Pattern.test(html)) throw new Error('stage10 render block not found');
  html = html.replace(stage10Pattern, stage10);
}

// 2) Reflect the saved room growth on the page's hero eye, behind all text.
if (!html.includes(pageCssMarker)) {
  const cssMarker = '@media(prefers-reduced-motion:reduce){.room-pet-eye';
  if (!html.includes(cssMarker)) throw new Error('page-growth CSS insert marker not found');
  const pageCss = `/* PAGE_EVOLUTION_REFLECT_V1 */
.hero{position:relative;isolation:isolate;overflow:visible!important}
.hero>.eye{position:relative;z-index:3}
.hero>h1{position:relative;z-index:5}
.page-growth-layer{position:absolute;left:50%;top:0;width:320px;height:220px;transform:translateX(-50%);z-index:0;pointer-events:none;overflow:visible}
.page-growth-layer svg{display:block;width:100%;height:100%;overflow:visible}
html[data-eye-stage="10"] .hero,html[data-eye-stage="20"] .hero,html[data-eye-stage="30"] .hero{padding-top:55px}
html[data-eye-stage="10"] .hero>h1{margin-top:48px}
html[data-eye-stage="20"] .hero>h1{margin-top:60px}
html[data-eye-stage="30"] .hero>h1{margin-top:72px}
html[data-eye-stage="30"] .hero>.eye{box-shadow:0 0 0 3px #e4b20a}
.page-growth-stem{stroke:#111;stroke-width:5;stroke-linecap:round}
.page-growth-eye .outer{fill:#fff;stroke:#111;stroke-width:3}
.page-growth-eye .iris{fill:#58c8ff;stroke:#111;stroke-width:2}
.page-growth-eye .pupil{fill:#111}.page-growth-eye .shine{fill:#fff}
.page-orbit-line{fill:none;stroke:#7f969f;stroke-width:2;stroke-dasharray:6 7;opacity:.85;animation:pageOrbitDash 8s linear infinite}
.page-orbit-line.alt{stroke:#58c8ff;stroke-dasharray:3 9;animation-duration:11s;animation-direction:reverse}
.page-god-ray{stroke:#e4b20a;stroke-width:4;stroke-linecap:round;opacity:.55;animation:pageGodPulse 2.8s ease-in-out infinite;transform-origin:160px 100px}
.page-god-halo{fill:none;stroke:#e4b20a;stroke-width:2}.page-god-halo.dotted{stroke-dasharray:3 7}
.page-god-star{fill:#ffd83d;stroke:#111;stroke-width:1.2}
@keyframes pageOrbitDash{to{stroke-dashoffset:-52}}
@keyframes pageGodPulse{0%,100%{opacity:.35}50%{opacity:.78}}
@media(prefers-reduced-motion:reduce){.page-orbit-line,.page-god-ray{animation:none}}
`;
  html = html.replace(cssMarker, pageCss + cssMarker);
}

// 3) Disable iOS/Safari double-tap zoom only inside the eye-room UI.
if (!html.includes(roomTapMarker)) {
  const roomCssNeedle = '.eye-room *{box-sizing:border-box}';
  if (!html.includes(roomCssNeedle)) throw new Error('eye-room CSS target not found');
  html = html.replace(roomCssNeedle, `${roomTapMarker}\n.eye-room,.eye-room *{touch-action:manipulation}\n.room-food{touch-action:none}\n${roomCssNeedle}`);
}

if (!html.includes(pageBootstrapMarker)) {
  const oldHeadBuild = "</style>`;html=html.replace('</head>',roomStyle+'</head>');";
  const newHeadBuild = "</style>`;const pageStageBootstrap=`<script>/* PAGE_STAGE_BOOTSTRAP_V1 */(function(){var n=0;try{n=Math.max(0,parseInt(localStorage.getItem('shiten02-eye-eaten-v2')||'0',10)||0)}catch(e){}document.documentElement.dataset.eyeStage=String(n>=30?30:n>=20?20:n>=10?10:0)})();<\\/script>`;html=html.replace('</head>',roomStyle+pageStageBootstrap+'</head>');";
  if (!html.includes(oldHeadBuild)) throw new Error('page-growth bootstrap target not found');
  html = html.replace(oldHeadBuild, newHeadBuild);
}

if (!html.includes(pageRenderMarker)) {
  const eyeFunction = "  function eye(cls){return '<span class=\"evo-eye '+cls+'\"></span>';}\n";
  if (!html.includes(eyeFunction)) throw new Error('page-growth JS insert target not found');
  const pageJs = `  /* PAGE_EVOLUTION_RENDER_V1 */
  var pageHero=document.querySelector('.hero'),pageGrowth=null;
  if(pageHero){pageGrowth=document.createElement('div');pageGrowth.className='page-growth-layer';pageGrowth.setAttribute('aria-hidden','true');var pageTitle=pageHero.querySelector('h1');pageHero.insertBefore(pageGrowth,pageTitle||null);}
  function pageEye(x,y,r){return '<g class="page-growth-eye" transform="translate('+x+' '+y+') rotate('+r+')"><ellipse class="outer" rx="23" ry="14.5"/><circle class="iris" r="8.5"/><circle class="pupil" r="3.5"/><circle class="shine" cx="3.2" cy="-3.2" r="1.8"/></g>';}
  function pageStage10(){var pts=[[60,82,-15],[108,34,-9],[160,22,0],[212,34,9],[260,82,15]],starts=[[91,88],[122,62],[160,55],[198,62],[229,88]],h='<svg viewBox="0 0 320 220">';for(var i=0;i<pts.length;i++)h+='<line class="page-growth-stem" x1="'+starts[i][0]+'" y1="'+starts[i][1]+'" x2="'+pts[i][0]+'" y2="'+pts[i][1]+'"/>';for(var j=0;j<pts.length;j++)h+=pageEye(pts[j][0],pts[j][1],pts[j][2]);return h+'</svg>';}
  function pageStage20(){var pts=[[160,18,0],[241,39,10],[292,100,2],[243,164,-8],[160,190,0],[77,164,8],[28,100,-2],[79,39,-10]],h='<svg viewBox="0 0 320 220"><ellipse class="page-orbit-line" cx="160" cy="100" rx="143" ry="72"/><ellipse class="page-orbit-line alt" cx="160" cy="100" rx="118" ry="91" transform="rotate(-12 160 100)"/>';for(var i=0;i<pts.length;i++)h+=pageEye(pts[i][0],pts[i][1],pts[i][2]);return h+'</svg>';}
  function pageStage30(){var pts=[[160,16,0],[244,35,9],[294,100,0],[244,165,-9],[160,190,0],[76,165,9],[26,100,0],[76,35,-9]],h='<svg viewBox="0 0 320 220">';for(var a=0;a<16;a++){var ang=a*Math.PI/8,x1=160+118*Math.cos(ang),y1=100+82*Math.sin(ang),x2=160+150*Math.cos(ang),y2=100+104*Math.sin(ang);h+='<line class="page-god-ray" x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';}h+='<ellipse class="page-god-halo dotted" cx="160" cy="100" rx="146" ry="88"/><ellipse class="page-god-halo" cx="160" cy="100" rx="121" ry="70"/>';for(var i=0;i<pts.length;i++)h+=pageEye(pts[i][0],pts[i][1],pts[i][2]);h+='<path class="page-god-star" d="M160 1 l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path class="page-god-star" d="M305 54 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path class="page-god-star" d="M18 150 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>';return h+'</svg>';}
  function renderPageEvolution(s){document.documentElement.dataset.eyeStage=String(s);if(!pageHero||!pageGrowth)return;pageGrowth.innerHTML=s===10?pageStage10():s===20?pageStage20():s===30?pageStage30():'';}
`;
  html = html.replace(eyeFunction, eyeFunction + pageJs);
}

if (!html.includes('renderPageEvolution(stage);')) {
  const renderStart = "var newStage=stageFor(eaten),changed=newStage!==stage;stage=newStage;room.classList.remove('stage-0','stage-10','stage-20','stage-30');";
  const renderSynced = "var newStage=stageFor(eaten),changed=newStage!==stage;stage=newStage;renderPageEvolution(stage);room.classList.remove('stage-0','stage-10','stage-20','stage-30');";
  if (!html.includes(renderStart)) throw new Error('page-growth render sync target not found');
  html = html.replace(renderStart, renderSynced);
}

// Validation: preserve existing features and guard against the previous selector collision.
if (/(?<![A-Za-z0-9_-])\.(?:b[1-7]|s[1-7])\{/.test(html)) throw new Error('unsafe generic stage10 selectors remain');
for (const marker of [stage10Marker,pageCssMarker,pageBootstrapMarker,pageRenderMarker,roomTapMarker,'renderPageEvolution(stage);','room-restart','金色の後光と目玉衛星']) {
  if (!html.includes(marker)) throw new Error(`missing required marker: ${marker}`);
}
if ((html.match(/page-growth-eye/g) || []).length < 4) throw new Error('page growth eye rendering missing');
if ((html.match(/room-sprout-eye/g) || []).length < 5) throw new Error('not all room sprout eyes rendered');
if (!html.includes('touch-action:manipulation')) throw new Error('room double-tap zoom guard missing');

const outer = html.match(/<body><script>\n([\s\S]*)\n<\/script><\/body><\/html>\s*$/);
if (!outer) throw new Error('outer script not found for syntax validation');
new Function(outer[1]);

fs.mkdirSync(require('path').dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log('Built and validated room + page growth reflection + room zoom guard v10.');
