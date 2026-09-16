import json
import time
import traceback
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

OUT = Path("browser-matrix-screenshots")
OUT.mkdir(exist_ok=True)

SITES = {
    "about": "https://kanatama0416-glitch.github.io/about-shiten/",
    "01": "https://kanatama0416-glitch.github.io/person1-shiten/",
    "02": "https://kanatama0416-glitch.github.io/person2-shiten/",
    "03": "https://kanatama0416-glitch.github.io/person3-shiten/",
    "04": "https://kanatama0416-glitch.github.io/person4-shiten/",
    "05": "https://kanatama0416-glitch.github.io/person5-shiten/",
}

ENVS = {
    "android": {
        "size": (412, 915),
        "ua": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    },
    "desktop": {"size": (1440, 900), "ua": None},
}

report = []
failures = []


def make_driver(env):
    options = webdriver.ChromeOptions()
    for arg in (
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
    ):
        options.add_argument(arg)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    if env["ua"]:
        options.add_argument("--user-agent=" + env["ua"])
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(*env["size"])
    driver.set_page_load_timeout(35)
    return driver


def js(driver, code, *args):
    return driver.execute_script(code, *args)


def visible(driver, selector):
    try:
        return driver.find_element(By.CSS_SELECTOR, selector).is_displayed()
    except Exception:
        return False


def wait_page(driver, key):
    WebDriverWait(driver, 20).until(
        lambda d: d.execute_script("return document.readyState") in ("interactive", "complete")
    )
    WebDriverWait(driver, 20).until(
        lambda d: "ページを読み込めませんでした。" not in d.find_element(By.TAG_NAME, "body").text
    )
    if key != "about":
        WebDriverWait(driver, 20).until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".page")) > 0)
        WebDriverWait(driver, 20).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "#secretToggle,#tearToggle")) > 0
        )
        WebDriverWait(driver, 20).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, ".intro")) == 0
            and "intro-lock" not in d.find_element(By.TAG_NAME, "body").get_attribute("class")
        )
        WebDriverWait(driver, 20).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "#shiten-pc-position-fix")) > 0
        )
    time.sleep(0.7)


def screenshot(driver, env_name, key, state):
    path = OUT / f"{env_name}-{key}-{state}.png"
    driver.save_screenshot(str(path))
    return str(path)


def common_checks(driver, env_name, key):
    body = driver.find_element(By.TAG_NAME, "body").text
    assert "ページを読み込めませんでした。" not in body, "load error fallback is visible"
    dims = js(
        driver,
        "return {vw:innerWidth,sw:document.documentElement.scrollWidth,bh:document.body.scrollHeight}",
    )
    assert dims["sw"] <= dims["vw"] + 4, f"horizontal overflow: {dims}"
    if key != "about":
        assert len(driver.find_elements(By.CSS_SELECTOR, ".v")) == 5, "view nav count is not five"
        assert visible(driver, ".about-shiten-link"), "About link is hidden"
        button = driver.find_element(By.CSS_SELECTOR, "#secretToggle,#tearToggle")
        rect = js(
            driver,
            "const r=arguments[0].getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}",
            button,
        )
        if env_name == "desktop":
            assert 900 <= (rect["left"] + rect["right"]) / 2 <= 1060, f"desktop eye position: {rect}"
        else:
            assert rect["right"] >= dims["vw"] - 35, f"mobile eye position: {rect}"
    return dims


def check_about(driver, env_name):
    assert visible(driver, "#heroEye"), "About hero eye missing"
    main = js(
        driver,
        'const r=document.querySelector("main").getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}',
    )
    if env_name == "desktop":
        assert 715 <= main["width"] <= 725, f"About main width: {main}"
        assert abs((main["left"] + main["right"]) / 2 - 720) <= 3, f"About main center: {main}"
    eye = driver.find_element(By.ID, "heroEye")
    ActionChains(driver).move_to_element(eye).click_and_hold().move_by_offset(0, 45).release().perform()
    WebDriverWait(driver, 4).until(
        lambda d: "on" in d.find_element(By.CSS_SELECTOR, ".game-ball").get_attribute("class")
    )
    ball = driver.find_element(By.CSS_SELECTOR, ".game-ball")
    ball_rect = js(
        driver,
        "const r=arguments[0].getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}",
        ball,
    )
    if env_name == "desktop":
        assert ball_rect["left"] >= main["left"] - 2 and ball_rect["right"] <= main["right"] + 2, (
            f"game ball outside centered main: ball={ball_rect}, main={main}"
        )
    return {"game_started": True, "ball_rect": ball_rect, "main_rect": main}


def check_01(driver):
    driver.find_element(By.ID, "secretToggle").click()
    time.sleep(0.25)
    assert js(driver, 'return document.body.classList.contains("secret-mode")'), "01 secret mode did not activate"
    return {"secret_mode": True}


