import { expect, test } from "bun:test";
import { cleanHtml } from "../skills/extensions/baoyu-url-to-markdown/scripts/lib/extract/html-cleaner";
import { convertHtmlToMarkdown } from "../skills/extensions/baoyu-url-to-markdown/scripts/lib/extract/html-to-markdown";
const html = await Bun.file(new URL("./fixtures/xhs-profile-cards.html", import.meta.url)).text();
test("XHS profile keeps actual card footer title/likes but removes site footer", async () => {
  const url = "https://www.xiaohongshu.com/user/profile/example";
  const cleaned = cleanHtml(html, url);
  expect(cleaned).toContain("脱敏卡片标题1");
  expect(cleaned).toContain("280");
  expect(cleaned).not.toContain("网站页脚应被删除");
  const converted = await convertHtmlToMarkdown(html, url, {enableRemoteMarkdownFallback:false});
  expect(converted.markdown).toContain("脱敏卡片标题1");
  expect(converted.markdown).toContain("脱敏卡片标题2");
  expect(converted.markdown).toContain("280");
  expect(cleanHtml(html, "https://example.com/article")).not.toContain("脱敏卡片标题1");
});
