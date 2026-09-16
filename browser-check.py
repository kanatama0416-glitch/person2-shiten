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


def set_count(count):
    js("localStorage.setItem(arguments[0], String(arguments[1])); location.reload();", STORAGE_KEY, count)
    expected = 30 if count >= 30 else 20 if count >= 20 else 10 if count >= 10 else 0
    wait.until(lambda d: d.execute_script(
        "var p=document.querySelector('.hero-pet'); return p && p.classList.contains('stage-'+arguments[0]);",
        expected,
    ))
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

try:
    driver.get(URL)
    wait_ready()

    expected_mini = {0: 0, 10: 5, 20: 8, 30: 8}
    for count in (0, 10, 20, 30):
        stage = set_count(count)
        mini_count = js("return document.querySelectorAll('.hero-evolution .pet-mini-outer').length;")
        assert_true(mini_count == expected_mini[stage], f'stage {stage}: unexpected hero mini-eye count {mini_count}')
        geom = hero_geometry_ok()
        assert_true(geom['petBottom'] <= geom['titleTop'] + 0.5, f'stage {stage}: hero overlaps title: {geom}')
        assert_true(geom['left'] >= -0.5 and geom['right'] <= geom['vw'] + 0.5, f'stage {stage}: hero exceeds viewport: {geom}')
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
    set_count(30)
    js("document.getElementById('secretToggle').click();")
    wait.until(lambda d: d.execute_script("return document.getElementById('eyeRoom').open === true && getComputedStyle(document.querySelector('.room-restart')).display !== 'none';"))
    js("document.querySelector('.room-restart').click();")
    wait.until(lambda d: d.execute_script(
        "return localStorage.getItem(arguments[0])==='0' && document.querySelector('.hero-pet').classList.contains('stage-0');",
        STORAGE_KEY,
    ))

    nav_count = js("return document.querySelectorAll('.views .v').length;")
    about_href = js("var a=document.querySelector('.about-shiten-link'); return a && a.href;")
    assert_true(nav_count == 5, f'expected 5 navigation links, got {nav_count}')
    assert_true(about_href and 'about-shiten' in about_href, f'About link missing or wrong: {about_href}')

    print('Browser smoke checks passed at 390x844: saved stages, 5-eye Lv.10 room, live sync, restart sync, title separation, touch rules, navigation.')
finally:
    driver.quit()
