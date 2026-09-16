import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

URL = os.environ.get('SHITEN_TEST_URL', 'http://127.0.0.1:8000/')

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--no-sandbox')
opts.add_argument('--disable-dev-shm-usage')
opts.add_argument('--window-size=390,844')

driver = webdriver.Chrome(options=opts)
wait = WebDriverWait(driver, 25)

try:
    driver.get(URL)
    wait.until(lambda d: d.execute_script(
        "return !!document.querySelector('.hero-pet') && getComputedStyle(document.body).visibility !== 'hidden';"
    ))
    wait.until(lambda d: d.execute_script(
        "return !document.getElementById('intro') && !document.body.classList.contains('intro-lock');"
    ))

    driver.execute_script("localStorage.setItem('shiten02-eye-eaten-v2','0'); location.reload();")
    wait.until(lambda d: d.execute_script(
        "return !!document.getElementById('secretToggle') && !document.getElementById('intro');"
    ))

    driver.find_element(By.ID, 'secretToggle').click()
    wait.until(lambda d: d.execute_script(
        "return document.getElementById('eyeRoom').open && !!document.querySelector('.room-food');"
    ))

    wait.until(lambda d: d.execute_script(
        "return !!document.querySelector('.room-food.shiten-feed-guide');"
    ))
    feed_text = driver.execute_script(
        "return getComputedStyle(document.querySelector('.room-food.shiten-feed-guide'),'::before').content;"
    )
    if 'ペットに運んでね' not in feed_text:
        raise AssertionError(f'feed guide text missing: {feed_text}')

    driver.find_element(By.CSS_SELECTOR, '.room-food').click()
    wait.until(lambda d: d.execute_script(
        "return !document.querySelector('.room-food') && !!document.querySelector('.room-spawn.shiten-spawn-guide');"
    ))
    spawn_text = driver.execute_script(
        "return getComputedStyle(document.querySelector('.room-spawn.shiten-spawn-guide'),'::before').content;"
    )
    if 'ごはんが生まれるよ' not in spawn_text:
        raise AssertionError(f'spawn guide text missing: {spawn_text}')

    driver.find_element(By.CSS_SELECTOR, '.room-spawn').click()
    wait.until(lambda d: d.execute_script(
        "return !!document.querySelector('.room-food') && !document.querySelector('.room-spawn.shiten-spawn-guide');"
    ))
    wait.until(lambda d: d.execute_script(
        "return !!document.querySelector('.room-food.shiten-feed-guide');"
    ))

    print('Idle guide checks passed: feed guide -> spawn guide -> feed guide.')
finally:
    driver.quit()
