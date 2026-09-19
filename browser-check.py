import os
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

URL = os.environ.get('SHITEN_TEST_URL', 'http://127.0.0.1:8000/')
STORAGE_KEY = 'shiten02-eye-eaten-v2'
SCREEN_DIR = Path(os.environ.get('SHITEN_SCREEN_DIR', 'browser-check-screenshots'))
SCREEN_DIR.mkdir(parents=True, exist_ok=True)

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--no-sandbox')
opts.add_argument('--disable-dev-shm-usage')
opts.add_argument('--window-size=390,844')
opts.add_argument('--force-device-scale-factor=1')

driver = webdriver.Chrome(options=opts)
driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {
    'width': 390,
    'height': 844,
    'deviceScaleFactor': 3,
    'mobile': True,
})
wait = WebDriverWait(driver, 20)


def js(script, *args):
    return driver.execute_script(script, *args)


def wait_ready():
    wait.until(lambda d: d.execute_script(
        "return !!document.querySelector('.hero-pet') && !!document.querySelector('.hero h1') && getComputedStyle(document.body).visibility !== 'hidden';"
    ))


def wait_intro_finished():
    wait.until(lambda d: d.execute_script(
        "return !document.getElementById('intro') && !document.body.classList.contains('intro-lock');"
    ))


def set_count(count):
    js("localStorage.setItem(arguments[0], String(arguments[1])); location.reload();", STORAGE_KEY, count)
    expected = 30 if count >= 30 else 20 if count >= 20 else 10 if count >= 10 else 0
    wait.until(lambda d: d.execute_script(
        "var p=document.querySelector('.hero-pet'); return p && p.classList.contains('stage-'+arguments[0]);",
        expected,
    ))
    wait_intro_finished()
    return expected


def assert_true(value, message):
    if not value:
        raise AssertionError(message)


def hero_geometry_ok():
    return js("""
      var p=document.querySelector('.hero-pet').getBoundingClientRect();
      var h=document.querySelector('.hero h1').getBoundingClientRect();
      return {petBottom:p.bottom,titleTop:h.top,left:p.left,right:p.right,vw:innerWidth};
    """)


def visible_mini_eye_centers():
    return js("""
      return Array.from(document.querySelectorAll('.hero-evolution .pet-mini-outer')).map(function(el){
        var r=el.getBoundingClientRect();
        var s=getComputedStyle(el);
        return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,visibility:s.visibility,opacity:s.opacity};
      });
    """)

