"""Create or verify this installation's local Postiz account through its actual UI."""
import json
import secrets
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from easel.runtime import write_json

credentials_file = root / '.runtime/postiz-account.json'
if not credentials_file.exists():
    write_json(credentials_file, {'email': 'studio@easel.local', 'password': secrets.token_urlsafe(30), 'company': 'Easel Studio', 'registered': False})
account = json.loads(credentials_file.read_text(encoding='utf-8'))
with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(str(root / '.runtime/postiz-ui'), headless=True, viewport={'width': 1440, 'height': 1000})
    page = browser.pages[0]
    page.goto('http://localhost:4007/auth/login' if account['registered'] else 'http://localhost:4007/auth')
    if '/auth' in page.url:
        page.locator('input[name=email]').fill(account['email'])
        page.locator('input[name=password]').fill(account['password'])
        if not account['registered']:
            page.locator('input[name=company]').fill(account['company'])
        page.get_by_role('button', name='Sign in' if account['registered'] else 'Create Account', exact=True).click()
        page.wait_for_url(lambda url: '/auth' not in url, timeout=45000)
    account['registered'] = True
    write_json(credentials_file, account)
    page.screenshot(path=str(root / '.runtime/postiz-dashboard.png'), full_page=True)
    print('Local account verified:', account['email'], page.url)
    if not account.get('api_key'):
        import requests
        page.goto('http://localhost:4007/settings')
        page.get_by_text('Developers', exact=True).click()
        page.get_by_role('button', name='Reveal', exact=True).first.click()
        key = page.locator('code').first.inner_text().strip()
        with requests.Session() as session:
            session.trust_env = False
            response = session.get('http://localhost:4007/api/public/v1/integrations', headers={'Authorization': key}, timeout=10)
            response.raise_for_status()
        account['api_key'] = key
        write_json(credentials_file, account)
        print('Local API connection verified; key saved privately.')
    browser.close()
