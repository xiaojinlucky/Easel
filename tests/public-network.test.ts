import { expect, test } from 'bun:test';
import { assertPublicUrl, installPublicNetworkGuard } from '../skills/extensions/baoyu-url-to-markdown/scripts/lib/browser/public-network';
import { CdpClient } from '../skills/extensions/baoyu-url-to-markdown/scripts/lib/browser/cdp-client';
import { BrowserSession } from '../skills/extensions/baoyu-url-to-markdown/scripts/lib/browser/session';

test('private DNS and disallowed redirects fail before dispatch', async () => {
  const resolve = (async () => [{address: '127.0.0.1', family: 4}]) as any;
  await expect(assertPublicUrl('https://github.com/test', ['github.com'], resolve)).rejects.toThrow('non-public');
  await expect(assertPublicUrl('https://127.0.0.1/', ['github.com'])).rejects.toThrow('supported');
  await expect(assertPublicUrl('http://github.com/test', ['github.com'])).rejects.toThrow('HTTPS');
  for (const address of ['10.0.0.1', '169.254.169.254', '::1', '::ffff:127.0.0.1']) {
    await expect(assertPublicUrl('https://assets.example/', undefined, (async () => [{address, family: address.includes(':') ? 6 : 4}]) as any)).rejects.toThrow('non-public');
  }
});

test.skipIf(process.env.EASEL_CDP_TEST !== '1')('real CloakBrowser rejects a synthetic 302 private redirect', async () => {
  const version = await (await fetch('http://127.0.0.1:9344/json/version')).json() as any;
  const client = await CdpClient.connect(version.webSocketDebuggerUrl);
  const browser = await BrowserSession.open(client);
  const session = browser.targetSession;
  const urls = new Map<string, string>();
  const failed: string[] = [];
  const continued: string[] = [];
  const source = 'https://github.com/easel-redirect-regression';
  session.on('Fetch.requestPaused', (event: any) => urls.set(event.requestId, event.request.url));
  const send = session.send.bind(session);
  session.send = (async (method: string, params: any = {}) => {
    const url = urls.get(params.requestId) || '';
    if (method === 'Fetch.continueRequest' && url === source) return send('Fetch.fulfillRequest', {requestId: params.requestId, responseCode: 302, responseHeaders: [{name: 'Location', value: 'https://127.0.0.1/private'}]});
    if (method === 'Fetch.continueRequest') continued.push(url);
    if (method === 'Fetch.failRequest') failed.push(url);
    return send(method, params);
  }) as any;
  try {
    await installPublicNetworkGuard(session, ['github.com']);
    await expect(browser.goto(source, 5000)).rejects.toThrow();
    expect(failed).toContain('https://127.0.0.1/private');
    expect(continued.some(url => url.includes('127.0.0.1'))).toBe(false);
  } finally {
    await browser.close();
    await client.close();
  }
}, 15000);
