const fs = require('fs');
const path = require('path');

const sourcePath = process.argv[2] || 'index.html';
const outPath = process.argv[3] || 'public/index.html';
let html = fs.readFileSync(sourcePath, 'utf8');

const remoteBaseUrl = 'https://raw.githubusercontent.com/kanatama0416-glitch/person1-shiten/93246663e808f739feba769129b4593087c794cf/index.html';
if (!html.includes(remoteBaseUrl)) {
  throw new Error('runtime base URL not found');
}
html = html.replace(remoteBaseUrl, './base.html');

const MARKER = 'SHITEN_SHARED_PET_V15';
if (html.includes(MARKER)) {
  throw new Error('source already contains generated shared-pet patch');
}

// Remove the old level-10-only CSS so level 10 has one source of truth.
const oldStage10Css = /\/\* STAGE10_SPROUT_FROM_MAIN_EYE_V2 \*\/[\s\S]*?(?=\.orbit-line\{)/;
if (!oldStage10Css.test(html)) throw new Error('old stage10 CSS marker not found');
html = html.replace(oldStage10Css, '');

// Shared renderer styles are used by both the room pet and the hero pet.
const sharedCss = `
/* SHITEN_SHARED_PET_V15 */
.eye-room,.eye-room *{-webkit-tap-highlight-color:transparent}
.eye-room{touch-action:manipulation;-webkit-user-select:none;user-select:none}
.eye-room button,.eye-room .room-controls,.eye-room .room-scene{touch-action:manipulation}
.eye-room .room-food{touch-action:none;-webkit-user-select:none;user-select:none}

.room-evolution{width:320px;height:220px;overflow:visible}
.stage-10 .room-evolution,.stage-20 .room-evolution,.stage-30 .room-evolution{left:50%;top:48%;width:320px;height:220px;transform:translate(-50%,-50%)}
.stage-10 .room-pet,.stage-20 .room-pet,.stage-30 .room-pet{top:48%}
.stage-10 .room-evolution,.stage-20 .room-evolution,.stage-30 .room-evolution{z-index:4}

.pet-evolution-svg{display:block;width:100%;height:100%;overflow:visible}
.pet-mini-outer{fill:#fff;stroke:#111;stroke-width:3}
.pet-mini-iris{fill:#58c8ff;stroke:#111;stroke-width:2}
.pet-mini-pupil{fill:#111}
.pet-mini-shine{fill:#fff}
.pet-sprout-stem{stroke:#111;stroke-width:5;stroke-linecap:round}
.pet-orbit{fill:none;stroke:#7f969f;stroke-width:2;stroke-dasharray:6 7;opacity:.82}
.pet-orbit.alt{stroke:#58c8ff;stroke-dasharray:3 9}
.pet-god-ray{stroke:#e4b20a;stroke-width:4;stroke-linecap:round;opacity:.55}
.pet-god-halo{fill:none;stroke:#e4b20a;stroke-width:2}
.pet-god-halo.dotted{stroke-dasharray:3 7}
.pet-god-star{fill:#ffd83d;stroke:#111;stroke-width:1.2}

.hero{overflow:visible!important}
.hero-pet{position:relative;width:320px;max-width:100%;height:90px;margin:0 auto 24px;display:block;transition:height .25s ease}
.hero-pet>.eye{position:absolute;z-index:3;left:50%;top:50%;margin:0!important;transform:translate(-50%,-50%) rotate(-3deg)}
.hero-pet>.hero-evolution{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:visible}
.hero-pet.stage-10,.hero-pet.stage-20,.hero-pet.stage-30{height:220px;margin-bottom:26px}
.hero-pet.stage-30>.eye{box-shadow:0 0 0 3px #e4b20a}
.hero>h1{position:relative;z-index:5}
@media(max-width:390px){.hero{padding-top:18px}.hero-pet.stage-10,.hero-pet.stage-20,.hero-pet.stage-30{height:210px}.hero-pet{width:100%}.hero-pet>.hero-evolution{left:50%;width:320px;max-width:100%;transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.hero-pet{transition:none}}
`;

const styleEnd = '</style>`;html=html.replace(\'</head>\',roomStyle+\'</head>\');';
if (!html.includes(styleEnd)) throw new Error('room style insertion point not found');
html = html.replace(styleEnd, sharedCss + '\n' + styleEnd);

// One SVG generator for room + page. The five level-10 eyes all emerge from the upper half.
const sharedJs = String.raw`
/* SHITEN_SHARED_PET_RENDER_V15 */
var SHITEN_EYE_STORAGE_KEY='shiten02-eye-eaten-v2';
function shitenStageFor(n){return n>=30?30:n>=20?20:n>=10?10:0;}
function shitenMiniEye(x,y,r,scale){
  var s=scale||1;
  return '<g transform="translate('+x+' '+y+') rotate('+r+') scale('+s+')"><ellipse class="pet-mini-outer" rx="20" ry="12.5"/><circle class="pet-mini-iris" r="7.5"/><circle class="pet-mini-pupil" r="3.1"/><circle class="pet-mini-shine" cx="2.8" cy="-2.8" r="1.5"/></g>';
}
function shitenEvolutionSvg(stage){
  var h='<svg class="pet-evolution-svg" viewBox="0 0 320 220" aria-hidden="true">',i;
  if(stage===10){
    var p=[[58,78,-15],[111,39,-9],[160,23,1],[209,39,10],[262,78,15]];
    var roots=[[111,96],[132,78],[160,72],[188,78],[209,96]];
    for(i=0;i<p.length;i++)h+='<line class="pet-sprout-stem" x1="'+roots[i][0]+'" y1="'+roots[i][1]+'" x2="'+p[i][0]+'" y2="'+p[i][1]+'"/>';
    for(i=0;i<p.length;i++)h+=shitenMiniEye(p[i][0],p[i][1],p[i][2],.94);
  }else if(stage===20){
    var s20=[[160,18,0],[241,39,10],[292,108,2],[243,178,-8],[160,202,0],[77,178,8],[28,108,-2],[79,39,-10]];
    h+='<ellipse class="pet-orbit" cx="160" cy="110" rx="143" ry="74"/><ellipse class="pet-orbit alt" cx="160" cy="110" rx="118" ry="92" transform="rotate(-12 160 110)"/>';
    for(i=0;i<s20.length;i++)h+=shitenMiniEye(s20[i][0],s20[i][1],s20[i][2],.82);
  }else if(stage===30){
    var s30=[[160,16,0],[244,36,9],[298,110,0],[244,184,-9],[160,204,0],[76,184,9],[22,110,0],[76,36,-9]];
    for(i=0;i<16;i++){var a=i*Math.PI/8,x1=160+116*Math.cos(a),y1=110+78*Math.sin(a),x2=160+151*Math.cos(a),y2=110+104*Math.sin(a);h+='<line class="pet-god-ray" x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';}
    h+='<ellipse class="pet-god-halo dotted" cx="160" cy="110" rx="147" ry="91"/><ellipse class="pet-god-halo" cx="160" cy="110" rx="121" ry="72"/>';
    for(i=0;i<s30.length;i++)h+=shitenMiniEye(s30[i][0],s30[i][1],s30[i][2],.74);
    h+='<path class="pet-god-star" d="M160 1 l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path class="pet-god-star" d="M304 52 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path class="pet-god-star" d="M17 159 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>';
  }
  return h+'</svg>';
}
function shitenEnsureHeroPet(){
  var hero=document.querySelector('.hero'),eye=hero&&hero.querySelector('.eye');
  if(!hero||!eye)return null;
  var pet=hero.querySelector('.hero-pet');
  if(!pet){
    pet=document.createElement('div');pet.className='hero-pet stage-0';
    var evolution=document.createElement('div');evolution.className='hero-evolution';evolution.setAttribute('aria-hidden','true');
    eye.parentNode.insertBefore(pet,eye);pet.appendChild(evolution);pet.appendChild(eye);
  }
  return pet;
}
function shitenRenderHeroPet(stage){
  var pet=shitenEnsureHeroPet();if(!pet)return;
  pet.classList.remove('stage-0','stage-10','stage-20','stage-30');pet.classList.add('stage-'+stage);pet.dataset.stage=String(stage);
  var evolution=pet.querySelector('.hero-evolution');if(evolution)evolution.innerHTML=shitenEvolutionSvg(stage);
  pet.setAttribute('aria-label',stage===0?'大きな目玉':stage===10?'小さな目玉が5つ生えた大きな目玉':stage===20?'目玉衛星を持つ大きな目玉':'金色の後光と目玉衛星を持つ神々しい大きな目玉');
}
function shitenRenderSavedHeroPet(){
  var eaten=0;try{eaten=Math.max(0,parseInt(localStorage.getItem(SHITEN_EYE_STORAGE_KEY)||'0',10)||0);}catch(e){}
  shitenRenderHeroPet(shitenStageFor(eaten));
}
shitenRenderSavedHeroPet();
window.addEventListener('pageshow',shitenRenderSavedHeroPet);
window.addEventListener('focus',shitenRenderSavedHeroPet);
window.addEventListener('storage',function(e){if(e.key===SHITEN_EYE_STORAGE_KEY)shitenRenderSavedHeroPet();});
document.addEventListener('visibilitychange',function(){if(!document.hidden)shitenRenderSavedHeroPet();});
`;

const roomScriptStart = 'const roomScript=`<script>\nfunction installEyeRoom(){';
if (!html.includes(roomScriptStart)) throw new Error('room script insertion point not found');
html = html.replace(roomScriptStart, 'const roomScript=`<script>\n' + sharedJs.replace(/`/g, '\\`') + '\nfunction installEyeRoom(){');

// Reuse the global storage/stage helpers in the room rather than redefining them.
html = html.replace("var colors=['#58c8ff','#ff87ae','#ffd83d','#70dc8b','#9b7cff'];var reduced=matchMedia('(prefers-reduced-motion: reduce)');var storageKey='shiten02-eye-eaten-v2';var eaten=0,born=0,drag=null,timer=null,oldOverflow='',stage=0;", "var colors=['#58c8ff','#ff87ae','#ffd83d','#70dc8b','#9b7cff'];var reduced=matchMedia('(prefers-reduced-motion: reduce)');var storageKey=SHITEN_EYE_STORAGE_KEY;var eaten=0,born=0,drag=null,timer=null,oldOverflow='',stage=0;");
html = html.replace('  function stageFor(n){return n>=30?30:n>=20?20:n>=10?10:0;}\n', '  function stageFor(n){return shitenStageFor(n);}\n');

// Replace the three evolved room renderers with the same SVG generator used on the page.
const stage10Pattern = /    if\(stage===10\)\{[\s\S]*?pet\.setAttribute\('aria-label','大きな目玉から小さな目玉がにょきにょき生えた目玉'\);\}/;
const stage20Pattern = /    if\(stage===20\)\{[\s\S]*?pet\.setAttribute\('aria-label','小さな目玉衛星をまわす大きな目玉'\);\}/;
const stage30Pattern = /    if\(stage===30\)\{[\s\S]*?pet\.setAttribute\('aria-label','金色の後光と目玉衛星を持つ神々しい目玉'\);\}/;
if (!stage10Pattern.test(html) || !stage20Pattern.test(html) || !stage30Pattern.test(html)) throw new Error('room evolution blocks not found');
html = html.replace(stage10Pattern, "    if(stage===10){evolution.innerHTML=shitenEvolutionSvg(10);status.textContent='なんだか、よくみえる。';help.innerHTML='たくさん食べて、進化したみたい。<br>目玉から、にょきにょき生えてきた。';next.textContent='20こで次の進化。';pet.setAttribute('aria-label','大きな目玉から小さな目玉が5つにょきにょき生えた目玉');}");
html = html.replace(stage20Pattern, "    if(stage===20){evolution.innerHTML=shitenEvolutionSvg(20);status.textContent='なんだか、まわしてる。';help.innerHTML='目玉たちがはなれて、<br>まわりをくるくるまわっている。';next.textContent='30こで最終進化。';pet.setAttribute('aria-label','小さな目玉衛星をまわす大きな目玉');}");
html = html.replace(stage30Pattern, "    if(stage===30){evolution.classList.add('god');evolution.innerHTML=shitenEvolutionSvg(30);status.textContent='なんだか、ぜんぶみえる。';help.innerHTML='もう、目玉をあげなくてもいいみたい。<br>いま、こっちを見ている。';next.textContent='';spawnButton.disabled=true;spawnText.textContent='みられている。';tray.innerHTML='';pet.setAttribute('aria-label','金色の後光と目玉衛星を持つ神々しい目玉');}");

// Every room render also updates the hero immediately; reload uses the saved value above.
const renderNeedle = "var newStage=stageFor(eaten),changed=newStage!==stage;stage=newStage;room.classList.remove('stage-0','stage-10','stage-20','stage-30');";
if (!html.includes(renderNeedle)) throw new Error('room render sync point not found');
html = html.replace(renderNeedle, "var newStage=stageFor(eaten),changed=newStage!==stage;stage=newStage;shitenRenderHeroPet(stage);room.classList.remove('stage-0','stage-10','stage-20','stage-30');");

// Validation: exactly five level-10 mini eyes are defined, one shared renderer is used,
// and the old page-growth-layer implementation is absent.
if (!html.includes(MARKER) || !html.includes('SHITEN_SHARED_PET_RENDER_V15')) throw new Error('shared pet markers missing');
if (!html.includes("var p=[[58,78,-15],[111,39,-9],[160,23,1],[209,39,10],[262,78,15]]")) throw new Error('level-10 five-eye geometry missing');
if (html.includes('page-growth-layer') || html.includes('PAGE_EVOLUTION_REFLECT_V1')) throw new Error('legacy page growth layer remains');
if ((html.match(/shitenEvolutionSvg\(/g) || []).length < 5) throw new Error('shared renderer not reused enough');
if (!html.includes('touch-action:manipulation') || !html.includes('.eye-room .room-food{touch-action:none')) throw new Error('room touch guard missing');
if (!html.includes('shitenRenderHeroPet(stage);')) throw new Error('live hero sync missing');
if (!html.includes("window.addEventListener('pageshow',shitenRenderSavedHeroPet)")) throw new Error('page restore sync missing');
if (!html.includes('room-restart') || !html.includes('shiten02-eye-eaten-v2')) throw new Error('existing room persistence/restart missing');

// Add the profile after the existing pet renderer has been prepared.
const profileHook = "html=html.replace('</head>',\"<style>.creator-signature{display:flex;flex-direction:row-reverse;align-items:flex-end;justify-content:center;gap:4px;width:max-content;max-width:100%;margin:22px auto 0;padding:5px 7px 7px}.creator-spine{flex:none;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:40px;height:224px;padding:12px 5px 10px;border:3px solid var(--k);border-radius:7px 7px 4px 4px;box-shadow:3px 3px 0 var(--k);background:#fff;transform-origin:bottom center}.creator-spine__text{writing-mode:vertical-rl;text-orientation:mixed;white-space:nowrap;font-size:14px;line-height:1.5;font-weight:800;letter-spacing:.02em;text-align:start}.creator-spine__text span{ text-combine-upright:all}.creator-spine__label{position:absolute;top:9px;left:0;right:0;text-align:center;font-size:10px;line-height:1.2;font-weight:800;letter-spacing:.08em;writing-mode:horizontal-tb}.creator-spine--name .creator-spine__text,.creator-spine--role .creator-spine__text{margin-top:20px}.creator-spine__icon{display:block;flex:none;width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.creator-spine--name{height:194px;width:48px;background:var(--p);transform:rotate(2deg)}.creator-spine--name .creator-spine__text{font-size:17px;font-weight:900;letter-spacing:.12em}.creator-spine--role{height:232px;background:#fff;transform:rotate(-1deg)}.creator-spine--hamster{height:216px;background:var(--gray)}.creator-spine--bio{height:250px;width:60px;background:var(--k);color:#fff;transform:rotate(-2deg)}.creator-spine--bio .creator-spine__text{font-weight:700;line-height:1.65;letter-spacing:0}.creator-spine--extra{height:226px;background:#fff;transform:rotate(1deg)}.creator-spine--bio .creator-spine__text{font-size:14px}.creator-spine__text{flex-shrink:0}</style></head>\");html=html.replace('</h1>',\"</h1><div class=\\\"creator-signature\\\" aria-label=\\\"この視点を書いた人（仮の紹介）\\\"><div class=\\\"creator-spine creator-spine--name\\\"><span class=\\\"creator-spine__label\\\">名前</span><div class=\\\"creator-spine__text\\\">あお（仮）</div><svg class=\\\"creator-spine__icon\\\" viewBox=\\\"0 0 24 24\\\" aria-hidden=\\\"true\\\"><path d=\\\"M3 12c4-7 14-7 18 0-4 7-14 7-18 0Z\\\"/><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"3\\\" fill=\\\"currentColor\\\"/></svg></div><div class=\\\"creator-spine creator-spine--role\\\"><span class=\\\"creator-spine__label\\\">担当</span><div class=\\\"creator-spine__text\\\">売場企画（仮）</div><svg class=\\\"creator-spine__icon\\\" viewBox=\\\"0 0 24 24\\\" aria-hidden=\\\"true\\\"><path d=\\\"M3 12c4-7 14-7 18 0-4 7-14 7-18 0Z\\\"/><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"3\\\" fill=\\\"currentColor\\\"/></svg></div><div class=\\\"creator-spine creator-spine--bio\\\"><div class=\\\"creator-spine__text\\\">休日は喫茶店めぐり。</div><svg class=\\\"creator-spine__icon\\\" viewBox=\\\"0 0 24 24\\\" aria-hidden=\\\"true\\\"><path d=\\\"M3 12c4-7 14-7 18 0-4 7-14 7-18 0Z\\\"/><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"3\\\" fill=\\\"currentColor\\\"/></svg></div></div>\");";
const profileMarker = 'document.open();document.write(html);document.close()';
if (!html.includes(profileMarker)) throw new Error('profile insertion point missing');
html = html.replace(profileMarker, profileHook + profileMarker);

const outer = html.match(/<body><script>\n([\s\S]*)\n<\/script><\/body><\/html>\s*$/);
if (!outer) throw new Error('outer script not found for syntax validation');
new Function(outer[1]);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
const localBasePath = path.join(path.dirname(sourcePath), 'base.html');
if (!fs.existsSync(localBasePath)) throw new Error('local base.html missing');
fs.copyFileSync(localBasePath, path.join(path.dirname(outPath), 'base.html'));
console.log('Built and validated shared room/page pet renderer v15 with page-restore sync.');