import json
import sys
from pathlib import Path

TARGET = Path(sys.argv[1] if len(sys.argv) > 1 else 'public/index.html')
MARKER = 'SHITEN_IDLE_GUIDE_V1'

text = TARGET.read_text(encoding='utf-8')
if MARKER in text:
    print('Idle guide already injected.')
    raise SystemExit(0)

needle = 'document.open();document.write(html);document.close()'
if needle not in text:
    raise SystemExit('document write marker not found')

guide_addon = f'''<style>
/* {MARKER} */
.room-food.shiten-feed-guide{{z-index:40}}
.room-food.shiten-feed-guide::before{{content:'↑ この目玉をペットに運んでね';position:absolute;left:50%;bottom:calc(100% + 9px);transform:translateX(-50%);z-index:60;pointer-events:none;white-space:nowrap;padding:7px 10px;border:2px solid #111;border-radius:999px;background:#111;color:#fff;box-shadow:3px 3px 0 var(--room-blue);font:800 12px/1.2 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;letter-spacing:.01em;animation:shitenGuideBob .9s ease-in-out infinite alternate}}
.room-food.shiten-feed-guide::after{{content:'';position:absolute;left:50%;top:-7px;z-index:59;width:10px;height:10px;background:#111;transform:translateX(-50%) rotate(45deg);pointer-events:none}}
.room-spawn.shiten-spawn-guide{{position:relative;z-index:40}}
.room-spawn.shiten-spawn-guide::before{{content:'↓ ここを押すと、ごはんが生まれるよ';position:absolute;left:50%;bottom:calc(100% + 11px);transform:translateX(-50%);z-index:60;pointer-events:none;white-space:nowrap;padding:7px 10px;border:2px solid #111;border-radius:999px;background:#111;color:#fff;box-shadow:3px 3px 0 var(--room-blue);font:800 12px/1.2 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;letter-spacing:.01em;animation:shitenGuideBob .9s ease-in-out infinite alternate}}
.room-spawn.shiten-spawn-guide::after{{content:'';position:absolute;left:50%;top:-8px;z-index:59;width:11px;height:11px;background:#111;transform:translateX(-50%) rotate(45deg);pointer-events:none}}
@keyframes shitenGuideBob{{from{{transform:translate(-50%,0)}}to{{transform:translate(-50%,-4px)}}}}
@media(max-width:390px){{.room-food.shiten-feed-guide::before,.room-spawn.shiten-spawn-guide::before{{font-size:11px;padding:6px 8px}}}}
@media(prefers-reduced-motion:reduce){{.room-food.shiten-feed-guide::before,.room-spawn.shiten-spawn-guide::before{{animation:none}}}}
</style><script>
(function(){{
  var attractScript=document.createElement('script');
  attractScript.src='https://kanatama0416-glitch.github.io/person1-shiten/eye-attract.js?v=0a1ae7d9';
  document.head.appendChild(attractScript);
  var toggleScript=document.createElement('script');
  toggleScript.src='https://kanatama0416-glitch.github.io/person1-shiten/eye-toggle-off.js?v=fb86c186';
  document.head.appendChild(toggleScript);
  var room=document.getElementById('eyeRoom');
  if(!room)return;
  var tray=room.querySelector('.room-tray');
  var launcher=document.getElementById('secretToggle');
  var spawnButton=room.querySelector('.room-spawn');
  var guideTimer=null;
  function clearGuide(){{
    if(guideTimer){{clearTimeout(guideTimer);guideTimer=null;}}
    room.querySelectorAll('.room-food.shiten-feed-guide').forEach(function(el){{el.classList.remove('shiten-feed-guide');}});
    if(spawnButton)spawnButton.classList.remove('shiten-spawn-guide');
  }}
  function showGuide(){{
    clearGuide();
    if(!room.open||room.classList.contains('stage-30'))return;
    var foods=tray?tray.querySelectorAll('.room-food'):[];
    if(foods.length){{
      var food=foods[Math.floor(foods.length/2)];
      if(food)food.classList.add('shiten-feed-guide');
      return;
    }}
    if(spawnButton&&!spawnButton.disabled)spawnButton.classList.add('shiten-spawn-guide');
  }}
  function scheduleGuide(){{
    clearGuide();
    if(!room.open||room.classList.contains('stage-30'))return;
    guideTimer=setTimeout(showGuide,2000);
  }}
  room.addEventListener('pointerdown',clearGuide,true);
  room.addEventListener('pointerup',scheduleGuide,true);
  room.addEventListener('pointercancel',scheduleGuide,true);
  room.addEventListener('keydown',function(){{clearGuide();setTimeout(scheduleGuide,0);}},true);
  room.addEventListener('close',clearGuide);
  if(launcher)launcher.addEventListener('click',function(){{setTimeout(scheduleGuide,0);}});
  if(spawnButton)spawnButton.addEventListener('click',function(){{setTimeout(scheduleGuide,0);}});
}})();
</script>'''

addon_literal = json.dumps(guide_addon, ensure_ascii=False).replace('</script', '<\\/script')
hook = "html=html.replace('</body>'," + addon_literal + "+'</body>');"
text = text.replace(needle, hook + needle, 1)

if MARKER not in text or 'shiten-spawn-guide' not in text or 'shiten-feed-guide' not in text:
    raise SystemExit('guide injection validation failed')

TARGET.write_text(text, encoding='utf-8')
print(f'Injected idle feeding guides into {TARGET}.')