def check_02(driver):
    driver.find_element(By.ID, "secretToggle").click()
    WebDriverWait(driver, 5).until(
        lambda d: d.find_element(By.ID, "eyeRoom").get_attribute("open") is not None
    )
    foods = driver.find_elements(By.CSS_SELECTOR, ".room-food")
    assert foods, "02 room opened but no food was spawned"
    foods[0].click()
    time.sleep(0.45)
    count = int(driver.find_element(By.CSS_SELECTOR, ".room-count b").text)
    assert count >= 1, f"02 feeding count: {count}"
    return {"room_open": True, "feed_count": count}


def check_03(driver):
    driver.find_element(By.ID, "secretToggle").click()
    WebDriverWait(driver, 3).until(lambda d: js(d, 'return document.body.classList.contains("cat-ready")'))
    WebDriverWait(driver, 3).until(
        lambda d: js(d, 'return document.documentElement.classList.contains("cat-night")')
    )
    js(driver, "window.scrollBy(0,520)")
    time.sleep(0.45)
    paws = len(driver.find_elements(By.CSS_SELECTOR, ".cat-paw"))
    assert paws > 0, "03 paw trail did not appear after scroll"
    return {"cat_ready": True, "cat_night": True, "paw_count": paws}


def check_04(driver):
    button = driver.find_element(By.ID, "tearToggle")
    button.click()
    time.sleep(0.45)
    garden = driver.find_element(By.ID, "p4Garden")
    paths = len(driver.find_elements(By.CSS_SELECTOR, "#p4GardenSvg path"))
    assert paths > 0 and garden.value_of_css_property("display") != "none", f"04 garden paths: {paths}"
    button.click()
    time.sleep(0.2)
    assert garden.value_of_css_property("display") == "none", "04 second eye press did not hide garden"
    return {"garden_built": True, "garden_paths": paths, "second_press_hides": True}


def check_05(driver):
    driver.find_element(By.ID, "secretToggle").click()
    WebDriverWait(driver, 3).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, ".final-finale.on")) > 0
    )
    assert visible(driver, ".final-finale"), "05 finale is hidden"
    time.sleep(0.2)
    driver.find_element(By.ID, "secretToggle").click()
    time.sleep(0.2)
    assert len(driver.find_elements(By.CSS_SELECTOR, ".final-finale")) == 0, "05 second eye press did not close finale"
    return {"finale_opened": True, "second_press_closes": True}


CHECKS = {
    "about": check_about,
    "01": check_01,
    "02": check_02,
    "03": check_03,
    "04": check_04,
    "05": check_05,
}

for env_name, env in ENVS.items():
    for key, url in SITES.items():
        driver = None
        row = {"environment": env_name, "site": key, "url": url, "ok": False}
        try:
            driver = make_driver(env)
            driver.get(url + "?matrix_check=20260916d")
            wait_page(driver, key)
            row["initial_screenshot"] = screenshot(driver, env_name, key, "initial")
            row["layout"] = common_checks(driver, env_name, key)
            row["interaction"] = CHECKS[key](driver, env_name) if key == "about" else CHECKS[key](driver)
            row["interaction_screenshot"] = screenshot(driver, env_name, key, "interaction")
            severe = []
            try:
                severe = [
                    e.get("message", "")
                    for e in driver.get_log("browser")
                    if e.get("level") == "SEVERE" and "favicon.ico" not in e.get("message", "")
                ]
            except Exception:
                pass
            row["severe_console"] = severe
            js_errors = [m for m in severe if "Uncaught" in m or "javascript" in m.lower()]
            shared_404 = [
                m for m in severe if "person1-shiten/" in m and "Failed to load resource" in m
            ]
            assert not js_errors, "JavaScript errors: " + " | ".join(js_errors[:3])
            assert not shared_404, "Shared interaction resource 404: " + " | ".join(shared_404[:3])
            row["ok"] = True
        except Exception as exc:
            row["error"] = f"{type(exc).__name__}: {exc}"
            row["traceback"] = traceback.format_exc(limit=4)
            failures.append(f"{env_name}/{key}: {row['error']}")
            if driver:
                try:
                    row["failure_screenshot"] = screenshot(driver, env_name, key, "FAIL")
                except Exception:
                    pass
        finally:
            if driver:
                try:
                    driver.quit()
                except Exception:
                    pass
            report.append(row)

Path("browser-matrix-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
)
Path("browser-matrix-summary.txt").write_text(
    "\n".join(
        ("PASS" if r["ok"] else "FAIL")
        + f"  {r['environment']:8} {r['site']}"
        + (("  " + r.get("error", "")) if not r["ok"] else "")
        for r in report
    )
    + "\n",
    encoding="utf-8",
)
print(Path("browser-matrix-summary.txt").read_text())
if failures:
    print("\nFAILURES:\n" + "\n".join(failures))
    raise SystemExit(1)
