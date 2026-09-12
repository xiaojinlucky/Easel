import { expect, mock, test } from "bun:test";
mock.module("../skills/extensions/baoyu-url-to-markdown/scripts/lib/browser/interaction-gates", () => ({detectInteractionGate: async () => ({reason: "test gate"})}));
const { genericAdapter } = await import("../skills/extensions/baoyu-url-to-markdown/scripts/lib/adapters/generic");
test("single-page research never scrolls but standalone retains bounded scroll", async () => {
  let scrolls = 0;
  const context: any = { input: {url: new URL("https://example.com")}, timeoutMs: 1000, log: {info() {}, debug() {}}, browser: {goto: async () => {}, scrollToEnd: async () => {scrolls++;}}, network: {waitForIdle: async () => {}} };
  const previous = process.env.EASEL_RESEARCH_SINGLE_PAGE;
  try {
    process.env.EASEL_RESEARCH_SINGLE_PAGE = "1";
    await genericAdapter.process(context);
    expect(scrolls).toBe(0);
    delete process.env.EASEL_RESEARCH_SINGLE_PAGE;
    await genericAdapter.process(context);
    expect(scrolls).toBe(1);
  } finally {
    if (previous === undefined) delete process.env.EASEL_RESEARCH_SINGLE_PAGE;
    else process.env.EASEL_RESEARCH_SINGLE_PAGE = previous;
  }
});
