import { expect, test } from 'bun:test';
import { detectInteractionGateFromSnapshot } from '../skills/extensions/baoyu-url-to-markdown/scripts/lib/browser/interaction-gates';

const article = { title: 'reCAPTCHA v3 false positive discussion', currentUrl: 'https://github.com/JimLiu/baoyu-skills/issues/205', bodyText: 'This issue discusses recaptcha and hcaptcha detection in normal articles.', hasCloudflareTurnstile: false, hasCloudflareChallenge: false, hasRecaptcha: false, hasRecaptchaIframe: false, hasHcaptcha: false, hasHcaptchaIframe: false };
test('captcha names inside an article are not a verification gate', () => {
  expect(detectInteractionGateFromSnapshot(article)).toBeNull();
});
test('actual verification controls and challenge pages still stop extraction', () => {
  for (const flag of ['hasRecaptcha', 'hasRecaptchaIframe', 'hasHcaptcha', 'hasHcaptchaIframe', 'hasCloudflareChallenge', 'hasCloudflareTurnstile']) {
    expect(detectInteractionGateFromSnapshot({ ...article, [flag]: true })).not.toBeNull();
  }
  expect(detectInteractionGateFromSnapshot({ ...article, bodyText: "I'm not a robot" })?.kind).toBe('recaptcha');
});
