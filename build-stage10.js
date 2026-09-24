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

// The deployed page must keep the launcher fully opaque.
const launcherOpacity = '.secret-toggle{opacity:.85}';
if (!html.includes(launcherOpacity)) throw new Error('launcher opacity rule missing');
html = html.replace(launcherOpacity, '.secret-toggle{opacity:1!important}');

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
const restartCssOld = '.stage-30 .room-restart{display:block}';
const restartCssNew = '.stage-30.restart-ready .room-restart{display:block}';
if (!html.includes(restartCssOld)) throw new Error('restart CSS marker missing');
html = html.replace(restartCssOld, restartCssNew);

const launcherOld = "launcher.addEventListener('click',function(){if(!room.open){oldOverflow=document.body.style.overflow;room.showModal();document.body.style.overflow='hidden';renderEvolution(false);}if(stage<30)spawn();});";
const launcherNew = "launcher.addEventListener('click',function(){if(!room.open){oldOverflow=document.body.style.overflow;room.showModal();document.body.style.overflow='hidden';room.classList.toggle('restart-ready',stage===30);renderEvolution(false);}if(stage<30)spawn();});";
if (!html.includes(launcherOld)) throw new Error('launcher restart marker missing');
html = html.replace(launcherOld, launcherNew);

const restartOld = "restartButton.addEventListener('click',function(){eaten=0;born=0;tray.innerHTML='';save();renderEvolution(false);status.textContent='また、はじめから。';spawnButton.focus({preventScroll:true});});";
const restartNew = "restartButton.addEventListener('click',function(){room.classList.remove('restart-ready');eaten=0;born=0;tray.innerHTML='';save();renderEvolution(false);status.textContent='また、はじめから。';spawnButton.focus({preventScroll:true});});";
if (!html.includes(restartOld)) throw new Error('restart handler marker missing');
html = html.replace(restartOld, restartNew);


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