try:
    driver.get(URL)
    wait_ready()
    wait_intro_finished()

    expected_mini = {0: 0, 10: 5, 20: 8, 30: 8}
    for count in (0, 10, 20, 30):
        stage = set_count(count)
        mini_count = js("return document.querySelectorAll('.hero-evolution .pet-mini-outer').length;")
        assert_true(mini_count == expected_mini[stage], f'stage {stage}: unexpected hero mini-eye count {mini_count}')
        geom = hero_geometry_ok()
        assert_true(geom['petBottom'] <= geom['titleTop'] + 0.5, f'stage {stage}: hero overlaps title: {geom}')
        assert_true(geom['left'] >= -0.5 and geom['right'] <= geom['vw'] + 0.5, f'stage {stage}: hero exceeds viewport: {geom}')
        if stage > 0:
            centers = visible_mini_eye_centers()
            assert_true(all(c['w'] > 10 and c['h'] > 6 and c['visibility'] != 'hidden' and float(c['opacity']) > 0 for c in centers), f'stage {stage}: mini eyes are not visibly rendered: {centers}')
        driver.save_screenshot(str(SCREEN_DIR / f'stage-{stage}-390.png'))

    set_count(10)
    js("document.getElementById('secretToggle').click();")
    wait.until(lambda d: d.execute_script("return document.getElementById('eyeRoom').open === true;"))
    room_mini_count = js("return document.querySelectorAll('#eyeRoom .room-evolution .pet-mini-outer').length;")
    assert_true(room_mini_count == 5, f'room stage 10: expected 5 mini eyes, got {room_mini_count}')
    upper_half_ok = js("""
      var pet=document.querySelector('#eyeRoom .room-pet').getBoundingClientRect();
      var center=pet.top+pet.height/2;
      return Array.from(document.querySelectorAll('#eyeRoom .room-evolution .pet-mini-outer')).every(function(el){
        var r=el.getBoundingClientRect(); return r.top+r.height/2 < center;
      });
    """)
    assert_true(upper_half_ok, 'room stage 10: a mini eye is at/below the main eye center')
    driver.save_screenshot(str(SCREEN_DIR / 'room-stage-10-390.png'))

    touch = js("""
      return {
        room:getComputedStyle(document.querySelector('.eye-room')).touchAction,
        food:getComputedStyle(document.querySelector('.room-food')).touchAction
      };
    """)
    assert_true(touch['room'] == 'manipulation', f"room touch-action is {touch['room']}")
    assert_true(touch['food'] == 'none', f"food drag touch-action is {touch['food']}")

    js("document.querySelector('.room-close').click();")
    set_count(9)
    js("document.getElementById('secretToggle').click();")
    wait.until(lambda d: d.execute_script("return document.getElementById('eyeRoom').open === true && !!document.querySelector('.room-food');"))
    js("document.querySelector('.room-food').click();")
    wait.until(lambda d: d.execute_script(
        "return localStorage.getItem(arguments[0])==='10' && document.querySelector('.hero-pet').classList.contains('stage-10');",
        STORAGE_KEY,
    ))

    js("document.querySelector('.room-close').click();")

    # First arrival at the final evolution: restart must stay hidden.
    set_count(0)
    js("document.getElementById('secretToggle').click();")
    wait.until(lambda d: d.execute_script("return document.getElementById('eyeRoom').open === true && !!document.querySelector('.room-food');"))
    for i in range(10):
        js("document.querySelector('.room-food').click();")
        wait.until(lambda d, n=i+1: d.execute_script(
            "return Number(localStorage.getItem(arguments[0]))===arguments[1];",
            STORAGE_KEY, n,
        ))
        if i < 9:
            js("document.querySelector('.room-spawn').click();")
            wait.until(lambda d: d.execute_script("return !!document.querySelector('.room-food');"))
    wait.until(lambda d: d.execute_script("return document.querySelector('#eyeRoom').classList.contains('stage-30');"))
    first_restart_display = js("return getComputedStyle(document.querySelector('.room-restart')).display;")
    assert_true(first_restart_display == 'none', f'first final evolution unexpectedly shows restart: {first_restart_display}')

    # After closing once and opening the room again, restart becomes available.
    js("document.querySelector('.room-close').click();")
    js("document.getElementById('secretToggle').click();")
    wait.until(lambda d: d.execute_script("return document.getElementById('eyeRoom').open === true && getComputedStyle(document.querySelector('.room-restart')).display !== 'none';"))
    js("document.querySelector('.room-restart').click();")
    wait.until(lambda d: d.execute_script(
        "return localStorage.getItem(arguments[0])==='0' && document.querySelector('.hero-pet').classList.contains('stage-0') && getComputedStyle(document.querySelector('.room-restart')).display === 'none';",
        STORAGE_KEY,
    ))

    nav_count = js("return document.querySelectorAll('.views .v').length;")
    about_href = js("var a=document.querySelector('.about-shiten-link'); return a && a.href;")
    assert_true(nav_count == 5, f'expected 5 navigation links, got {nav_count}')
    assert_true(about_href and 'about-shiten' in about_href, f'About link missing or wrong: {about_href}')

    profile_icons = js("""
      return {
        total: document.querySelectorAll('.creator-signature .creator-spine__icon').length,
        eye: document.querySelectorAll('.creator-signature .profile-icon-eye').length,
        card: document.querySelectorAll('.creator-signature .profile-icon-card').length,
        plan: document.querySelectorAll('.creator-signature .profile-icon-plan').length,
        event: document.querySelectorAll('.creator-signature .profile-icon-event').length,
        place: document.querySelectorAll('.creator-signature .profile-icon-place').length
      };
    """)
    assert_true(profile_icons == {'total': 5, 'eye': 1, 'card': 1, 'plan': 1, 'event': 1, 'place': 1}, f'profile icons wrong: {profile_icons}')

    print('Browser visual checks passed after intro at 390x844: saved stages, visible evolved hero, 5-eye Lv.10 room, live sync, restart sync, title separation, touch rules, navigation.')
finally:
    driver.quit()
