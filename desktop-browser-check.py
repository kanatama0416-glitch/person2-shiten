import os
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

URL = os.environ.get('SHITEN_TEST_URL', 'http://127.0.0.1:8000/')
STORAGE_KEY = 'shiten02-eye-eaten-v2'
SCREEN_DIR = Path(os.environ.get('SHITEN_DESKTOP_SCREEN_DIR', 'desktop-browser-check-screenshots'))
SCREEN_DIR.mkdir(parents=True, exist_ok=True)

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--no-sandbox')
opts.add_argument('--disable-dev-shm-usage')
opts.add_argument('--window-size=1280,900')
opts.add_argument('--force-device-scale-factor=1')

driver = webdriver.Chrome(options=opts)
wait = WebDriverWait(driver, 20)


def js(script, *args):
    return driver.execute_script(script, *args)


def wait_ready():
    wait.until(lambda d: d.execute_script(
        "return !!document.querySelector('.hero-pet') && !!document.getElementById('secretToggle') && getComputedStyle(document.body).visibility !== 'hidden';"
    ))
    wait.until(lambda d: d.execute_script(
        "return !document.getElementById('intro') && !document.body.classList.contains('intro-lock');"
    ))


def assert_true(value, message):
    if not value:
        raise AssertionError(message)


def open_room():
    js("document.getElementById('secretToggle').click();")
    wait.until(lambda d: d.execute_script(
        "return document.getElementById('eyeRoom').open === true && !!document.querySelector('#eyeRoom .room-food');"
    ))


def drag_one_food_to_pet():
    food = driver.find_element(By.CSS_SELECTOR, '#eyeRoom .room-food')
    pet = driver.find_element(By.CSS_SELECTOR, '#eyeRoom .room-pet')
    tray = driver.find_element(By.CSS_SELECTOR, '#eyeRoom .room-tray')
    food_rect = food.rect
    pet_rect = pet.rect
    tray_rect = tray.rect
    assert_true(pet_rect['y'] + pet_rect['height'] < tray_rect['y'],
                f'pet should be outside/above the food tray on desktop: pet={pet_rect}, tray={tray_rect}')
    ActionChains(driver).move_to_element(food).click_and_hold(food).pause(0.15).move_to_element(pet).pause(0.15).release(pet).perform()


try:
    driver.get(URL)
    wait_ready()
    js("localStorage.setItem(arguments[0],'0'); location.reload();", STORAGE_KEY)
    wait_ready()

    # Verify the 02 book-cover layout is unchanged and Google Books covers can load where configured.
    wait.until(lambda d: d.execute_script(
        "return [...document.querySelectorAll('.book-cover-photo')].length===5 && [...document.querySelectorAll('.book-cover-photo')].every(function(img){return img.complete && img.naturalWidth>20 && img.naturalHeight>20;});"
    ))
    cover_state = js("""
        return [...document.querySelectorAll('.book')].map(function(book){
          var img=book.querySelector('.book-cover-photo'), frame=book.querySelector('.cover').getBoundingClientRect(), mock=book.querySelector('.mock').getBoundingClientRect();
          return {src:img.currentSrc||img.src, source:img.dataset.coverSource||'local', isbn:img.dataset.googleBooksIsbn||'', frameW:frame.width, frameH:frame.height, mockW:mock.width, mockH:mock.height, naturalW:img.naturalWidth, naturalH:img.naturalHeight};
        });
    """)
    assert_true(len(cover_state) == 5, f'expected five book covers, got {len(cover_state)}')
    for state in cover_state[1:]:
        assert_true(abs(state['frameW']-cover_state[0]['frameW']) < 1 and abs(state['frameH']-cover_state[0]['frameH']) < 1,
                    f'book cover frame size changed: {cover_state}')
        assert_true(abs(state['mockW']-cover_state[0]['mockW']) < 1 and abs(state['mockH']-cover_state[0]['mockH']) < 1,
                    f'book mock size changed: {cover_state}')
    google_loaded = [state for state in cover_state if state['source'] == 'google-books' and 'books.google.com/books/content' in state['src']]
    assert_true(len(google_loaded) >= 1, f'no Google Books cover loaded; cover state={cover_state}')
    driver.save_screenshot(str(SCREEN_DIR / 'desktop-books-google.png'))
    print('Book cover check:', cover_state)

    open_room()
    drag_one_food_to_pet()
    wait.until(lambda d: d.execute_script(
        "return localStorage.getItem(arguments[0])==='1' && document.querySelector('#eyeRoom .room-count b').textContent==='1';",
        STORAGE_KEY,
    ))

    # Spawn a second food and cross the first evolution milestone using drag-and-drop again.
    js("document.querySelector('#eyeRoom .room-spawn').click();")
    wait.until(lambda d: d.execute_script("return !!document.querySelector('#eyeRoom .room-food');"))
    drag_one_food_to_pet()
    wait.until(lambda d: d.execute_script(
        "return localStorage.getItem(arguments[0])==='2' && document.querySelector('.hero-pet').classList.contains('stage-10') && document.getElementById('eyeRoom').classList.contains('stage-10');",
        STORAGE_KEY,
    ))

    level = js("return document.querySelector('#eyeRoom .room-level').textContent;")
    next_text = js("return document.querySelector('#eyeRoom .room-next').textContent;")
    marker = js("return document.documentElement.innerHTML.includes('SHITEN_DESKTOP_DRAG_V1');")
    assert_true(level == 'Lv.2', f'expected Lv.2 after second feed, got {level!r}')
    assert_true(next_text == '5こで次の進化。', f'expected next milestone 5, got {next_text!r}')
    assert_true(marker, 'desktop drag fix marker missing from deployed document')

    driver.save_screenshot(str(SCREEN_DIR / 'desktop-drag-stage-2.png'))
    print('Desktop drag check passed at 1280x900: food can leave the tray, reach the pet, increment the count, and evolve at 2 feeds.')
finally:
    driver.quit()