// Text-only content patch for 02. This runs against the fetched base page at runtime.
function runtimeReplace(oldText,newText){
  return 'html=html.replace('+JSON.stringify(oldText)+','+JSON.stringify(newText)+');';
}
const contentReplacements = [
  [`<title>世界の解像度を上げる視点</title>`,`<title>「見る」から「巻き込まれる」へ変わる視点</title>`],
  [`<span class="title-mark">世界の解像度を</span><br><span class="title-mark">上げる視点</span>`,`<span class="title-mark">「見る」から</span><br><span class="title-mark">「巻き込まれる」へ</span><br><span class="title-mark">変わる視点</span>`],
  [`<section class="essay"><span class="secret-eye" aria-hidden="true"></span><p>同じ景色を見ていても、誰もが同じものを見ているわけではありません。ある人にはただの路地に見える場所が、別の人には記憶や物語の入口に見える。偶然起きた出来事を失敗と捉える人もいれば、そこに新しい表現の可能性を見つける人もいます。</p><p>私にとって「視点」とは、目の前にあるものをどう見るかだけではなく、<span class="hl">そこから何を見つけ、何を意味のあるものとして拾い上げるかを決めるもの</span>です。</p><p>アートに触れる面白さの一つは、自分とは違う誰かの視点を一時的に借りられることだと思います。その人が何を見つめ、何に引っかかり、どんなものに価値を見出しているのかを知ることで、それまで自分の世界には存在していなかったものが、少しずつ見えるようになる。</p><p>そして一度見えるようになったものは、作品の前を離れても残り続けます。何気ない路地や室外機、偶然の出来事、人との出会い。それまで背景だったものが、急に輪郭を持ちはじめる。</p><p>私にとって視点が広がるとは、知識が増えることだけではありません。世界の中に「気づけるもの」が増えていくことです。アートとの出会いによって、同じ日常が以前より細かく、複雑に、面白く見えるようになる。そんなふうに世界の解像度を広げてくれる視点を、この本たちから受け取ってきました。</p></section>`,`<section class="essay"><span class="secret-eye" aria-hidden="true"></span><p>アートは受け身で眺めるものとは限りません。観客が飛び込み身体を動かし他者と関わることで完成するような、「人が関わる舞台やルール」がアートってこともあります。二子玉川ビエンナーレや世田谷パン祭りといった地域イベント運営を長年続ける私の原点も「人が能動的に面白がることで予測不能な場が立ち現れる瞬間」にあります。今回選んだ5冊は、他者と関わり合い互いを豊かにしていくアートの熱量に出会える本です。</p></section>`],
  [`<p class="note">※ 表紙はレイアウト確認用の仮イメージです。</p>`,``],
  [`<div class="cover"><div class="mock m1"><strong>GENKYO</strong></div></div><b class="num">1</b>`,`<div class="cover"><div class="mock m1 real-cover"><img class="book-cover-photo" src="./book-covers/book_cover_27.png" alt="『非常にはっきりとわからない』の表紙"></div></div><b class="num">1</b>`],
  [`<span class="artist">横尾忠則</span><h3>『GENKYO 横尾忠則 原郷から幻境へ、そして現況は？』</h3><p>グラフィックデザイナー時代から画家としての作品まで、横尾忠則の表現を幅広く見ることができる一冊です。まずは作品そのものを通して、「横尾忠則は世界をどう見ているのか」を視覚的に感じられる本として選びました。</p>`,`<span class="artist">目［mé］</span><h3>『非常にはっきりとわからない』</h3><p>「おじさんの顔が空に浮かぶ日」に惹かれ参加したトークイベント。無関心だった地元住民の飲み屋に通い詰めて信頼を築き、やがて町中を巻き込む壮大な事件へ発展していく泥臭い道のりをご本人から伺い、大笑いして感動で涙しました。外から眺める美術品ではなく、作り手と街の境界が溶け合い、誰もが当事者になっていく熱狂の記録です。日常の確信をひっくり返すエネルギーが詰まっています。</p>`],
  [`<div class="cover"><div class="mock m2"><strong>ONSEN</strong></div></div><b class="num">2</b>`,`<div class="cover"><div class="mock m2 real-cover"><img class="book-cover-photo" src="https://books.google.com/books/content?vid=ISBN9784865411836&printsec=frontcover&img=1&zoom=2&source=gbs_api" data-cover-source="google-books" data-google-books-isbn="9784865411836" alt="『デコレータークラブ』の表紙" onerror="this.onerror=null;this.dataset.coverSource='local-fallback';this.src='./book-covers/book_cover_28.png'"></div></div><b class="num">2</b>`],
  [`<span class="artist">横尾忠則</span><h3>『温泉主義』</h3><p>横尾忠則が訪れた温泉地での出来事と、そこから生まれた絵を一緒に見ることができます。個人的な記憶や経験が、どのように作品へとつながっていくのか。その人が見たものと、描いたものの間をたどることができる一冊です。</p>`,`<span class="artist">飯川雄大</span><h3>『デコレータークラブ』</h3><p>大ファンです。直接お話を伺った際もその知性に圧倒されました。巨大過ぎて全貌が見渡せない猫や、砂が詰まった異様に重いリュックの放置など、「何これ？」と鑑賞者の身体反応や好奇心を巻き込み、能動的なアクションを通じて初めて空間のタネ明かしが成立します。見る人をただの観客から「共犯者」へと変えてしまう、ユーモアと批評性に満ちたアートの記録です。</p>`],
  [`<div class="cover"><div class="mock m3"><strong>BLUELAND</strong></div></div><b class="num">3</b>`,`<div class="cover"><div class="mock m3 real-cover"><img class="book-cover-photo" src="./book-covers/book_cover_29.png" data-cover-source="local" alt="『縄張りと島』の表紙"></div></div><b class="num">3</b>`],
  [`<span class="artist">横尾忠則</span><h3>『ぶるうらんど』</h3><p>横尾忠則が初めて小説という形式に挑んだ作品です。絵の中に現れていた幻想的な世界が、今度は文章として立ち上がってきます。「見る横尾忠則」だけでなく、「読む横尾忠則」から、その視点に触れられる本として選びました。</p>`,`<span class="artist">加藤翼</span><h3>『縄張りと島』</h3><p>2014年に「二子玉川ビエンナーレ」実行委員として加藤さんをお招きし、駅前で巨大構造物の引き起こしを実施しました。握りしめたロープを通して見知らぬ人同士のパワーがぶるぶると伝わり、一軒の大きな家がまるごとドカーンと立ち上がった瞬間に湧き起こった大拍手は今も忘れられません。「みんなで力を合わせる」という泥臭い身体の協働が、人と人との連帯や祈りを強烈に実感させてくれる本です。</p>`],
  [`<div class="cover"><div class="mock m4"><strong>FIREBALL</strong></div></div><b class="num">4</b>`,`<div class="cover"><div class="mock m4 real-cover"><img class="book-cover-photo" src="./book-covers/book_cover_30.png" data-cover-source="local" alt="『共にいることの可能性、その試み、その記録』の表紙"></div></div><b class="num">4</b>`],
  [`<span class="artist">蔡國強</span><h3>『原初火球』</h3><p>火薬の爆発によって作品をつくる蔡國強。人が意図したものと、完全には制御できない爆発の偶然性を組み合わせ、その制作過程まで含めて作品としています。「作者がすべてを決める」という見方とは異なる、偶然を受け入れる視点に惹かれて選びました。</p>`,`<span class="artist">田中功起</span><h3>『共にいることの可能性、その試み、その記録』</h3><p>「9人の美容師が1人の髪を同時に切る」など、あえて不条理なルールを設定し、見知らぬ他者同士が協働する実験を追った記録です。他者と一緒に何かを作るときの居心地の悪さ、意見の衝突、その先にある微かな共鳴。（上手くいかなかったりする。）場づくりの現場で直面する人間関係のリアルな摩擦を真正面から見つめ、「他者と共に場を編み上げる難しさと、その価値」を静かに教えてくれます。</p>`],
  [`<div class="cover"><div class="mock m5"><strong>EARLY WORKS</strong></div></div><b class="num">5</b>`,`<div class="cover"><div class="mock m5 real-cover"><img class="book-cover-photo" src="./book-covers/book_cover_31.png" data-cover-source="local" alt="『リー・ミンウェイとその関係展』の表紙"></div></div><b class="num">5</b>`],
  [`<span class="artist">蔡國強</span><h3>初期作品の図録</h3><p>蔡國強が若手だった頃の火薬作品が収録された図録です。いわき回廊美術館を訪れた際、蔡國強と長く活動してきた方と偶然出会い、「蔡さんのアートが好きなら」と譲っていただきました。作品だけでなく、人や土地との出会いまで含めて、私自身の蔡國強を見る視点を広げてくれた一冊です。</p>`,`<span class="artist">李明維（リー・ミンウェイ）</span><h3>『リー・ミンウェイとその関係展』</h3><p>10年前に六本木の森美術館で鑑賞し、来日したご本人のトークも聴けた展覧会の図録です。見知らぬ誰かに手紙を書く小部屋や、知らない人とベッドを並べて寝てみるとか、持ち寄った服を繕ってもらいながら対話するとか、作家が用意したのはモノではなく「心を通わせるきっかけ」でした。大勢で綱を引く熱狂とはまた違う、静かに対話が生まれるあたたかな関係性のアートです。</p>`]
];
const contentHook = '/* CONTENT_02_MURAKAMI_DEPLOY_V2 */'+contentReplacements.map(pair=>runtimeReplace(pair[0],pair[1])).join('');

