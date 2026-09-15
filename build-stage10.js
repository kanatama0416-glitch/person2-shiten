const fs = require('fs');

const source = fs.readFileSync('index.html', 'utf8');
let html = source;

const oldMarker = '/* STAGE10_SPROUT_FROM_MAIN_EYE_V2 */';
const newMarker = '/* STAGE10_SPROUT_SVG_V3 */';

if (!html.includes(newMarker)) {
  if (!html.includes(oldMarker)) throw new Error('old stage10 marker not found');

  const cssPattern = /\/\* STAGE10_SPROUT_FROM_MAIN_EYE_V2 \*\/[\s\S]*?(?=\.orbit-line\{)/;
  const css = `/* STAGE10_SPROUT_SVG_V3 */
.stage-10 .room-evolution{top:50%;width:260px;height:190px;overflow:visible}
.eye-room .room-sprouts{display:block;width:100%;height:100%;overflow:visible}
.eye-room .room-sprout-stem{stroke:#111;stroke-width:5;stroke-linecap:round}
.eye-room .room-sprout-eye .outer{fill:#fff;stroke:#111;stroke-width:3}
.eye-room .room-sprout-eye .iris{fill:var(--room-blue);stroke:#111;stroke-width:2}
.eye-room .room-sprout-eye .pupil{fill:#111}
.eye-room .room-sprout-eye .shine{fill:#fff}
`;
  html = html.replace(cssPattern, css);

  const points = [
    [22,90,-8], [68,24,-10], [130,10,2], [192,24,10],
    [238,90,8], [230,145,4], [30,145,-4]
  ];
  let svg = '<svg class="room-sprouts" viewBox="0 0 260 190" aria-hidden="true">';
  for (const [x,y] of points) svg += `<line class="room-sprout-stem" x1="130" y1="95" x2="${x}" y2="${y}"/>`;
  for (const [x,y,r] of points) {
    svg += `<g class="room-sprout-eye" transform="translate(${x} ${y}) rotate(${r})"><ellipse class="outer" rx="22" ry="14"/><circle class="iris" r="8"/><circle class="pupil" r="3.3"/><circle class="shine" cx="3" cy="-3" r="1.7"/></g>`;
  }
  svg += '</svg>';

  const stage10Pattern = /if\(stage===10\)\{evolution\.innerHTML=[\s\S]*?pet\.setAttribute\('aria-label','大きな目玉から小さな目玉がにょきにょき生えた目玉'\);\}/;
  const stage10 = `if(stage===10){evolution.innerHTML='${svg}';status.textContent='なんだか、よくみえる。';help.innerHTML='たくさん食べて、進化したみたい。<br>目玉から、にょきにょき生えてきた。';next.textContent='20こで次の進化。';pet.setAttribute('aria-label','大きな目玉から小さな目玉がにょきにょき生えた目玉');}`;
  if (!stage10Pattern.test(html)) throw new Error('stage10 render block not found');
  html = html.replace(stage10Pattern, stage10);
}

// The previous version used generic .b1/.s1 selectors and broke unrelated page elements.
if (/(?<![A-Za-z0-9_-])\.(?:b[1-7]|s[1-7])\{/.test(html)) throw new Error('unsafe generic stage10 selectors remain');
if (!html.includes(newMarker)) throw new Error('new stage10 marker missing');
if ((html.match(/room-sprout-eye/g) || []).length < 7) throw new Error('not all sprout eyes rendered');
if (!html.includes('room-restart')) throw new Error('restart button missing');
if (!html.includes('金色の後光と目玉衛星')) throw new Error('final-stage wingless god missing');

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/index.html', html);
console.log('Built and validated corrected stage10 site.');
