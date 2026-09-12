// Easel local adaptation: enforce public-network requests before browser navigation.
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import type { TargetSession } from './cdp-client';

export async function assertPublicUrl(raw: string, domains?: string[], resolve = lookup): Promise<void> {
  const url = new URL(raw);
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Public collection requires HTTPS without credentials or custom ports');
  if (domains && !domains.some(domain => host === domain || host.endsWith('.' + domain))) throw new Error('Redirect left the supported public sites');
  const addresses = await resolve(host, { all: true });
  if (!addresses.length || addresses.some(record => ipaddr.process(record.address).range() !== 'unicast')) throw new Error('Blocked non-public network address');
}

export async function installPublicNetworkGuard(session: TargetSession, domains: string[]): Promise<void> {
  session.on('Fetch.requestPaused', async (event: { requestId: string; request: {url: string}; resourceType: string }) => {
    try {
      await assertPublicUrl(event.request.url, event.resourceType === 'Document' ? domains : undefined);
    } catch (error) {
      if (event.resourceType === 'Document') process.stderr.write('Easel network guard: ' + (error as Error).message + '\n');
      await session.send('Fetch.failRequest', {requestId: event.requestId, errorReason: 'BlockedByClient'}).catch(() => {});
      return;
    }
    await session.send('Fetch.continueRequest', {requestId: event.requestId}).catch(() => {});
  });
  await session.send('Network.setBypassServiceWorker', {bypass: true});
  await session.send('Network.setCacheDisabled', {cacheDisabled: true});
  await session.send('Network.setBlockedURLs', {urls: ['file://*', 'http://*', 'ws://*', 'wss://*']});
  await session.send('Fetch.enable', {patterns: [{urlPattern: '*', requestStage: 'Request'}]});
}