// Add the profile after the existing pet renderer has been prepared.
const bookCoverCss = `.real-cover{display:flex;align-items:center;justify-content:center;background:#f7f5ef}.real-cover:before,.real-cover:after{display:none!important}.book-cover-photo{display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain}`;
const profileCss = `.creator-signature{display:flex;flex-direction:row-reverse;align-items:flex-end;justify-content:center;gap:3px;width:max-content;max-width:100%;margin:22px auto 0;padding:5px 5px 7px}.creator-spine{flex:none;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:36px;height:224px;padding:12px 4px 10px;border:3px solid var(--k);border-radius:7px 7px 4px 4px;box-shadow:3px 3px 0 var(--k);background:#fff;transform-origin:bottom center}.creator-spine__text{writing-mode:vertical-rl;text-orientation:mixed;white-space:nowrap;font-size:13px;line-height:1.45;font-weight:800;letter-spacing:.02em;text-align:start;flex-shrink:0}.creator-spine__text span{text-combine-upright:all}.creator-spine__label{position:absolute;top:9px;left:0;right:0;text-align:center;font-size:9px;line-height:1.2;font-weight:800;letter-spacing:.04em;writing-mode:horizontal-tb}.creator-spine--name .creator-spine__text,.creator-spine--role .creator-spine__text,.creator-spine--bio .creator-spine__text{margin-top:20px}.creator-spine__icon{display:block;flex:none;width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.creator-spine--name{height:194px;width:46px;background:var(--p);transform:rotate(2deg)}.creator-spine--name .creator-spine__text{font-size:16px;font-weight:900;letter-spacing:.1em}.creator-spine--role{height:226px;background:#fff;transform:rotate(-1deg)}.creator-spine--role-alt{height:210px;transform:rotate(1deg)}.creator-spine--bio{width:44px;background:var(--k);color:#fff;transform:rotate(-2deg)}.creator-spine--bio-a{height:250px;width:72px;margin-left:6px;transform:rotate(-2deg)}.creator-spine--bio-a .creator-spine__text{white-space:normal;height:176px;width:52px;line-height:1.5}.creator-spine--bio-c{height:214px;transform:rotate(1deg)}.creator-spine--bio .creator-spine__text{font-weight:700;line-height:1.5;letter-spacing:0;font-size:13px}@media(max-width:340px){.creator-signature{gap:2px;padding-left:2px;padding-right:2px}.creator-spine{width:34px}.creator-spine--name{width:42px}.creator-spine--bio{width:40px}.creator-spine--bio-a{width:68px}.creator-spine--bio-a .creator-spine__text{width:50px}.creator-spine__text{font-size:12px}.creator-spine--name .creator-spine__text{font-size:15px}}`;
const profileEye = `<svg class="creator-spine__icon profile-icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c4-7 14-7 18 0-4 7-14 7-18 0Z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;
const profileCard = `<svg class="creator-spine__icon profile-icon-card" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14h4"/></svg>`;
const profilePlan = `<svg class="creator-spine__icon profile-icon-plan" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M8.5 14.5c-1.2-1-2-2.5-2-4.2a5.5 5.5 0 0 1 11 0c0 1.7-.8 3.2-2 4.2-.8.7-1.1 1.2-1.2 2h-4.6c-.1-.8-.4-1.3-1.2-2Z"/></svg>`;
const profileEvent = `<svg class="creator-spine__icon profile-icon-event" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M7 17c.5-1.4 1.2-2 2-2s1.5.6 2 2M13 17c.5-1.4 1.2-2 2-2s1.5.6 2 2"/></svg>`;
const profilePlace = `<svg class="creator-spine__icon profile-icon-place" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>`;
const profileHtml = `</h1><div class="creator-signature" aria-label="この視点を書いた人"><div class="creator-spine creator-spine--name"><span class="creator-spine__label">名前</span><div class="creator-spine__text">むらかみ</div>${profileEye}</div><div class="creator-spine creator-spine--role"><span class="creator-spine__label">所属</span><div class="creator-spine__text">カード事業部</div>${profileCard}</div><div class="creator-spine creator-spine--role creator-spine--role-alt"><div class="creator-spine__text">企画・開発２課</div>${profilePlan}</div><div class="creator-spine creator-spine--bio creator-spine--bio-a"><span class="creator-spine__label">自己紹介</span><div class="creator-spine__text">複数の地域イベントを企画運営しています。</div>${profileEvent}</div><div class="creator-spine creator-spine--bio creator-spine--bio-c"><div class="creator-spine__text">場づくりが好きです。</div>${profilePlace}</div></div>`;
const profileHook = runtimeReplace('</head>','<style>'+bookCoverCss+profileCss+'</style></head>') + runtimeReplace('</h1>',profileHtml);
const profileMarker = 'document.open();document.write(html);document.close()';
if (!html.includes(profileMarker)) throw new Error('profile insertion point missing');
html = html.replace(profileMarker, contentHook + profileHook + profileMarker);

const outer = html.match(/<body><script>\n([\s\S]*)\n<\/script><\/body><\/html>\s*$/);
if (!outer) throw new Error('outer script not found for syntax validation');
new Function(outer[1]);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
const localBasePath = path.join(path.dirname(sourcePath), 'base.html');
if (!fs.existsSync(localBasePath)) throw new Error('local base.html missing');
fs.copyFileSync(localBasePath, path.join(path.dirname(outPath), 'base.html'));
const coverNames=['book_cover_27.png','book_cover_28.png','book_cover_29.png','book_cover_30.png','book_cover_31.png'];
const publicCoverDir=path.join(path.dirname(outPath),'book-covers');
fs.mkdirSync(publicCoverDir,{recursive:true});
for(const name of coverNames){const src=path.join('book-covers',name);if(!fs.existsSync(src))throw new Error('missing book cover asset: '+src);fs.copyFileSync(src,path.join(publicCoverDir,name));if(!html.includes('./book-covers/'+name))throw new Error('book cover not referenced: '+name);}
console.log('Built and validated shared room/page pet renderer v17 with verified Google Books cover and local covers.');