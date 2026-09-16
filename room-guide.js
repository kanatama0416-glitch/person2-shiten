(function(){
  'use strict';
  var style=document.createElement('style');
  style.textContent=`
.room-food.shiten-feed-guide{z-index:40}
.room-food.shiten-feed-guide::before{content:'↑ この目玉をペットに運んでね';position:absolute;left:50%;bottom:calc(100% + 9px);transform:translateX(-50%);z-index:60;pointer-events:none;white-space:nowrap;padding:7px 10px;border:2px solid #111;border-radius:999px;background:#111;color:#fff;box-shadow:3px 3px 0 var(--room-blue);font:800 12px/1.2 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;letter-spacing:.01em;animation:shitenGuideBob .9s ease-in-out infinite alternate}
.room-food.shiten-feed-guide::after{content:'';position:absolute;left:50%;top:-7px;z-index:59;width:10px;height:10px;background:#111;transform:translateX(-50%) rotate(45deg);pointer-events:none}
.room-spawn.shiten-spawn-guide{position:relative;z-index:40}
.room-spawn.shiten-spawn-guide::before{content:'↓ ここを押すと、ごはんが生まれるよ';position:absolute;left:50%;bottom:calc(100% + 11px);transform:translateX(-50%);z-index:60;pointer-events:none;white-space:nowrap;padding:7px 10px;border:2px solid #111;border-radius:999px;background:#111;color:#fff;box-shadow:3px 3px 0 var(--room-blue);font:800 12px/1.2 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;letter-spacing:.01em;animation:shitenGuideBob .9s ease-in-out infinite alternate}
.room-spawn.shiten-spawn-guide::after{content:'';position:absolute;left:50%;top:-8px;z-index:59;width:11px;height:11px;background:#111;transform:translateX(-50%) rotate(45deg);pointer-events:none}
@keyframes shitenGuideBob{from{transform:translate(-50%,0)}to{transform:translate(-50%,-4px)}}
@media(max-width:390px){.room-food.shiten-feed-guide::before,.room-spawn.shiten-spawn-guide::before{font-size:11px;padding:6px 8px}}
@media(prefers-reduced-motion:reduce){.room-food.shiten-feed-guide::before,.room-spawn.shiten-spawn-guide::before{animation:none}}
`;
  document.head.appendChild(style);

  var room=document.getElementById('eyeRoom');
  if(!room)return;
  var tray=room.querySelector('.room-tray');
  var launcher=document.getElementById('secretToggle');
  var spawnButton=room.querySelector('.room-spawn');
  var guideTimer=null;
  function clearGuide(){
    if(guideTimer){clearTimeout(guideTimer);guideTimer=null;}
    room.querySelectorAll('.room-food.shiten-feed-guide').forEach(function(el){el.classList.remove('shiten-feed-guide');});
    if(spawnButton)spawnButton.classList.remove('shiten-spawn-guide');
  }
  function showGuide(){
    clearGuide();
    if(!room.open||room.classList.contains('stage-30'))return;
    var foods=tray?tray.querySelectorAll('.room-food'):[];
    if(foods.length){
      var food=foods[Math.floor(foods.length/2)];
      if(food)food.classList.add('shiten-feed-guide');
      return;
    }
    if(spawnButton&&!spawnButton.disabled)spawnButton.classList.add('shiten-spawn-guide');
  }
  function scheduleGuide(){
    clearGuide();
    if(!room.open||room.classList.contains('stage-30'))return;
    guideTimer=setTimeout(showGuide,2000);
  }
  room.addEventListener('pointerdown',clearGuide,true);
  room.addEventListener('pointerup',scheduleGuide,true);
  room.addEventListener('pointercancel',scheduleGuide,true);
  room.addEventListener('keydown',function(){clearGuide();setTimeout(scheduleGuide,0);},true);
  room.addEventListener('close',clearGuide);
  if(launcher)launcher.addEventListener('click',function(){setTimeout(scheduleGuide,0);});
  if(spawnButton)spawnButton.addEventListener('click',function(){setTimeout(scheduleGuide,0);});
})();
