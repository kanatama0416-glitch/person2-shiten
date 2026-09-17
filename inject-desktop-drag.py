import json
import sys
from pathlib import Path

TARGET = Path(sys.argv[1] if len(sys.argv) > 1 else 'public/index.html')
MARKER = 'SHITEN_DESKTOP_DRAG_V1'

text = TARGET.read_text(encoding='utf-8')
if MARKER in text:
    print('Desktop drag fix already injected.')
    raise SystemExit(0)

needle = 'document.open();document.write(html);document.close()'
if needle not in text:
    raise SystemExit('document write marker not found')

addon = f'''<style>
/* {MARKER} */
.room-food.shiten-desktop-drag-ghost{{position:absolute!important;z-index:1000!important;margin:0!important;pointer-events:none!important;opacity:.95!important;filter:drop-shadow(2px 4px 0 #1112);transform:none!important}}
.room-food.shiten-desktop-drag-source{{opacity:.2!important}}
</style><script>
(function(){{
  var room=document.getElementById('eyeRoom');
  if(!room)return;
  var pet=room.querySelector('.room-pet');
  var iris=room.querySelector('.room-pet-iris');
  if(!pet)return;

  var active=null;

  function overPet(x,y){{
    var r=pet.getBoundingClientRect();
    return x>=r.left-18&&x<=r.right+18&&y>=r.top-18&&y<=r.bottom+18;
  }}

  function makeGhost(food,x,y){{
    var ghost=food.cloneNode(true);
    ghost.classList.remove('shiten-feed-guide');
    ghost.classList.add('shiten-desktop-drag-ghost');
    ghost.removeAttribute('id');
    ghost.tabIndex=-1;
    ghost.setAttribute('aria-hidden','true');
    room.appendChild(ghost);
    food.classList.add('shiten-desktop-drag-source');
    active.ghost=ghost;
    placeGhost(x,y);
  }}

  function placeGhost(x,y){{
    if(!active||!active.ghost)return;
    var rr=room.getBoundingClientRect();
    active.ghost.style.left=(x-rr.left+room.scrollLeft-25)+'px';
    active.ghost.style.top=(y-rr.top+room.scrollTop-24)+'px';
  }}

  function updatePet(x,y){{
    var r=pet.getBoundingClientRect();
    var hit=overPet(x,y);
    pet.classList.toggle('ready',hit);
    if(iris){{
      iris.style.translate=Math.max(-12,Math.min(12,(x-r.left-r.width/2)/10))+'px '+Math.max(-8,Math.min(8,(y-r.top-r.height/2)/10))+'px';
    }}
    return hit;
  }}

  function cleanup(){{
    if(!active)return;
    if(active.ghost)active.ghost.remove();
    if(active.food)active.food.classList.remove('shiten-desktop-drag-source');
    pet.classList.remove('ready');
    if(iris)iris.style.translate='';
    active=null;
  }}

  room.addEventListener('pointerdown',function(e){{
    var food=e.target.closest&&e.target.closest('.room-food');
    if(!food||food.classList.contains('shiten-desktop-drag-ghost')||e.button!==0||!e.isPrimary)return;
    // Own the drag gesture before the older per-food pointer-capture handler runs.
    // A plain click is still allowed to reach the existing click-to-feed handler.
    e.stopPropagation();
    active={{food:food,id:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false,ghost:null}};
  }},true);

  document.addEventListener('pointermove',function(e){{
    if(!active||e.pointerId!==active.id)return;
    var distance=Math.hypot(e.clientX-active.startX,e.clientY-active.startY);
    if(!active.moved&&distance<5)return;
    active.moved=true;
    e.preventDefault();
    e.stopPropagation();
    if(!active.ghost)makeGhost(active.food,e.clientX,e.clientY);
    else placeGhost(e.clientX,e.clientY);
    updatePet(e.clientX,e.clientY);
  }},true);

  document.addEventListener('pointerup',function(e){{
    if(!active||e.pointerId!==active.id)return;
    var food=active.food;
    var moved=active.moved;
    var hit=moved&&overPet(e.clientX,e.clientY);
    if(moved){{
      e.preventDefault();
      e.stopPropagation();
    }}
    cleanup();
    if(hit&&food&&food.isConnected){{
      // Reuse the original feed() path through its existing click handler.
      food.click();
    }}
  }},true);

  document.addEventListener('pointercancel',function(e){{
    if(active&&e.pointerId===active.id)cleanup();
  }},true);
  window.addEventListener('blur',cleanup);
  room.addEventListener('close',cleanup);
}})();
</script>'''

addon_literal = json.dumps(addon, ensure_ascii=False).replace('</script', '<\\/script')
hook = "html=html.replace('</body>'," + addon_literal + "+'</body>');"
text = text.replace(needle, hook + needle, 1)

if MARKER not in text or 'shiten-desktop-drag-ghost' not in text:
    raise SystemExit('desktop drag injection validation failed')

TARGET.write_text(text, encoding='utf-8')
print(f'Injected desktop drag fix into {TARGET}.')
