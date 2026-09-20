(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/.pnpm/defuddle@0.19.2/node_modules/defuddle/dist/index.js
  var require_dist = __commonJS({
    "node_modules/.pnpm/defuddle@0.19.2/node_modules/defuddle/dist/index.js"(exports, module) {
      !(function(t, e) {
        "object" == typeof exports && "object" == typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : "object" == typeof exports ? exports.Defuddle = e() : t.Defuddle = e();
      })(Object("undefined" != typeof self ? self : exports), (() => (() => {
        "use strict";
        var t = { 2640(t2, e2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.TW_ARBITRARY_RE = e2.TW_SPECIAL_CLASS_RE = e2.TW_COLOR_CLASS_RE = e2.TAILWIND_SPECIAL = e2.TAILWIND_COLORS = e2.ALLOWED_ATTRIBUTES_DEBUG = e2.ALLOWED_ATTRIBUTES = e2.ALLOWED_EMPTY_ELEMENTS = e2.FOOTNOTE_LIST_SELECTORS = e2.FOOTNOTE_INLINE_REFERENCES = e2.TEST_ATTRIBUTES_SELECTOR = e2.PARTIAL_SELECTORS_ANCHORED_REGEX = e2.PARTIAL_SELECTORS_REGEX = e2.PARTIAL_SELECTORS = e2.TEST_ATTRIBUTES = e2.EXACT_SELECTORS_JOINED = e2.EXACT_SELECTORS = e2.HIDDEN_EXACT_SKIP_SELECTOR = e2.HIDDEN_EXACT_SELECTOR = e2.CONTENT_ELEMENT_SELECTOR = e2.INLINE_ELEMENTS = e2.PRESERVE_ELEMENTS = e2.BLOCK_LEVEL_ELEMENTS = e2.BLOCK_ELEMENTS_SET = e2.BLOCK_ELEMENTS_SELECTOR = e2.BLOCK_ELEMENTS = e2.MOBILE_WIDTH = e2.ENTRY_POINT_ELEMENTS = void 0, e2.ENTRY_POINT_ELEMENTS = ["#post", ".post-content", ".post-body", ".article-content", "#article-content", ".js-article-content", ".article_post", ".article-wrapper", ".entry-content", ".content-article", ".instapaper_body", ".post", ".markdown-body", "article", '[role="article"]', "main", '[role="main"]', ".article-body", "#content", "body"], e2.MOBILE_WIDTH = 600, e2.BLOCK_ELEMENTS = ["div", "section", "article", "main", "aside", "header", "footer", "nav", "content"], e2.BLOCK_ELEMENTS_SELECTOR = e2.BLOCK_ELEMENTS.join(","), e2.BLOCK_ELEMENTS_SET = new Set(e2.BLOCK_ELEMENTS), e2.BLOCK_LEVEL_ELEMENTS = /* @__PURE__ */ new Set([...e2.BLOCK_ELEMENTS, "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "dl", "dt", "dd", "pre", "blockquote", "figure", "figcaption", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "details", "summary", "address", "hr", "form", "fieldset"]), e2.PRESERVE_ELEMENTS = /* @__PURE__ */ new Set(["pre", "code", "table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li", "dl", "dt", "dd", "figure", "figcaption", "picture", "details", "summary", "blockquote", "form", "fieldset"]), e2.INLINE_ELEMENTS = /* @__PURE__ */ new Set(["a", "span", "strong", "em", "i", "b", "u", "code", "br", "small", "sub", "sup", "mark", "date", "del", "ins", "q", "abbr", "cite", "relative-time", "time", "font"]), e2.CONTENT_ELEMENT_SELECTOR = ["math", "[data-mathml]", ".katex", ".katex-mathml", ".katex-display", ".MathJax", ".MathJax_Display", ".MathJax_SVG", "mjx-container", "pre", "code", "table", "img", "picture", "video", "blockquote", "figure"].join(", ");
          const r2 = ["[hidden]", '[aria-hidden="true"]', ".hidden", ".invisible"], n2 = r2.map(((t3) => '[aria-hidden="true"]' === t3 ? '[aria-hidden="true"]:not([class*="math"]):not(svg):not([class*="paywall"])' : t3));
          e2.HIDDEN_EXACT_SELECTOR = n2.join(","), e2.HIDDEN_EXACT_SKIP_SELECTOR = r2.join(","), e2.EXACT_SELECTORS = ["noscript", 'script:not([type^="math/"])', "style", "meta", "link", "audio:not([src]):not(:has(source))", "video:not([src]):not(:has(source))", ".jwplayer", '.ad:not([class*="gradient"])', '[class^="ad-" i]', '[class$="-ad" i]', "[data-ad-wrapper]", '[id^="ad-" i]', '[id$="-ad" i]', '[role="banner" i]', '[alt*="advert" i]', ".promo", ".Promo", "#barrier-page", ".alert", '[rel="sponsored" i]', '[href*="source=promotion" i]', '[id="comments" i]', '[id="comment" i]', 'div[class*="cover-"]', 'div[id*="cover-"]', "ads-breadcrumbs", "header:not(:has(p + p)):not(:has(img))", 'header[class~="fixed"]', 'header[class~="sticky"]', ".header:not(.banner)", "#header", "#Header", "#banner", "#Banner", "nav", ".navigation", "#navigation", '[role="navigation" i]', '[role="dialog" i]', '[role="alertdialog" i]', '[role*="complementary" i]', '[class*="pagination" i]', ".menu", "#siteSub", ".previous", ".author", ".Author", '[class$="_bio"]', "#categories", ".contributor", ".date", "#date", "[data-date]", ".entry-meta", ".meta", ".tags", "#tags", '[rel="tag"]', ".headline", "#headline", "#title", "#Title", "#articleTag", '[href*="/author/"]', '[href*="/author?"]', '[href$="/author"]', 'a[href*="copyright.com"]', 'a[href*="google.com/preferences"]', '[href="#top"]', '[href="#Top"]', '[href="#page-header"]', '[href="#content"]', '[href="#site-content"]', '[href="#main-content"]', '[href^="#main"]', '[src*="author"]', ".toc", ".Toc", "#toc", '[href*="#toc"]', "footer", ".aside", 'aside:not([class*="callout"])', "button", "canvas", "date", "dialog", "fieldset", "form", 'input:not([type="checkbox"])', 'input[type="checkbox"][class*="sidebar" i]', 'input[type="checkbox"][id*="sidebar" i]', 'input[type="checkbox"][class*="drawer" i]', 'input[type="checkbox"][id*="drawer" i]', 'input[type="checkbox"][class*="hamburger" i]', 'input[type="checkbox"][id*="hamburger" i]', 'input[type="checkbox"][class*="toggle" i]', 'input[type="checkbox"][id*="toggle" i]', 'input[type="checkbox"][class*="trigger" i]', 'input[type="checkbox"][id*="trigger" i]', "label", "option", "select", '[role="listbox"]', '[role="option"]', "textarea", ...n2, "instaread-player", "iframe:not([src])", 'iframe[src*="blink.net"]', 'iframe[src*="giscus.app"]', 'iframe[src*="tinypass.com"]', 'iframe[src*="trinitymedia.ai"]', '[class="logo" i]', "#logo", "#Logo", "#newsletter", "#Newsletter", ".subscribe", '[data-component-name="ButtonCreateButton"]', '[data-component-name="DigestPostEmbed"]', '[data-component-name="SubscribeWidgetToDOM"]', '[class*="digestPostEmbed"]', ".noprint", '[data-print-layout="hide" i]', '[data-block="donotprint" i]', '[class*="clickable-icon" i]', 'li span[class*="ltx_tag" i][class*="ltx_tag_item" i]', 'a[href^="#"][class*="anchor" i]', 'a[href^="#"][class*="ref" i]:not(.ltx_ref):not(.footnote-backref)', '[data-container*="most-viewed" i]', ".sidebar", ".Sidebar", "#sidebar", "#Sidebar", "#side-bar", "#secondary", "#sitesub", '[href*="/sitemap/sitemap.xml"]', '[data-link-name*="skip" i]', '[aria-label*="skip" i]', '[title^="Share on" i]', '[aria-label="Dismiss" i]', '[aria-label="Close" i]', "svg[data-icon]", '[data-testid="load-more-posts"] + div', ".copyright", "#copyright", ".licensebox", "#page-info", "#rss", "#feed", ".gutter", "#primaryaudio", "#NYT_ABOVE_MAIN_CONTENT_REGION", '[data-testid="photoviewer-children-figure"] > span', "table.infobox", '[data-optimizely="related-articles-section" i]', '[data-orientation="vertical"]', ".gh-header-sticky", '[data-testid="issue-metadata-sticky"]'], e2.EXACT_SELECTORS_JOINED = e2.EXACT_SELECTORS.join(","), e2.TEST_ATTRIBUTES = ["class", "id", "data-component", "data-test", "data-testid", "data-test-id", "data-qa", "data-cy"], e2.PARTIAL_SELECTORS = ["a-statement", "(?<!main-)access-wall", "activitypub", "actioncall", "addcomment", "addtoany", "advert", "adlayout", "ad-tldr", "ad-placement", "adplacehold", "ads-container", "_ad_", "AdBlock_", "AdUnit", "after_content", "after_main_article", "afterpost", "allterms", "-alert-", "alert-box", "_archive", "around-the-web", "aroundpages", "article-author", "article-badges", "article-banner", "article-bottom-section", "article-bottom", "article-category", "article-card", "article-citation", "article-continues", "article__copy", "article_date", "article-date", "article-end ", "article_header", "article-header", "article__header", "article__hero", "article__info", "article-info", "article-meta", "article_meta", "article__meta", "articlename", "article-subject", "article_subject", "article-snippet", "article-separator", "article--share", "article-share", "article--topics", "article-tools", "articletags", "article-tags", "article_tags", "articletitle", "article-title", "article_title", "articletopics", "article-topics", "article-actions", "article--lede", "articlewell", "associated-people", "ambient-video__button", "audio-card", "beyondwords", "about-author", "author-bio", "author-box", "author-info", "author_info", "authorm", "author-mini-bio", "author-name", "author-publish-info", "authored-by", "avatar", "back-to-top", "backlink_container", "backlinks-section", "bio-block", "biobox", "blog-pager", "bookmark-", "-bookmark", "bottominfo", "bottomnav", "bottom-of-article", "bottom-wrapper", "brand-bar", "bcrumb", "breadcrumb", "brdcrumb", "crumbs", "bubblewrapper", "button-wrapper", "buttons-container", "btn-", "-btn", "byline", "captcha", "card-text", "card-media", "card-post", "carouselcontainer", "carousel-container", "cat_header", "cat-overlay", "catlinks", "_categories", "card-author", "card-content", "chapter-list", "collections", "comments", "-comment\\b", "commentbox", "comment-button", "commentcomp", "comment-content", "comment-count", "comment-form", "comment-number", "comment-respond", "comment-thread", "comment-wrap", "complementary", "consent", "contact-", "contactus", "cookie.law", "content-card", "copycontent", "copy-tooltip", "content-topics", "contentpromo", "context-bar", "context-widget", "core-collateral", "cover-image", "cover-photo", "cover-wrap", "created-date", "creative-commons_", "c-subscribe", "_cta", "-cta", "cta-", "cta_", "current-issue", "custom-list-number", "dateline", "dateheader", "date-header", "date-pub", "disclaimer", "disclosure", "discussion", "discuss_", "-dismiss", "disqus", "donate", "donation", "dropdown", "editorial_contact", "editorial-contact", "element-invisible", "elementor-shortcode", "eletters", "emailsignup", "emoji-bar", "engagement-widget", "enhancement-", "entry-author-info", "entry-categories", "entry-date", "entry-title", "entry-utility", "-error", "error-", "eyebrow", "expand-reduce", "external-anchor", "externallinkembedwrapper", "extra-services", "extra-title", "facebook", "fancy-box", "favorite", "featured-content", "feature_feed", "feedback", "feed-links", "field-site-sections", "filed", "fixheader", "floating-vid", "follower", "footer", "footnote-back", "footnoteback", "form-group", "for-you", "frontmatter", "further-reading", "fullbleedheader", "gallery-count", "gated-popup", "gh-feed", "gist-meta", "goog-", "graph-view", "hamburger", "hawk-", "header-pattern", "hero[_\\-a-z]", "hide-for-print", "hide-print", "hide-when-no-script", "hidden-print", "hidden-sidenote", "hidden-accessibility", "home-link", "icon-sidebar", "inarticle-ad", "infoline", "inline-topic", "instacartIntegration", "interlude", "interaction", "itemendrow", "intro-date", "invisible", "jp-no-solution", "jp-relatedposts", "jswarning", "js-warning", "jumplink", "jumpto", "jump-to-", "js-skip-to-content", "keepreading", "keep-reading", "keep_reading", "keyword_wrap", "kicker", "labstab", "-labels", "language-name", "lastupdated", "latest-content", "-ledes-", "-license", "license-", "lightbox-popup", "like-button", "link-box", "links-grid", "links-title", "listing-dynamic-terms", "list-tags", "live-blog-header-live-label", "listinks", "loading", "loa-info", "logo", "ltx_role_refnum", "ltx_tag_bibitem", "ltx_error", "masthead", "marketing", "media-inquiry", "-menu", "menu-", "metadata", "meta-bottom", "meta-date", "meta-row", "might-like", "minibio", "more-about", "mod-paywall", "_modal", "-modal", "more-", "morenews", "morestories", "more_wrapper", "most-read", "move-helper", "mw-editsection", "mw-cite-backlink", "mw-indicators", "mw-jump-link", "nav-", "nav_", "navigation-post", "next-", "next_prev", "no-script", "newsgallery", "news-story-title", "newsletter_", "newsletterbanner", "newslettercontainer", "newsletter-form", "newsletter-signup", "newslettersignup", "newsletterwidget", "newsletterwrapper", "not-found", "notessection", "nomobile", "noprint", "onward-journey", "open-slideshow", "originally-published", "osano-cm", "other-blogs", "outline-view", "pagefoot", "pagehead", "page-header", "page-title", "paywall_message", "-partners", "permission-", "plea", "popular", "popup_links", "pop_stories", "pop-up", "post__author", "post-author", "post-bottom", "post__category", "postcomment", "postdate", "post-date", "post_date", "post-details", "post-feeds", "postinfo", "post-info", "post_info", "post-inline-date", "post-links", "postlist", "post_list", "post_meta", "post-meta", "postmeta", "post_more", "postnavi", "post-navigation", "postpath", "post-preview", "postsnippet", "post_snippet", "post-snippet", "post-subject", "posttax", "post-tax", "post_tax", "posttag", "post-tag", "post_time", "posttitle", "post-title", "post_title", "post__title", "post-ufi-button", "prev-post", "prevnext", "prev_next", "prev-next", "previousnext", "press-inquiries", "print-none", "print-header", "print:hidden", "privacy-notice", "privacy-settings", "profile", "promo_article", "promo-bar", "promo-box", "pubdate", "pub_date", "pub-date", "publish_date", "publish-date", "publication-date", "publicationName", "qr-code", "qr_code", "quick_up", "_rail", "ratingssection", "read_also", "readmore", "read-next", "read_next", "read_time", "read-time", "reading_time", "reading-time", "reading-list", "recent-", "recent-articles", "recentpost", "recent_post", "recent-post", "recommend", "redirectedfrom", "recirc", "register", "(?<!h[1-6]-)related", "relevant", "relposts", "reversefootnote", "rightcol", "\\bnocontent\\b", "_rss", "rss-link", "rubricwrapper", "screen-reader-text", "scroll_to", "scroll-to", "_search", "-search", "section-nav", "series-banner", "share-box", "sharedaddy", "share-icons", "sharelinks", "share-links", "share-post", "share-print", "share-section", "share-text", "sharing_", "shariff-", "shortcode-id", "show-for-print", "sidebartitle", "sidebar-content", "sidebar-wrapper", "sideitems", "sidebar-author", "sidebar-item", "side-box", "sign-in-gate", "similar-", "similar_", "similars-", "site-index", "site-header", "siteheader", "site-name", "site-wordpress", "skip-content", "skip-to-content", "skip-link", "c-skip-link", "_skip-link", "-slider", "slug-wrap", "social-author", "social-button", "social-shar", "social-date", "speechify-ignore", "speedbump", "sponsor", "springercitation", "sr-only", "_stats", "sticky-social", "story-date", "story-navigation", "storyreadtime", "storysmall", "storypublishdate", "subject-label", "submenu", "-subscribe-", "subscriber-drive", "subscription-", "_tags", "tags__item", "tag_list", "tag-list", "tag-module", "takeaways", "taxonomy", "table-of-contents", "tblc", "tabs-", "terminaltout", "time-rubric", "timestamp", "time-read", "time-to-read", "tip_off", "-ticker", "tiptout", "-tout-", "toc-container", "toggle-caption", "tooltip-content", "topbar", "subnavbar", "topic-authors", "topic-footer", "topic-list", "topic-subnav", "top-wrapper", "tree-item", "trending", "trust-feat", "trust-badge", "trust-project", "chakra-badge", "twiblock", "u-hide", "upsell", "vid_carousel", "viewbottom", "view-language", "yarpp-related", "visually-hidden", "welcomebox", "widget_pages", "window__widget", "w-form-done", "w-form-fail"], e2.PARTIAL_SELECTORS_REGEX = new RegExp(e2.PARTIAL_SELECTORS.join("|"), "i"), e2.PARTIAL_SELECTORS_ANCHORED_REGEX = new RegExp("^(?:" + e2.PARTIAL_SELECTORS.join("|") + ")$", "i"), e2.TEST_ATTRIBUTES_SELECTOR = e2.TEST_ATTRIBUTES.map(((t3) => `[${t3}]`)).join(","), e2.FOOTNOTE_INLINE_REFERENCES = ["sup.reference", "cite.ltx_cite", 'sup[id^="fnr"]', 'span[id^="fnr"]', 'span[class*="footnote_ref"]', 'span[class*="footnote-ref"]', "span.footnote-link", "a.citation", 'a[id^="ref-link"]', 'a[href^="#fn"]', 'a[href^="#cite"]', 'a[href^="#reference"]', 'a[href^="#footnote"]', 'a[href^="#r"]', 'a[href^="#b"]', 'a[href*="cite_note"]', 'a[href*="cite_ref"]', "a.footnote-anchor", "span.footnote-hovercard-target a", 'a[role="doc-biblioref"]', 'a[id^="fnref"]', 'a[id^="ref-link"]', "sup.footnoteref", "sup.footnote-reference", 'sup[data-fn] > a[href^="#"]', 'sup[id^="ftnt_ref"] a[href^="#ftnt"]', 'span.easy-footnote > a[href^="#easy-footnote-bottom-"]', 'a.footnote[href^="#"]', 'a[data-type="noteref"]'].join(","), e2.FOOTNOTE_LIST_SELECTORS = ["div.footnote ol", "div.footnotes ol", 'div[role="doc-endnotes"]', 'div[role="doc-footnotes"]', "ol.footnotes-list", "ol.footnotes", "ol.references", 'ol[class*="article-references"]', "section.footnotes ol", 'section[role="doc-endnotes"]', 'section[role="doc-footnotes"]', 'section[role="doc-bibliography"]', "ul.footnotes-list", "ul.ltx_biblist", 'div.footnote[data-component-name="FootnoteToDOM"]', "div.footnotes-footer", "div.footnote-definitions", "div.footnote-definition", "ol.wp-block-footnotes", "ol.easy-footnotes-wrapper", "div.footnotes-segment", "#footnotes"].join(","), e2.ALLOWED_EMPTY_ELEMENTS = /* @__PURE__ */ new Set(["area", "audio", "base", "br", "circle", "col", "defs", "ellipse", "embed", "figure", "g", "hr", "iframe", "img", "input", "line", "link", "mask", "meta", "object", "param", "path", "pattern", "picture", "polygon", "polyline", "rect", "source", "stop", "svg", "td", "th", "track", "use", "video", "wbr"]), e2.ALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set(["alt", "allow", "allowfullscreen", "aria-label", "checked", "colspan", "controls", "data-latex", "data-src", "data-srcset", "data-callout", "data-callout-fold", "data-callout-title", "data-lang", "dir", "display", "frameborder", "headers", "height", "href", "kind", "label", "lang", "role", "rowspan", "sandbox", "src", "srclang", "srcset", "start", "title", "type", "width", "accent", "accentunder", "align", "columnalign", "columnlines", "columnspacing", "columnspan", "data-mjx-texclass", "depth", "displaystyle", "fence", "frame", "framespacing", "linethickness", "lspace", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "scriptlevel", "separator", "stretchy", "symmetric", "voffset", "xmlns"]), e2.ALLOWED_ATTRIBUTES_DEBUG = /* @__PURE__ */ new Set(["class", "id"]), e2.TAILWIND_COLORS = { slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" }, gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712" }, zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" }, neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a" }, stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" }, red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" }, orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" }, amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" }, yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" }, lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" }, green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" }, emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" }, teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" }, cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" }, sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" }, blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" }, indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" }, violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" }, purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" }, fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" }, pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" }, rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" } }, e2.TAILWIND_SPECIAL = { black: "#000", white: "#fff", transparent: "transparent", current: "currentColor" }, e2.TW_COLOR_CLASS_RE = /^(fill|stroke)-([a-z]+)-(\d{2,3})(?:\/(\d+))?$/, e2.TW_SPECIAL_CLASS_RE = /^(fill|stroke)-(black|white|transparent|current)$/, e2.TW_ARBITRARY_RE = /^text-\[(.+)\]$/;
        }, 4467(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.findContentStart = function t3(e3, r3) {
            const o2 = (function(t4, e4) {
              const r4 = (0, n2.normalizeText)(e4);
              if (!r4) return null;
              const o3 = t4.querySelectorAll("h1, h2");
              for (const t5 of o3) if ((0, n2.normalizeText)(t5.textContent || "") === r4) return t5;
              return null;
            })(e3, r3) || null, i2 = e3.ownerDocument.createTreeWalker(e3, 1);
            o2 && (i2.currentNode = o2);
            let s2 = null, a2 = null, l2 = i2.nextNode();
            for (; l2; ) {
              const t4 = l2;
              if (h(t4)) {
                if (c.has(t4.tagName)) {
                  s2 = t4;
                  break;
                }
                a2 || (a2 = t4);
              }
              l2 = i2.nextNode();
            }
            if (s2) return s2;
            if (a2) {
              let t4 = a2;
              for (; ; ) {
                let e4 = null, r4 = false;
                for (const n3 of t4.children) if (h(n3)) {
                  if (e4) {
                    r4 = true;
                    break;
                  }
                  e4 = n3;
                }
                if (!e4 || r4) break;
                t4 = e4;
              }
              return t4;
            }
            return o2 ? t3(e3, "") : null;
          }, e2.isAboveContentStart = function(t3, e3) {
            if (!e3) return false;
            if (t3 === e3) return false;
            const r3 = t3.compareDocumentPosition(e3);
            return !(1 & r3) && !!(4 & r3);
          };
          const n2 = r2(2552), o = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i, i = /^by\s+\S/i, s = /[.!?]/, a = /\b(?:isHidden(?:-[A-Za-z0-9_]+)?|is-hidden)\b/, l = /* @__PURE__ */ new Set(["P", "DIV", "SECTION", "ARTICLE", "BLOCKQUOTE", "FONT"]), c = /* @__PURE__ */ new Set(["P", "BLOCKQUOTE", "FONT"]), u = '[role="dialog"], [role="alertdialog"]', d = `aside, nav, header, footer, form, ${u}`;
          function h(t3) {
            if (!t3.tagName) return false;
            if (!l.has(t3.tagName)) return false;
            if (t3.closest(d)) return false;
            const e3 = "string" == typeof t3.className ? t3.className : "";
            if (a.test(e3)) return false;
            if (t3.querySelector(u)) return false;
            if (t3.querySelector("script, style")) return false;
            const r3 = (t3.textContent || "").trim();
            if (!r3) return false;
            const c2 = (0, n2.countWords)(r3);
            return !(c2 < 7) && (!!s.test(r3) && (!(i.test(r3) && c2 < 15) && (!(o.test(r3) && c2 < 20) && (!((function(t4) {
              let e4 = 0;
              for (const r4 of t4.querySelectorAll("a")) e4 += (r4.textContent || "").length;
              return e4;
            })(t3) > 0.7 * r3.length) && !("DIV" === t3.tagName && !t3.querySelector("p"))))));
          }
        }, 5628(t2, e2, r2) {
          var n2 = this && this.__awaiter || function(t3, e3, r3, n3) {
            return new (r3 || (r3 = Promise))((function(o2, i2) {
              function s2(t4) {
                try {
                  l2(n3.next(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function a2(t4) {
                try {
                  l2(n3.throw(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function l2(t4) {
                var e4;
                t4.done ? o2(t4.value) : (e4 = t4.value, e4 instanceof r3 ? e4 : new r3((function(t5) {
                  t5(e4);
                }))).then(s2, a2);
              }
              l2((n3 = n3.apply(t3, e3 || [])).next());
            }));
          };
          Object.defineProperty(e2, "__esModule", { value: true }), e2.Defuddle = void 0;
          const o = r2(1608), i = r2(1917), s = r2(2640), a = r2(4840), l = r2(3610), c = r2(7726), u = r2(3550), d = r2(2408), h = r2(8983), m = r2(7393), f = r2(3172), p = r2(662), g = r2(2552), v = r2(639), y = /* @__PURE__ */ new Set(["title", "author", "published", "site", "description", "image", "language"]), b = /[:\[\]()#>~+,]/;
          class x {
            constructor(t3, e3 = {}) {
              this._schemaOrgData = void 0, this._schemaOrgExtracted = false, this._inExtractorPipelineRun = false, this.doc = t3, this.options = e3, this.debug = e3.debug || false;
            }
            getSchemaOrgData() {
              return this._schemaOrgExtracted || (this._schemaOrgData = this._extractSchemaOrgData(this.doc), this._schemaOrgExtracted = true), this._schemaOrgData;
            }
            parse() {
              this.doc.body && (this._normalizeAttributes(this.doc.body), this._resolveNoscriptImages(this.doc.body));
              let t3 = this.parseInternal();
              if (t3.wordCount < 200) {
                this._log("Initial parse returned very little content, trying again");
                const e4 = this.parseInternal({ removePartialSelectors: false });
                e4.wordCount > 2 * t3.wordCount && (this._log("Retry produced more content"), t3 = e4);
              }
              if (t3.wordCount < 50) {
                this._log("Still very little content, retrying without hidden-element removal");
                const e4 = this.parseInternal({ removeHiddenElements: false });
                e4.wordCount > 2 * t3.wordCount && (this._log("Hidden-element retry produced more content"), t3 = e4);
                const r3 = this.findLargestHiddenContentSelector();
                if (r3) {
                  this._log("Retrying with hidden content selector:", r3);
                  const e5 = this.parseInternal({ removeHiddenElements: false, removePartialSelectors: false, contentSelector: r3 });
                  (e5.wordCount > t3.wordCount || e5.wordCount > Math.max(20, 0.7 * t3.wordCount) && e5.content.length < t3.content.length) && (this._log("Hidden-selector retry produced better focused content"), t3 = e5);
                }
              }
              if (t3.wordCount < 50) {
                this._log("Still very little content, retrying without scoring/partial selectors (possible index page)");
                const e4 = this.parseInternal({ removeLowScoring: false, removePartialSelectors: false, removeContentPatterns: false });
                e4.wordCount > t3.wordCount && (this._log("Index page retry produced more content"), t3 = e4);
              }
              const e3 = this._getSchemaText(t3.schemaOrgData);
              if (e3 && this.countHtmlWords(e3) > 1.5 * t3.wordCount) {
                const r3 = this.doc, n3 = r3.cloneNode(true);
                this._stripUnsafeElements(n3.body), this.doc = n3;
                try {
                  const r4 = this._findElementBySchemaText(this.doc.body, e3);
                  if (r4) {
                    const e4 = this.getElementSelector(r4);
                    this._log("Schema.org suggests a better content element, retrying with selector:", e4);
                    t3 = this.parseInternal({ contentSelector: e4 });
                  } else this._log("Using schema.org text as content (DOM element not found)"), t3.content = e3, t3.wordCount = this.countHtmlWords(e3);
                } finally {
                  this.doc = r3;
                }
              }
              return t3;
            }
            _getSchemaText(t3, e3 = 0) {
              if (!t3 || e3 > 10) return "";
              const r3 = Array.isArray(t3) ? t3 : [t3];
              for (const t4 of r3) if (Array.isArray(t4)) {
                const r4 = this._getSchemaText(t4, e3 + 1);
                if (r4) return r4;
              } else {
                if ((null == t4 ? void 0 : t4.text) && "string" == typeof t4.text) return t4.text;
                if ((null == t4 ? void 0 : t4.articleBody) && "string" == typeof t4.articleBody) return t4.articleBody;
                if ((null == t4 ? void 0 : t4["@graph"]) && Array.isArray(t4["@graph"])) {
                  const r4 = this._getSchemaText(t4["@graph"], e3 + 1);
                  if (r4) return r4;
                }
              }
              return "";
            }
            _serializeFallbackBody() {
              if (!this.doc.body) return "";
              const t3 = this.doc.body.cloneNode(true);
              return this._stripUnsafeElements(t3), this.resolveContentUrls((0, v.serializeHTML)(t3));
            }
            _stripUnsafeElements(t3) {
              if (!t3) return;
              const e3 = t3.querySelectorAll('script:not([type^="math/"]), style, noscript, frame, frameset, object, embed, applet, base');
              for (const t4 of e3) t4.remove();
              const r3 = [t3, ...Array.from(t3.querySelectorAll("*"))];
              for (const t4 of r3) for (const e4 of Array.from(t4.attributes)) {
                const r4 = e4.name.toLowerCase();
                if (r4.startsWith("on")) t4.removeAttribute(e4.name);
                else if ("srcdoc" === r4) t4.removeAttribute(e4.name);
                else if (["href", "src", "action", "formaction", "xlink:href"].includes(r4)) {
                  const n3 = !("src" === r4 && "IFRAME" === t4.tagName);
                  (0, v.isDangerousUrl)(e4.value, n3) && t4.removeAttribute(e4.name);
                }
              }
            }
            _deduplicateImages(t3) {
              for (const e4 of t3.querySelectorAll("figure")) {
                const t4 = Array.from(e4.querySelectorAll("img")).filter(((t5) => !t5.closest("noscript") && t5.parentElement));
                if (t4.length < 2) continue;
                const r3 = /* @__PURE__ */ new Map();
                for (const e5 of t4) {
                  const t5 = e5.getAttribute("src") || "";
                  if (!t5 || t5.startsWith("data:")) continue;
                  const n3 = (e5.getAttribute("alt") || "").trim() || null, o2 = r3.get(n3) || [];
                  o2.push(e5), r3.set(n3, o2);
                }
                for (const [t5, e5] of r3) e5.length < 2 || null !== t5 && e5.every(((t6) => t6.getAttribute("src") === e5[0].getAttribute("src"))) || this._keepBestImage(e5);
              }
              const e3 = Array.from(t3.querySelectorAll("img"));
              for (let t4 = 0; t4 < e3.length - 1; t4++) {
                const r3 = e3[t4];
                if (!r3.parentElement) continue;
                if (r3.closest("noscript") || r3.closest("figure")) continue;
                const n3 = (r3.getAttribute("alt") || "").trim();
                if (!n3) continue;
                const o2 = r3.getAttribute("src") || "";
                if (!o2 || o2.startsWith("data:")) continue;
                const i2 = e3[t4 + 1];
                if (!i2.parentElement) continue;
                if (i2.closest("noscript") || i2.closest("figure")) continue;
                if ((i2.getAttribute("alt") || "").trim() !== n3) continue;
                const s2 = i2.getAttribute("src") || "";
                s2 && !s2.startsWith("data:") && (s2 !== o2 && this._noVisibleContentBetween(r3, i2) && this._keepBestImage([r3, i2]));
              }
              for (const e4 of Array.from(t3.querySelectorAll("img"))) {
                if (!e4.parentElement) continue;
                if (e4.closest("a, figure, noscript")) continue;
                const t4 = e4.getAttribute("src") || "";
                if (!t4 || t4.startsWith("data:")) continue;
                const r3 = e4.parentElement, n3 = this._normalizeSrc(t4);
                for (const t5 of r3.querySelectorAll(":scope > a[href]")) {
                  if (!t5.querySelector("img")) continue;
                  const r4 = t5.getAttribute("href") || "";
                  if (n3 === this._normalizeSrc(r4)) {
                    e4.remove();
                    break;
                  }
                }
              }
            }
            _keepBestImage(t3) {
              let e3 = t3[0];
              for (let r3 = 1; r3 < t3.length; r3++) {
                const n3 = this._pickBestImage(e3, t3[r3]);
                (n3 === e3 ? t3[r3] : e3).remove(), e3 = n3;
              }
            }
            _noVisibleContentBetween(t3, e3) {
              const r3 = (t4) => {
                if (!t4) return null;
                if (t4.firstChild) return t4.firstChild;
                let e4 = t4;
                for (; e4; ) {
                  if (e4.nextSibling) return e4.nextSibling;
                  e4 = e4.parentNode;
                }
                return null;
              };
              for (let n3 = r3(t3); n3 && n3 !== e3; n3 = r3(n3)) if (3 === n3.nodeType && (n3.textContent || "").trim()) return false;
              return true;
            }
            _normalizeSrc(t3) {
              return t3.replace(/^https?:\/\//, "").split("?")[0];
            }
            _removeCoverImage(t3, e3) {
              if (!e3) return;
              const r3 = this._normalizeSrc(e3);
              for (const e4 of t3.querySelectorAll("img")) {
                const t4 = e4.getAttribute("src") || "";
                if (!t4 || t4.startsWith("data:")) continue;
                if (this._normalizeSrc(t4) !== r3) continue;
                const n3 = this._getLargestImageSrc(e4), o2 = e4.closest("figure");
                return o2 && o2.querySelector("figcaption") || e4.remove(), n3;
              }
            }
            _pickBestImage(t3, e3) {
              const r3 = t3.getAttribute("srcset") ? 2 : t3.closest("picture") ? 1 : 0, n3 = e3.getAttribute("srcset") ? 2 : e3.closest("picture") ? 1 : 0;
              if (r3 !== n3) return r3 > n3 ? t3 : e3;
              const o2 = x._urlWidth(t3), i2 = x._urlWidth(e3);
              return o2 !== i2 ? o2 > i2 ? t3 : e3 : t3;
            }
            static _urlWidth(t3) {
              const e3 = (t3.getAttribute("src") || "").match(x._urlWidthPattern);
              return e3 ? parseInt(e3[1], 10) : 0;
            }
            _normalizeAttributes(t3) {
              const e3 = [["srcSet", "srcset"]], r3 = t3.querySelectorAll("img, source");
              for (const t4 of r3) for (const [r4, n3] of e3) {
                const e4 = t4.getAttribute(r4);
                null !== e4 && (t4.removeAttribute(r4), t4.setAttribute(n3, e4));
              }
            }
            _resolveNoscriptImages(t3) {
              const e3 = t3.querySelectorAll("noscript");
              for (const t4 of e3) {
                let e4 = t4.querySelector("img");
                if (!e4) {
                  let r4 = t4.innerHTML || "";
                  if (r4.includes("<img") || (r4 = t4.textContent || ""), !r4.includes("<img")) continue;
                  e4 = (0, v.parseHTML)(this.doc, r4).querySelector("img");
                }
                if (!e4) continue;
                const r3 = e4.getAttribute("src") || "";
                if (!r3 || r3.startsWith("data:")) continue;
                const n3 = e4.getAttribute("alt"), o2 = t4.parentElement;
                if (!o2) continue;
                let i2 = false;
                const s2 = o2.querySelectorAll(":scope > img");
                for (const t5 of s2) {
                  if (!(t5.getAttribute("src") || "").startsWith("data:")) continue;
                  if (!n3 || t5.getAttribute("alt") !== n3) continue;
                  t5.setAttribute("src", r3);
                  const o3 = e4.getAttribute("srcset") || "";
                  o3 && t5.setAttribute("srcset", o3), i2 = true;
                  break;
                }
                if (!i2 && this._isLazyImageContext(t4)) {
                  const r4 = (t4.closest("figure") || o2).querySelectorAll("img");
                  let n4 = false;
                  for (const t5 of r4) {
                    if (t5.closest("noscript")) continue;
                    const e5 = t5.getAttribute("src") || "";
                    if (e5 && !e5.startsWith("data:")) {
                      n4 = true;
                      break;
                    }
                  }
                  if (!n4) {
                    const r5 = e4.cloneNode(true);
                    o2.insertBefore(r5, t4);
                  }
                }
              }
            }
            _isLazyImageContext(t3) {
              if (t3.closest("figure")) return true;
              const e3 = t3.parentElement;
              if (e3) {
                for (const r4 of e3.children) if (r4 !== t3 && (0, v.getClassName)(r4).toLowerCase().includes("lazy")) return true;
                const r3 = (0, v.getClassName)(e3).toLowerCase();
                if (r3.includes("image") || r3.includes("img") || r3.includes("picture") || r3.includes("photo") || r3.includes("media")) return true;
              }
              return false;
            }
            _findElementBySchemaText(t3, e3) {
              var r3;
              const n3 = ((null === (r3 = e3.split(/\n\s*\n/)[0]) || void 0 === r3 ? void 0 : r3.trim()) || "").substring(0, 100).trim();
              if (!n3) return null;
              const o2 = (0, g.countWords)(e3);
              let i2 = null, s2 = 1 / 0;
              const a2 = t3.querySelectorAll("*");
              for (const e4 of a2) {
                if (e4 === t3) continue;
                const r4 = e4.textContent || "";
                if (!r4.includes(n3)) continue;
                const a3 = (0, g.countWords)(r4);
                a3 >= 0.8 * o2 && a3 < s2 && (s2 = a3, i2 = e4);
              }
              return i2;
            }
            findLargestHiddenContentSelector() {
              const t3 = this.doc.body;
              if (!t3) return;
              const e3 = Array.from(t3.querySelectorAll(s.HIDDEN_EXACT_SKIP_SELECTOR)).filter(((t4) => !(t4.getAttribute("class") || "").includes("math")));
              let r3 = null, n3 = 0;
              for (const t4 of e3) {
                const e4 = (0, g.countWords)(t4.textContent || "");
                e4 > n3 && (r3 = t4, n3 = e4);
              }
              return !r3 || n3 < 30 ? void 0 : this.getElementSelector(r3);
            }
            _getLargestImageSrc(t3) {
              const e3 = t3.getAttribute("srcset") || "";
              if (!e3) return t3.getAttribute("src") || "";
              const r3 = /(.+?)\s+(\d+(?:\.\d+)?)w/g;
              let n3, o2 = "", i2 = 0, s2 = 0;
              for (; null !== (n3 = r3.exec(e3)); ) {
                let t4 = n3[1].trim();
                s2 > 0 && (t4 = t4.replace(/^,\s*/, "")), s2 = r3.lastIndex;
                const e4 = parseFloat(n3[2]);
                t4 && e4 > i2 && (i2 = e4, o2 = t4);
              }
              let a2 = o2 || t3.getAttribute("src") || "";
              return a2 = a2.replace(/,w_\d+/g, "").replace(/,c_\w+/g, ""), a2;
            }
            parseAsync() {
              return n2(this, void 0, void 0, (function* () {
                var t3;
                if (false !== this.options.useAsync) {
                  const t4 = yield this.tryAsyncExtractor(i.ExtractorRegistry.findPreferredAsyncExtractor.bind(i.ExtractorRegistry));
                  if (t4) return t4;
                }
                const e3 = this.parse();
                return e3.wordCount > 0 || false === this.options.useAsync ? e3 : null !== (t3 = yield this.tryAsyncExtractor(i.ExtractorRegistry.findAsyncExtractor.bind(i.ExtractorRegistry))) && void 0 !== t3 ? t3 : e3;
              }));
            }
            fetchAsyncVariables() {
              return n2(this, void 0, void 0, (function* () {
                var t3;
                if (false === this.options.useAsync) return null;
                try {
                  const e3 = this.options.url || this.doc.URL, r3 = this.getSchemaOrgData(), n3 = { includeReplies: null !== (t3 = this.options.includeReplies) && void 0 !== t3 ? t3 : "extractors", language: this.options.language, fetch: this.options.fetch }, o2 = i.ExtractorRegistry.findPreferredAsyncExtractor(this.doc, e3, r3, n3);
                  if (o2) {
                    const t4 = yield o2.extractAsync();
                    return this.getExtractorVariables(t4.variables) || null;
                  }
                } catch (t4) {
                  console.error("Defuddle", "Error fetching async variables:", t4);
                }
                return null;
              }));
            }
            tryAsyncExtractor(t3) {
              return n2(this, void 0, void 0, (function* () {
                var e3;
                try {
                  const r3 = this.options.url || this.doc.URL, n3 = this.getSchemaOrgData(), i2 = { includeReplies: null !== (e3 = this.options.includeReplies) && void 0 !== e3 ? e3 : "extractors", language: this.options.language, fetch: this.options.fetch }, s2 = t3(this.doc, r3, n3, i2);
                  if (s2) {
                    const t4 = Date.now(), e4 = yield s2.extractAsync(), r4 = this._collectMetaTags(), i3 = o.MetadataExtractor.extract(this.doc, n3, r4);
                    return this.buildExtractorResponse(e4, i3, t4, s2, r4);
                  }
                } catch (t4) {
                  console.error("Defuddle", "Error in async extraction:", t4);
                }
                return null;
              }));
            }
            parseInternal(t3 = {}) {
              var e3, r3, n3, s2, g2, v2, y2;
              const b2 = Date.now(), x2 = {}, C = null !== (e3 = this.options.profile) && void 0 !== e3 && e3, S = (t4, e4) => {
                if (!C) return e4();
                const r4 = performance.now(), n4 = e4();
                return x2[t4] = Math.round(performance.now() - r4), n4;
              };
              if (!this.doc.documentElement) {
                const t4 = this.options.url || "";
                return { content: "", title: "", description: "", domain: t4 ? new URL(t4).hostname : "", favicon: "", image: "", language: "", parseTime: Date.now() - b2, published: "", author: "", site: "", schemaOrgData: null, wordCount: 0 };
              }
              const E = Object.assign(Object.assign({ removeExactSelectors: true, removePartialSelectors: true, removeHiddenElements: true, removeLowScoring: true, removeSmallImages: true, removeContentPatterns: true, standardize: true, includeReplies: "extractors" }, this.options), t3), A = [], w = this.getSchemaOrgData();
              this._metaTags || (this._metaTags = this._collectMetaTags());
              const T = this._metaTags;
              this._metadata || (this._metadata = o.MetadataExtractor.extract(this.doc, w, T));
              const _ = this._metadata;
              E.removeImages && this.removeImages(this.doc);
              try {
                const t4 = E.url || this.doc.URL, e4 = { includeReplies: E.includeReplies, language: E.language, fetch: E.fetch };
                if (!this._inExtractorPipelineRun) {
                  const o3 = i.ExtractorRegistry.findExtractor(this.doc, t4, w, e4);
                  if (o3 && o3.canExtract()) {
                    const t5 = o3.extract();
                    if (t5.contentSelector) {
                      this._inExtractorPipelineRun = true;
                      try {
                        const e5 = this.parseInternal({ contentSelector: t5.contentSelector, removeLowScoring: false, removeHiddenElements: false }), i2 = this.getExtractorVariables(t5.variables);
                        return Object.assign(Object.assign(Object.assign({}, e5), { title: (null === (r3 = t5.variables) || void 0 === r3 ? void 0 : r3.title) || e5.title, description: (null === (n3 = t5.variables) || void 0 === n3 ? void 0 : n3.description) || e5.description, author: (null === (s2 = t5.variables) || void 0 === s2 ? void 0 : s2.author) || e5.author, published: (null === (g2 = t5.variables) || void 0 === g2 ? void 0 : g2.published) || e5.published, site: (null === (v2 = t5.variables) || void 0 === v2 ? void 0 : v2.site) || e5.site, language: (null === (y2 = t5.variables) || void 0 === y2 ? void 0 : y2.language) || e5.language, extractorType: o3.constructor.name.replace("Extractor", "").toLowerCase() }), i2 ? { variables: i2 } : {});
                      } finally {
                        this._inExtractorPipelineRun = false;
                      }
                    }
                    return this.buildExtractorResponse(t5, _, b2, o3, T);
                  }
                }
                this._mobileStyles || (this._mobileStyles = this._evaluateMediaQueries(this.doc));
                const o2 = this._mobileStyles;
                this._smallImages || (this._smallImages = (0, d.findSmallImages)(this.doc, this.debug));
                const L = this._smallImages;
                let q;
                S("cloneDocument", (() => {
                  var t5;
                  q = this.doc.cloneNode(true), null === (t5 = q.body) || void 0 === t5 || t5.normalize();
                })), S("flattenShadowRoots", (() => this.flattenShadowRoots(this.doc, q))), S("resolveStreamedContent", (() => this.resolveStreamedContent(q))), S("applyMobileStyles", (() => this.applyMobileStyles(q, o2)));
                const N = S("findMainContent", (() => {
                  let t5 = null;
                  if (E.contentSelector && (t5 = q.querySelector(E.contentSelector), this._log("Using contentSelector:", E.contentSelector, t5 ? "found" : "not found")), t5 || (t5 = this.findMainContent(q)), t5) {
                    const e5 = t5.closest("[data-defuddle]");
                    e5 && (t5 = e5);
                  }
                  if (t5 && "body" === t5.tagName.toLowerCase()) {
                    const e5 = this._getSchemaText(w);
                    if (e5) {
                      const r4 = this._findElementBySchemaText(q.body, e5);
                      r4 && (this._log("Found content element via schema.org text"), t5 = r4);
                    }
                  }
                  return t5;
                }));
                if (!N) {
                  const t5 = this._serializeFallbackBody(), e5 = Date.now();
                  return Object.assign(Object.assign({ content: t5 }, _), { wordCount: this.countHtmlWords(t5), parseTime: Math.round(e5 - b2), metaTags: T });
                }
                S("removeMetadataBlock", (() => {
                  (_.published || _.author) && (0, p.removeMetadataBlock)(N), N.querySelectorAll("wbr").forEach(((t5) => t5.remove()));
                })), S("adoptExternalFootnotes", (() => {
                  E.standardize && this.adoptExternalFootnotes(N, q);
                })), S("standardizeFootnotesCallouts", (() => {
                  E.standardize && ((0, l.standardizeFootnotes)(N), (0, c.standardizeCallouts)(N));
                })), S("removeSmallImages", (() => {
                  E.removeSmallImages && (0, d.removeSmallImages)(q, L, this.debug);
                })), S("removeHiddenElements", (() => {
                  E.removeHiddenElements && (0, h.removeHiddenElements)(q, this.debug, A);
                })), S("removeEyebrowLabel", (() => {
                  E.removeContentPatterns && N && (0, f.removeEyebrowLabel)(N, this.debug, A);
                })), S("removeBySelector", (() => {
                  (E.removeExactSelectors || E.removePartialSelectors) && (0, m.removeBySelector)(q, this.debug, E.removeExactSelectors, E.removePartialSelectors, N, A, false === E.removeHiddenElements);
                })), S("removeLowScoring", (() => {
                  E.removeLowScoring && u.ContentScorer.scoreAndRemove(q, this.debug, A, N);
                })), S("removeByContentPattern", (() => {
                  if (E.removeContentPatterns && N) {
                    const t5 = this.options.url || this.doc.URL || "";
                    (0, f.removeByContentPattern)(N, this.debug, t5, _.title || "", _.description || "", A);
                  }
                })), S("standardizeContent", (() => {
                  E.standardize && (0, a.standardizeContent)(N, _, this.doc, this.debug, C ? x2 : void 0);
                })), S("resolveRelativeUrls", (() => this.resolveRelativeUrls(N))), this._deduplicateImages(N);
                const k = this._removeCoverImage(N, _.image || "");
                k && (_.image = k), this._stripUnsafeElements(N);
                const $ = N.outerHTML, P = Date.now(), O = Object.assign(Object.assign({ content: $ }, _), { wordCount: this.countHtmlWords($), parseTime: Math.round(P - b2), metaTags: T });
                return this.debug && (O.debug = { contentSelector: this.getElementSelector(N), removals: A }), this.options.profile && (O.profile = x2), O;
              } catch (t4) {
                console.error("Defuddle", "Error processing document:", t4);
                const e4 = this._serializeFallbackBody(), r4 = Date.now();
                return Object.assign(Object.assign({ content: e4 }, _), { wordCount: this.countHtmlWords(e4), parseTime: Math.round(r4 - b2), metaTags: T });
              }
            }
            countHtmlWords(t3) {
              const e3 = t3.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#\d+;/g, " ").replace(/&\w+;/g, " ");
              return (0, g.countWords)(e3);
            }
            _log(...t3) {
              this.debug && console.log("Defuddle:", ...t3);
            }
            _evaluateMediaQueries(t3) {
              const e3 = [], r3 = /max-width[^:]*:\s*(\d+)/;
              try {
                if (!t3.styleSheets) return e3;
                const n3 = Array.from(t3.styleSheets).filter(((t4) => {
                  try {
                    return t4.cssRules, true;
                  } catch (t5) {
                    return t5 instanceof DOMException && t5.name, false;
                  }
                }));
                n3.flatMap(((t4) => {
                  try {
                    return "undefined" == typeof CSSMediaRule ? [] : Array.from(t4.cssRules).filter(((t5) => t5 instanceof CSSMediaRule && t5.conditionText.includes("max-width")));
                  } catch (t5) {
                    return this.debug && console.warn("Defuddle: Failed to process stylesheet:", t5), [];
                  }
                })).forEach(((t4) => {
                  const n4 = t4.conditionText.match(r3);
                  if (n4) {
                    const r4 = parseInt(n4[1]);
                    if (s.MOBILE_WIDTH <= r4) {
                      Array.from(t4.cssRules).filter(((t5) => t5 instanceof CSSStyleRule)).forEach(((t5) => {
                        try {
                          e3.push({ selector: t5.selectorText, styles: t5.style.cssText });
                        } catch (t6) {
                          this.debug && console.warn("Defuddle: Failed to process CSS rule:", t6);
                        }
                      }));
                    }
                  }
                }));
              } catch (t4) {
                console.error("Defuddle: Error evaluating media queries:", t4);
              }
              return e3;
            }
            applyMobileStyles(t3, e3) {
              e3.forEach((({ selector: e4, styles: r3 }) => {
                try {
                  t3.querySelectorAll(e4).forEach(((t4) => {
                    t4.setAttribute("style", (t4.getAttribute("style") || "") + r3);
                  }));
                } catch (t4) {
                  console.error("Defuddle", "Error applying styles for selector:", e4, t4);
                }
              }));
            }
            removeImages(t3) {
              const e3 = t3.getElementsByTagName("img");
              Array.from(e3).forEach(((t4) => {
                t4.remove();
              }));
            }
            findMainContent(t3) {
              const e3 = [];
              if (s.ENTRY_POINT_ELEMENTS.forEach(((r4, n4) => {
                t3.querySelectorAll(r4).forEach(((t4) => {
                  let r5 = 40 * (s.ENTRY_POINT_ELEMENTS.length - n4);
                  r5 += u.ContentScorer.scoreElement(t4), e3.push({ element: t4, score: r5, selectorIndex: n4 });
                }));
              })), 0 === e3.length) return this.findContentByScoring(t3);
              if (e3.sort(((t4, e4) => e4.score - t4.score)), this.debug && this._log("Content candidates:", e3.map(((t4) => ({ element: t4.element.tagName, selector: this.getElementSelector(t4.element), score: t4.score })))), 1 === e3.length && "body" === e3[0].element.tagName.toLowerCase()) {
                const e4 = this.findTableBasedContent(t3);
                if (e4) return e4;
              }
              const r3 = e3[0];
              let n3 = r3;
              for (let t4 = 1; t4 < e3.length; t4++) {
                const o2 = e3[t4], i2 = (0, g.countWords)(o2.element.textContent || "");
                if (o2.selectorIndex < n3.selectorIndex && n3.element.contains(o2.element) && i2 > 50) {
                  let t5 = 0;
                  for (const n4 of e3) if (n4.selectorIndex === o2.selectorIndex && r3.element.contains(n4.element) && ++t5 > 1) break;
                  if (t5 > 1) continue;
                  n3 = o2;
                }
              }
              return n3 !== r3 ? n3.element : r3.element;
            }
            findTableBasedContent(t3) {
              const e3 = Array.from(t3.getElementsByTagName("table")).some(((t4) => {
                var e4;
                const r4 = parseInt(t4.getAttribute("width") || "0"), n4 = this.getComputedStyle(t4), o2 = (0, v.getClassName)(t4).toLowerCase();
                return r4 > 400 || (null === (e4 = null == n4 ? void 0 : n4.width) || void 0 === e4 ? void 0 : e4.includes("px")) && parseInt(n4.width) > 400 || "center" === t4.getAttribute("align") || o2.includes("content") || o2.includes("article") || Array.from(t4.getElementsByTagName("tr")).some(((t5) => {
                  const e5 = Array.from(t5.children).filter(((t6) => "TD" === t6.tagName));
                  return e5.length >= 2 && e5.some(((t6) => t6.getAttribute("width")));
                }));
              }));
              if (!e3) return null;
              const r3 = Array.from(t3.getElementsByTagName("td")), n3 = u.ContentScorer.findBestElement(r3);
              if (!n3) return null;
              return 2 * (0, g.countWords)(n3.textContent || "") < (0, g.countWords)((t3.body || t3.documentElement).textContent || "") ? null : n3;
            }
            findContentByScoring(t3) {
              const e3 = [];
              return t3.querySelectorAll(s.BLOCK_ELEMENTS_SELECTOR).forEach(((t4) => {
                const r3 = u.ContentScorer.scoreElement(t4);
                r3 > 0 && e3.push({ score: r3, element: t4 });
              })), e3.length > 0 ? e3.sort(((t4, e4) => e4.score - t4.score))[0].element : null;
            }
            getElementSelector(t3) {
              const e3 = [];
              let r3 = t3;
              for (; r3 && r3 !== this.doc.documentElement; ) {
                let t4 = r3.tagName.toLowerCase();
                if (r3.id) t4 += "#" + r3.id;
                else if ((0, v.getClassName)(r3)) {
                  const e4 = (0, v.getClassName)(r3).trim().split(/\s+/).filter(((t5) => !b.test(t5)));
                  e4.length && (t4 += "." + e4.join("."));
                }
                e3.unshift(t4), r3 = r3.parentElement;
              }
              return e3.join(" > ");
            }
            getComputedStyle(t3) {
              return (0, g.getComputedStyle)(t3);
            }
            adoptExternalFootnotes(t3, e3) {
              const r3 = e3.body || e3;
              r3 && t3 !== r3 && r3.querySelectorAll("div, section, aside").forEach(((e4) => {
                var r4;
                const n3 = (0, v.getClassName)(e4), o2 = e4.id || "";
                if (!/footnote/i.test(n3) && !/footnote/i.test(o2)) return;
                if (t3.contains(e4) || e4.contains(t3)) return;
                const i2 = e4.querySelector("h1, h2, h3, h4, h5, h6");
                i2 && l.FOOTNOTE_SECTION_RE.test((null === (r4 = i2.textContent) || void 0 === r4 ? void 0 : r4.trim()) || "") && t3.appendChild(e4);
              }));
            }
            resolveRelativeUrls(t3) {
              const e3 = this.options.url || this.doc.URL;
              if (!e3) return;
              let r3 = e3;
              const n3 = this.doc.querySelector("base[href]");
              if (n3) {
                const t4 = n3.getAttribute("href");
                if (t4) try {
                  r3 = new URL(t4, e3).href;
                } catch (t5) {
                }
              }
              const o2 = (t4) => {
                const e4 = t4.trim().replace(/^\\?["']+/, "").replace(/\\?["']+$/, "");
                if (e4.startsWith("#")) return e4;
                try {
                  return new URL(e4, r3).href;
                } catch (r4) {
                  return e4 || t4;
                }
              };
              t3.querySelectorAll("[href]").forEach(((t4) => {
                const e4 = t4.getAttribute("href");
                e4 && t4.setAttribute("href", o2(e4));
              })), t3.querySelectorAll("[src]").forEach(((t4) => {
                const e4 = t4.getAttribute("src");
                e4 && t4.setAttribute("src", o2(e4));
              })), t3.querySelectorAll("[srcset]").forEach(((t4) => {
                const e4 = t4.getAttribute("srcset");
                if (e4) {
                  const r4 = /(.+?)\s+(\d+(?:\.\d+)?[wx])/g, n4 = [];
                  let i2, s2 = 0;
                  for (; null !== (i2 = r4.exec(e4)); ) {
                    let t5 = i2[1].trim();
                    s2 > 0 && (t5 = t5.replace(/^,\s*/, "")), s2 = r4.lastIndex, n4.push(`${o2(t5)} ${i2[2]}`);
                  }
                  if (n4.length > 0) t4.setAttribute("srcset", n4.join(", "));
                  else {
                    const r5 = e4.split(",").map(((t5) => {
                      const e5 = t5.trim().split(/\s+/);
                      return e5[0] && (e5[0] = o2(e5[0])), e5.join(" ");
                    })).join(", ");
                    t4.setAttribute("srcset", r5);
                  }
                }
              })), t3.querySelectorAll("[poster]").forEach(((t4) => {
                const e4 = t4.getAttribute("poster");
                e4 && t4.setAttribute("poster", o2(e4));
              }));
            }
            flattenShadowRoots(t3, e3) {
              var r3, n3, o2;
              if (!t3.body || !e3.body) return;
              const i2 = Array.from(t3.body.querySelectorAll("*")), s2 = i2.find(((t4) => t4.shadowRoot));
              if (!s2) return;
              const a2 = Array.from(e3.body.querySelectorAll("*"));
              if ((null !== (o2 = null === (n3 = null === (r3 = s2.shadowRoot) || void 0 === r3 ? void 0 : r3.childNodes) || void 0 === n3 ? void 0 : n3.length) && void 0 !== o2 ? o2 : 0) > 0) for (let t4 = i2.length - 1; t4 >= 0; t4--) {
                const r4 = i2[t4];
                if (!r4.shadowRoot) continue;
                const n4 = a2[t4];
                if (!n4) continue;
                const o3 = r4.shadowRoot.innerHTML;
                o3.length > 0 && this.replaceShadowHost(n4, o3, e3);
              }
              else {
                const t4 = [];
                for (let e4 = 0; e4 < i2.length; e4++) {
                  const r4 = i2[e4], n4 = r4.getAttribute("data-defuddle-shadow");
                  if (!n4) continue;
                  const o3 = a2[e4];
                  o3 && (t4.push({ cloneEl: o3, html: n4 }), r4.removeAttribute("data-defuddle-shadow"), o3.removeAttribute("data-defuddle-shadow"));
                }
                for (const { cloneEl: r4, html: n4 } of t4) this.replaceShadowHost(r4, n4, e3);
              }
            }
            resolveStreamedContent(t3) {
              const e3 = t3.querySelectorAll("script"), r3 = [], n3 = /\$RC\("(B:\d+)","(S:\d+)"\)/g;
              for (const t4 of e3) {
                const e4 = t4.textContent || "";
                if (!e4.includes("$RC(")) continue;
                let o3;
                for (n3.lastIndex = 0; null !== (o3 = n3.exec(e4)); ) r3.push({ templateId: o3[1], contentId: o3[2] });
              }
              if (0 === r3.length) return;
              let o2 = 0;
              for (const { templateId: e4, contentId: n4 } of r3) {
                const r4 = t3.getElementById(e4), i2 = t3.getElementById(n4);
                if (!r4 || !i2) continue;
                const s2 = r4.parentNode;
                if (!s2) continue;
                let a2 = r4.nextSibling, l2 = false;
                for (; a2; ) {
                  const t4 = a2.nextSibling;
                  if (8 === a2.nodeType && "/$" === a2.data) {
                    a2.remove(), l2 = true;
                    break;
                  }
                  a2.remove(), a2 = t4;
                }
                if (l2) {
                  for (; i2.firstChild; ) s2.insertBefore(i2.firstChild, r4);
                  r4.remove(), i2.remove(), o2++;
                }
              }
              o2 > 0 && this._log("Resolved streamed content:", o2, "suspense boundaries");
            }
            replaceShadowHost(t3, e3, r3) {
              var n3;
              const o2 = (0, v.parseHTML)(r3, e3);
              if (t3.tagName.includes("-")) {
                const e4 = r3.createElement("div");
                e4.appendChild(o2), null === (n3 = t3.parentNode) || void 0 === n3 || n3.replaceChild(e4, t3);
              } else t3.textContent = "", t3.appendChild(o2);
            }
            resolveContentUrls(t3) {
              if (!(this.options.url || this.doc.URL)) return t3;
              const e3 = this.doc.createElement("div");
              return e3.appendChild((0, v.parseHTML)(this.doc, t3)), this.resolveRelativeUrls(e3), (0, v.serializeHTML)(e3);
            }
            _extractSchemaOrgData(t3) {
              const e3 = t3.querySelectorAll('script[type="application/ld+json"]'), r3 = [];
              e3.forEach(((t4) => {
                let e4 = t4.textContent || "";
                try {
                  e4 = e4.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "").replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1").replace(/^\s*(\*\/|\/\*)\s*|\s*(\*\/|\/\*)\s*$/g, "").trim();
                  const t5 = JSON.parse(e4);
                  t5["@graph"] && Array.isArray(t5["@graph"]) ? r3.push(...t5["@graph"]) : r3.push(t5);
                } catch (t5) {
                  console.error("Defuddle: Error parsing schema.org data:", t5), this.debug && console.error("Defuddle: Problematic JSON content:", e4);
                }
              }));
              const n3 = (t4) => {
                if ("string" == typeof t4) return this._decodeHTMLEntities(t4);
                if (Array.isArray(t4)) return t4.map(n3);
                if ("object" == typeof t4 && null !== t4) {
                  const e4 = {};
                  for (const r4 in t4) Object.prototype.hasOwnProperty.call(t4, r4) && (e4[r4] = n3(t4[r4]));
                  return e4;
                }
                return t4;
              };
              return r3.map(n3);
            }
            _collectMetaTags() {
              const t3 = [];
              return this.doc.querySelectorAll("meta").forEach(((e3) => {
                const r3 = e3.getAttribute("name"), n3 = e3.getAttribute("property");
                let o2 = e3.getAttribute("content");
                o2 && t3.push({ name: r3, property: n3, content: this._decodeHTMLEntities(o2) });
              })), t3;
            }
            _decodeHTMLEntities(t3) {
              return (0, v.decodeHTMLEntities)(this.doc, t3);
            }
            buildExtractorResponse(t3, e3, r3, n3, o2) {
              var i2, s2, a2, l2, c2, u2;
              const d2 = this._sanitizeExtractorHtml(t3.contentHtml), h2 = this.getExtractorVariables(t3.variables);
              return Object.assign({ content: d2, title: (null === (i2 = t3.variables) || void 0 === i2 ? void 0 : i2.title) || e3.title, description: (null === (s2 = t3.variables) || void 0 === s2 ? void 0 : s2.description) || e3.description, domain: e3.domain, favicon: e3.favicon, image: e3.image, language: (null === (a2 = t3.variables) || void 0 === a2 ? void 0 : a2.language) || e3.language, published: (null === (l2 = t3.variables) || void 0 === l2 ? void 0 : l2.published) || e3.published, author: (null === (c2 = t3.variables) || void 0 === c2 ? void 0 : c2.author) || e3.author, site: (null === (u2 = t3.variables) || void 0 === u2 ? void 0 : u2.site) || e3.site, schemaOrgData: e3.schemaOrgData, wordCount: this.countHtmlWords(d2), parseTime: Math.round(Date.now() - r3), extractorType: n3.constructor.name.replace("Extractor", "").toLowerCase(), metaTags: o2 }, h2 ? { variables: h2 } : {});
            }
            _sanitizeExtractorHtml(t3) {
              if (!t3) return t3;
              const e3 = this.doc.createElement("div");
              return e3.appendChild((0, v.parseHTML)(this.doc, t3)), this._stripUnsafeElements(e3), this.resolveRelativeUrls(e3), (0, v.serializeHTML)(e3);
            }
            getExtractorVariables(t3) {
              if (!t3) return;
              const e3 = {};
              let r3 = false;
              for (const [n3, o2] of Object.entries(t3)) y.has(n3) || (e3[n3] = o2, r3 = true);
              return r3 ? e3 : void 0;
            }
          }
          e2.Defuddle = x, x._urlWidthPattern = /(?:width[=:/]|[/,?&]w[_:=])(\d+)/;
        }, 7726(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.standardizeCallouts = function(t3) {
            var e3, r3;
            const n3 = t3.ownerDocument;
            if (!n3) return;
            const i = Array.from(t3.querySelectorAll(".callout.is-collapsed, .callout.is-collapsible"));
            for (const t4 of i) {
              const e4 = t4.classList.contains("is-collapsed");
              t4.classList.remove("is-collapsed", "is-collapsible"), t4.hasAttribute("data-callout-fold") || t4.setAttribute("data-callout-fold", e4 ? "-" : "+");
              const r4 = t4.querySelector(".callout-fold");
              r4 && r4.remove();
              const n4 = t4.querySelector(".callout-content");
              if (n4) {
                const t5 = n4.getAttribute("style");
                if (t5) {
                  const e5 = t5.replace(/display\s*:\s*none\s*;?/gi, "").trim();
                  e5 ? n4.setAttribute("style", e5) : n4.removeAttribute("style");
                }
              }
            }
            const s = Array.from(t3.querySelectorAll(".markdown-alert"));
            for (const t4 of s) {
              const e4 = Array.from(t4.classList).find(((t5) => t5.startsWith("markdown-alert-") && "markdown-alert" !== t5)), r4 = e4 ? e4.replace("markdown-alert-", "") : "note", i2 = r4.charAt(0).toUpperCase() + r4.slice(1), s2 = t4.querySelector(".markdown-alert-title");
              s2 && s2.remove(), t4.replaceWith(o(n3, r4, i2, t4));
            }
            const a = Array.from(t3.querySelectorAll('aside[class*="callout"]'));
            for (const t4 of a) {
              const e4 = Array.from(t4.classList).find(((t5) => t5.startsWith("callout-"))), r4 = e4 ? e4.replace("callout-", "") : "note", i2 = r4.charAt(0).toUpperCase() + r4.slice(1), s2 = t4.querySelector(".callout-content");
              t4.replaceWith(o(n3, r4, i2, s2 || t4));
            }
            const l = /* @__PURE__ */ new Set(["info", "warning", "note", "tip", "danger", "caution", "important", "abstract", "success", "question", "failure", "bug", "example", "quote"]), c = Array.from(t3.querySelectorAll(".admonition"));
            for (const t4 of c) {
              if (t4.getAttribute("data-callout")) continue;
              const r4 = Array.from(t4.classList).find(((t5) => l.has(t5))) || "note", i2 = t4.querySelector(".admonition-title"), s2 = (null === (e3 = null == i2 ? void 0 : i2.textContent) || void 0 === e3 ? void 0 : e3.trim()) || r4.charAt(0).toUpperCase() + r4.slice(1);
              i2 && i2.remove();
              const a2 = t4.querySelector(".admonition-content") || t4.querySelector(".details-content") || t4;
              t4.replaceWith(o(n3, r4, s2, a2));
            }
            const u = Array.from(t3.querySelectorAll('.alert[class*="alert-"]'));
            for (const t4 of u) {
              const e4 = Array.from(t4.classList).find(((t5) => t5.startsWith("alert-") && "alert-dismissible" !== t5)), i2 = e4 ? e4.replace("alert-", "") : "note", s2 = t4.querySelector(".alert-heading, .alert-title"), a2 = (null === (r3 = null == s2 ? void 0 : s2.textContent) || void 0 === r3 ? void 0 : r3.trim()) || i2.charAt(0).toUpperCase() + i2.slice(1);
              s2 && s2.remove(), t4.replaceWith(o(n3, i2, a2, t4));
            }
          };
          const n2 = r2(639);
          function o(t3, e3, r3, o2) {
            const i = t3.createElement("div");
            i.setAttribute("data-callout", e3), i.className = "callout";
            const s = t3.createElement("div");
            s.className = "callout-title";
            const a = t3.createElement("div");
            a.className = "callout-title-inner", a.textContent = r3, s.appendChild(a), i.appendChild(s);
            const l = t3.createElement("div");
            return l.className = "callout-content", (0, n2.transferContent)(o2, l), i.appendChild(l), i;
          }
        }, 754(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.codeBlockRules = void 0;
          const n2 = r2(2552), o = [/^language-(\w+)$/, /^lang-(\w+)$/, /^(\w+)-code$/, /^code-(\w+)$/, /^syntax-(\w+)$/, /^code-snippet__(\w+)$/, /^highlight-(\w+)$/, /^(\w+)-snippet$/, /(?:^|\s)(?:language|lang|brush|syntax)-(\w+)(?:\s|$)/i], i = /* @__PURE__ */ new Set(["abap", "actionscript", "ada", "adoc", "agda", "antlr4", "applescript", "arduino", "armasm", "asciidoc", "aspnet", "atom", "bash", "batch", "c", "clojure", "cmake", "cobol", "coffeescript", "cpp", "c++", "crystal", "csharp", "cs", "dart", "django", "dockerfile", "dotnet", "elixir", "elm", "erlang", "fortran", "fsharp", "gdscript", "gitignore", "glsl", "golang", "gradle", "graphql", "groovy", "haskell", "hs", "haxe", "hlsl", "html", "idris", "java", "javascript", "js", "jsx", "jsdoc", "json", "jsonp", "julia", "kotlin", "latex", "lean", "lean4", "lisp", "elisp", "livescript", "lua", "makefile", "markdown", "md", "markup", "masm", "mathml", "matlab", "mongodb", "mysql", "nasm", "nginx", "nim", "nix", "objc", "ocaml", "pascal", "perl", "php", "postgresql", "powershell", "prolog", "puppet", "python", "regex", "rss", "ruby", "rb", "rust", "scala", "scheme", "shell", "sh", "solidity", "sparql", "sql", "ssml", "svg", "swift", "tcl", "terraform", "tex", "toml", "typescript", "ts", "tsx", "unrealscript", "verilog", "vhdl", "webassembly", "wasm", "xml", "yaml", "yml", "zig"]);
          e2.codeBlockRules = [{ selector: ["pre", 'div[class*="prismjs"]', ".syntaxhighlighter", ".highlight", ".highlight-source", ".wp-block-syntaxhighlighter-code", ".wp-block-code", 'div[class*="language-"]', ".code-block[data-lang]", "code.hl.block"].join(", "), element: "pre", transform: (t3, e3) => {
            var r3;
            if (!((t4) => "classList" in t4 && "getAttribute" in t4 && "querySelector" in t4)(t3)) return t3;
            t3.querySelectorAll('button, [class*="codeblock-button"]').forEach(((t4) => t4.remove())), t3.querySelectorAll('[class*="header"], [class*="toolbar"], [class*="titlebar"], [class*="title-bar"]').forEach(((e4) => {
              var r4;
              const o2 = e4.tagName;
              if ("DIV" !== o2 && "SPAN" !== o2) return;
              const i2 = null === (r4 = e4.closest) || void 0 === r4 ? void 0 : r4.call(e4, "[data-line], .line");
              if (i2 && t3.contains(i2)) return;
              if (e4.querySelector("[data-line], .line, pre")) return;
              const s2 = (e4.textContent || "").trim();
              (0, n2.countWords)(s2) <= 5 && e4.remove();
            }));
            const s = (t4) => {
              var e4;
              const r4 = t4.getAttribute("data-lang") || t4.getAttribute("data-language") || t4.getAttribute("language");
              if (r4) return r4.toLowerCase();
              const n3 = Array.from(t4.classList || []);
              if (null === (e4 = t4.classList) || void 0 === e4 ? void 0 : e4.contains("syntaxhighlighter")) {
                const t5 = n3.find(((t6) => !["syntaxhighlighter", "nogutter"].includes(t6)));
                if (t5 && i.has(t5.toLowerCase())) return t5.toLowerCase();
              }
              for (const t5 of n3) for (const e5 of o) {
                const r5 = t5.toLowerCase().match(e5);
                if (r5 && r5[1] && i.has(r5[1].toLowerCase())) return r5[1].toLowerCase();
              }
              for (const t5 of n3) if (i.has(t5.toLowerCase())) return t5.toLowerCase();
              return "";
            };
            let a = "", l = t3;
            for (; l && !a; ) {
              if (a = s(l), !a && l === t3) {
                const t4 = l.querySelector('code[data-lang], code[class*="language-"]') || l.querySelector("code");
                t4 && (a = s(t4));
              }
              l = l.parentElement;
            }
            const c = t3.querySelector(".cm-content");
            if (c && !a) {
              const e4 = Array.from(t3.querySelectorAll("div"));
              for (const t4 of e4) {
                if (t4.contains(c)) continue;
                const e5 = (t4.textContent || "").trim().toLowerCase();
                if (e5 && i.has(e5)) {
                  a = e5;
                  break;
                }
              }
            }
            const u = (t4) => {
              var e4;
              if ((0, n2.isTextNode)(t4)) return (null === (e4 = t4.parentElement) || void 0 === e4 ? void 0 : e4.querySelector("[data-line], .line")) && !(t4.textContent || "").trim() ? "" : t4.textContent || "";
              let r4 = "";
              if ((0, n2.isElement)(t4)) {
                if (t4.matches(".hover-info, .hover-container")) return "";
                if ("BUTTON" === t4.tagName || "STYLE" === t4.tagName) return "";
                if ("BR" === t4.tagName) {
                  const e5 = t4.previousElementSibling;
                  return e5 && e5.matches('div[class*="line"], span[class*="line"], .ec-line, [data-line-number], [data-line]') ? "" : "\n";
                }
                if (t4.matches("span.lnt")) return "";
                if (t4.matches("span.lineno")) return "";
                if (t4.matches(".react-syntax-highlighter-line-number")) return "";
                if (t4.matches(".rouge-gutter")) return "";
                if (("DIV" === t4.tagName || "SPAN" === t4.tagName) && 2 === t4.children.length) {
                  const e5 = (t4.children[0].textContent || "").trim();
                  if (/^\d+$/.test(e5)) return u(t4.children[1]).replace(/\n$/, "") + "\n";
                }
                if (t4.matches('div[class*="line"], span[class*="line"], .ec-line, [data-line-number], [data-line]')) {
                  const e5 = t4.querySelector('.code:not(.token), .content:not(.token), [class*="code-"], [class*="content-"]');
                  if (e5) return (e5.textContent || "").replace(/\n$/, "") + "\n";
                  const r5 = t4.querySelector('.line-number, .gutter, [class*="line-number"], [class*="gutter"]');
                  if (r5) {
                    return Array.from(t4.childNodes).filter(((t5) => !r5.contains(t5))).map(((t5) => u(t5))).join("").replace(/\n$/, "") + "\n";
                  }
                  return (t4.textContent || "").replace(/\n$/, "") + "\n";
                }
                t4.childNodes.forEach(((t5) => {
                  r4 += u(t5);
                }));
              }
              return r4;
            };
            let d = "";
            if (t3.matches(".syntaxhighlighter, .wp-block-syntaxhighlighter-code") && (d = ((t4) => {
              const e4 = t4.querySelector(".syntaxhighlighter table .code .container");
              if (e4) return Array.from(e4.children).map(((t5) => {
                const e5 = Array.from(t5.querySelectorAll("code")).map(((t6) => {
                  var e6;
                  let r5 = t6.textContent || "";
                  return (null === (e6 = t6.classList) || void 0 === e6 ? void 0 : e6.contains("spaces")) && (r5 = " ".repeat(r5.length)), r5;
                })).join("");
                return e5 || t5.textContent || "";
              })).join("\n");
              const r4 = t4.querySelectorAll(".code .line");
              return r4.length > 0 ? Array.from(r4).map(((t5) => {
                const e5 = Array.from(t5.querySelectorAll("code")).map(((t6) => t6.textContent || "")).join("");
                return e5 || t5.textContent || "";
              })).join("\n") : "";
            })(t3)), !d && c) d = u(c);
            else if (!d) {
              let e4 = t3;
              if ("PRE" !== t3.tagName && "CODE" !== t3.tagName) {
                const r4 = Array.from(t3.querySelectorAll("pre")), n3 = r4.find(((t4) => t4.querySelector('code[data-lang], code[class*="language-"], .line, [data-line]'))) || r4.find(((t4) => t4.querySelector("span[class]") && !t4.classList.contains("lineno")));
                n3 && (e4 = n3);
              }
              d = u(e4);
            }
            if (t3.matches("code.hl.block")) d = d.replace(/^[ \t]+|[ \t]+$/g, "").replace(/\t/g, "    ").replace(/\u00a0/g, " ").replace(/^\n+/, "");
            else {
              d = d.replace(/\t/g, "    ").replace(/\u00a0/g, " ");
              const t4 = d.split("\n");
              let e4 = 1 / 0;
              for (const r4 of t4) {
                const t5 = r4.search(/\S/);
                t5 > -1 && (e4 = Math.min(e4, t5));
              }
              e4 === 1 / 0 && (e4 = 0), e4 > 0 && (d = t4.map(((t5) => t5.slice(e4))).join("\n")), d = d.replace(/^\s+|\s+$/g, "").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").replace(/\n+$/, "");
            }
            let h = t3;
            for (let e4 = 0; e4 < 3 && h; e4++) {
              const e5 = h.parentElement;
              if (!e5 || "BODY" === e5.tagName) break;
              if (e5.children.length > 5) break;
              if (null === (r3 = e5.closest) || void 0 === r3 ? void 0 : r3.call(e5, "[data-callout]")) break;
              const o2 = Array.from(e5.children);
              for (const e6 of o2) {
                if (e6.contains(t3)) continue;
                const r4 = e6.tagName;
                if ("DIV" !== r4 && "SPAN" !== r4) continue;
                const o3 = (e6.textContent || "").trim();
                (0, n2.countWords)(o3) <= 5 && !e6.querySelector("pre, code, img, svg, table, h1, h2, h3, h4, h5, h6, p, blockquote, ul, ol, hr") && e6.remove();
              }
              h = e5;
            }
            const m = e3.createElement("pre");
            t3.matches("code.hl.block, pre.hl.lean.lean-output") && m.setAttribute("data-verso-code", "true");
            const f = e3.createElement("code");
            return a && (f.setAttribute("data-lang", a), f.setAttribute("class", `language-${a}`)), f.textContent = d, m.appendChild(f), m;
          } }];
        }, 3610(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.FOOTNOTE_SECTION_RE = void 0, e2.standardizeFootnotes = function(t3) {
            const e3 = t3.ownerDocument;
            if (!e3) return;
            new h(e3).standardizeFootnotes(t3);
          };
          const n2 = r2(2640), o = r2(639), i = r2(2552), s = r2(4840);
          e2.FOOTNOTE_SECTION_RE = /^(foot\s*notes?|end\s*notes?|notes?|references?)$/i;
          const a = /^[\^\u21A9\u21A5\u2191\u21B5\u2934\u2935\u23CE]+$/, l = /^#cite_ref-/, c = /^\[?\(?(\d{1,4})\)?\]?$/;
          function u(t3) {
            var e3;
            return (null === (e3 = ((null == t3 ? void 0 : t3.getAttribute("href")) || "").split("#").pop()) || void 0 === e3 ? void 0 : e3.toLowerCase()) || "";
          }
          const d = [{ selector: "sup.footnoteref", extract: (t3) => {
            var e3;
            const r3 = t3.querySelector('a[id^="footnoteref-"]');
            return (null === (e3 = null == r3 ? void 0 : r3.id.match(/^footnoteref-(\d+)$/)) || void 0 === e3 ? void 0 : e3[1]) || "";
          } }, { selector: 'a[id^="ref-link"]', extract: (t3) => {
            var e3;
            return (null === (e3 = t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
          } }, { selector: 'a[role="doc-biblioref"]', extract: (t3) => {
            const e3 = t3.getAttribute("data-xml-rid");
            if (e3) return e3;
            const r3 = t3.getAttribute("href") || "";
            return r3.startsWith("#core-R") ? r3.replace("#core-", "") : "";
          } }, { selector: "a.footnote-anchor, span.footnote-hovercard-target a", extract: (t3) => {
            var e3;
            return ((null === (e3 = t3.id) || void 0 === e3 ? void 0 : e3.replace("footnote-anchor-", "")) || "").toLowerCase();
          } }, { selector: "sup.reference", extract: (t3) => {
            let e3 = "";
            return t3.querySelectorAll("a").forEach(((t4) => {
              var r3;
              const n3 = null === (r3 = (t4.getAttribute("href") || "").split("/").pop()) || void 0 === r3 ? void 0 : r3.match(/(?:cite_note|cite_ref)-(.+)/);
              n3 && (e3 = n3[1].toLowerCase());
            })), e3;
          } }, { selector: 'sup[id^="fnref:"], span[id^="fnref:"]', extract: (t3) => t3.id.replace("fnref:", "").toLowerCase() }, { selector: 'sup[id^="fnr"]', extract: (t3) => t3.id.replace("fnr", "").toLowerCase() }, { selector: "sup.footnote-reference", extract: (t3) => u(t3.querySelector('a[href^="#"]')) }, { selector: "span.footnote-reference", extract: (t3) => {
            var e3;
            const r3 = t3.getAttribute("data-footnote-id") || "";
            return r3 || ((null === (e3 = t3.id) || void 0 === e3 ? void 0 : e3.startsWith("fnref")) ? t3.id.replace("fnref", "").toLowerCase() : "");
          } }, { selector: "span.footnote-link", extract: (t3) => t3.getAttribute("data-footnote-id") || "" }, { selector: "a.citation", extract: (t3) => {
            var e3;
            return (null === (e3 = t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
          } }, { selector: 'a[id^="fnref"]', extract: (t3) => t3.id.replace("fnref", "").toLowerCase() }, { selector: 'a[data-type="noteref"]', extract: (t3) => u(t3) }];
          class h {
            constructor(t3) {
              this.pendingRemovals = [], this.doc = t3;
            }
            makeRefId(t3, e3) {
              return e3 > 0 ? `fnref:${t3}-${e3 + 1}` : `fnref:${t3}`;
            }
            mergeFootnotes(t3, e3) {
              for (const [r3, n3] of Object.entries(e3)) {
                const e4 = parseInt(r3);
                t3[e4] || (t3[e4] = n3);
              }
            }
            addFootnote(t3, e3, r3, n3) {
              if (!e3 || t3.processedIds.has(e3)) return false;
              const o2 = null != n3 ? n3 : t3.count;
              return t3.footnotes[o2] = { content: r3, originalId: e3, refs: [] }, t3.processedIds.add(e3), void 0 === n3 ? t3.count++ : n3 >= t3.count && (t3.count = n3 + 1), true;
            }
            createFootnoteItem(t3, e3, r3) {
              const i2 = "string" == typeof e3 ? this.doc : e3.ownerDocument, s2 = i2.createElement("li");
              if (s2.className = "footnote", s2.id = `fn:${t3}`, "string" == typeof e3) {
                const t4 = i2.createElement("p");
                t4.appendChild((0, o.parseHTML)(i2, e3)), s2.appendChild(t4);
              } else {
                const t4 = Array.from(e3.children), r4 = t4.some(((t5) => "p" === t5.tagName.toLowerCase())), a3 = t4.some(((t5) => n2.BLOCK_LEVEL_ELEMENTS.has(t5.tagName.toLowerCase())));
                if (r4 || a3) !r4 && a3 ? t4.forEach(((t5) => {
                  if (this.isBackrefLink(t5)) return;
                  const e4 = t5.cloneNode(true);
                  this.removeBackrefs(e4), s2.appendChild(e4);
                })) : t4.forEach(((t5) => {
                  var e4;
                  if (!this.isBackrefLink(t5)) if ("p" === t5.tagName.toLowerCase()) {
                    if (!(null === (e4 = t5.textContent) || void 0 === e4 ? void 0 : e4.trim()) && !t5.querySelector("img, br")) return;
                    const r5 = i2.createElement("p");
                    (0, o.transferContent)(t5, r5), this.removeBackrefs(r5), s2.appendChild(r5);
                  } else {
                    const e5 = t5.cloneNode(true);
                    this.removeBackrefs(e5), s2.appendChild(e5);
                  }
                }));
                else {
                  const t5 = i2.createElement("p");
                  (0, o.transferContent)(e3, t5), this.removeBackrefs(t5), s2.appendChild(t5);
                }
              }
              const a2 = s2.querySelector("p:last-of-type") || s2;
              return r3.forEach(((t4, e4) => {
                const n3 = i2.createElement("a");
                n3.href = `#${t4}`, n3.title = "return to article", n3.className = "footnote-backref", n3.textContent = "↩", e4 < r3.length - 1 && (n3.textContent += " "), a2.appendChild(n3);
              })), s2;
            }
            collectFootnotes(t3) {
              const e3 = { footnotes: {}, processedIds: /* @__PURE__ */ new Set(), count: 1 };
              t3.querySelectorAll(n2.FOOTNOTE_LIST_SELECTORS).forEach(((r4) => {
                var n3, i2;
                if (r4.matches("div.footnotes-footer")) {
                  return void r4.querySelectorAll("div.footnote-footer").forEach(((r5) => {
                    const n4 = (r5.id || "").match(/^footnote-(\d+)$/);
                    if (!n4) return;
                    const i3 = n4[1];
                    if (e3.processedIds.has(i3)) return;
                    const s2 = r5.cloneNode(true), a2 = s2.querySelector("a");
                    a2 && a2.remove();
                    const l2 = (0, o.serializeHTML)(s2).replace(/^\s*\.\s*/, ""), c2 = t3.ownerDocument.createElement("div");
                    c2.appendChild((0, o.parseHTML)(t3.ownerDocument, l2.trim())), this.addFootnote(e3, i3, c2);
                  }));
                }
                if (r4.matches("div.footnote-definition") && !(null === (n3 = r4.parentElement) || void 0 === n3 ? void 0 : n3.matches("div.footnote-definitions"))) {
                  const t4 = (r4.id || "").toLowerCase(), n4 = r4.cloneNode(true), o2 = n4.querySelector("sup.footnote-definition-label");
                  return o2 && o2.remove(), void this.addFootnote(e3, t4, n4);
                }
                if (r4.matches("div.footnote-definitions")) {
                  r4.querySelectorAll("div.footnote-definition").forEach(((t4) => {
                    const r5 = t4.querySelector("sup[id]"), n5 = t4.querySelector(".footnote-body");
                    r5 && n5 && this.addFootnote(e3, (r5.id || "").toLowerCase(), n5.cloneNode(true));
                  }));
                  const n4 = r4.parentElement;
                  return void (n4 && n4 !== t3 && (null === (i2 = n4.classList) || void 0 === i2 ? void 0 : i2.contains("footnotes")) && this.pendingRemovals.push(n4));
                }
                if (r4.matches("ol.easy-footnotes-wrapper")) {
                  return r4.querySelectorAll("li.easy-footnote-single").forEach(((t4) => {
                    var r5, n4;
                    const o2 = t4.querySelector('span[id^="easy-footnote-bottom-"]');
                    if (!o2) return;
                    const i3 = t4.cloneNode(true);
                    null === (r5 = i3.querySelector('span[id^="easy-footnote-bottom-"]')) || void 0 === r5 || r5.remove(), null === (n4 = i3.querySelector("a.easy-footnote-to-top")) || void 0 === n4 || n4.remove(), this.addFootnote(e3, o2.id.toLowerCase(), i3);
                  })), void t3.querySelectorAll("span.easy-footnote-margin-adjust").forEach(((t4) => {
                    this.pendingRemovals.push(t4);
                  }));
                }
                if (r4.matches("div.footnotes-segment")) {
                  return r4.querySelectorAll("h5.footnote-body-heading").forEach(((r5) => {
                    var n4, o2, i3, s2;
                    const a2 = ((null === (n4 = r5.querySelector("a[id]")) || void 0 === n4 ? void 0 : n4.id) || "").toLowerCase();
                    if (!a2) return;
                    const l2 = t3.ownerDocument.createElement("div");
                    let c2 = r5.nextElementSibling;
                    for (; c2 && ("h5" !== c2.tagName.toLowerCase() || !(null === (o2 = c2.classList) || void 0 === o2 ? void 0 : o2.contains("footnote-body-heading"))); ) ((null === (i3 = c2.textContent) || void 0 === i3 ? void 0 : i3.trim()) || (null === (s2 = c2.querySelector) || void 0 === s2 ? void 0 : s2.call(c2, "img, br"))) && l2.appendChild(c2.cloneNode(true)), c2 = c2.nextElementSibling;
                    this.addFootnote(e3, a2, l2);
                  })), void this.pendingRemovals.push(r4);
                }
                if (r4.matches('div.footnote[data-component-name="FootnoteToDOM"]')) {
                  const t4 = r4.querySelector("a.footnote-number"), n4 = r4.querySelector(".footnote-content");
                  return void (t4 && n4 && this.addFootnote(e3, t4.id.replace("footnote-", "").toLowerCase(), n4));
                }
                r4.querySelectorAll('li, div[role="listitem"]').forEach(((t4) => {
                  const { id: r5, content: n4 } = this.extractListItemIdAndContent(t4);
                  this.addFootnote(e3, r5, n4 || t4);
                }));
              }));
              const r3 = [this.tryDataTypeFootnotes, this.tryGenericIdDetection, this.tryWordExport, this.tryGoogleDocs, this.tryLabeledSection, this.tryLooseFootnotes, this.tryClassFootnote];
              for (const n3 of r3) {
                if (e3.count > 1) break;
                n3.call(this, t3, e3);
              }
              return e3.footnotes;
            }
            tryDataTypeFootnotes(t3, e3) {
              t3.querySelectorAll('p[data-type="footnote"][id]').forEach(((r3) => {
                const n3 = (r3.id || "").toLowerCase();
                if (!n3) return;
                const o2 = t3.ownerDocument.createElement("div"), i2 = r3.cloneNode(true), s2 = i2.firstElementChild;
                s2 && "sup" === s2.tagName.toLowerCase() && s2.querySelector('a[href*="#"]') && (s2.remove(), this.trimLeadingWhitespace(i2)), o2.appendChild(i2), this.addFootnote(e3, n3, o2), this.pendingRemovals.push(r3);
              }));
            }
            tryGenericIdDetection(t3, e3) {
              const r3 = /* @__PURE__ */ new Map();
              if (t3.querySelectorAll('a[href*="#"]').forEach(((t4) => {
                var e4;
                const n4 = u(t4);
                if (!n4) return;
                const o2 = (null === (e4 = t4.textContent) || void 0 === e4 ? void 0 : e4.trim()) || "";
                c.test(o2) && (r3.has(n4) || r3.set(n4, []), r3.get(n4).push(t4));
              })), r3.size < 2) return;
              const n3 = new Set(r3.keys()), i2 = t3.querySelectorAll("div, section, aside, footer, ol, ul");
              let s2 = null, a2 = 0;
              if (i2.forEach(((e4) => {
                if (e4 === t3) return;
                const r4 = this.findMatchingFootnoteElements(e4, n3).length;
                r4 >= 2 && r4 >= a2 && (a2 = r4, s2 = e4);
              })), !s2) return;
              const l2 = this.findMatchingFootnoteElements(s2, n3), d2 = new Set(l2.map((({ id: t4 }) => t4)));
              let h2 = 0, m = 0;
              r3.forEach(((t4, e4) => {
                t4.some(((t5) => s2.contains(t5))) || (h2++, d2.has(e4) && m++);
              })), m < Math.max(2, Math.ceil(0.75 * h2)) && (s2 = null), l2.forEach((({ el: r4, id: i3 }) => {
                var s3, a3;
                if (e3.processedIds.has(i3)) return;
                const l3 = t3.ownerDocument.createElement("div"), c2 = r4.cloneNode(true), u2 = c2.querySelector(`a[id="${i3}"]`);
                !u2 || (null === (s3 = u2.textContent) || void 0 === s3 ? void 0 : s3.trim()) && !/^\d+[.)]*\s*$/.test(u2.textContent.trim()) || u2.remove();
                const d3 = c2.querySelector("a[name]");
                d3 && (null === (a3 = d3.getAttribute("name")) || void 0 === a3 ? void 0 : a3.toLowerCase()) === i3 && d3.remove();
                const h3 = c2.childNodes[0];
                h3 && 3 === h3.nodeType && (h3.textContent = h3.textContent.replace(/^\d+\.\s*/, "").replace(/^\s+/, "")), c2.matches("li") ? (0, o.transferContent)(c2, l3) : l3.appendChild(c2);
                let m2 = r4.nextElementSibling;
                for (; m2 && !m2.id; ) {
                  const t4 = this.getChildAnchorId(m2);
                  if (t4 && n3.has(t4)) break;
                  l3.appendChild(m2.cloneNode(true)), m2 = m2.nextElementSibling;
                }
                this.addFootnote(e3, i3, l3);
              })), s2 && this.pendingRemovals.push(s2);
            }
            tryWordExport(t3, e3) {
              const r3 = Array.from(t3.querySelectorAll('a[href*="#_ftnref"]'));
              if (r3.length < 2) return;
              const n3 = [];
              r3.forEach(((t4) => {
                const e4 = u(t4).match(/^_ftnref(\d+)$/);
                e4 && n3.push({ num: parseInt(e4[1]), anchor: t4 });
              })), n3.sort(((t4, e4) => t4.num - e4.num)), n3.forEach((({ num: r4, anchor: n4 }) => {
                const o2 = `_ftn${r4}`;
                if (e3.processedIds.has(o2)) return;
                let i2 = n4.parentElement;
                for (; i2 && i2 !== t3; ) {
                  const t4 = i2.tagName.toLowerCase();
                  if ("p" === t4 || "div" === t4 || "li" === t4) break;
                  i2 = i2.parentElement;
                }
                if (!i2 || i2 === t3) return;
                const s2 = i2.cloneNode(true), a2 = s2.querySelector('a[href*="_ftnref"]');
                if (a2) {
                  const t4 = a2.closest("sup");
                  t4 ? t4.remove() : a2.remove();
                }
                const l2 = t3.ownerDocument.createElement("div");
                l2.appendChild(s2), this.addFootnote(e3, o2, l2, r4), this.pendingRemovals.push(i2);
              }));
            }
            tryGoogleDocs(t3, r3) {
              var n3;
              const o2 = [];
              if (t3.querySelectorAll('p[id^="ftnt"]').forEach(((t4) => {
                const e3 = (t4.id || "").match(/^ftnt(\d+)$/);
                e3 && o2.push({ num: parseInt(e3[1]), el: t4 });
              })), o2.length < 2) return;
              o2.sort(((t4, e3) => t4.num - e3.num)), o2.forEach((({ num: e3, el: n4 }) => {
                var o3;
                const i3 = `ftnt${e3}`;
                if (r3.processedIds.has(i3)) return;
                const s3 = n4.cloneNode(true);
                null === (o3 = s3.querySelector('a[href*="#ftnt_ref"]')) || void 0 === o3 || o3.remove();
                const a3 = t3.ownerDocument.createElement("div");
                a3.appendChild(s3), this.addFootnote(r3, i3, a3, e3), this.pendingRemovals.push(n4);
                const l2 = n4.parentElement;
                l2 && l2 !== t3 && "div" === l2.tagName.toLowerCase() && 1 === l2.children.length && this.pendingRemovals.push(l2);
              }));
              const i2 = o2[0].el, s2 = i2.parentElement, a2 = (s2 && s2 !== t3 && "div" === s2.tagName.toLowerCase() ? s2 : i2).previousElementSibling;
              a2 && /^h[1-6]$/.test(a2.tagName.toLowerCase()) && e2.FOOTNOTE_SECTION_RE.test((null === (n3 = a2.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "") && this.pendingRemovals.push(a2);
            }
            tryLooseFootnotes(t3, e3) {
              var r3, n3;
              const o2 = this.findLooseFootnoteParagraphs(t3);
              if (!o2) return;
              const { paragraphs: i2, toRemove: s2 } = o2, a2 = new Set(s2);
              for (let t4 = 0; t4 < i2.length; t4++) {
                const { num: o3, el: s3 } = i2[t4], l2 = null !== (n3 = null === (r3 = i2[t4 + 1]) || void 0 === r3 ? void 0 : r3.el) && void 0 !== n3 ? n3 : null, c2 = this.stripMarkerAndWrap(s3);
                let u2 = s3.nextElementSibling;
                for (; u2 && u2 !== l2 && a2.has(u2); ) c2.appendChild(u2.cloneNode(true)), u2 = u2.nextElementSibling;
                this.addFootnote(e3, String(o3), c2);
              }
              this.pendingRemovals.push(...s2);
            }
            tryClassFootnote(t3, e3) {
              const r3 = [];
              t3.querySelectorAll("p.footnote").forEach(((t4) => {
                const e4 = this.parseFootnoteNum(t4);
                null !== e4 && r3.push({ num: e4, el: t4 });
              }));
              for (const { num: t4, el: n3 } of r3) this.addFootnote(e3, String(t4), this.stripMarkerAndWrap(n3));
              this.pendingRemovals.push(...r3.map(((t4) => t4.el)));
            }
            tryLabeledSection(t3, r3) {
              var n3, i2;
              const s2 = t3.querySelectorAll("div, section, aside");
              for (const t4 of Array.from(s2)) {
                const s3 = (0, o.getClassName)(t4), a2 = t4.id || "";
                if (!/footnote/i.test(s3) && !/footnote/i.test(a2)) continue;
                const l2 = t4.querySelector("h1, h2, h3, h4, h5, h6");
                if (!l2 || !e2.FOOTNOTE_SECTION_RE.test((null === (n3 = l2.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "")) continue;
                const c2 = [];
                if (t4.querySelectorAll("p").forEach(((t5) => {
                  const e3 = this.parseFootnoteNum(t5);
                  null !== e3 && c2.push({ num: e3, el: t5 });
                })), 0 === c2.length) continue;
                const u2 = new Set(c2.map(((t5) => t5.el)));
                for (let t5 = 0; t5 < c2.length; t5++) {
                  const { num: e3, el: n4 } = c2[t5], o2 = this.stripMarkerAndWrap(n4);
                  let s4 = n4.nextElementSibling;
                  for (; s4 && !u2.has(s4); ) (null === (i2 = s4.textContent) || void 0 === i2 ? void 0 : i2.trim()) && o2.appendChild(s4.cloneNode(true)), this.pendingRemovals.push(s4), s4 = s4.nextElementSibling;
                  this.addFootnote(r3, String(e3), o2), this.pendingRemovals.push(n4);
                }
                this.pendingRemovals.push(t4);
                break;
              }
            }
            trimLeadingWhitespace(t3) {
              const e3 = t3.firstChild;
              3 === (null == e3 ? void 0 : e3.nodeType) && (e3.textContent = e3.textContent.replace(/^\s+/, ""));
            }
            isBoldWrappedSup(t3) {
              var e3, r3, n3;
              const o2 = null === (e3 = t3.tagName) || void 0 === e3 ? void 0 : e3.toLowerCase();
              return ("b" === o2 || "strong" === o2) && t3.firstChild === t3.firstElementChild && "sup" === (null === (n3 = null === (r3 = t3.firstElementChild) || void 0 === r3 ? void 0 : r3.tagName) || void 0 === n3 ? void 0 : n3.toLowerCase());
            }
            stripMarkerAndWrap(t3) {
              const e3 = t3.ownerDocument.createElement("div"), r3 = t3.cloneNode(true), n3 = r3.firstElementChild;
              return n3 && (this.isBoldWrappedSup(n3) ? (n3.firstElementChild.remove(), this.trimLeadingWhitespace(n3)) : (n3.remove(), this.trimLeadingWhitespace(r3))), e3.appendChild(r3), e3;
            }
            parseFootnoteNum(t3) {
              var e3;
              if (!t3.firstChild) return null;
              let r3 = t3.firstElementChild;
              if (!r3 || r3 !== t3.firstChild) return null;
              let n3 = r3.tagName.toLowerCase();
              if (this.isBoldWrappedSup(r3) && (r3 = r3.firstElementChild, n3 = "sup"), "sup" !== n3 && "strong" !== n3) return null;
              const o2 = (null === (e3 = r3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "", i2 = parseInt(o2, 10);
              return !isNaN(i2) && i2 >= 1 && String(i2) === o2 ? i2 : null;
            }
            crossValidate(t3, e3) {
              const r3 = new Set(e3.map(((t4) => t4.num))), n3 = /* @__PURE__ */ new Set();
              return t3.querySelectorAll("sup").forEach(((t4) => {
                var o2;
                if (e3.some(((e4) => e4.el.contains(t4)))) return;
                if (t4.querySelector("a")) return;
                const i2 = (null === (o2 = t4.textContent) || void 0 === o2 ? void 0 : o2.trim()) || "", s2 = parseInt(i2, 10);
                !isNaN(s2) && s2 >= 1 && String(s2) === i2 && r3.has(s2) && n3.add(s2);
              })), n3.size >= 2;
            }
            findLooseFootnoteParagraphs(t3) {
              var r3, n3;
              const o2 = Array.from(t3.querySelectorAll("p")), i2 = o2.length > 0 && null !== (r3 = o2[o2.length - 1].parentElement) && void 0 !== r3 ? r3 : t3, s2 = Array.from(i2.children);
              for (let e3 = s2.length - 1; e3 >= 0; e3--) {
                if ("hr" !== s2[e3].tagName.toLowerCase()) continue;
                const r4 = [];
                for (let t4 = e3 + 1; t4 < s2.length; t4++) {
                  const e4 = this.parseFootnoteNum(s2[t4]);
                  null !== e4 && r4.push({ num: e4, el: s2[t4] });
                }
                if (r4.length >= 2 && this.crossValidate(t3, r4)) return { paragraphs: r4, toRemove: s2.slice(e3) };
                break;
              }
              const a2 = [];
              let l2 = -1;
              for (let t4 = s2.length - 1; t4 >= 0; t4--) {
                const e3 = s2[t4], r4 = e3.tagName.toLowerCase();
                if ("p" === r4) {
                  const r5 = this.parseFootnoteNum(e3);
                  if (null !== r5) {
                    a2.unshift({ num: r5, el: e3 }), l2 = t4;
                    continue;
                  }
                  break;
                }
                if ("ul" !== r4 && "ol" !== r4 && "blockquote" !== r4) break;
              }
              if (a2.length >= 2 && this.crossValidate(t3, a2)) {
                const t4 = s2.slice(l2), r4 = a2[0].el.previousElementSibling;
                if (r4) {
                  const o3 = r4.tagName.toLowerCase();
                  /^h[1-6]$/.test(o3) && e2.FOOTNOTE_SECTION_RE.test((null === (n3 = r4.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "") && t4.unshift(r4);
                }
                return { paragraphs: a2, toRemove: t4 };
              }
              const c2 = [];
              for (let t4 = Math.floor(o2.length / 2); t4 < o2.length; t4++) {
                const e3 = this.parseFootnoteNum(o2[t4]);
                null !== e3 && c2.push({ num: e3, el: o2[t4] });
              }
              return c2.length >= 2 && this.crossValidate(t3, c2) ? { paragraphs: c2, toRemove: c2.map(((t4) => t4.el)) } : null;
            }
            isBackrefLink(t3) {
              var e3, r3, n3;
              if ("a" !== (null === (e3 = t3.tagName) || void 0 === e3 ? void 0 : e3.toLowerCase())) return false;
              const o2 = (null === (r3 = t3.textContent) || void 0 === r3 ? void 0 : r3.trim().replace(/\uFE0E|\uFE0F/g, "")) || "";
              if (a.test(o2) || (null === (n3 = t3.classList) || void 0 === n3 ? void 0 : n3.contains("footnote-backref"))) return true;
              const i2 = t3.getAttribute("href") || "";
              return l.test(i2);
            }
            removeBackrefs(t3) {
              for (t3.querySelectorAll("a").forEach(((t4) => {
                var e3;
                if (this.isBackrefLink(t4)) {
                  const r3 = t4.parentElement;
                  "sup" === (null === (e3 = null == r3 ? void 0 : r3.tagName) || void 0 === e3 ? void 0 : e3.toLowerCase()) && 1 === r3.children.length ? r3.remove() : t4.remove();
                }
              })); t3.firstChild && 3 === t3.firstChild.nodeType; ) {
                const e3 = t3.firstChild.textContent;
                if (!(e3 && /^[\s\^,.;]*$/.test(e3) && e3.includes("^"))) break;
                t3.firstChild.remove();
              }
              for (; t3.lastChild && 3 === t3.lastChild.nodeType; ) {
                const e3 = t3.lastChild.textContent;
                if (!/^[\s,.;]*$/.test(e3)) break;
                t3.lastChild.remove();
              }
            }
            getChildAnchorId(t3) {
              const e3 = t3.querySelector("a[id], a[name]");
              return e3 ? (e3.id || e3.getAttribute("name") || "").toLowerCase() : "";
            }
            extractListItemIdAndContent(t3) {
              var e3, r3;
              const n3 = t3.querySelector(".citations");
              if (null === (e3 = null == n3 ? void 0 : n3.id) || void 0 === e3 ? void 0 : e3.toLowerCase().startsWith("r")) return { id: n3.id.toLowerCase(), content: n3.querySelector(".citation-content") || null };
              const o2 = (t3.id || "").toLowerCase();
              for (const e4 of ["bib.bib", "fn:", "fn"]) if (o2.startsWith(e4)) return { id: o2.slice(e4.length), content: t3 };
              if (t3.hasAttribute("data-counter")) {
                return { id: (t3.getAttribute("data-counter") || "").replace(/\.$/, "").toLowerCase(), content: t3 };
              }
              const i2 = null === (r3 = o2.split("/").pop()) || void 0 === r3 ? void 0 : r3.match(/cite_note-(.+)/);
              return { id: i2 ? i2[1] : o2, content: t3 };
            }
            findMatchingFootnoteElements(t3, e3) {
              const r3 = [], n3 = /* @__PURE__ */ new Set();
              return t3.querySelectorAll("li, p, div").forEach(((t4) => {
                let o2 = "";
                if (t4.id && e3.has(t4.id.toLowerCase())) o2 = t4.id.toLowerCase();
                else if (!t4.id) {
                  const r4 = this.getChildAnchorId(t4);
                  r4 && e3.has(r4) && (o2 = r4);
                }
                o2 && !n3.has(o2) && (r3.push({ el: t4, id: o2 }), n3.add(o2));
              })), r3;
            }
            replaceContainerPreservingText(t3, e3) {
              let r3 = "", n3 = false;
              for (const e4 of t3.childNodes) (0, i.isTextNode)(e4) ? r3 += e4.textContent || "" : (0, i.isElement)(e4) && (n3 = true);
              if (r3 = r3.trim(), r3 && n3) {
                const n4 = t3.ownerDocument.createDocumentFragment();
                n4.appendChild(t3.ownerDocument.createTextNode(r3)), n4.appendChild(e3), t3.replaceWith(n4);
              } else t3.replaceWith(e3);
            }
            findOuterFootnoteContainer(t3) {
              var e3;
              let r3 = t3, n3 = t3.parentElement;
              for (; n3; ) {
                const t4 = n3.tagName.toLowerCase();
                if ("span" !== t4 && "sup" !== t4) break;
                if ("span" === t4) {
                  let t5 = false;
                  for (const o2 of n3.childNodes) if (o2 !== r3) {
                    if ((0, i.isTextNode)(o2) && (null === (e3 = o2.textContent) || void 0 === e3 ? void 0 : e3.trim())) {
                      t5 = true;
                      break;
                    }
                    if ((0, i.isElement)(o2) && "sup" !== o2.tagName.toLowerCase()) {
                      t5 = true;
                      break;
                    }
                  }
                  if (t5) break;
                }
                r3 = n3, n3 = n3.parentElement;
              }
              return r3;
            }
            createFootnoteReference(t3, e3) {
              const r3 = this.doc.createElement("sup");
              r3.id = e3;
              const n3 = this.doc.createElement("a");
              return n3.href = `#fn:${t3}`, n3.textContent = t3, r3.appendChild(n3), r3;
            }
            collectInlineSidenotes(t3) {
              const e3 = {}, r3 = t3.querySelectorAll("span.footnote-container, span.sidenote-container, span.inline-footnote");
              if (0 === r3.length) {
                const r4 = t3.querySelectorAll("label.footref");
                if (r4.length > 0) {
                  let n4 = 1;
                  return r4.forEach(((t4) => {
                    var r5, o2, i2;
                    let s2 = t4.nextElementSibling;
                    if ("INPUT" === (null == s2 ? void 0 : s2.tagName) && (null === (r5 = s2.classList) || void 0 === r5 ? void 0 : r5.contains("footref-toggle")) && (s2 = s2.nextElementSibling), !s2 || "SPAN" !== s2.tagName || !(null === (o2 = s2.classList) || void 0 === o2 ? void 0 : o2.contains("sidenote"))) return;
                    const a2 = s2.cloneNode(true), l2 = a2.querySelector("sup");
                    l2 && a2.firstChild === l2 && l2.remove(), e3[n4] = { content: a2, originalId: String(n4), refs: [`fnref:${n4}`] };
                    const c2 = this.createFootnoteReference(String(n4), `fnref:${n4}`), u2 = t4.nextElementSibling;
                    "INPUT" === (null == u2 ? void 0 : u2.tagName) && (null === (i2 = u2.classList) || void 0 === i2 ? void 0 : i2.contains("footref-toggle")) && u2.remove(), s2.remove(), t4.replaceWith(c2), n4++;
                  })), t3.querySelectorAll("footer").forEach(((t4) => {
                    t4.querySelector(".footdef") && t4.remove();
                  })), e3;
                }
                return t3.querySelectorAll("span.sidenote").forEach(((t4) => {
                  t4.remove();
                })), e3;
              }
              let n3 = 1;
              return r3.forEach(((t4) => {
                const r4 = t4.querySelector("span.footnote, span.sidenote, span.footnoteContent");
                if (!r4) return;
                e3[n3] = { content: r4.cloneNode(true), originalId: String(n3), refs: [`fnref:${n3}`] };
                const o2 = this.createFootnoteReference(String(n3), `fnref:${n3}`);
                t4.replaceWith(o2), n3++;
              })), e3;
            }
            collectSidenotesColumn(t3) {
              const e3 = {};
              let r3 = Array.from(t3.querySelectorAll(".sidenotes-column"));
              if (0 === r3.length) {
                let e4 = t3.parentElement;
                for (let t4 = 0; t4 < 3 && e4 && 0 === r3.length; t4++) r3 = Array.from(e4.querySelectorAll(":scope > .sidenotes-column")), e4 = e4.parentElement;
              }
              if (0 === r3.length) return e3;
              let n3 = 1;
              return r3.forEach(((t4) => {
                t4.querySelectorAll(".sidenote[id]").forEach(((t5) => {
                  var r4;
                  const o2 = t5.id;
                  if (!o2) return;
                  const s2 = t5.querySelector(".sidenote__id"), a2 = null === (r4 = null == s2 ? void 0 : s2.textContent) || void 0 === r4 ? void 0 : r4.replace(/\D/g, ""), l2 = a2 ? parseInt(a2, 10) : n3, c2 = this.doc.createElement("div");
                  Array.from(t5.childNodes).forEach(((t6) => {
                    var e4, r5, n4;
                    if ((0, i.isElement)(t6)) {
                      if (null === (e4 = t6.classList) || void 0 === e4 ? void 0 : e4.contains("sidenote__id")) return;
                      if (null === (r5 = t6.classList) || void 0 === r5 ? void 0 : r5.contains("sidenote__label")) return;
                      if (null === (n4 = t6.classList) || void 0 === n4 ? void 0 : n4.contains("sn-backref")) return;
                    }
                    c2.appendChild(t6.cloneNode(true));
                  })), this.removeBackrefs(c2), e3[l2] = { content: c2, originalId: o2.toLowerCase(), refs: [] }, n3++;
                })), t4.remove();
              })), e3;
            }
            collectAsideFootnotes(t3) {
              const e3 = {}, r3 = Array.from(t3.querySelectorAll("aside > ol[start]"));
              return 0 === r3.length || r3.forEach(((t4) => {
                const r4 = t4.parentElement, n3 = parseInt(t4.getAttribute("start") || "", 10);
                if (isNaN(n3) || n3 < 1) return;
                const i2 = Array.from(t4.querySelectorAll("li"));
                if (0 === i2.length) return;
                const s2 = this.doc.createElement("div");
                1 === i2.length ? (0, o.transferContent)(i2[0].cloneNode(true), s2) : i2.forEach(((t5) => {
                  const e4 = this.doc.createElement("p");
                  (0, o.transferContent)(t5.cloneNode(true), e4), s2.appendChild(e4);
                })), e3[n3] = { content: s2, originalId: String(n3), refs: [] }, r4.remove();
              })), e3;
            }
            collectHiddenAsideFootnotes(t3) {
              const e3 = {}, r3 = Array.from(t3.querySelectorAll("span[data-definition]"));
              if (0 === r3.length) return e3;
              const n3 = /* @__PURE__ */ new Map();
              t3.querySelectorAll("aside[id]").forEach(((t4) => {
                n3.set(t4.id, t4);
              }));
              let i2 = 1;
              return r3.forEach(((t4) => {
                const r4 = t4.getAttribute("data-definition");
                if (!r4) return;
                const s2 = n3.get(r4);
                if (!s2) return;
                const a2 = this.doc.createElement("div");
                (0, o.transferContent)(s2, a2), s2.remove();
                const l2 = String(i2), c2 = `fnref:${l2}`;
                e3[i2] = { content: a2, originalId: r4.toLowerCase(), refs: [c2] }, t4.replaceWith(this.createFootnoteReference(l2, c2)), i2++;
              })), e3;
            }
            standardizeFootnotes(t3) {
              const e3 = this.collectInlineSidenotes(t3), r3 = this.collectHiddenAsideFootnotes(t3);
              this.mergeFootnotes(r3, this.collectFootnotes(t3)), this.mergeFootnotes(r3, this.collectSidenotesColumn(t3)), this.mergeFootnotes(r3, this.collectAsideFootnotes(t3));
              const o2 = t3.querySelectorAll(n2.FOOTNOTE_INLINE_REFERENCES), i2 = /* @__PURE__ */ new Map(), a2 = /* @__PURE__ */ new Map();
              Object.entries(r3).forEach((([t4, e4]) => {
                a2.set(e4.originalId.toLowerCase(), [t4, e4]);
              })), o2.forEach(((t4) => {
                var e4, r4;
                if (!t4 || !t4.parentNode) return;
                if (!(null === (e4 = t4.textContent) || void 0 === e4 ? void 0 : e4.trim())) return;
                if (t4.matches("cite.ltx_cite")) {
                  const e5 = [];
                  if (t4.querySelectorAll("a").forEach(((t5) => {
                    var r5;
                    const n4 = t5.getAttribute("href");
                    if (!n4) return;
                    const o3 = null === (r5 = n4.split("/").pop()) || void 0 === r5 ? void 0 : r5.match(/bib\.bib(\d+)/);
                    if (!o3) return;
                    const i3 = a2.get(o3[1].toLowerCase());
                    if (!i3) return;
                    const [s2, l3] = i3, c2 = this.makeRefId(s2, l3.refs.length);
                    l3.refs.push(c2), e5.push(this.createFootnoteReference(s2, c2));
                  })), e5.length > 0) {
                    const r5 = this.findOuterFootnoteContainer(t4), n4 = t4.ownerDocument.createDocumentFragment();
                    e5.forEach(((e6, r6) => {
                      r6 > 0 && n4.appendChild(t4.ownerDocument.createTextNode(" ")), n4.appendChild(e6);
                    })), r5.replaceWith(n4);
                  }
                  return;
                }
                let n3 = "";
                for (const { selector: e5, extract: r5 } of d) if (t4.matches(e5)) {
                  n3 = r5(t4);
                  break;
                }
                if (!n3) {
                  const e5 = t4.getAttribute("href");
                  e5 && (n3 = e5.replace(/^[#]/, "").toLowerCase());
                }
                if (n3) {
                  const e5 = a2.get(n3.toLowerCase());
                  if (e5) {
                    const [n4, o3] = e5, s2 = this.findOuterFootnoteContainer(t4), a3 = "sup" === s2.tagName.toLowerCase();
                    if (a3 && (null === (r4 = i2.get(s2)) || void 0 === r4 ? void 0 : r4.some(((t5) => t5.footnoteNumber === n4)))) return;
                    const l3 = this.makeRefId(n4, o3.refs.length);
                    o3.refs.push(l3), a3 ? (i2.has(s2) || i2.set(s2, []), i2.get(s2).push({ footnoteNumber: n4, refId: l3 })) : this.replaceContainerPreservingText(s2, this.createFootnoteReference(n4, l3));
                  }
                }
              }));
              const l2 = Object.entries(r3).filter((([t4, e4]) => 0 === e4.refs.length));
              if (l2.length > 0) {
                const e4 = /* @__PURE__ */ new Map(), n3 = /* @__PURE__ */ new Map();
                l2.forEach((([t4, r4]) => {
                  e4.set(r4.originalId, [t4, r4]), n3.set(t4, [t4, r4]);
                }));
                const o3 = (t4) => t4.closest('[id^="fnref:"]') || t4.closest("#footnotes") || this.pendingRemovals.some(((e5) => e5.contains(t4))), i3 = (t4, e5) => {
                  const [r4, n4] = e5, o4 = this.makeRefId(r4, n4.refs.length);
                  n4.refs.push(o4);
                  const i4 = this.findOuterFootnoteContainer(t4);
                  this.replaceContainerPreservingText(i4, this.createFootnoteReference(r4, o4));
                };
                t3.querySelectorAll('a[href*="#"]').forEach(((t4) => {
                  var r4;
                  if (!t4.parentNode || o3(t4)) return;
                  const n4 = u(t4);
                  if (!n4) return;
                  const s2 = e4.get(n4);
                  if (!s2) return;
                  const a3 = (null === (r4 = t4.textContent) || void 0 === r4 ? void 0 : r4.trim()) || "";
                  c.test(a3) && i3(t4, s2);
                }));
                Object.values(r3).some(((t4) => 0 === t4.refs.length)) && t3.querySelectorAll("sup, span.footnote-ref").forEach(((t4) => {
                  var r4, o4;
                  if (!t4.parentNode || (null === (r4 = t4.id) || void 0 === r4 ? void 0 : r4.startsWith("fnref:")) || t4.closest("#footnotes")) return;
                  const s2 = ((null === (o4 = t4.textContent) || void 0 === o4 ? void 0 : o4.trim()) || "").match(c);
                  if (!s2) return;
                  const a3 = n3.get(s2[1]) || e4.get(s2[1]);
                  !a3 || a3[1].refs.length > 0 || i3(t4, a3);
                }));
              }
              i2.forEach(((t4, e4) => {
                const r4 = this.doc.createDocumentFragment();
                t4.forEach((({ footnoteNumber: t5, refId: e5 }) => {
                  r4.appendChild(this.createFootnoteReference(t5, e5));
                })), e4.replaceWith(r4);
              }));
              const h2 = this.doc.createElement("div");
              h2.id = "footnotes";
              const m = this.doc.createElement("ol"), f = Object.assign(Object.assign({}, e3), r3);
              Object.entries(f).forEach((([t4, e4]) => {
                m.appendChild(this.createFootnoteItem(parseInt(t4), e4.content, e4.refs));
              })), t3.querySelectorAll(n2.FOOTNOTE_LIST_SELECTORS).forEach(((t4) => t4.remove())), this.pendingRemovals.forEach(((t4) => {
                t4.parentNode && t4.remove();
              })), (0, s.removeOrphanedDividers)(t3), m.children.length > 0 && (h2.appendChild(m), t3.appendChild(h2));
            }
          }
        }, 7864(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.headingRules = void 0, e2.removePermalinkAnchors = function(t3) {
            Array.from(t3.querySelectorAll("h1 a, h2 a, h3 a, h4 a, h5 a, h6 a, a.permalink, a.anchor-link, a.heading-anchor")).forEach(((t4) => {
              o(t4) && t4.remove();
            }));
          }, e2.isPermalinkAnchor = o;
          const n2 = r2(2640);
          function o(t3) {
            if ("a" !== t3.tagName.toLowerCase()) return false;
            const e3 = t3.getAttribute("href") || "", r3 = (t3.getAttribute("title") || "").toLowerCase(), n3 = (t3.getAttribute("class") || "").toLowerCase(), o2 = (t3.textContent || "").trim();
            if (e3.startsWith("#")) return true;
            if (r3.includes("permalink")) return true;
            return !!(n3.includes("permalink") || n3.includes("heading-anchor") || n3.includes("anchor-link")) || !!/^[#\xb6\xa7\ud83d\udd17\uFEFF]$/.test(o2);
          }
          e2.headingRules = [{ selector: "h1, h2, h3, h4, h5, h6", element: "keep", transform: (t3) => {
            var e3, r3;
            const i = t3.ownerDocument;
            if (!i) return t3;
            const s = i.createElement(t3.tagName);
            if (Array.from(t3.attributes).forEach(((t4) => {
              n2.ALLOWED_ATTRIBUTES.has(t4.name) && s.setAttribute(t4.name, t4.value);
            })), !t3.children.length) return s.textContent = (null === (e3 = t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "", s;
            const a = t3.cloneNode(true), l = /* @__PURE__ */ new Map(), c = [];
            Array.from(a.querySelectorAll("*")).forEach(((t4) => {
              var e4, r4, n3, i2;
              if (!(function(t5) {
                const e5 = t5.tagName.toLowerCase();
                return "button" === e5 || !("a" !== e5 || !o(t5)) || !(!t5.classList.contains("anchor") && !t5.classList.contains("permalink-widget")) || !("span" !== e5 && "div" !== e5 || !Array.from(t5.querySelectorAll("a")).some(((t6) => o(t6))));
              })(t4)) return;
              l.set(t4, (null === (e4 = t4.textContent) || void 0 === e4 ? void 0 : e4.trim()) || "");
              const s2 = t4.parentElement;
              s2 && s2 !== a && (null === (r4 = s2.textContent) || void 0 === r4 ? void 0 : r4.trim()) === (null === (n3 = t4.textContent) || void 0 === n3 ? void 0 : n3.trim()) && l.set(s2, (null === (i2 = t4.textContent) || void 0 === i2 ? void 0 : i2.trim()) || ""), c.push(t4);
            })), c.forEach(((t4) => t4.remove()));
            let u = (null === (r3 = a.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
            return !u && l.size > 0 && (u = Array.from(l.values())[0]), s.textContent = u, s;
          } }];
        }, 2649(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.imageRules = void 0, e2.isBase64Placeholder = b;
          const n2 = r2(2552), o = r2(639), i = r2(2640), s = /^data:image\/([^;]+);base64,/, a = /\.(jpg|jpeg|png|webp)\s+\d/, l = /^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/, c = /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i, u = /\s(\d+)w/, d = /dpr=(\d+(?:\.\d+)?)/, h = /^([^\s]+)/, m = /^https?:\/\//, f = /^[\w\-\.\/\\]+\.(jpg|jpeg|png|gif|webp|svg)$/i, p = /^\d{4}-\d{2}-\d{2}$/;
          function g(t3, e3, r3) {
            const i2 = r3.createElement("figure");
            i2.appendChild(t3.cloneNode(true));
            const s2 = r3.createElement("figcaption"), a2 = (function(t4) {
              const e4 = [], r4 = /* @__PURE__ */ new Set(), i3 = (t5) => {
                var o2;
                if ((0, n2.isTextNode)(t5)) {
                  const n3 = (null === (o2 = t5.textContent) || void 0 === o2 ? void 0 : o2.trim()) || "";
                  n3 && !r4.has(n3) && (e4.push(n3), r4.add(n3));
                } else if ((0, n2.isElement)(t5)) {
                  const e5 = t5.childNodes;
                  for (let t6 = 0; t6 < e5.length; t6++) i3(e5[t6]);
                }
              }, s3 = t4.childNodes;
              for (let t5 = 0; t5 < s3.length; t5++) i3(s3[t5]);
              if (e4.length > 0) return e4.join(" ");
              return (0, o.serializeHTML)(t4);
            })(e3);
            return s2.appendChild((0, o.parseHTML)(r3, a2)), i2.appendChild(s2), i2;
          }
          function v(t3, e3) {
            e3.setAttribute("srcset", t3);
            const r3 = q(t3);
            r3 && C(r3) && e3.setAttribute("src", r3);
          }
          function y(t3, e3, r3) {
            for (let n3 = 0; n3 < t3.attributes.length; n3++) {
              const o2 = t3.attributes[n3];
              r3.includes(o2.name) || e3.setAttribute(o2.name, o2.value);
            }
          }
          function b(t3) {
            const e3 = t3.match(s);
            if (!e3) return false;
            if ("svg+xml" === e3[1]) return false;
            const r3 = e3[0].length;
            return t3.length - r3 < 133;
          }
          function x(t3) {
            return t3.startsWith("data:image/svg+xml");
          }
          function C(t3) {
            return !t3.startsWith("data:") && (!(!t3 || "" === t3.trim()) && (c.test(t3) || t3.includes("image") || t3.includes("img") || t3.includes("photo")));
          }
          function S(t3) {
            if (E(t3)) return true;
            return t3.querySelectorAll("img, video, picture, source").length > 0;
          }
          function E(t3) {
            const e3 = t3.tagName.toLowerCase();
            return "img" === e3 || "video" === e3 || "picture" === e3 || "source" === e3;
          }
          function A(t3) {
            if (E(t3)) return t3;
            const e3 = t3.querySelectorAll("picture");
            if (e3.length > 0) return e3[0];
            const r3 = t3.querySelectorAll("img"), n3 = [];
            for (let t4 = 0; t4 < r3.length; t4++) {
              const e4 = r3[t4], o3 = e4.getAttribute("src") || "", i3 = e4.getAttribute("alt") || "";
              x(o3) || (b(o3) || !i3.trim() && r3.length > 1 || n3.push(e4));
            }
            if (n3.length > 0) return n3[0];
            const o2 = t3.querySelectorAll("video");
            if (o2.length > 0) return o2[0];
            const i2 = t3.querySelectorAll("source");
            if (i2.length > 0) return i2[0];
            const s2 = t3.querySelectorAll("img, picture, source, video");
            return s2.length > 0 ? s2[0] : null;
          }
          function w(t3) {
            var e3, r3, n3, o2;
            const i2 = t3.querySelector("figcaption");
            if (i2) return i2;
            const s2 = /* @__PURE__ */ new Set(), a2 = ['[class*="caption"]', '[class*="description"]', '[class*="alt"]', '[class*="title"]', '[class*="credit"]', '[class*="text"]', '[class*="post-thumbnail-text"]', '[class*="image-caption"]', '[class*="photo-caption"]', "[aria-label]", "[title]"].join(", "), l2 = t3.querySelectorAll(a2);
            for (let t4 = 0; t4 < l2.length; t4++) {
              const r4 = l2[t4];
              if (E(r4)) continue;
              const n4 = null === (e3 = r4.textContent) || void 0 === e3 ? void 0 : e3.trim();
              if (n4 && n4.length > 0 && !s2.has(n4)) return s2.add(n4), r4;
            }
            const c2 = t3.querySelector("img");
            if (c2 && c2.hasAttribute("alt")) {
              const e4 = c2.getAttribute("alt");
              if (e4 && e4.trim().length > 0) {
                const r4 = t3.ownerDocument.createElement("div");
                return r4.textContent = e4, r4;
              }
            }
            if (t3.parentElement) {
              const e4 = t3.parentElement.children;
              for (let n4 = 0; n4 < e4.length; n4++) {
                const o3 = e4[n4];
                if (o3 === t3) continue;
                if (Array.from(o3.classList).some(((t4) => t4.includes("caption") || t4.includes("credit") || t4.includes("text") || t4.includes("description")))) {
                  const t4 = null === (r3 = o3.textContent) || void 0 === r3 ? void 0 : r3.trim();
                  if (t4 && t4.length > 0) return o3;
                }
              }
            }
            const u2 = t3.querySelectorAll("img");
            for (let t4 = 0; t4 < u2.length; t4++) {
              const e4 = u2[t4];
              if (!e4.parentElement) continue;
              let r4 = e4.nextElementSibling;
              for (; r4; ) {
                if (["EM", "STRONG", "SPAN", "I", "B", "SMALL", "CITE"].includes(r4.tagName)) {
                  const t5 = null === (n3 = r4.textContent) || void 0 === n3 ? void 0 : n3.trim();
                  if (t5 && t5.length > 0) return r4;
                }
                r4 = r4.nextElementSibling;
              }
            }
            for (let t4 = 0; t4 < u2.length; t4++) {
              const e4 = u2[t4], r4 = e4.parentElement;
              if (!r4) continue;
              const n4 = r4.querySelectorAll("em, strong, span, i, b, small, cite");
              for (let t5 = 0; t5 < n4.length; t5++) {
                const r5 = n4[t5];
                if (r5 === e4) continue;
                const i3 = null === (o2 = r5.textContent) || void 0 === o2 ? void 0 : o2.trim();
                if (i3 && i3.length > 0) return r5;
              }
            }
            return null;
          }
          function T(t3) {
            var e3;
            const r3 = (null === (e3 = t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
            return !(r3.length < 10 || r3.startsWith("http://") || r3.startsWith("https://")) && (!f.test(r3) && (!r3.match(/^\d+$/) && !p.test(r3)));
          }
          function _(t3, e3) {
            const r3 = t3.tagName.toLowerCase();
            if ("img" === r3) return L(t3, e3);
            if ("picture" === r3) {
              const r4 = t3.querySelector("img");
              return r4 ? L(r4, e3) : t3.cloneNode(true);
            }
            return "source" === r3 ? (function(t4, e4) {
              const r4 = e4.createElement("img"), n3 = t4.getAttribute("srcset");
              n3 && v(n3, r4);
              const o2 = t4.parentElement;
              if (o2) {
                const t5 = o2.querySelectorAll("img"), e5 = [];
                for (let r5 = 0; r5 < t5.length; r5++) {
                  const n4 = t5[r5], o3 = n4.getAttribute("src") || "";
                  b(o3) || x(o3) || "" === o3 || e5.push(n4);
                }
                if (e5.length > 0) {
                  if (y(e5[0], r4, ["src", "srcset"]), !r4.hasAttribute("src") || !C(r4.getAttribute("src") || "")) {
                    const t6 = e5[0].getAttribute("src");
                    t6 && C(t6) && r4.setAttribute("src", t6);
                  }
                } else {
                  const t6 = o2.querySelector("img[data-src]");
                  if (t6 && (y(t6, r4, ["src", "srcset"]), !r4.hasAttribute("src") || !C(r4.getAttribute("src") || ""))) {
                    const e6 = t6.getAttribute("data-src");
                    e6 && C(e6) && r4.setAttribute("src", e6);
                  }
                }
              }
              return r4;
            })(t3, e3) : t3.cloneNode(true);
          }
          function L(t3, e3) {
            const r3 = t3.getAttribute("src") || "";
            if (b(r3) || x(r3)) {
              const r4 = t3.parentElement;
              if (r4) {
                const n3 = r4.querySelectorAll("source"), o2 = [];
                for (let t4 = 0; t4 < n3.length; t4++) {
                  const e4 = n3[t4];
                  e4.hasAttribute("data-srcset") && "" !== e4.getAttribute("data-srcset") && o2.push(e4);
                }
                if (o2.length > 0) {
                  const r5 = e3.createElement("img"), n4 = t3.getAttribute("data-src");
                  return n4 && !x(n4) && r5.setAttribute("src", n4), y(t3, r5, ["src"]), r5;
                }
              }
            }
            return t3.cloneNode(true);
          }
          function q(t3) {
            if (!t3 || !t3.trim()) return null;
            const e3 = t3.trim(), r3 = /(.+?)\s+(\d+(?:\.\d+)?[wx])/g;
            let n3, o2 = 0;
            for (; null !== (n3 = r3.exec(e3)); ) {
              let t4 = n3[1].trim();
              if (o2 > 0 && (t4 = t4.replace(/^,\s*/, "")), o2 = r3.lastIndex, t4 && !x(t4)) return t4;
            }
            const i2 = e3.match(h);
            return i2 && i2[1] && !x(i2[1]) ? i2[1] : null;
          }
          function N(t3) {
            if (0 === t3.length) return null;
            if (1 === t3.length) return t3[0];
            for (let e4 = 0; e4 < t3.length; e4++) if (!t3[e4].hasAttribute("media")) return t3[e4];
            let e3 = null, r3 = 0;
            for (let n3 = 0; n3 < t3.length; n3++) {
              const o2 = t3[n3], i2 = o2.getAttribute("srcset");
              if (!i2) continue;
              const s2 = i2.match(u), a2 = i2.match(d);
              if (s2 && s2[1]) {
                const t4 = parseInt(s2[1], 10) * (a2 ? parseFloat(a2[1]) : 1);
                t4 > r3 && (r3 = t4, e3 = o2);
              }
            }
            return e3 || t3[0];
          }
          e2.imageRules = [{ selector: "picture", element: "picture", transform: (t3, e3) => {
            const r3 = t3.querySelectorAll("source"), n3 = t3.querySelector("img");
            if (!n3) {
              const n4 = N(r3);
              if (n4) {
                const r4 = n4.getAttribute("srcset");
                if (r4) {
                  const n5 = e3.createElement("img");
                  return v(r4, n5), t3.replaceChildren(n5), t3;
                }
              }
              return t3;
            }
            let o2 = null, i2 = null;
            if (r3.length > 0) {
              const t4 = N(r3);
              t4 && (o2 = t4.getAttribute("srcset"), o2 && (i2 = q(o2)));
            }
            if (o2 && n3.setAttribute("srcset", o2), i2 && C(i2)) n3.setAttribute("src", i2);
            else if (!n3.hasAttribute("src") || !C(n3.getAttribute("src") || "")) {
              const t4 = q(n3.getAttribute("srcset") || o2 || "");
              t4 && C(t4) && n3.setAttribute("src", t4);
            }
            return r3.forEach(((t4) => t4.remove())), t3;
          } }, { selector: "uni-image-full-width", element: "figure", transform: (t3, e3) => {
            var r3;
            const n3 = e3.createElement("figure"), i2 = e3.createElement("img"), s2 = t3.querySelector("img");
            if (!s2) return n3;
            let a2 = s2.getAttribute("src");
            const l2 = s2.getAttribute("data-loading");
            if (l2) try {
              const t4 = JSON.parse(l2);
              t4.desktop && C(t4.desktop) && (a2 = t4.desktop);
            } catch (t4) {
            }
            if (!a2 || !C(a2)) return n3;
            i2.setAttribute("src", a2);
            let c2 = s2.getAttribute("alt");
            c2 || (c2 = t3.getAttribute("alt-text")), c2 && i2.setAttribute("alt", c2), n3.appendChild(i2);
            const u2 = t3.querySelector("figcaption");
            if (u2) {
              const t4 = null === (r3 = u2.textContent) || void 0 === r3 ? void 0 : r3.trim();
              if (t4 && t4.length > 5) {
                const r4 = e3.createElement("figcaption"), i3 = u2.querySelector(".rich-text p");
                i3 ? (0, o.transferContent)(i3, r4) : r4.textContent = t4, n3.appendChild(r4);
              }
            }
            return n3;
          } }, { selector: 'img[data-src], img[data-srcset], img[loading="lazy"], img.lazy, img.lazyload, img[src^="data:image/svg+xml"]', element: "img", transform: (t3, e3) => {
            const r3 = t3.getAttribute("src") || "", n3 = (function(t4) {
              if (t4.hasAttribute("data-src") || t4.hasAttribute("data-srcset")) return true;
              for (let e4 = 0; e4 < t4.attributes.length; e4++) {
                const r4 = t4.attributes[e4];
                if ("src" !== r4.name) {
                  if (r4.name.startsWith("data-") && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(r4.value)) return true;
                  if (/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(r4.value)) return true;
                }
              }
              return false;
            })(t3);
            (b(r3) || x(r3)) && n3 && t3.removeAttribute("src");
            const o2 = t3.getAttribute("data-src");
            o2 && !t3.getAttribute("src") && t3.setAttribute("src", o2);
            const i2 = t3.getAttribute("data-srcset");
            i2 && !t3.getAttribute("srcset") && t3.setAttribute("srcset", i2);
            for (let e4 = 0; e4 < t3.attributes.length; e4++) {
              const r4 = t3.attributes[e4];
              if ("src" === r4.name || "srcset" === r4.name || "alt" === r4.name) continue;
              const n4 = r4.value.charAt(0);
              if ("{" !== n4 && "[" !== n4) {
                if (a.test(r4.value)) t3.setAttribute("srcset", r4.value);
                else if (l.test(r4.value)) {
                  const e5 = t3.getAttribute("src") || "", n5 = m.test(e5), o3 = m.test(r4.value);
                  n5 && !o3 || t3.setAttribute("src", r4.value);
                }
              }
            }
            return t3.classList.remove("lazy", "lazyload"), t3.removeAttribute("data-ll-status"), t3.removeAttribute("data-src"), t3.removeAttribute("data-srcset"), t3.removeAttribute("loading"), t3;
          } }, { selector: "span:has(img)", element: "span", transform: (t3, e3) => {
            try {
              if (!S(t3)) return t3;
              for (const e4 of t3.children) if (i.BLOCK_LEVEL_ELEMENTS.has(e4.tagName.toLowerCase())) return t3;
              const r3 = A(t3);
              if (!r3) return t3;
              const n3 = w(t3), o2 = _(r3, e3);
              if (n3 && T(n3)) {
                const t4 = g(o2, n3, e3);
                return n3.parentNode && n3.parentNode.removeChild(n3), t4;
              }
              return o2;
            } catch (e4) {
              return t3;
            }
          } }, { selector: 'figure, p:has([class*="caption"])', element: "figure", transform: (t3, e3) => {
            try {
              if (!S(t3)) return t3;
              const r3 = A(t3);
              if (!r3) return t3;
              const n3 = w(t3);
              if (n3 && T(n3)) {
                const o2 = A(t3);
                let i2;
                return i2 = o2 || _(r3, e3), g(i2, n3, e3);
              }
              return t3;
            } catch (e4) {
              return t3;
            }
          } }];
        }, 7282(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.LOOKS_LIKE_LATEX_RE = e2.mathSelectors = e2.mathFastCheck = e2.isBlockDisplay = e2.getBasicLatexFromElement = e2.getMathMLFromElement = e2.reconstructMathMLFromMjx = void 0, e2.extractLatexFromImageSrc = function(t3) {
            for (const e4 of g) {
              const r4 = t3.match(e4);
              if (r4) {
                const t4 = v(r4[1]);
                if (t4) return t4;
              }
            }
            const e3 = t3.match(/\?([^#]+)/);
            if (e3) {
              const t4 = v(e3[1]);
              if (t4) return t4;
            }
            const r3 = t3.split("?")[0].split("/");
            for (let t4 = r3.length - 1; t4 >= 0; t4--) if (/%5[Cc]/.test(r3[t4])) {
              const e4 = v(r3[t4]);
              if (e4) return e4;
            }
            return null;
          }, e2.wrapRawLatexDelimiters = function(t3, r3) {
            var n3, i2;
            if (!(function(t4) {
              const e3 = Array.from(t4.querySelectorAll("script[src]"));
              for (const t5 of e3) {
                const e4 = (t5.getAttribute("src") || "").toLowerCase();
                if (e4.includes("mathjax") || e4.includes("katex")) return true;
              }
              const r4 = Array.from(t4.querySelectorAll("script:not([src])"));
              for (const t5 of r4) {
                const e4 = t5.textContent || "";
                if (/MathJax\s*[.=]/.test(e4) || /katex/i.test(e4)) return true;
              }
              return false;
            })(r3)) return;
            if (t3.querySelector(e2.mathFastCheck)) return;
            const s2 = [];
            !(function t4(e3) {
              if (!(0, o.isElement)(e3) || !C.has(e3.tagName)) if ((0, o.isTextNode)(e3)) s2.push(e3);
              else for (let r4 = e3.firstChild; r4; r4 = r4.nextSibling) t4(r4);
            })(t3);
            for (const t4 of s2) {
              const e3 = t4.textContent || "";
              if (!e3.includes("$") && !e3.includes("\\(") && !e3.includes("\\[")) continue;
              const s3 = [];
              let l2, c2 = 0, u2 = false;
              for (y.lastIndex = 0; null !== (l2 = y.exec(e3)); ) {
                const t5 = null !== (n3 = l2[1]) && void 0 !== n3 ? n3 : l2[2], r4 = null !== (i2 = l2[3]) && void 0 !== i2 ? i2 : l2[4], o2 = void 0 !== t5, d3 = (null != t5 ? t5 : r4).trim();
                (void 0 !== l2[2] || void 0 !== l2[4] || (a2 = d3, b.test(a2) || x.test(a2))) && (c2 < l2.index && s3.push(e3.slice(c2, l2.index)), o2 && (u2 = true), s3.push({ latex: d3, isBlock: o2 }), c2 = l2.index + l2[0].length);
              }
              if (0 === s3.length) continue;
              if (c2 < e3.length && s3.push(e3.slice(c2)), u2) {
                const e4 = s3.some(((t5) => "string" == typeof t5 && t5.trim().length > 0)), r4 = t4.parentElement, n4 = !!r4 && Array.from(r4.childNodes).some(((e5) => e5 !== t4 && ((0, o.isTextNode)(e5) && (e5.textContent || "").trim().length > 0 || (0, o.isElement)(e5))));
                if (e4 || n4) for (const t5 of s3) "string" != typeof t5 && (t5.isBlock = false);
              }
              const d2 = r3.createDocumentFragment();
              for (const t5 of s3) if ("string" == typeof t5) d2.appendChild(r3.createTextNode(t5));
              else {
                const e4 = r3.createElement("math");
                e4.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML"), e4.setAttribute("display", t5.isBlock ? "block" : "inline"), e4.setAttribute("data-latex", t5.latex), e4.textContent = t5.latex, d2.appendChild(e4);
              }
              t4.replaceWith(d2);
            }
            var a2;
          };
          const n2 = r2(639), o = r2(2552), i = /[\u2061\u2062\u2063\u2064]/g, s = (t3) => t3.normalize("NFKC").replace(i, ""), a = /* @__PURE__ */ new Set(["mi", "mo", "mn", "mtext", "ms", "mspace", "mglyph"]), l = /* @__PURE__ */ new Set(["mrow", "mstyle", "mpadded", "mphantom", "menclose", "merror", "mtable", "mtr", "mtd", "mlabeledtr"]), c = /* @__PURE__ */ new Set(["mjx-nstrut", "mjx-dstrut", "mjx-strut", "mjx-line", "mjx-spacer", "mjx-break", "mjx-mark"]), u = (t3, e3) => {
            for (const r3 of Array.from(t3.children)) if (r3.tagName.toLowerCase() === e3) return r3;
            return null;
          }, d = (t3, e3, r3) => {
            if (!t3) return [];
            const n3 = [];
            for (const o2 of Array.from(t3.children)) o2 !== r3 && n3.push(...f(o2, e3));
            return n3;
          }, h = (t3, e3) => {
            if (1 === t3.length) return t3[0];
            const r3 = e3.createElement("mrow");
            return t3.forEach(((t4) => r3.appendChild(t4))), r3;
          }, m = (t3, e3, r3) => {
            const n3 = r3.createElement(t3);
            return e3.forEach(((t4) => n3.appendChild(t4))), n3;
          }, f = (t3, e3) => {
            const r3 = t3.tagName.toLowerCase();
            if ("mjx-c" === r3) {
              const r4 = s(t3.textContent || "");
              return r4 ? [e3.createTextNode(r4)] : [];
            }
            if (c.has(r3)) return [];
            if (!r3.startsWith("mjx-")) return [];
            const n3 = r3.slice(4);
            if (a.has(n3)) {
              const r4 = s(t3.textContent || "");
              if (!r4 && "mspace" !== n3) return [];
              const o2 = e3.createElement(n3);
              return r4 && (o2.textContent = r4), [o2];
            }
            if (l.has(n3)) return [m(n3, d(t3, e3), e3)];
            switch (n3) {
              case "mfrac": {
                const r4 = h(d(t3.querySelector("mjx-num"), e3), e3), n4 = h(d(t3.querySelector("mjx-den"), e3), e3);
                return [m("mfrac", [r4, n4], e3)];
              }
              case "msqrt": {
                const r4 = t3.querySelector("mjx-box");
                return [m("msqrt", d(r4 || t3, e3), e3)];
              }
              case "msub":
              case "msup": {
                const r4 = u(t3, "mjx-script"), o2 = h(d(t3, e3, r4), e3), i2 = h(d(r4, e3), e3);
                return [m(n3, [o2, i2], e3)];
              }
              case "msubsup": {
                const r4 = u(t3, "mjx-script"), n4 = h(d(t3, e3, r4), e3), o2 = d(r4, e3), i2 = o2.length > 1 ? o2[o2.length - 1] : o2[0] || e3.createElement("mrow"), s2 = o2.length > 1 ? o2[0] : e3.createElement("mrow");
                return [m("msubsup", [n4, i2, s2], e3)];
              }
              case "munder":
              case "mover":
              case "munderover": {
                const r4 = h(d(t3.querySelector("mjx-base"), e3), e3), o2 = t3.querySelector("mjx-under"), i2 = t3.querySelector("mjx-over");
                return "munder" === n3 ? [m("munder", [r4, h(d(o2, e3), e3)], e3)] : "mover" === n3 ? [m("mover", [r4, h(d(i2, e3), e3)], e3)] : [m("munderover", [r4, h(d(o2, e3), e3), h(d(i2, e3), e3)], e3)];
              }
              default:
                return d(t3, e3);
            }
          };
          e2.reconstructMathMLFromMjx = (t3, e3) => {
            const r3 = e3.createElement("math");
            r3.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
            for (const n4 of Array.from(t3.children)) for (const t4 of f(n4, e3)) r3.appendChild(t4);
            if (0 === r3.childNodes.length) return null;
            const n3 = "true" === t3.getAttribute("display");
            return n3 && r3.setAttribute("display", "block"), { mathml: r3.outerHTML, latex: null, isBlock: n3 };
          };
          const p = (t3) => {
            const e3 = t3.cloneNode(true);
            return ((t4) => {
              const e4 = t4.ownerDocument;
              if (!e4) return;
              const r3 = Array.from(t4.querySelectorAll("mtable"));
              for (const t5 of r3) {
                const r4 = Array.from(t5.children).filter(((t6) => {
                  const e5 = t6.tagName.toLowerCase();
                  return "mtr" === e5 || "mlabeledtr" === e5;
                }));
                if (1 !== r4.length) continue;
                const n3 = r4[0];
                if ("mlabeledtr" !== n3.tagName.toLowerCase()) continue;
                const o2 = Array.from(n3.children).filter(((t6) => "mtd" === t6.tagName.toLowerCase()));
                if (o2.length < 2) continue;
                const [i2, ...s2] = o2, a2 = e4.createElement("mrow");
                for (const t6 of s2) for (; t6.firstChild; ) a2.appendChild(t6.firstChild);
                if (i2.childNodes.length > 0) {
                  const t6 = e4.createElement("mspace");
                  for (t6.setAttribute("width", "2em"), a2.appendChild(t6); i2.firstChild; ) a2.appendChild(i2.firstChild);
                }
                t5.replaceWith(a2);
              }
            })(e3), e3.outerHTML;
          };
          e2.getMathMLFromElement = (t3) => {
            if ("math" === t3.tagName.toLowerCase()) {
              const e3 = "block" === t3.getAttribute("display");
              return { mathml: p(t3), latex: t3.getAttribute("alttext") || null, isBlock: e3 };
            }
            const r3 = t3.getAttribute("data-mathml");
            if (r3) {
              const e3 = t3.ownerDocument || document, o3 = (0, n2.parseHTML)(e3, r3).querySelector("math");
              if (o3) {
                const t4 = "block" === o3.getAttribute("display");
                return { mathml: p(o3), latex: o3.getAttribute("alttext") || null, isBlock: t4 };
              }
            }
            const o2 = t3.querySelector(".MJX_Assistive_MathML, mjx-assistive-mml");
            if (o2) {
              const t4 = o2.querySelector("math");
              if (t4) {
                const e3 = t4.getAttribute("display"), r4 = o2.getAttribute("display"), n3 = "block" === e3 || "block" === r4;
                return { mathml: p(t4), latex: t4.getAttribute("alttext") || null, isBlock: n3 };
              }
            }
            const i2 = t3.querySelector(".katex-mathml math");
            if (i2) return { mathml: p(i2), latex: null, isBlock: false };
            const s2 = "mjx-math" === t3.tagName.toLowerCase() ? t3 : t3.querySelector("mjx-math");
            if (s2) {
              const r4 = t3.ownerDocument || document, n3 = (0, e2.reconstructMathMLFromMjx)(s2, r4);
              if (n3) return n3;
            }
            return null;
          };
          e2.getBasicLatexFromElement = (t3) => {
            var e3, r3, n3, o2;
            const i2 = t3.getAttribute("data-latex");
            if (i2) return i2;
            const s2 = t3.getAttribute("data-math");
            if (s2) return s2;
            const a2 = (null === (e3 = t3.parentElement) || void 0 === e3 ? void 0 : e3.classList.contains("hurmet-tex")) ? t3.parentElement.getAttribute("data-entry") : null;
            if (a2) return a2;
            if ("img" === t3.tagName.toLowerCase() && t3.classList.contains("latex")) {
              const e4 = t3.getAttribute("alt");
              if (e4) return e4;
              const r4 = t3.getAttribute("src");
              if (r4) {
                const t4 = r4.match(/latex\.php\?latex=([^&]+)/);
                if (t4) return decodeURIComponent(t4[1]).replace(/\+/g, " ").replace(/%5C/g, "\\");
              }
            }
            const l2 = t3.querySelector('annotation[encoding="application/x-tex"]');
            if (null == l2 ? void 0 : l2.textContent) return l2.textContent.trim();
            if (t3.matches(".katex")) {
              const e4 = t3.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
              if (null == e4 ? void 0 : e4.textContent) return e4.textContent.trim();
            }
            if (t3.matches('script[type="math/tex"]') || t3.matches('script[type="math/tex; mode=display"]')) return (null === (r3 = t3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || null;
            if (t3.parentElement) {
              const e4 = t3.parentElement.querySelector('script[type="math/tex"], script[type="math/tex; mode=display"]');
              if (e4) return (null === (n3 = e4.textContent) || void 0 === n3 ? void 0 : n3.trim()) || null;
            }
            return "math" === t3.tagName.toLowerCase() && (null === (o2 = t3.textContent) || void 0 === o2 ? void 0 : o2.trim()) ? t3.textContent.trim() : t3.getAttribute("alt") || null;
          };
          e2.isBlockDisplay = (t3) => {
            if ("block" === t3.getAttribute("display")) return true;
            const e3 = (0, n2.getClassName)(t3).toLowerCase();
            if (e3.includes("display") || e3.includes("block")) return true;
            if (t3.closest('.katex-display, .MathJax_Display, [data-display="block"]')) return true;
            const r3 = t3.previousElementSibling;
            if ("p" === (null == r3 ? void 0 : r3.tagName.toLowerCase())) return true;
            if (t3.matches(".mwe-math-fallback-image-display")) return true;
            if (t3.matches(".katex")) return null !== t3.closest(".katex-display");
            if (t3.hasAttribute("display")) return "true" === t3.getAttribute("display");
            if (t3.matches('script[type="math/tex; mode=display"]')) return true;
            const o2 = t3.closest("[display]");
            return !!o2 && "true" === o2.getAttribute("display");
          }, e2.mathFastCheck = 'math, mjx-container, .MathJax, .katex, img.latex, [data-math], [data-latex], script[type^="math/"]', e2.mathSelectors = ['img.latex[src*="latex.php"]', "span.MathJax", "mjx-container", 'script[type="math/tex"]', 'script[type="math/tex; mode=display"]', '.MathJax_Preview + script[type="math/tex"]', ".MathJax_Display", ".MathJax_SVG", ".MathJax_MathML", ".mwe-math-element", ".mwe-math-fallback-image-inline", ".mwe-math-fallback-image-display", ".mwe-math-mathml-inline", ".mwe-math-mathml-display", ".katex", ".katex-display", ".katex-mathml", ".katex-html", "[data-katex]", 'script[type="math/katex"]', "math", "[data-math]", "[data-latex]", "[data-tex]", 'script[type^="math/"]', 'annotation[encoding="application/x-tex"]'].join(",");
          const g = ["latex", "chl", "tex", "eq", "math"].map(((t3) => new RegExp(`[?&]${t3}=([^&#]+)`, "i")));
          function v(t3) {
            try {
              const r3 = decodeURIComponent(t3.replace(/\+/g, " "));
              return e2.LOOKS_LIKE_LATEX_RE.test(r3) ? r3 : null;
            } catch (t4) {
              return null;
            }
          }
          e2.LOOKS_LIKE_LATEX_RE = /\\[a-zA-Z]{2,}/;
          const y = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^\s$][^$]*[^\s$]|[^\s$])\$|\\\(([\s\S]+?)\\\)/g, b = /\\[a-zA-Z]/, x = /[_^{}]/;
          const C = /* @__PURE__ */ new Set(["PRE", "CODE", "SCRIPT", "STYLE", "MATH", "SVG", "TEXTAREA"]);
        }, 6e3(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.mathRules = e2.createCleanMathEl = void 0;
          const n2 = r2(7282), o = r2(639);
          e2.createCleanMathEl = (t3, e3, r3, n3) => {
            const i = n3.createElement("math");
            if (i.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML"), i.setAttribute("display", r3 ? "block" : "inline"), i.setAttribute("data-latex", e3 || ""), null == t3 ? void 0 : t3.mathml) {
              const e4 = (0, o.parseHTML)(n3, t3.mathml).querySelector("math");
              e4 && (0, o.transferContent)(e4, i);
            } else e3 && (i.textContent = e3);
            return i;
          }, e2.mathRules = [{ selector: n2.mathSelectors, element: "math", fastCheck: n2.mathFastCheck, transform: (t3, r3) => {
            if (!(function(t4) {
              return "classList" in t4 && "getAttribute" in t4 && "querySelector" in t4;
            })(t3)) return t3;
            const o2 = (0, n2.getMathMLFromElement)(t3), i = (0, n2.getBasicLatexFromElement)(t3), s = (0, n2.isBlockDisplay)(t3), a = (0, e2.createCleanMathEl)(o2, i, s, r3);
            if (t3.parentElement && !t3.matches('script[type^="math/"]')) {
              t3.parentElement.querySelectorAll('script[type^="math/"], .MathJax_Preview, script[type="text/javascript"][src*="mathjax"], script[type="text/javascript"][src*="katex"]').forEach(((t4) => t4.remove()));
            }
            return a;
          } }];
        }, 1917(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.ExtractorRegistry = void 0;
          const n2 = r2(5959), o = r2(2248), i = r2(1064), s = r2(3258), a = r2(9759), l = r2(2458), c = r2(8632), u = r2(8397), d = r2(3020), h = r2(4732), m = r2(3588), f = r2(5666), p = r2(3055), g = r2(27), v = r2(6581), y = r2(8090), b = r2(2144), x = r2(8477), C = r2(9970), S = r2(5654), E = r2(4454), A = r2(1756), w = r2(7228), T = r2(7278), _ = r2(9964);
          class L {
            static initialize() {
              this.register({ patterns: ["x.com", "twitter.com"], extractor: i.XArticleExtractor }), this.register({ patterns: ["twitter.com", /\/x\.com\/.*/], extractor: o.TwitterExtractor }), this.register({ patterns: ["x.com", "twitter.com"], extractor: f.XOembedExtractor }), this.register({ patterns: ["reddit.com", "old.reddit.com", "new.reddit.com", /^https:\/\/[^\/]+\.reddit\.com/], extractor: n2.RedditExtractor }), this.register({ patterns: ["youtube.com", "youtu.be", /youtube\.com\/watch\?v=.*/, /youtu\.be\/.*/], extractor: s.YoutubeExtractor }), this.register({ patterns: ["bilibili.com", /www\.bilibili\.com\/video\/BV[0-9A-Za-z]+/], extractor: a.BilibiliExtractor }), this.register({ patterns: ["news.ycombinator.com"], extractor: l.HackerNewsExtractor }), this.register({ patterns: [/^https?:\/\/chatgpt\.com\/(c|share)\/.*/], extractor: c.ChatGPTExtractor }), this.register({ patterns: ["claude.ai", /^https?:\/\/claude\.ai\/(chat|share)\/.*/], extractor: u.ClaudeExtractor }), this.register({ patterns: [/^https?:\/\/grok\.com\/(chat|share)(\/.*)?$/], extractor: d.GrokExtractor }), this.register({ patterns: [/^https?:\/\/gemini\.google\.com\/app\/.*/], extractor: h.GeminiExtractor }), this.register({ patterns: ["github.com", /^https?:\/\/github\.com\/.*/], extractor: m.GitHubExtractor }), this.register({ patterns: ["linkedin.com"], extractor: x.LinkedInExtractor }), this.register({ patterns: ["threads.net", "www.threads.com", "threads.com"], extractor: C.ThreadsExtractor }), this.register({ patterns: ["bsky.app"], extractor: S.BlueskyExtractor }), this.register({ patterns: ["medium.com", /\.medium\.com/], extractor: A.MediumExtractor }), this.register({ patterns: ["wiki.c2.com"], extractor: g.C2WikiExtractor }), this.register({ patterns: [/^https?:\/\/substack\.com\/@[^/]+\/note\/.+/, /^https?:\/\/substack\.com\/home\/post\/p-\d+/, "substack.com"], extractor: v.SubstackExtractor }), this.register({ patterns: ["nytimes.com"], extractor: y.NytimesExtractor }), this.register({ patterns: ["wikipedia.org"], extractor: b.WikipediaExtractor }), this.register({ patterns: [/\/@[^/]+\/\d+/], extractor: _.MastodonExtractor }), this.register({ patterns: [/\/t\/[^/]+\/\d+/], extractor: E.DiscourseExtractor }), this.register({ patterns: ["leetcode.com"], extractor: w.LeetCodeExtractor }), this.register({ patterns: ["lwn.net"], extractor: T.LwnExtractor }), this.register({ patterns: [/.*/], extractor: p.BbcodeDataExtractor });
            }
            static register(t3) {
              this.mappings.push(t3);
            }
            static findExtractor(t3, e3, r3, n3) {
              return this.findByPredicate(t3, e3, r3, ((t4) => t4.canExtract()), n3);
            }
            static findAsyncExtractor(t3, e3, r3, n3) {
              return this.findByPredicate(t3, e3, r3, ((t4) => t4.canExtractAsync()), n3);
            }
            static findPreferredAsyncExtractor(t3, e3, r3, n3) {
              return this.findByPredicate(t3, e3, r3, ((t4) => t4.canExtractAsync() && t4.prefersAsync()), n3);
            }
            static findByPredicate(t3, e3, r3, n3, o2) {
              try {
                const i2 = new URL(e3).hostname;
                for (const { patterns: s2, extractor: a2 } of this.mappings) {
                  if (s2.some(((t4) => t4 instanceof RegExp ? t4.test(e3) : i2.includes(t4)))) {
                    const i3 = new a2(t3, e3, r3, o2);
                    if (n3(i3)) return i3;
                  }
                }
                return null;
              } catch (t4) {
                return console.error("Error finding extractor:", t4), null;
              }
            }
          }
          e2.ExtractorRegistry = L, L.mappings = [], L.initialize();
        }, 2279(t2, e2) {
          var r2 = this && this.__awaiter || function(t3, e3, r3, n2) {
            return new (r3 || (r3 = Promise))((function(o, i) {
              function s(t4) {
                try {
                  l(n2.next(t4));
                } catch (t5) {
                  i(t5);
                }
              }
              function a(t4) {
                try {
                  l(n2.throw(t4));
                } catch (t5) {
                  i(t5);
                }
              }
              function l(t4) {
                var e4;
                t4.done ? o(t4.value) : (e4 = t4.value, e4 instanceof r3 ? e4 : new r3((function(t5) {
                  t5(e4);
                }))).then(s, a);
              }
              l((n2 = n2.apply(t3, e3 || [])).next());
            }));
          };
          Object.defineProperty(e2, "__esModule", { value: true }), e2.BaseExtractor = void 0;
          e2.BaseExtractor = class {
            constructor(t3, e3, r3, n2) {
              this.document = t3, this.url = e3, this.schemaOrgData = r3, this.options = n2 || {};
            }
            get fetch() {
              return (this.options.fetch || globalThis.fetch).bind(globalThis);
            }
            postTitle(t3, e3) {
              return `Post by ${t3} on ${e3}`;
            }
            canExtractAsync() {
              return false;
            }
            prefersAsync() {
              return false;
            }
            extractAsync() {
              return r2(this, void 0, void 0, (function* () {
                return this.extract();
              }));
            }
          };
        }, 5181(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.ConversationExtractor = void 0;
          const n2 = r2(2279), o = r2(5628), i = r2(639);
          class s extends n2.BaseExtractor {
            getFootnotes() {
              return [];
            }
            extract() {
              var t3;
              const e3 = this.extractMessages(), r3 = this.getMetadata(), n3 = this.getFootnotes(), s2 = this.createContentHtml(e3, n3), a = this.createTemporaryDocument(), l = a.createElement("article");
              l.appendChild((0, i.parseHTML)(a, s2)), a.body.appendChild(l);
              const c = new o.Defuddle(a, { url: "about:blank" }).parse(), u = c.content;
              return { content: u, contentHtml: u, extractedContent: { messageCount: e3.length.toString() }, variables: { title: r3.title || "Conversation", site: r3.site, description: r3.description || `${r3.site} conversation with ${e3.length} messages`, wordCount: (null === (t3 = c.wordCount) || void 0 === t3 ? void 0 : t3.toString()) || "" } };
            }
            createTemporaryDocument() {
              var t3;
              const e3 = this.document.implementation;
              if (null == e3 ? void 0 : e3.createHTMLDocument) return e3.createHTMLDocument();
              const r3 = (null === (t3 = this.document.defaultView) || void 0 === t3 ? void 0 : t3.DOMParser) || globalThis.DOMParser;
              if (r3) return new r3().parseFromString("<!doctype html><html><body></body></html>", "text/html");
              throw new Error("Unable to create a temporary document for conversation extraction");
            }
            createContentHtml(t3, e3) {
              return `${t3.map(((e4, r3) => {
                const n3 = e4.timestamp ? `<div class="message-timestamp">${e4.timestamp}</div>` : "", o2 = /<p[^>]*>[\s\S]*?<\/p>/i.test(e4.content) ? e4.content : `<p>${e4.content}</p>`, i2 = e4.metadata ? Object.entries(e4.metadata).map((([t4, e5]) => `data-${t4}="${e5}"`)).join(" ") : "";
                return `
			<div class="message message-${e4.author.toLowerCase()}" ${i2}>
				<div class="message-header">
					<p class="message-author"><strong>${e4.author}</strong></p>
					${n3}
				</div>
				<div class="message-content">
					${o2}
				</div>
			</div>${r3 < t3.length - 1 ? "\n<hr>" : ""}`;
              })).join("\n").trim()}
${e3.length > 0 ? `
			<div id="footnotes">
				<ol>
					${e3.map(((t4, e4) => `
						<li class="footnote" id="fn:${e4 + 1}">
							<p>
								<a href="${t4.url}" target="_blank">${t4.text}</a>&nbsp;<a href="#fnref:${e4 + 1}" class="footnote-backref">↩</a>
							</p>
						</li>
					`)).join("")}
				</ol>
			</div>` : ""}`.trim();
            }
          }
          e2.ConversationExtractor = s;
        }, 3055(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.BbcodeDataExtractor = void 0;
          const n2 = r2(2279), o = r2(6618);
          class i extends n2.BaseExtractor {
            constructor() {
              super(...arguments), this.eventData = void 0;
            }
            canExtract() {
              var t3, e3;
              return !!(null === (e3 = null === (t3 = this.getEventData()) || void 0 === t3 ? void 0 : t3.announcement_body) || void 0 === e3 ? void 0 : e3.body);
            }
            extract() {
              const t3 = this.getEventData(), e3 = t3.announcement_body, r3 = (0, o.bbcodeToHtml)(e3.body || ""), n3 = e3.headline || t3.event_name || "", i2 = e3.posttime ? new Date(1e3 * e3.posttime).toISOString() : "";
              return { content: r3, contentHtml: r3, extractedContent: {}, variables: { title: n3, author: this.getGroupName(), published: i2 } };
            }
            getEventData() {
              var t3;
              return void 0 === this.eventData && (this.eventData = null !== (t3 = this.parseConfigAttr("data-partnereventstore")) && void 0 !== t3 ? t3 : null), this.eventData;
            }
            getGroupName() {
              const t3 = this.parseConfigAttr("data-groupvanityinfo");
              return (null == t3 ? void 0 : t3.group_name) || "";
            }
            parseConfigAttr(t3) {
              const e3 = this.document.querySelector("#application_config"), r3 = null == e3 ? void 0 : e3.getAttribute(t3);
              if (!r3) return null;
              try {
                const t4 = JSON.parse(r3);
                return Array.isArray(t4) ? t4[0] : t4;
              } catch (t4) {
                return null;
              }
            }
          }
          e2.BbcodeDataExtractor = i;
        }, 9759(t2, e2, r2) {
          var n2 = this && this.__awaiter || function(t3, e3, r3, n3) {
            return new (r3 || (r3 = Promise))((function(o2, i2) {
              function s2(t4) {
                try {
                  l2(n3.next(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function a2(t4) {
                try {
                  l2(n3.throw(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function l2(t4) {
                var e4;
                t4.done ? o2(t4.value) : (e4 = t4.value, e4 instanceof r3 ? e4 : new r3((function(t5) {
                  t5(e4);
                }))).then(s2, a2);
              }
              l2((n3 = n3.apply(t3, e3 || [])).next());
            }));
          };
          Object.defineProperty(e2, "__esModule", { value: true }), e2.BilibiliExtractor = void 0;
          const o = r2(2279), i = r2(639), s = r2(1497), a = 4e3, l = /[\u4E00-\u9FFF]/;
          class c extends o.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              super(t3, e3, r3, n3);
            }
            canExtract() {
              return !!this.getBvid();
            }
            canExtractAsync() {
              return this.canExtract();
            }
            prefersAsync() {
              return true;
            }
            extract() {
              return this.buildResult();
            }
            extractAsync() {
              return n2(this, void 0, void 0, (function* () {
                var t3;
                const e3 = this.getBvid();
                if (!e3) return this.buildResult();
                const r3 = yield this.fetchViewData(e3);
                if (!r3) return this.buildResult();
                const { aid: n3, pages: o2 = [] } = r3, i2 = this.getPageNumber(), s2 = o2.length > 0 ? null !== (t3 = o2[i2 - 1]) && void 0 !== t3 ? t3 : o2[0] : void 0, a2 = null == s2 ? void 0 : s2.cid, l2 = this.normalizeLanguageCode(this.options.language), u = n3 && a2 ? `${e3}:${a2}:${l2}` : "";
                let d;
                if (n3 && a2) {
                  if (u && c.transcriptCache.has(u)) {
                    const t4 = c.transcriptCache.get(u);
                    d = null != t4 ? t4 : void 0;
                  } else if (d = yield this.fetchTranscript(n3, a2, e3), u && (c.transcriptCache.set(u, null != d ? d : null), c.transcriptCache.size > 300)) {
                    const t4 = c.transcriptCache.keys().next().value;
                    t4 && c.transcriptCache.delete(t4);
                  }
                }
                return this.buildResult(d, r3, s2, i2);
              }));
            }
            getBvid() {
              var t3;
              if (void 0 !== this._bvid) return this._bvid;
              try {
                const e3 = new URL(this.url).pathname.match(/\/video\/(BV[0-9A-Za-z]+)\/?/);
                this._bvid = null !== (t3 = null == e3 ? void 0 : e3[1]) && void 0 !== t3 ? t3 : "";
              } catch (t4) {
                this._bvid = "";
              }
              return this._bvid;
            }
            getPageNumber() {
              try {
                const t3 = new URL(this.url), e3 = parseInt(new URLSearchParams(t3.search).get("p") || "1", 10);
                return Number.isFinite(e3) && e3 > 0 ? e3 : 1;
              } catch (t3) {
                return 1;
              }
            }
            formatDescription(t3) {
              const e3 = (0, i.escapeHtml)(t3).replace(/\n/g, "<br>");
              return e3 ? `<p>${e3}</p>` : "";
            }
            buildEmbedHtml(t3, e3) {
              return `<iframe width="560" height="315" src="${`https://player.bilibili.com/player.html?bvid=${encodeURIComponent(t3)}&page=${e3}&high_quality=1&danmaku=0`}" title="Bilibili video player" frameborder="0" allowfullscreen></iframe>`;
            }
            buildResult(t3, e3, r3, n3) {
              var o2;
              const i2 = this.getBvid(), s2 = (null == e3 ? void 0 : e3.title) || this.document.title || "", a2 = (null === (o2 = null == e3 ? void 0 : e3.owner) || void 0 === o2 ? void 0 : o2.name) || "", l2 = (null == e3 ? void 0 : e3.desc) || "", c2 = l2.slice(0, 200).trim(), u = (null == e3 ? void 0 : e3.pic) || "", d = (null == e3 ? void 0 : e3.pubdate) ? new Date(1e3 * e3.pubdate).toISOString() : "";
              let h = "";
              i2 && (h += this.buildEmbedHtml(i2, n3 || this.getPageNumber())), l2 && (h += this.formatDescription(l2)), (null == t3 ? void 0 : t3.html) && (h += t3.html);
              const m = { title: s2, author: a2, site: "Bilibili", image: u, published: d, description: c2 };
              return (null == r3 ? void 0 : r3.part) && (m.part = r3.part), (null == t3 ? void 0 : t3.text) && (m.transcript = t3.text), (null == t3 ? void 0 : t3.languageCode) && (m.language = t3.languageCode), { content: h, contentHtml: h, extractedContent: Object.assign({ videoId: i2 }, (null == r3 ? void 0 : r3.cid) ? { cid: String(r3.cid) } : {}), variables: m };
            }
            normalizeLanguageCode(t3) {
              return (t3 || "").trim().replace(/_/g, "-").toLocaleLowerCase();
            }
            pickSubtitleTrack(t3, e3) {
              var r3;
              if (0 === t3.length) return;
              const n3 = this.normalizeLanguageCode(e3), o2 = n3 ? n3.split("-")[0] : "", i2 = (t4) => (t4 || "").trim().toLocaleLowerCase();
              return null === (r3 = t3.map(((t4, e4) => {
                const r4 = this.normalizeLanguageCode(t4.lan);
                let s2 = 3;
                n3 && (r4 === n3 ? s2 = 0 : o2 && r4 === o2 ? s2 = 1 : o2 && r4.split("-")[0] === o2 && (s2 = 2));
                const a2 = t4.is_ai_subtitle || ((t5) => {
                  const e5 = i2(t5);
                  return e5.includes("ai") || e5.includes("auto") || e5.includes("自动");
                })(t4.lan_doc) ? 1 : 0, l2 = ((t5) => "zh-cn" === t5 || "zh-hans" === t5 ? 0 : "zh" === t5 ? 1 : t5.startsWith("zh-") ? 2 : "en" === t5 || t5.startsWith("en-") ? 3 : 4)(r4);
                return { t: t4, prefScore: s2, aiScore: a2, lp: l2, id: "number" == typeof t4.id ? t4.id : Number.MAX_SAFE_INTEGER, doc: i2(t4.lan_doc), urlKey: ((t5) => {
                  const e5 = (t5 || "").trim();
                  if (!e5) return "";
                  try {
                    const t6 = e5.startsWith("//") ? `https:${e5}` : e5, r5 = new URL(t6);
                    return `${r5.hostname.toLocaleLowerCase()}${r5.pathname}`;
                  } catch (t6) {
                    return e5.split("?")[0].split("#")[0];
                  }
                })(t4.subtitle_url), index: e4 };
              })).sort(((t4, e4) => t4.prefScore !== e4.prefScore ? t4.prefScore - e4.prefScore : t4.aiScore !== e4.aiScore ? t4.aiScore - e4.aiScore : t4.lp !== e4.lp ? t4.lp - e4.lp : t4.id !== e4.id ? t4.id - e4.id : t4.doc !== e4.doc ? t4.doc.localeCompare(e4.doc) : t4.urlKey !== e4.urlKey ? t4.urlKey.localeCompare(e4.urlKey) : t4.index - e4.index))[0]) || void 0 === r3 ? void 0 : r3.t;
            }
            fetchViewData(t3) {
              return n2(this, void 0, void 0, (function* () {
                try {
                  const e3 = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(t3)}`, r3 = yield this.fetch(e3, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; Defuddle/1.0)" }, credentials: "include", signal: AbortSignal.timeout(a) });
                  if (!r3.ok) return;
                  const n3 = yield r3.json();
                  if (0 !== (null == n3 ? void 0 : n3.code)) return;
                  return n3.data;
                } catch (t4) {
                  return;
                }
              }));
            }
            parseSubtitleTracks(t3) {
              var e3, r3, n3, o2, i2, s2;
              const a2 = [null === (r3 = null === (e3 = null == t3 ? void 0 : t3.data) || void 0 === e3 ? void 0 : e3.subtitle) || void 0 === r3 ? void 0 : r3.subtitles, null === (o2 = null === (n3 = null == t3 ? void 0 : t3.data) || void 0 === n3 ? void 0 : n3.subtitle) || void 0 === o2 ? void 0 : o2.list, null === (s2 = null === (i2 = null == t3 ? void 0 : t3.data) || void 0 === i2 ? void 0 : i2.subtitle) || void 0 === s2 ? void 0 : s2.tracks];
              for (const t4 of a2) if (Array.isArray(t4)) return t4.map(((t5) => {
                var e4, r4, n4, o3, i3, s3;
                return { lan: String(null !== (n4 = null !== (r4 = null !== (e4 = null == t5 ? void 0 : t5.lan) && void 0 !== e4 ? e4 : null == t5 ? void 0 : t5.lang) && void 0 !== r4 ? r4 : null == t5 ? void 0 : t5.language) && void 0 !== n4 ? n4 : ""), lan_doc: (null == t5 ? void 0 : t5.lan_doc) ? String(t5.lan_doc) : void 0, subtitle_url: String(null !== (s3 = null !== (i3 = null !== (o3 = null == t5 ? void 0 : t5.subtitle_url) && void 0 !== o3 ? o3 : null == t5 ? void 0 : t5.subtitleUrl) && void 0 !== i3 ? i3 : null == t5 ? void 0 : t5.url) && void 0 !== s3 ? s3 : ""), id: "number" == typeof (null == t5 ? void 0 : t5.id) ? t5.id : "number" == typeof (null == t5 ? void 0 : t5.subtitle_id) ? t5.subtitle_id : void 0, is_ai_subtitle: "boolean" == typeof (null == t5 ? void 0 : t5.is_ai_subtitle) ? t5.is_ai_subtitle : "number" == typeof (null == t5 ? void 0 : t5.ai_type) ? t5.ai_type > 0 : void 0 };
              })).filter(((t5) => !!t5.lan && !!t5.subtitle_url));
              return [];
            }
            fetchPlayerV2(t3) {
              return n2(this, void 0, void 0, (function* () {
                const e3 = yield this.fetch(t3, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; Defuddle/1.0)" }, credentials: "include", signal: AbortSignal.timeout(a) });
                if (!e3.ok) return { tracks: [], code: e3.status, message: `http_${e3.status}` };
                const r3 = yield e3.json(), n3 = "number" == typeof (null == r3 ? void 0 : r3.code) ? r3.code : void 0, o2 = "string" == typeof (null == r3 ? void 0 : r3.message) ? r3.message : void 0;
                return 0 !== n3 ? { tracks: [], code: n3, message: o2 } : { tracks: this.parseSubtitleTracks(r3), code: n3, message: o2 };
              }));
            }
            fetchTranscript(t3, e3, r3) {
              return n2(this, void 0, void 0, (function* () {
                try {
                  const n3 = `https://api.bilibili.com/x/player/wbi/v2?bvid=${encodeURIComponent(String(r3))}&aid=${encodeURIComponent(String(t3))}&cid=${encodeURIComponent(String(e3))}`, o2 = `https://api.bilibili.com/x/player/v2?bvid=${encodeURIComponent(String(r3))}&cid=${encodeURIComponent(String(e3))}`, i2 = `https://api.bilibili.com/x/player/v2?aid=${encodeURIComponent(String(t3))}&cid=${encodeURIComponent(String(e3))}`;
                  let s2 = [];
                  if (s2 = (yield this.fetchPlayerV2(n3)).tracks, 0 === s2.length) {
                    if (s2 = (yield this.fetchPlayerV2(o2)).tracks, 0 === s2.length) {
                      s2 = (yield this.fetchPlayerV2(i2)).tracks;
                    }
                  }
                  if (!Array.isArray(s2) || 0 === s2.length) return;
                  const l2 = this.pickSubtitleTrack(s2, this.options.language);
                  if (!(null == l2 ? void 0 : l2.subtitle_url)) return;
                  const c2 = this.normalizeSubtitleUrl(l2.subtitle_url);
                  if (!c2) return;
                  if (!this.isAllowedSubtitleHost(c2)) return;
                  const u = yield this.fetch(c2.toString(), { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; Defuddle/1.0)" }, signal: AbortSignal.timeout(a) });
                  if (!u.ok) return;
                  const d = yield u.json(), h = this.parseSubtitleJson(d);
                  if (!h) return;
                  return Object.assign(Object.assign({}, h), { languageCode: l2.lan });
                } catch (t4) {
                  return;
                }
              }));
            }
            normalizeSubtitleUrl(t3) {
              try {
                const e3 = (t3 || "").trim();
                if (!e3) return null;
                const r3 = e3.startsWith("//") ? `https:${e3}` : e3, n3 = new URL(r3);
                return "https:" !== n3.protocol ? null : n3;
              } catch (t4) {
                return null;
              }
            }
            isAllowedSubtitleHost(t3) {
              const e3 = t3.hostname.toLocaleLowerCase();
              return e3.endsWith(".hdslb.com") || e3.endsWith(".bilibili.com");
            }
            parseSubtitleJson(t3) {
              const e3 = (Array.isArray(null == t3 ? void 0 : t3.body) ? t3.body : []).map(((t4) => ({ start: "number" == typeof t4.from ? t4.from : NaN, end: "number" == typeof t4.to ? t4.to : "number" == typeof t4.from ? t4.from : NaN, text: (t4.content || "").trim() }))).filter(((t4) => Number.isFinite(t4.start) && t4.text.length > 0)).sort(((t4, e4) => t4.start - e4.start));
              if (0 === e3.length) return;
              const r3 = this.groupSubtitleLines(e3), { html: n3, text: o2 } = (0, s.buildTranscript)("bilibili", r3);
              return { html: n3, text: o2 };
            }
            groupSubtitleLines(t3) {
              const e3 = [];
              let r3 = t3[0].start, n3 = t3[0].end, o2 = t3[0].text;
              const i2 = () => {
                const t4 = o2.replace(/\s+/g, " ").trim();
                t4 && e3.push({ start: Math.max(0, Math.floor(r3)), text: t4, speakerChange: e3.length > 0 });
              };
              for (let e4 = 1; e4 < t3.length; e4++) {
                const s2 = t3[e4], a2 = s2.start - n3, l2 = Math.max(s2.end, s2.start) - r3;
                a2 > 20 || l2 > 30 ? (i2(), r3 = s2.start, n3 = s2.end, o2 = s2.text) : (o2 = this.concatTranscriptText(o2, s2.text), n3 = Math.max(n3, s2.end));
              }
              return i2(), e3;
            }
            concatTranscriptText(t3, e3) {
              const r3 = (t3 || "").trimEnd(), n3 = (e3 || "").trimStart();
              if (!r3) return n3;
              if (!n3) return r3;
              const o2 = r3[r3.length - 1], i2 = n3[0], s2 = l.test(o2), a2 = l.test(i2);
              if (s2 && a2) return r3 + n3;
              /[A-Za-z0-9]$/.test(r3), /^[A-Za-z0-9]/.test(n3);
              return `${r3} ${n3}`;
            }
          }
          e2.BilibiliExtractor = c, c.transcriptCache = /* @__PURE__ */ new Map();
        }, 5654(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.BlueskyExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              super(t3, e3, r3, n3), this.postItems = [], this.threadScreen = t3.querySelector('[data-testid="postThreadScreen"]'), this.threadScreen && (this.postItems = Array.from(this.threadScreen.querySelectorAll('[data-testid^="postThreadItem-by-"]')));
            }
            canExtract() {
              return this.postItems.length > 0;
            }
            extract() {
              const t3 = this.getHandle(this.postItems[0]), e3 = [], r3 = [];
              let n3 = false;
              for (const o3 of this.postItems) {
                const i2 = this.getHandle(o3);
                n3 || i2 !== t3 ? (n3 = true, r3.push(o3)) : e3.push(o3);
              }
              const o2 = e3.map(((t4) => this.extractPostContent(t4))).join("\n<hr>\n"), s2 = false !== this.options.includeReplies ? this.extractComments(r3) : "", a = (0, i.buildContentHtml)("bluesky", o2, s2), l = `@${t3}`, c = this.getDisplayName(this.postItems[0]), u = this.createDescription(this.postItems[0]), d = this.getPublishedDate(), h = this.postTitle(c || l, "Bluesky");
              return { content: a, contentHtml: a, extractedContent: { postAuthor: t3 }, variables: Object.assign({ title: h, author: c || l, site: "Bluesky", description: u }, d && { published: d }) };
            }
            extractComments(t3) {
              if (0 === t3.length) return "";
              let e3 = 0;
              const r3 = t3.map(((t4) => {
                const r4 = this.getHandle(t4), n3 = this.getDisplayName(t4), o2 = this.extractPostContent(t4), i2 = this.getReplyDate(t4), s2 = this.getPermalink(t4);
                return this.hasTopConnector(t4) ? e3++ : e3 = 0, { author: n3 ? `${n3} @${r4}` : `@${r4}`, date: i2, content: o2, depth: e3, url: s2 || void 0 };
              }));
              return (0, i.buildCommentTree)(r3);
            }
            hasTopConnector(t3) {
              const e3 = t3.children[0];
              if (!e3) return false;
              const r3 = e3.querySelectorAll("div");
              for (const t4 of Array.from(r3)) {
                const e4 = t4.getAttribute("style") || "";
                if (e4.includes("width: 2px") && e4.includes("background-color")) return true;
              }
              return false;
            }
            getHandle(t3) {
              const e3 = (t3.getAttribute("data-testid") || "").match(/^postThreadItem-by-(.+)$/);
              return e3 ? e3[1] : "";
            }
            getDisplayName(t3) {
              var e3;
              const r3 = t3.querySelector('a[aria-label*="avatar"]');
              if (r3) {
                const t4 = (r3.getAttribute("aria-label") || "").match(/^(.+)'s avatar$/);
                if (t4) return t4[1];
              }
              const n3 = t3.querySelectorAll('a[href^="/profile/"]');
              for (const t4 of Array.from(n3)) {
                const r4 = (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
                if (r4 && !r4.startsWith("@") && !r4.includes("avatar") && !r4.includes("·")) return r4;
              }
              return "";
            }
            getPublishedDate() {
              const t3 = this.document.querySelector('meta[name="twitter:value1"]');
              if (t3) {
                const e3 = t3.getAttribute("content") || "";
                try {
                  return new Date(e3).toISOString().split("T")[0];
                } catch (t4) {
                }
              }
              return "";
            }
            getReplyDate(t3) {
              const e3 = t3.querySelector('a[href*="/post/"]');
              if (!e3) return "";
              const r3 = e3.getAttribute("aria-label") || "";
              if (!r3) return "";
              try {
                const t4 = new Date(r3.replace(" at ", " "));
                if (!isNaN(t4.getTime())) return t4.toISOString().split("T")[0];
              } catch (t4) {
              }
              return "";
            }
            getPermalink(t3) {
              const e3 = t3.querySelector('a[href*="/post/"]');
              if (!e3) return "";
              const r3 = e3.getAttribute("href") || "";
              return r3.startsWith("http") ? r3 : `https://bsky.app${r3}`;
            }
            extractPostContent(t3) {
              const e3 = [], r3 = t3.querySelector('div[data-word-wrap="1"]');
              if (r3) {
                const t4 = this.cleanText(r3);
                t4 && e3.push(t4);
              }
              const n3 = this.extractImages(t3);
              n3 && e3.push(n3);
              const o2 = this.extractLinkCard(t3);
              o2 && e3.push(o2);
              const i2 = this.extractQuotedPost(t3);
              return i2 && e3.push(i2), e3.join("\n");
            }
            cleanText(t3) {
              const e3 = t3.cloneNode(true);
              e3.querySelectorAll('a[href*="/profile/"]').forEach(((t4) => {
                var r4;
                const n3 = (null === (r4 = t4.textContent) || void 0 === r4 ? void 0 : r4.trim()) || "", o2 = t4.getAttribute("href") || "";
                if (n3.startsWith("@")) {
                  const r5 = n3.slice(1), o3 = e3.ownerDocument.createElement("a");
                  o3.setAttribute("href", `https://bsky.app/profile/${r5}`), o3.textContent = n3, t4.replaceWith(o3);
                } else o2.startsWith("/profile/") && t4.setAttribute("href", `https://bsky.app${o2}`);
              })), e3.querySelectorAll('a[href^="http"]').forEach(((t4) => {
                var r4;
                const n3 = t4.getAttribute("href") || "", o2 = (null === (r4 = t4.textContent) || void 0 === r4 ? void 0 : r4.trim()) || "", i2 = e3.ownerDocument.createElement("a");
                i2.setAttribute("href", n3), i2.textContent = o2, t4.replaceWith(i2);
              })), e3.querySelectorAll("span, div").forEach(((t4) => {
                t4.replaceWith(...Array.from(t4.childNodes));
              }));
              let r3 = (e3.innerHTML || e3.textContent || "").trim();
              if (r3 = r3.replace(/[\u200E\u200F\u200B]/g, ""), r3 = r3.replace(/[^\S\n]+/g, " ").trim(), !r3) return "";
              return r3.split(/\n+/).map(((t4) => t4.trim())).filter(((t4) => t4)).map(((t4) => `<p>${t4}</p>`)).join("\n");
            }
            extractImages(t3) {
              const e3 = [];
              return t3.querySelectorAll('img[src*="/feed_thumbnail/"], img[src*="/feed_fullsize/"]').forEach(((t4) => {
                const r3 = t4.getAttribute("src") || "";
                if (!r3) return;
                const n3 = r3.replace("/feed_thumbnail/", "/feed_fullsize/");
                e3.push(`<img src="${(0, o.escapeHtml)(n3)}" alt="" />`);
              })), e3.join("\n");
            }
            extractLinkCard(t3) {
              const e3 = t3.querySelectorAll('a[aria-label][href^="http"]');
              for (const t4 of Array.from(e3)) {
                if (!t4.querySelector('div[style*="border"]')) continue;
                const e4 = t4.getAttribute("href") || "", r3 = t4.getAttribute("aria-label") || "", n3 = t4.querySelector("img");
                if (r3) {
                  let t5 = "";
                  if (n3) {
                    const i2 = n3.getAttribute("src") || "";
                    t5 += `<a href="${(0, o.escapeHtml)(e4)}"><img src="${(0, o.escapeHtml)(i2)}" alt="${(0, o.escapeHtml)(r3)}" /></a>
`;
                  }
                  return t5 += `<p><a href="${(0, o.escapeHtml)(e4)}">${(0, o.escapeHtml)(r3)}</a></p>`, t5;
                }
              }
              return "";
            }
            extractQuotedPost(t3) {
              const e3 = t3.querySelectorAll('[data-testid^="postThreadItem-by-"]');
              for (const r3 of Array.from(e3)) {
                if (r3 === t3) continue;
                const e4 = this.getHandle(r3), n3 = this.getDisplayName(r3), o2 = r3.querySelector('div[data-word-wrap="1"]'), s2 = o2 ? this.cleanText(o2) : "";
                return (0, i.buildQuotedPost)({ author: n3 ? `${n3} @${e4}` : `@${e4}`, content: s2 });
              }
              return "";
            }
            createDescription(t3) {
              const e3 = t3.querySelector('div[data-word-wrap="1"]');
              return e3 ? (e3.textContent || "").replace(/[\u200E\u200F\u200B]/g, "").trim().slice(0, 140).replace(/\s+/g, " ") : "";
            }
          }
          e2.BlueskyExtractor = s;
        }, 27(t2, e2, r2) {
          var n2 = this && this.__awaiter || function(t3, e3, r3, n3) {
            return new (r3 || (r3 = Promise))((function(o2, i2) {
              function s2(t4) {
                try {
                  l(n3.next(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function a2(t4) {
                try {
                  l(n3.throw(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function l(t4) {
                var e4;
                t4.done ? o2(t4.value) : (e4 = t4.value, e4 instanceof r3 ? e4 : new r3((function(t5) {
                  t5(e4);
                }))).then(s2, a2);
              }
              l((n3 = n3.apply(t3, e3 || [])).next());
            }));
          };
          Object.defineProperty(e2, "__esModule", { value: true }), e2.C2WikiExtractor = void 0;
          const o = r2(2279), i = r2(639);
          class s extends o.BaseExtractor {
            canExtract() {
              return false;
            }
            canExtractAsync() {
              return null !== this.getPageTitle();
            }
            prefersAsync() {
              return true;
            }
            extract() {
              return { content: "", contentHtml: "" };
            }
            extractAsync() {
              return n2(this, void 0, void 0, (function* () {
                const t3 = this.getPageTitle();
                if (!t3) return { content: "", contentHtml: "" };
                const e3 = yield this.fetch("https://c2.com/wiki/remodel/pages/" + t3).then(((t4) => t4.json()));
                if (!e3 || !e3.text) return { content: "", contentHtml: "" };
                const r3 = t3.replace(/([a-z])([A-Z])/g, "$1 $2"), n3 = this.renderPage(e3);
                return { content: n3, contentHtml: n3, variables: Object.assign({ title: r3, site: "C2 Wiki" }, e3.date ? { published: e3.date } : {}) };
              }));
            }
            getPageTitle() {
              if (void 0 !== this.pageTitle) return this.pageTitle;
              try {
                const t3 = new URL(this.url).search.match(/[?&]([A-Za-z]\w*)/);
                this.pageTitle = t3 ? t3[1] : "WelcomeVisitors";
              } catch (t3) {
                this.pageTitle = null;
              }
              return this.pageTitle;
            }
            renderPage(t3) {
              return `${this.markup(t3.text)}${t3.date ? `<hr><p>Last edit ${(0, i.escapeHtml)(t3.date)}</p>` : ""}`;
            }
            markup(t3) {
              const e3 = t3.replace(/\\\n/g, " ").split(/\r?\n/), r3 = [];
              let n3 = [];
              for (const t4 of e3) {
                const { html: e4, openTags: o2 } = this.applyBullets(t4, n3);
                r3.push(this.applyInline(e4)), n3 = o2;
              }
              for (; n3.length > 0; ) r3.push(`</${n3.pop()}>`);
              return r3.join("\n");
            }
            applyBullets(t3, e3) {
              const r3 = [...e3];
              let n3 = "";
              const o2 = (t4, e4) => {
                for (; r3.length > t4; ) n3 += `</${r3.pop()}>`;
                e4 && r3.length < t4 ? (n3 += `<${e4}>`, r3.push(e4)) : e4 && r3.length === t4 && r3[t4 - 1] !== e4 && (n3 += `</${r3.pop()}><${e4}>`, r3.push(e4));
              };
              if (/^\s*$/.test(t3)) {
                return r3.some(((t4) => "ul" === t4 || "ol" === t4 || "dl" === t4)) ? { html: "", openTags: r3 } : (o2(0), { html: n3 + "<p></p>", openTags: r3 });
              }
              if (/^-----*/.test(t3)) return o2(0), { html: n3 + "<hr>", openTags: r3 };
              const i2 = t3.match(/^(\t+)(.+):\t/);
              if (i2) return o2(i2[1].length, "dl"), { html: n3 + `<dt>${i2[2]}<dd>` + t3.slice(i2[0].length), openTags: r3 };
              const s2 = t3.match(/^(\t+)\*/);
              if (s2) return o2(s2[1].length, "ul"), { html: n3 + "<li>" + t3.slice(s2[0].length), openTags: r3 };
              const a2 = t3.match(/^(\*+)/);
              if (a2) return o2(a2[1].length, "ul"), { html: n3 + "<li>" + t3.slice(a2[0].length), openTags: r3 };
              const l = t3.match(/^(\t+)\d+\.?/);
              return l ? (o2(l[1].length, "ol"), { html: n3 + "<li>" + t3.slice(l[0].length), openTags: r3 }) : /^\s/.test(t3) ? (o2(1, "pre"), { html: n3 + t3, openTags: r3 }) : (o2(0), { html: n3 + t3, openTags: r3 });
            }
            applyInline(t3) {
              return t3.replace(/'''(.*?)'''/g, "<strong>$1</strong>").replace(/''(.*?)''/g, "<em>$1</em>").replace(/\b(https?|ftp|mailto|file|telnet|news):[^\s<>[\]"'()]*[^\s<>[\]"'(),.?]/g, ((t4) => (0, i.isDangerousUrl)(t4) ? (0, i.escapeHtml)(t4) : /\.(gif|jpg|jpeg|png)$/i.test(t4) ? `<img src="${a(t4)}">` : `<a href="${a(t4)}" rel="nofollow" target="_blank">${(0, i.escapeHtml)(t4)}</a>`));
            }
          }
          function a(t3) {
            return t3.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
          }
          e2.C2WikiExtractor = s;
        }, 8632(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.ChatGPTExtractor = void 0;
          const n2 = r2(5181), o = r2(639);
          class i extends n2.ConversationExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.cachedMessages = null, this.turns = t3.querySelectorAll('[data-testid^="conversation-turn-"]'), this.footnotes = [], this.footnoteCounter = 0;
            }
            canExtract() {
              return !!this.turns && this.turns.length > 0;
            }
            extractMessages() {
              if (this.cachedMessages) return this.cachedMessages;
              const t3 = [];
              return this.footnotes = [], this.footnoteCounter = 0, this.turns ? (this.turns.forEach(((e3) => {
                var r3, n3;
                const i2 = e3.querySelector("h4.sr-only, h5.sr-only, h6.sr-only"), s = (null === (n3 = null === (r3 = null == i2 ? void 0 : i2.textContent) || void 0 === r3 ? void 0 : r3.trim()) || void 0 === n3 ? void 0 : n3.replace(/:\s*$/, "")) || "", a = Array.from(e3.querySelectorAll("[data-message-author-role]")).filter(((t4) => t4.closest('[data-testid^="conversation-turn-"]') === e3)), l = a[0], c = (null == l ? void 0 : l.getAttribute("data-message-author-role")) || "", u = a.flatMap(((t4) => {
                  const e4 = this.getMessageContentElements(t4);
                  return e4.length > 0 ? e4.map(((t5) => (0, o.serializeHTML)(t5))) : [(0, o.serializeHTML)(t4)];
                }));
                let d = (u.length > 0 ? u : [(0, o.serializeHTML)(e3)]).join("\n");
                d = d.replace(/\u200B/g, "");
                const h = this.document.createElement("div");
                h.appendChild((0, o.parseHTML)(this.document, d)), h.querySelectorAll("h4.sr-only, h5.sr-only, h6.sr-only").forEach(((t4) => t4.remove())), d = (0, o.serializeHTML)(h);
                d = d.replace(/(&ZeroWidthSpace;)?(<span[^>]*?>\s*(?:<span[^>]*?>\s*)*<a(?=[^>]*?href="([^"]+)")(?=[^>]*?target="_blank")(?=[^>]*?rel="noopener")[^>]*?>[\s\S]*?<\/a>\s*(?:<\/span>\s*)+)/gi, ((t4, e4, r4, n4) => {
                  let o2 = "", i3 = "";
                  try {
                    o2 = new URL(n4).hostname.replace(/^www\./, "");
                    const t5 = n4.split("#:~:text=");
                    if (t5.length > 1) {
                      i3 = decodeURIComponent(t5[1]), i3 = i3.replace(/%2C/g, ",");
                      const e5 = i3.split(",");
                      i3 = e5.length > 1 && e5[0].trim() ? ` — ${e5[0].trim()}...` : e5[0].trim() ? ` — ${i3.trim()}` : "";
                    }
                  } catch (t5) {
                    console.error(`Failed to parse URL: ${n4}`, t5), o2 = n4;
                  }
                  let s2, a2 = this.footnotes.findIndex(((t5) => t5.url === n4));
                  return -1 === a2 ? (this.footnoteCounter++, s2 = this.footnoteCounter, this.footnotes.push({ url: n4, text: `<a href="${n4}">${o2}</a>${i3}` })) : s2 = a2 + 1, `<sup id="fnref:${s2}"><a href="#fn:${s2}">${s2}</a></sup>`;
                }));
                const m = this.document.createElement("div");
                m.appendChild((0, o.parseHTML)(this.document, d)), m.querySelectorAll('span[data-state="closed"]').forEach(((t4) => t4.remove())), d = (0, o.serializeHTML)(m), d = d.replace(/<p[^>]*>\s*<\/p>/g, ""), t3.push({ author: s, content: d.trim(), metadata: { role: c || "unknown" } });
              })), this.cachedMessages = t3, t3) : t3;
            }
            getMessageContentElements(t3) {
              const e3 = ".markdown, .whitespace-pre-wrap", r3 = [...t3.matches(e3) ? [t3] : [], ...Array.from(t3.querySelectorAll(e3))];
              return r3.filter(((t4) => !r3.some(((e4) => e4 !== t4 && e4.contains(t4)))));
            }
            getFootnotes() {
              return this.footnotes;
            }
            getMetadata() {
              const t3 = this.getTitle(), e3 = this.extractMessages();
              return { title: t3, site: "ChatGPT", url: this.url, messageCount: e3.length, description: `ChatGPT conversation with ${e3.length} messages` };
            }
            getTitle() {
              var t3, e3, r3;
              const n3 = null === (t3 = this.document.title) || void 0 === t3 ? void 0 : t3.trim();
              if (n3 && "ChatGPT" !== n3) return n3;
              const o2 = null === (r3 = null === (e3 = this.turns) || void 0 === e3 ? void 0 : e3.item(0)) || void 0 === r3 ? void 0 : r3.querySelector(".text-message");
              if (o2) {
                const t4 = o2.textContent || "";
                return t4.length > 50 ? t4.slice(0, 50) + "..." : t4;
              }
              return "ChatGPT Conversation";
            }
          }
          e2.ChatGPTExtractor = i;
        }, 8397(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.ClaudeExtractor = void 0;
          const n2 = r2(5181), o = r2(639);
          class i extends n2.ConversationExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.articles = t3.querySelectorAll('div[data-testid="user-message"], div[data-testid="assistant-message"], div.font-claude-response');
            }
            canExtract() {
              return !!this.articles && this.articles.length > 0;
            }
            extractMessages() {
              const t3 = [];
              return this.articles ? (this.articles.forEach(((e3) => {
                let r3, n3;
                if (e3.hasAttribute("data-testid")) {
                  if ("user-message" !== e3.getAttribute("data-testid")) return;
                  r3 = "you", n3 = (0, o.serializeHTML)(e3);
                } else {
                  if (!e3.classList.contains("font-claude-response")) return;
                  {
                    r3 = "assistant";
                    const t4 = e3.querySelector(".standard-markdown") || e3;
                    n3 = (0, o.serializeHTML)(t4);
                  }
                }
                n3 && (n3 = n3.replace(/\u200B/g, "").replace(/<p[^>]*>\s*<\/p>/g, ""), t3.push({ author: "you" === r3 ? "You" : "Claude", content: n3.trim(), metadata: { role: r3 } }));
              })), t3) : t3;
            }
            getMetadata() {
              const t3 = this.getTitle(), e3 = this.extractMessages();
              return { title: t3, site: "Claude", url: this.url, messageCount: e3.length, description: `Claude conversation with ${e3.length} messages` };
            }
            getTitle() {
              var t3, e3, r3, n3, o2;
              const i2 = null === (t3 = this.document.title) || void 0 === t3 ? void 0 : t3.trim();
              if (i2 && "Claude" !== i2) return i2.replace(/ - Claude$/, "");
              const s = null === (r3 = null === (e3 = this.document.querySelector("header .font-tiempos")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim();
              if (s) return s;
              const a = null === (o2 = null === (n3 = this.articles) || void 0 === n3 ? void 0 : n3.item(0)) || void 0 === o2 ? void 0 : o2.querySelector('[data-testid="user-message"]');
              if (a) {
                const t4 = a.textContent || "";
                return t4.length > 50 ? t4.slice(0, 50) + "..." : t4;
              }
              return "Claude Conversation";
            }
          }
          e2.ClaudeExtractor = i;
        }, 4454(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.DiscourseExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              var o2;
              super(t3, e3, r3, n3);
              const i2 = (null === (o2 = t3.querySelector('meta[name="generator"]')) || void 0 === o2 ? void 0 : o2.getAttribute("content")) || "";
              this.isDiscourse = i2.startsWith("Discourse");
            }
            canExtract() {
              return this.isDiscourse && !!this.document.querySelector(".topic-post");
            }
            extract() {
              var t3, e3, r3, n3;
              const o2 = this.getTopicTitle(), s2 = (null === (t3 = this.document.querySelector('meta[property="og:site_name"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content")) || "", a = (null === (r3 = null === (e3 = this.document.querySelector(".badge-category__name")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "", l = this.getTags(), c = this.getPublishedDate(), u = Array.from(this.document.querySelectorAll(".topic-post")), d = u.find(((t4) => t4.classList.contains("topic-owner"))), h = d ? this.extractPostContent(d) : "", m = d ? this.getAuthor(d) : "", f = u.filter(((t4) => t4 !== d)), p = false !== this.options.includeReplies ? this.extractComments(f) : "", g = (0, i.buildContentHtml)("discourse", h, p), v = m || this.getAuthor(u[0]), y = d ? this.getPostText(d).slice(0, 140).replace(/\s+/g, " ") : "";
              return { content: g, contentHtml: g, extractedContent: { topicId: (null === (n3 = this.document.querySelector("h1[data-topic-id]")) || void 0 === n3 ? void 0 : n3.getAttribute("data-topic-id")) || "", category: a, tags: l.join(", ") }, variables: Object.assign({ title: o2, author: v, site: s2 || "Discourse", description: y }, c && { published: c }) };
            }
            getTopicTitle() {
              var t3, e3;
              const r3 = this.document.querySelector(".fancy-title");
              if (r3) return (null === (t3 = r3.textContent) || void 0 === t3 ? void 0 : t3.trim()) || "";
              const n3 = this.document.querySelector("h1[data-topic-id]");
              if (n3) {
                const t4 = n3.cloneNode(true);
                return t4.querySelectorAll("svg, .topic-statuses").forEach(((t5) => t5.remove())), (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
              }
              return "";
            }
            getTags() {
              return Array.from(this.document.querySelectorAll("a.discourse-tag")).map(((t3) => {
                var e3;
                return t3.getAttribute("data-tag-name") || (null === (e3 = t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
              })).filter(((t3) => t3));
            }
            getPublishedDate() {
              const t3 = this.document.querySelector('meta[property="article:published_time"]');
              if (t3) {
                const e3 = t3.getAttribute("content") || "";
                try {
                  return new Date(e3).toISOString().split("T")[0];
                } catch (t4) {
                }
              }
              return "";
            }
            getAuthor(t3) {
              var e3;
              const r3 = t3.querySelector(".names a[data-user-card]");
              return (null == r3 ? void 0 : r3.getAttribute("data-user-card")) || (null === (e3 = null == r3 ? void 0 : r3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
            }
            getPostDate(t3) {
              const e3 = t3.querySelector(".relative-date[data-time]");
              if (!e3) return "";
              const r3 = parseInt(e3.getAttribute("data-time") || "0");
              if (!r3) return "";
              try {
                return new Date(r3).toISOString().split("T")[0];
              } catch (t4) {
                return "";
              }
            }
            getPostPermalink(t3) {
              const e3 = t3.querySelector("a.post-date[href]");
              if (!e3) return "";
              const r3 = e3.getAttribute("href") || "";
              if (!r3) return "";
              try {
                return `${new URL(this.url).origin}${r3}`;
              } catch (t4) {
                return r3;
              }
            }
            getLikeCount(t3) {
              var e3;
              const r3 = t3.querySelector("button.like-count"), n3 = (null === (e3 = null == r3 ? void 0 : r3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
              return n3 ? `${n3} likes` : "";
            }
            getPostText(t3) {
              var e3;
              const r3 = t3.querySelector(".cooked");
              return r3 && (null === (e3 = r3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
            }
            extractPostContent(t3) {
              const e3 = t3.querySelector(".cooked");
              if (!e3) return "";
              const r3 = e3.cloneNode(true);
              return r3.querySelectorAll(".cooked-selection-barrier").forEach(((t4) => t4.remove())), r3.querySelectorAll("a.anchor").forEach(((t4) => t4.remove())), (0, o.serializeHTML)(r3);
            }
            extractComments(t3) {
              if (0 === t3.length) return "";
              const e3 = t3.map(((t4) => {
                const e4 = this.getAuthor(t4), r3 = this.extractPostContent(t4), n3 = this.getPostDate(t4), o2 = this.getPostPermalink(t4);
                return { author: e4, date: n3, content: r3, depth: 0, score: this.getLikeCount(t4) || void 0, url: o2 || void 0 };
              }));
              return (0, i.buildCommentTree)(e3);
            }
          }
          e2.DiscourseExtractor = s;
        }, 4732(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.GeminiExtractor = void 0;
          const n2 = r2(5181), o = r2(639);
          class i extends n2.ConversationExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.messageCount = null, this.conversationContainers = t3.querySelectorAll("div.conversation-container"), this.footnotes = [];
            }
            canExtract() {
              return !!this.conversationContainers && this.conversationContainers.length > 0;
            }
            extractMessages() {
              this.messageCount = 0;
              const t3 = [];
              return this.conversationContainers ? (this.extractSources(), this.conversationContainers.forEach(((e3) => {
                const r3 = e3.querySelector("user-query");
                if (r3) {
                  const e4 = r3.querySelector(".query-text");
                  if (e4) {
                    const r4 = (0, o.serializeHTML)(e4);
                    t3.push({ author: "You", content: r4.trim(), metadata: { role: "user" } });
                  }
                }
                const n3 = e3.querySelector("model-response");
                if (n3) {
                  const e4 = n3.querySelector(".model-response-text .markdown"), r4 = n3.querySelector("#extended-response-markdown-content") || e4;
                  if (r4) {
                    let e5 = (0, o.serializeHTML)(r4);
                    const n4 = this.document.createElement("div");
                    n4.appendChild((0, o.parseHTML)(this.document, e5)), n4.querySelectorAll(".table-content").forEach(((t4) => {
                      t4.classList.remove("table-content");
                    })), e5 = (0, o.serializeHTML)(n4), t3.push({ author: "Gemini", content: e5.trim(), metadata: { role: "assistant" } });
                  }
                }
              })), this.messageCount = t3.length, t3) : t3;
            }
            extractSources() {
              const t3 = this.document.querySelectorAll("browse-item");
              t3 && t3.length > 0 && t3.forEach(((t4) => {
                var e3, r3, n3, o2;
                const i2 = t4.querySelector("a");
                if (i2 instanceof HTMLAnchorElement) {
                  const t5 = i2.href, s = (null === (r3 = null === (e3 = i2.querySelector(".domain")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "", a = (null === (o2 = null === (n3 = i2.querySelector(".title")) || void 0 === n3 ? void 0 : n3.textContent) || void 0 === o2 ? void 0 : o2.trim()) || "";
                  t5 && (s || a) && this.footnotes.push({ url: t5, text: a ? `${s}: ${a}` : s });
                }
              }));
            }
            getFootnotes() {
              return this.footnotes;
            }
            getMetadata() {
              var t3;
              const e3 = this.getTitle(), r3 = null !== (t3 = this.messageCount) && void 0 !== t3 ? t3 : this.extractMessages().length;
              return { title: e3, site: "Gemini", url: this.url, messageCount: r3, description: `Gemini conversation with ${r3} messages` };
            }
            getTitle() {
              var t3, e3, r3, n3, o2;
              const i2 = null === (t3 = this.document.title) || void 0 === t3 ? void 0 : t3.trim();
              if (i2 && "Gemini" !== i2 && !i2.includes("Gemini")) return i2;
              const s = null === (r3 = null === (e3 = this.document.querySelector(".title-text")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim();
              if (s) return s;
              const a = null === (o2 = null === (n3 = this.conversationContainers) || void 0 === n3 ? void 0 : n3.item(0)) || void 0 === o2 ? void 0 : o2.querySelector(".query-text");
              if (a) {
                const t4 = a.textContent || "";
                return t4.length > 50 ? t4.slice(0, 50) + "..." : t4;
              }
              return "Gemini Conversation";
            }
          }
          e2.GeminiExtractor = i;
        }, 3588(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.GitHubExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.isIssue = /\/issues\/\d+/.test(e3), this.isPR = /\/pull\/\d+/.test(e3);
            }
            canExtract() {
              return !!['meta[name="expected-hostname"][content="github.com"]', 'meta[name="octolytics-url"]', 'meta[name="github-keyboard-shortcuts"]', ".js-header-wrapper", "#js-repo-pjax-container"].some(((t3) => null !== this.document.querySelector(t3))) && (this.isIssue ? ['[data-testid="issue-metadata-sticky"]', '[data-testid="issue-title"]'].some(((t3) => null !== this.document.querySelector(t3))) : !!this.isPR && [".pull-discussion-timeline", ".discussion-timeline", ".gh-header-title", ".js-issue-title"].some(((t3) => null !== this.document.querySelector(t3))));
            }
            extract() {
              const t3 = this.extractRepoInfo(), e3 = this.extractNumber(), r3 = this.isPR ? "pull" : "issue", n3 = this.isPR ? this.getPRBody() : null, { content: o2, author: i2, published: s2 } = this.isPR ? this.getPRContent(n3) : this.getIssueContent(), a = false !== this.options.includeReplies ? this.isPR ? this.extractPRComments(n3) : this.extractComments() : "", l = this.createContentHtml(o2, a);
              return { content: l, contentHtml: l, extractedContent: { type: r3, number: e3, repository: t3.repo, owner: t3.owner }, variables: { title: this.document.title, author: i2, published: s2, site: `GitHub - ${t3.owner}/${t3.repo}`, description: this.createDescription(l) } };
            }
            createContentHtml(t3, e3) {
              return (0, i.buildContentHtml)("github", t3, e3);
            }
            getIssueContent() {
              const t3 = this.document.querySelector('[data-testid="issue-viewer-issue-container"]');
              if (!t3) return { content: "", author: "", published: "" };
              const e3 = this.extractAuthor(t3, ['a[data-testid="issue-body-header-author"]', ".IssueBodyHeaderAuthor-module__authorLoginLink--_S7aT", ".ActivityHeader-module__AuthorLink--iofTU", 'a[href*="/users/"][data-hovercard-url*="/users/"]', 'a[aria-label*="profile"]']), r3 = t3.querySelector("relative-time"), n3 = (null == r3 ? void 0 : r3.getAttribute("datetime")) || "", o2 = t3.querySelector('[data-testid="issue-body-viewer"] .markdown-body');
              if (!o2) return { content: "", author: e3, published: n3 };
              return { content: this.cleanBodyContent(o2), author: e3, published: n3 };
            }
            extractComments() {
              const t3 = Array.from(this.document.querySelectorAll("[data-wrapper-timeline-id]")), e3 = /* @__PURE__ */ new Set(), r3 = [];
              for (const n3 of t3) {
                const t4 = n3.querySelector(".react-issue-comment");
                if (!t4) continue;
                const o2 = n3.getAttribute("data-wrapper-timeline-id");
                if (!o2 || e3.has(o2)) continue;
                e3.add(o2);
                const i2 = this.extractAuthor(t4, [".ActivityHeader-module__AuthorLink--iofTU", 'a[data-testid="avatar-link"]', 'a[href^="/"][data-hovercard-url*="/users/"]']), s2 = t4.querySelector("relative-time"), a = (null == s2 ? void 0 : s2.getAttribute("datetime")) || "", l = a ? new Date(a).toISOString().split("T")[0] : "", c = t4.querySelector(".markdown-body");
                if (!c) continue;
                const u = this.cleanBodyContent(c);
                u && r3.push({ author: i2, date: l, content: u });
              }
              return (0, i.buildCommentTree)(r3);
            }
            getPRBody() {
              return this.document.querySelector('[id^="pullrequest-"]') || this.document.querySelector(".timeline-comment");
            }
            getPRContent(t3) {
              var e3;
              const r3 = (null == t3 ? void 0 : t3.querySelector(".comment-body.markdown-body")) || this.document.querySelector(".comment-body.markdown-body"), n3 = r3 ? this.cleanBodyContent(r3) : "", o2 = (null == t3 ? void 0 : t3.querySelector(".author")) || this.document.querySelector(".gh-header-meta .author"), i2 = (null === (e3 = null == o2 ? void 0 : o2.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "", s2 = null == t3 ? void 0 : t3.querySelector("relative-time");
              return { content: n3, author: i2, published: (null == s2 ? void 0 : s2.getAttribute("datetime")) || "" };
            }
            extractPRComments(t3) {
              var e3;
              const r3 = Array.from(this.document.querySelectorAll(".timeline-comment, .review-comment")), n3 = [];
              for (const o2 of r3) {
                if (t3 && (o2 === t3 || t3.contains(o2))) continue;
                const r4 = o2.querySelector(".author"), i2 = (null === (e3 = null == r4 ? void 0 : r4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "", s2 = o2.querySelector("relative-time"), a = (null == s2 ? void 0 : s2.getAttribute("datetime")) || "", l = a ? new Date(a).toISOString().split("T")[0] : "", c = o2.querySelector(".comment-body.markdown-body");
                if (!c) continue;
                const u = this.cleanBodyContent(c);
                u && n3.push({ author: i2, date: l, content: u });
              }
              return (0, i.buildCommentTree)(n3);
            }
            extractAuthor(t3, e3) {
              for (const r3 of e3) {
                const e4 = t3.querySelector(r3);
                if (e4) {
                  const t4 = e4.getAttribute("href");
                  if (t4) {
                    if (t4.startsWith("/")) return t4.substring(1);
                    if (t4.includes("github.com/")) {
                      const e5 = t4.match(/github\.com\/([^\/\?#]+)/);
                      if (e5 && e5[1]) return e5[1];
                    }
                  }
                }
              }
              return "Unknown";
            }
            cleanBodyContent(t3) {
              const e3 = t3.cloneNode(true);
              return e3.querySelectorAll('button, [data-testid*="button"], [data-testid*="menu"]').forEach(((t4) => t4.remove())), e3.querySelectorAll(".js-clipboard-copy, .zeroclipboard-container").forEach(((t4) => t4.remove())), e3.querySelectorAll('div.highlight[class*="highlight-source-"] pre, div.highlight pre').forEach(((t4) => {
                const e4 = t4.parentElement;
                if (!e4) return;
                const r3 = e4.className.match(/highlight-source-(\w+)/), n3 = (null == r3 ? void 0 : r3[1]) || "", o2 = e4.getAttribute("data-snippet-clipboard-copy-content") || t4.textContent || "", i2 = this.document.createElement("code");
                n3 && (i2.setAttribute("class", `language-${n3}`), i2.setAttribute("data-lang", n3)), i2.textContent = o2;
                const s2 = this.document.createElement("pre");
                s2.appendChild(i2), e4.replaceWith(s2);
              })), (0, o.serializeHTML)(e3).trim();
            }
            extractNumber() {
              var t3;
              const e3 = this.url.match(/\/(issues|pull)\/(\d+)/);
              if (e3) return e3[2];
              const r3 = this.document.querySelector("h1"), n3 = null === (t3 = null == r3 ? void 0 : r3.textContent) || void 0 === t3 ? void 0 : t3.match(/#(\d+)/);
              return n3 ? n3[1] : "";
            }
            extractRepoInfo() {
              const t3 = this.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
              if (t3) return { owner: t3[1], repo: t3[2] };
              const e3 = this.document.title.match(/([^\/\s]+)\/([^\/\s]+)/);
              return e3 ? { owner: e3[1], repo: e3[2] } : { owner: "", repo: "" };
            }
            createDescription(t3) {
              var e3;
              if (!t3) return "";
              const r3 = this.document.createElement("div");
              return r3.appendChild((0, o.parseHTML)(this.document, t3)), (null === (e3 = r3.textContent) || void 0 === e3 ? void 0 : e3.trim().slice(0, 140).replace(/\s+/g, " ")) || "";
            }
          }
          e2.GitHubExtractor = s;
        }, 3020(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.GrokExtractor = void 0;
          const n2 = r2(5181), o = r2(639);
          class i extends n2.ConversationExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.messageContainerSelector = ".relative.group.flex.flex-col.justify-center.w-full", this.messageBubbles = t3.querySelectorAll(this.messageContainerSelector), this.footnotes = [], this.footnoteCounter = 0;
            }
            canExtract() {
              return !!this.messageBubbles && this.messageBubbles.length > 0;
            }
            extractMessages() {
              const t3 = [];
              return this.footnotes = [], this.footnoteCounter = 0, this.messageBubbles && 0 !== this.messageBubbles.length ? (this.messageBubbles.forEach(((e3) => {
                var r3;
                const n3 = e3.classList.contains("items-end"), i2 = e3.classList.contains("items-start");
                if (!n3 && !i2) return;
                const s = e3.querySelector(".message-bubble");
                if (!s) return;
                let a = "", l = "", c = "";
                if (n3) a = s.textContent || "", l = "user", c = "You";
                else if (i2) {
                  l = "assistant", c = "Grok";
                  const t4 = s.cloneNode(true);
                  null === (r3 = t4.querySelector(".relative.border.border-border-l1.bg-surface-base")) || void 0 === r3 || r3.remove(), a = (0, o.serializeHTML)(t4), a = this.processFootnotes(a);
                }
                a.trim() && t3.push({ author: c, content: a.trim(), metadata: { role: l } });
              })), t3) : t3;
            }
            getFootnotes() {
              return this.footnotes;
            }
            getMetadata() {
              var t3;
              const e3 = this.getTitle(), r3 = (null === (t3 = this.messageBubbles) || void 0 === t3 ? void 0 : t3.length) || 0;
              return { title: e3, site: "Grok", url: this.url, messageCount: r3, description: `Grok conversation with ${r3} messages` };
            }
            getTitle() {
              var t3, e3;
              const r3 = null === (t3 = this.document.title) || void 0 === t3 ? void 0 : t3.trim();
              if (r3 && "Grok" !== r3 && !r3.startsWith("Grok by ")) return r3.replace(/\s-\s*Grok$/, "").trim();
              const n3 = this.document.querySelector(`${this.messageContainerSelector}.items-end`);
              if (n3) {
                const t4 = n3.querySelector(".message-bubble");
                if (t4) {
                  const r4 = (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
                  return r4.length > 50 ? r4.slice(0, 50) + "..." : r4;
                }
              }
              return "Grok Conversation";
            }
            processFootnotes(t3) {
              return t3.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, ((t4, e3, r3) => {
                if (!e3 || e3.startsWith("#") || !e3.match(/^https?:\/\//i)) return t4;
                let n3;
                if (this.footnotes.find(((t5) => t5.url === e3))) n3 = this.footnotes.findIndex(((t5) => t5.url === e3)) + 1;
                else {
                  this.footnoteCounter++, n3 = this.footnoteCounter;
                  let t5 = e3;
                  try {
                    const r4 = new URL(e3).hostname.replace(/^www\./, "");
                    t5 = `<a href="${e3}" target="_blank" rel="noopener noreferrer">${r4}</a>`;
                  } catch (r4) {
                    t5 = `<a href="${e3}" target="_blank" rel="noopener noreferrer">${e3}</a>`, console.warn(`GrokExtractor: Could not parse URL for footnote: ${e3}`);
                  }
                  this.footnotes.push({ url: e3, text: t5 });
                }
                return `${r3}<sup id="fnref:${n3}" class="footnote-ref"><a href="#fn:${n3}" class="footnote-link">${n3}</a></sup>`;
              }));
            }
          }
          e2.GrokExtractor = i;
        }, 2458(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.HackerNewsExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.mainPost = t3.querySelector(".fatitem"), this.isListingPage = this.detectListingPage(), this.isCommentPage = this.detectCommentPage(), this.mainComment = this.isCommentPage ? this.findMainComment() : null;
            }
            detectListingPage() {
              if (this.mainPost) return false;
              return this.document.querySelectorAll("tr.athing").length > 1;
            }
            detectCommentPage() {
              var t3, e3;
              return !!(null === (t3 = this.mainPost) || void 0 === t3 ? void 0 : t3.querySelector(".onstory")) && !(null === (e3 = this.mainPost) || void 0 === e3 ? void 0 : e3.querySelector(".titleline"));
            }
            findMainComment() {
              var t3;
              return (null === (t3 = this.mainPost) || void 0 === t3 ? void 0 : t3.querySelector("tr.athing")) || null;
            }
            canExtract() {
              return !!this.mainPost || this.isListingPage;
            }
            extract() {
              if (this.isListingPage) return this.extractListing();
              const t3 = this.getPostContent(), e3 = false !== this.options.includeReplies ? this.extractComments() : "", r3 = this.createContentHtml(t3, e3), n3 = this.getPostTitle(), o2 = this.getPostAuthor(), i2 = this.createDescription(), s2 = this.getPostDate();
              return { content: r3, contentHtml: r3, extractedContent: { postId: this.getPostId(), postAuthor: o2 }, variables: { title: n3, author: o2, site: "Hacker News", description: i2, published: s2 } };
            }
            getMoreLink() {
              var t3;
              const e3 = this.document.querySelector(".morelink");
              if (!e3) return null;
              return { url: e3.getAttribute("href") || "", text: (null === (t3 = e3.textContent) || void 0 === t3 ? void 0 : t3.trim()) || "More" };
            }
            extractListing() {
              var t3;
              const e3 = this.extractStories(), r3 = this.getMoreLink(), n3 = this.buildListingHtml(e3, r3);
              return { content: n3, contentHtml: n3, extractedContent: {}, variables: { title: (null === (t3 = this.document.title) || void 0 === t3 ? void 0 : t3.replace(/\s*\|\s*Hacker News$/, "").trim()) || "Hacker News", site: "Hacker News" } };
            }
            extractStories() {
              var t3, e3, r3, n3, o2, i2, s2, a;
              const l = Array.from(this.document.querySelectorAll("tr.athing")), c = [];
              for (const u of l) {
                const l2 = u.getAttribute("id") || "", d = u.querySelector(".titleline a");
                if (!d) continue;
                const h = (null === (t3 = d.textContent) || void 0 === t3 ? void 0 : t3.trim()) || "", m = d.getAttribute("href") || "", f = (null === (r3 = null === (e3 = u.querySelector(".sitestr")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "", p = u.nextElementSibling, g = (null === (o2 = null === (n3 = null == p ? void 0 : p.querySelector(".score")) || void 0 === n3 ? void 0 : n3.textContent) || void 0 === o2 ? void 0 : o2.trim()) || "", v = (null === (s2 = null === (i2 = null == p ? void 0 : p.querySelector(".hnuser")) || void 0 === i2 ? void 0 : i2.textContent) || void 0 === s2 ? void 0 : s2.trim()) || "", y = null == p ? void 0 : p.querySelector(".age"), b = ((null == y ? void 0 : y.getAttribute("title")) || "").split("T")[0] || "", x = p ? Array.from(p.querySelectorAll("td.subtext a")) : [], C = x[x.length - 1], S = (null === (a = null == C ? void 0 : C.textContent) || void 0 === a ? void 0 : a.replace(/\u00a0/g, " ").trim()) || "", E = /\d+\s*comment/.test(S) ? S : "", A = l2 ? `https://news.ycombinator.com/item?id=${l2}` : "";
                c.push({ id: l2, title: h, url: m, site: f, score: g, author: v, date: b, comments: E, commentsUrl: A });
              }
              return c;
            }
            buildListingHtml(t3, e3) {
              if (0 === t3.length) return "";
              const r3 = t3.map(((t4) => {
                let e4 = "<li>";
                e4 += `<a href="${(0, o.escapeHtml)(t4.url)}">${(0, o.escapeHtml)(t4.title)}</a>`, t4.site && (e4 += ` <small>(${(0, o.escapeHtml)(t4.site)})</small>`);
                const r4 = [];
                return t4.score && r4.push((0, o.escapeHtml)(t4.score)), t4.author && r4.push(`by ${(0, o.escapeHtml)(t4.author)}`), t4.comments && r4.push(`<a href="${(0, o.escapeHtml)(t4.commentsUrl)}">${(0, o.escapeHtml)(t4.comments)}</a>`), r4.length > 0 && (e4 += `<br><small>${r4.join(" · ")}</small>`), e4 += "</li>", e4;
              }));
              let n3 = `<ol>${r3.join("")}</ol>`;
              return e3 && (n3 += `<p><a href="${(0, o.escapeHtml)(e3.url)}">${(0, o.escapeHtml)(e3.text)}</a></p>`), n3;
            }
            createContentHtml(t3, e3) {
              return (0, i.buildContentHtml)("hackernews", t3, e3);
            }
            getPostContent() {
              var t3, e3, r3, n3;
              if (!this.mainPost) return "";
              if (this.isCommentPage && this.mainComment) {
                const n4 = (null === (t3 = this.mainComment.querySelector(".hnuser")) || void 0 === t3 ? void 0 : t3.textContent) || "[deleted]", s3 = this.mainComment.querySelector(".commtext"), a2 = s3 ? (0, o.serializeHTML)(s3) : "", l2 = this.mainComment.querySelector(".age"), c2 = ((null == l2 ? void 0 : l2.getAttribute("title")) || "").split("T")[0] || "", u = (null === (r3 = null === (e3 = this.mainComment.querySelector(".score")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
                return (0, i.buildComment)({ author: n4, date: c2, content: a2, score: u || void 0 });
              }
              const s2 = this.mainPost.querySelector("tr.athing"), a = (null == s2 || s2.nextElementSibling, (null === (n3 = null == s2 ? void 0 : s2.querySelector(".titleline a")) || void 0 === n3 ? void 0 : n3.getAttribute("href")) || "");
              let l = "";
              a && (l += `<p><a href="${a}" target="_blank">${a}</a></p>`);
              const c = this.mainPost.querySelector(".toptext");
              return c && (l += `<div class="post-text">${(0, o.serializeHTML)(c)}</div>`), l;
            }
            extractComments() {
              const t3 = Array.from(this.document.querySelectorAll("tr.comtr"));
              return this.processComments(t3);
            }
            processComments(t3) {
              var e3, r3, n3, s2;
              const a = [], l = /* @__PURE__ */ new Set();
              for (const i2 of t3) {
                const t4 = i2.getAttribute("id");
                if (!t4 || l.has(t4)) continue;
                l.add(t4);
                const c = (null === (e3 = i2.querySelector(".ind img")) || void 0 === e3 ? void 0 : e3.getAttribute("width")) || "0", u = parseInt(c) / 40, d = i2.querySelector(".commtext"), h = (null === (r3 = i2.querySelector(".hnuser")) || void 0 === r3 ? void 0 : r3.textContent) || "[deleted]", m = i2.querySelector(".age"), f = (null === (s2 = null === (n3 = i2.querySelector(".score")) || void 0 === n3 ? void 0 : n3.textContent) || void 0 === s2 ? void 0 : s2.trim()) || "";
                if (!d) continue;
                const p = `https://news.ycombinator.com/item?id=${t4}`, g = ((null == m ? void 0 : m.getAttribute("title")) || "").split("T")[0] || "";
                a.push({ author: h, date: g, content: (0, o.serializeHTML)(d), depth: u, score: f || void 0, url: p });
              }
              return (0, i.buildCommentTree)(a);
            }
            getPostId() {
              const t3 = this.url.match(/id=(\d+)/);
              return (null == t3 ? void 0 : t3[1]) || "";
            }
            getPostTitle() {
              var t3, e3, r3, n3, o2;
              if (this.isCommentPage && this.mainComment) {
                const r4 = (null === (t3 = this.mainComment.querySelector(".hnuser")) || void 0 === t3 ? void 0 : t3.textContent) || "[deleted]", n4 = (null === (e3 = this.mainComment.querySelector(".commtext")) || void 0 === e3 ? void 0 : e3.textContent) || "";
                return `Comment by ${r4}: ${n4.trim().slice(0, 50) + (n4.length > 50 ? "..." : "")}`;
              }
              return (null === (o2 = null === (n3 = null === (r3 = this.mainPost) || void 0 === r3 ? void 0 : r3.querySelector(".titleline")) || void 0 === n3 ? void 0 : n3.textContent) || void 0 === o2 ? void 0 : o2.trim()) || "";
            }
            getPostAuthor() {
              var t3, e3, r3;
              return (null === (r3 = null === (e3 = null === (t3 = this.mainPost) || void 0 === t3 ? void 0 : t3.querySelector(".hnuser")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
            }
            createDescription() {
              const t3 = this.getPostTitle(), e3 = this.getPostAuthor();
              return this.isCommentPage ? `Comment by ${e3} on Hacker News` : `${t3} - by ${e3} on Hacker News`;
            }
            getPostDate() {
              if (!this.mainPost) return "";
              const t3 = this.mainPost.querySelector(".age");
              return ((null == t3 ? void 0 : t3.getAttribute("title")) || "").split("T")[0] || "";
            }
          }
          e2.HackerNewsExtractor = s;
        }, 7228(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.LeetCodeExtractor = void 0;
          const n2 = r2(2279);
          class o extends n2.BaseExtractor {
            canExtract() {
              return null !== this.document.querySelector('[data-track-load="description_content"]');
            }
            extract() {
              var t3;
              const e3 = (null === (t3 = this.document.querySelector('meta[property="og:title"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content")) || "";
              return { content: "", contentHtml: "", contentSelector: '[data-track-load="description_content"]', variables: { title: e3.replace(/\s*[-\u2013\u2014]\s*LeetCode\s*$/, "") || e3, site: "LeetCode" } };
            }
          }
          e2.LeetCodeExtractor = o;
        }, 8477(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.LinkedInExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              super(t3, e3, r3, n3), this.postArticle = t3.querySelector('[role="article"].feed-shared-update-v2');
            }
            canExtract() {
              return !!this.postArticle;
            }
            extract() {
              var t3;
              const e3 = this.getPostContent(), r3 = false !== this.options.includeReplies ? this.extractComments() : "", n3 = (0, i.buildContentHtml)("linkedin", e3, r3), o2 = this.getAuthorName(), s2 = this.createDescription();
              return { content: n3, contentHtml: n3, extractedContent: { postUrn: (null === (t3 = this.postArticle) || void 0 === t3 ? void 0 : t3.getAttribute("data-urn")) || "" }, variables: { title: this.postTitle(o2, "LinkedIn"), author: o2, site: "LinkedIn", description: s2 } };
            }
            getPostContent() {
              if (!this.postArticle) return "";
              const t3 = this.postArticle.querySelector(".feed-shared-update-v2__update-content-wrapper"), e3 = this.postArticle.querySelector(".update-components-text.update-components-update-v2__commentary"), r3 = !e3 || t3 && t3.contains(e3) ? "" : this.cleanTextContent(e3), n3 = this.extractImages(), o2 = this.extractVideo(), i2 = this.extractQuotedPost(t3);
              let s2 = "";
              return r3 && (s2 += r3), n3 && (s2 += `
${n3}`), o2 && (s2 += `
${o2}`), i2 && (s2 += `
${i2}`), s2;
            }
            getVisibleText(t3, e3) {
              var r3;
              const n3 = t3.cloneNode(true), o2 = e3 ? `.visually-hidden, ${e3}` : ".visually-hidden";
              return n3.querySelectorAll(o2).forEach(((t4) => t4.remove())), (null === (r3 = n3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
            }
            cleanTextContent(t3) {
              const e3 = t3.cloneNode(true);
              e3.querySelectorAll(".visually-hidden, .feed-shared-inline-show-more-text__see-more-less-toggle").forEach(((t4) => t4.remove())), e3.querySelectorAll("a").forEach(((t4) => {
                var e4;
                const r4 = t4.getAttribute("href") || "", n3 = (null === (e4 = t4.textContent) || void 0 === e4 ? void 0 : e4.trim()) || "";
                if (r4 && n3) {
                  const e5 = this.document.createElement("a");
                  e5.setAttribute("href", r4), e5.textContent = n3, t4.replaceWith(e5);
                } else t4.replaceWith(t4.textContent || "");
              })), e3.querySelectorAll("span, div").forEach(((t4) => {
                t4.replaceWith(...Array.from(t4.childNodes));
              }));
              let r3 = (0, o.serializeHTML)(e3).trim();
              r3 = r3.replace(/<!--.*?-->/g, "");
              return r3.split(/(?:<br\s*\/?>\s*){2,}|\n{2,}/).map(((t4) => t4.replace(/<br\s*\/?>/g, " ").replace(/\s+/g, " ").trim())).filter(((t4) => t4)).map(((t4) => `<p>${t4}</p>`)).join("\n");
            }
            extractQuotedPost(t3) {
              var e3;
              if (!t3) return "";
              const r3 = t3.querySelector(".update-components-actor__title"), n3 = r3 ? this.getVisibleText(r3, ".update-components-actor__supplementary-actor-info, .text-view-model__verified-icon") : "", o2 = t3.querySelector(".update-components-actor__sub-description");
              let s2 = "";
              if (o2) {
                const t4 = ((null === (e3 = (o2.querySelector('[aria-hidden="true"]') || o2).textContent) || void 0 === e3 ? void 0 : e3.trim()) || "").match(/^(\d+\w+)/);
                s2 = t4 ? t4[1] : "";
              }
              const a = t3.querySelector(".update-components-text.update-components-update-v2__commentary"), l = a ? this.cleanTextContent(a) : "", c = t3.querySelector("a.update-components-mini-update-v2__link-to-details-page"), u = (null == c ? void 0 : c.getAttribute("href")) || "", d = u ? (u.startsWith("http") ? u : `https://www.linkedin.com${u}`).split("?")[0] : "";
              return (0, i.buildQuotedPost)({ author: n3 || void 0, date: s2 || void 0, content: l, url: d || void 0 });
            }
            extractImages() {
              if (!this.postArticle) return "";
              const t3 = [];
              return this.postArticle.querySelectorAll(".update-components-image img, .feed-shared-image img").forEach(((e3) => {
                const r3 = e3.getAttribute("src") || "", n3 = e3.getAttribute("alt") || "";
                !r3 || r3.includes("profile-displayphoto") || r3.includes("avm-avatar") || t3.push(`<img src="${(0, o.escapeHtml)(r3)}" alt="${(0, o.escapeHtml)(n3)}" />`);
              })), t3.join("\n");
            }
            extractVideo() {
              if (!this.postArticle) return "";
              const t3 = this.postArticle.querySelector(".update-components-linkedin-video video[poster]");
              if (!t3) return "";
              const e3 = t3.getAttribute("poster") || "";
              return `<img src="${(0, o.escapeHtml)(e3)}" alt="Video thumbnail" />`;
            }
            extractComments() {
              if (!this.postArticle) return "";
              const t3 = [], e3 = this.postArticle.querySelectorAll("article.comments-comment-entity:not(.comments-comment-entity--reply)");
              for (const r3 of Array.from(e3)) {
                const e4 = this.extractCommentData(r3, 0);
                e4 && t3.push(e4);
                const n3 = r3.querySelectorAll(".comments-replies-list article.comments-comment-entity--reply");
                for (const e5 of Array.from(n3)) {
                  const r4 = this.extractCommentData(e5, 1);
                  r4 && t3.push(r4);
                }
              }
              return t3.length > 0 ? (0, i.buildCommentTree)(t3) : "";
            }
            extractCommentData(t3, e3) {
              var r3, n3, o2, i2, s2;
              const a = (null === (n3 = null === (r3 = t3.querySelector(".comments-comment-meta__description-title")) || void 0 === r3 ? void 0 : r3.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "";
              if (!a) return null;
              const l = t3.querySelector(".comments-comment-entity__content .update-components-text"), c = l ? this.cleanTextContent(l) : "", u = t3.querySelector("time.comments-comment-meta__data"), d = (null === (o2 = null == u ? void 0 : u.textContent) || void 0 === o2 ? void 0 : o2.trim()) || "", h = t3.querySelector("a.comments-comment-meta__description-container"), m = (null === (i2 = null == h ? void 0 : h.getAttribute("href")) || void 0 === i2 ? void 0 : i2.split("?")[0]) || "";
              let f = "";
              m && (f = m.startsWith("http") ? m : `https://www.linkedin.com${m}`);
              const p = t3.querySelector(".comments-comment-social-bar__reactions-count--cr span.v-align-middle"), g = (null === (s2 = null == p ? void 0 : p.textContent) || void 0 === s2 ? void 0 : s2.trim()) || "";
              return { author: a, date: d, content: c, depth: e3, score: g ? `${g} reactions` : void 0, url: f || void 0 };
            }
            getAuthorName() {
              if (!this.postArticle) return "";
              const t3 = this.postArticle.querySelector(".update-components-actor__title");
              return t3 ? this.getVisibleText(t3, ".text-view-model__verified-icon, .update-components-actor__supplementary-actor-info") : "";
            }
            createDescription() {
              if (!this.postArticle) return "";
              const t3 = this.postArticle.querySelector(".feed-shared-update-v2__update-content-wrapper"), e3 = this.postArticle.querySelector(".update-components-text.update-components-update-v2__commentary");
              return !e3 || t3 && t3.contains(e3) ? "" : this.getVisibleText(e3).slice(0, 140).replace(/\s+/g, " ");
            }
          }
          e2.LinkedInExtractor = s;
        }, 7278(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.LwnExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            canExtract() {
              return !!this.document.querySelector(".PageHeadline") && !!this.document.querySelector(".ArticleText");
            }
            extract() {
              var t3, e3, r3, n3, o2, s2;
              const a = this.document.querySelector(".ArticleText main"), l = a ? this.getArticleContent(a) : "", c = false !== this.options.includeReplies && a ? this.extractComments(a) : "", u = (0, i.buildContentHtml)("lwn", l, c), d = (null === (e3 = null === (t3 = this.document.querySelector(".Byline")) || void 0 === t3 ? void 0 : t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
              return { content: u, contentHtml: u, extractedContent: {}, variables: { title: (null === (n3 = null === (r3 = this.document.querySelector(".PageHeadline h1")) || void 0 === r3 ? void 0 : r3.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "", author: (null === (o2 = d.match(/by\s+(\w+)/i)) || void 0 === o2 ? void 0 : o2[1]) || "", site: "LWN.net", published: this.parseDate(d), description: (null === (s2 = this.document.querySelector('meta[property="og:description"]')) || void 0 === s2 ? void 0 : s2.getAttribute("content")) || "" } };
            }
            parseDate(t3) {
              const e3 = t3.match(/Posted\s+(\w+\s+\d+,\s+\d{4})/);
              if (!e3) return "";
              const r3 = new Date(e3[1]);
              return isNaN(r3.getTime()) ? "" : r3.toISOString().split("T")[0];
            }
            getArticleContent(t3) {
              const e3 = t3.cloneNode(true);
              for (const t4 of Array.from(e3.querySelectorAll('details.CommentBox, form, a[name^="Comm"]'))) t4.remove();
              let r3 = e3.lastElementChild;
              for (; r3 && ("HR" === r3.tagName || "BR" === r3.tagName && r3.getAttribute("clear")); ) {
                const t4 = r3.previousElementSibling;
                r3.remove(), r3 = t4;
              }
              return (0, o.serializeHTML)(e3);
            }
            extractComments(t3) {
              const e3 = Array.from(t3.querySelectorAll("details.CommentBox")), r3 = [];
              for (const n3 of e3) {
                const e4 = this.getCommentDepth(n3, t3), o2 = this.extractCommentData(n3, e4);
                o2 && r3.push(o2);
              }
              return r3.length > 0 ? (0, i.buildCommentTree)(r3) : "";
            }
            getCommentDepth(t3, e3) {
              let r3 = 0, n3 = t3.parentElement;
              for (; n3 && n3 !== e3; ) "DETAILS" === n3.tagName && n3.classList.contains("CommentBox") && r3++, n3 = n3.parentElement;
              return r3;
            }
            extractCommentData(t3, e3) {
              var r3, n3, o2, i2, s2, a, l;
              const c = t3.querySelector(":scope > summary .CommentPoster");
              if (!c) return null;
              const u = (null === (n3 = null === (r3 = c.querySelector("b")) || void 0 === r3 ? void 0 : r3.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "", d = c.querySelector('a[href^="/Articles/"]'), h = (null == d ? void 0 : d.getAttribute("href")) || "", m = h ? `https://lwn.net${h}` : "", f = this.parseDate(c.textContent || ""), p = (null === (i2 = null === (o2 = t3.querySelector(":scope > summary h3.CommentTitle")) || void 0 === o2 ? void 0 : o2.textContent) || void 0 === i2 ? void 0 : i2.trim()) || "", g = null === (s2 = t3.parentElement) || void 0 === s2 ? void 0 : s2.closest("details.CommentBox"), v = (null === (l = null === (a = null == g ? void 0 : g.querySelector(":scope > summary h3.CommentTitle")) || void 0 === a ? void 0 : a.textContent) || void 0 === l ? void 0 : l.trim()) || "", y = p && p !== v ? p : "";
              return { author: u, date: f, content: this.getCommentContent(t3, y), depth: e3, url: m };
            }
            getCommentContent(t3, e3) {
              var r3, n3;
              let i2 = "";
              e3 && (i2 += `<p><strong>${(0, o.escapeHtml)(e3)}</strong></p>`);
              const s2 = t3.querySelector(":scope > .FormattedComment");
              if (s2) i2 += (0, o.serializeHTML)(s2);
              else {
                const e4 = this.document.createElement("div");
                for (const o2 of Array.from(t3.childNodes)) {
                  if (1 === o2.nodeType) {
                    const t4 = o2, e5 = t4.tagName;
                    if ("SUMMARY" === e5 || "DETAILS" === e5 || t4.classList.contains("CommentReplyButton")) continue;
                    if ("FORM" === e5) continue;
                    if ("A" === e5 && (null === (r3 = t4.getAttribute("name")) || void 0 === r3 ? void 0 : r3.startsWith("CommAnchor"))) continue;
                    if ("P" === e5 && !(null === (n3 = t4.textContent) || void 0 === n3 ? void 0 : n3.trim())) continue;
                  }
                  e4.appendChild(o2.cloneNode(true));
                }
                const s3 = (0, o.serializeHTML)(e4).trim();
                s3 && (i2 += s3);
              }
              return i2;
            }
          }
          e2.LwnExtractor = s;
        }, 9964(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.MastodonExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              super(t3, e3, r3, n3), this.mainPost = null, this.replyStatuses = [], this.mainPost = t3.querySelector(".detailed-status__wrapper");
              const o2 = Array.from(t3.querySelectorAll(".status__wrapper"));
              this.replyStatuses = o2.filter(((t4) => !!t4.querySelector(".status[data-id]")));
            }
            canExtract() {
              if (!this.mainPost) return false;
              if (this.document.getElementById("mastodon")) return true;
              const t3 = this.document.querySelector("script#initial-state");
              if (t3) {
                const e3 = t3.textContent || "";
                if (e3.includes("mastodon/mastodon") || e3.includes('"mastodon"')) return true;
              }
              return Array.from(this.document.querySelectorAll('link[rel="stylesheet"]')).some(((t4) => (t4.getAttribute("href") || "").includes("mastodon")));
            }
            extract() {
              var t3;
              const e3 = this.getFullHandle(this.mainPost), r3 = e3.split("@")[0], n3 = this.getDisplayName(this.mainPost), o2 = [], s2 = [];
              let a = false;
              for (const t4 of this.replyStatuses) {
                const e4 = this.getFullHandle(t4).split("@")[0];
                a || e4 !== r3 ? (a = true, s2.push(t4)) : o2.push(t4);
              }
              const l = [this.extractPostContent(this.mainPost), ...o2.map(((t4) => this.extractPostContent(t4)))].filter(Boolean).join("\n<hr>\n"), c = false !== this.options.includeReplies ? this.extractComments(s2) : "", u = (0, i.buildContentHtml)("mastodon", l, c), d = n3 || `@${e3}`, h = this.getDescription(), m = this.getPublishedDate(), f = (null === (t3 = this.document.querySelector('meta[property="og:site_name"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content")) || "", p = this.postTitle(d, f || "Mastodon");
              return { content: u, contentHtml: u, extractedContent: { postAuthor: e3 }, variables: Object.assign({ title: p, author: d, site: f || "Mastodon", description: h }, m && { published: m }) };
            }
            getFullHandle(t3) {
              var e3;
              const r3 = t3.querySelector(".display-name__account");
              return ((null === (e3 = null == r3 ? void 0 : r3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "").replace(/^@/, "");
            }
            getDisplayName(t3) {
              var e3;
              const r3 = t3.querySelector(".display-name__html");
              if (!r3) return "";
              const n3 = r3.cloneNode(true);
              return this.replaceEmojiImages(n3), (null === (e3 = n3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
            }
            getReplyDate(t3) {
              const e3 = t3.querySelector("time[datetime]");
              if (!e3) return "";
              const r3 = e3.getAttribute("datetime") || "";
              try {
                return new Date(r3).toISOString().split("T")[0];
              } catch (t4) {
                return "";
              }
            }
            getReplyPermalink(t3) {
              const e3 = t3.querySelector("a.status__relative-time[href]");
              if (!e3) return "";
              const r3 = e3.getAttribute("href") || "";
              if (!r3) return "";
              try {
                const t4 = new URL(this.url);
                return r3.startsWith("http") ? r3 : `${t4.origin}${r3}`;
              } catch (t4) {
                return r3;
              }
            }
            getPublishedDate() {
              const t3 = this.document.querySelector('meta[property="og:published_time"]');
              if (t3) {
                const e3 = t3.getAttribute("content") || "";
                try {
                  return new Date(e3).toISOString().split("T")[0];
                } catch (t4) {
                }
              }
              if (this.mainPost) {
                const t4 = this.mainPost.querySelector("time[datetime]");
                if (t4) try {
                  return new Date(t4.getAttribute("datetime") || "").toISOString().split("T")[0];
                } catch (t5) {
                }
              }
              return "";
            }
            getDescription() {
              if (!this.mainPost) return "";
              const t3 = this.mainPost.querySelector(".status__content__text");
              return t3 ? (t3.textContent || "").trim().slice(0, 140).replace(/\s+/g, " ") : "";
            }
            extractPostContent(t3) {
              const e3 = [], r3 = this.extractTextContent(t3.querySelector(".status__content"));
              r3 && e3.push(r3);
              const n3 = this.extractImages(t3);
              n3 && e3.push(n3);
              const o2 = this.extractLinkCard(t3);
              return o2 && e3.push(o2), e3.join("\n");
            }
            extractTextContent(t3) {
              if (!t3) return "";
              const e3 = t3.querySelector(".status__content__text");
              if (!e3) return "";
              const r3 = e3.cloneNode(true);
              return this.replaceEmojiImages(r3), r3.querySelectorAll("span.invisible").forEach(((t4) => t4.remove())), r3.querySelectorAll("span").forEach(((t4) => {
                t4.replaceWith(...Array.from(t4.childNodes));
              })), (r3.innerHTML || r3.textContent || "").trim();
            }
            replaceEmojiImages(t3) {
              t3.querySelectorAll("img.emojione").forEach(((t4) => {
                const e3 = t4.getAttribute("alt") || "";
                e3 ? t4.replaceWith(t4.ownerDocument.createTextNode(e3)) : t4.remove();
              }));
            }
            extractImages(t3) {
              const e3 = t3.querySelector(".media-gallery");
              if (!e3) return "";
              const r3 = [];
              return e3.querySelectorAll(".media-gallery__item-thumbnail").forEach(((t4) => {
                const e4 = t4.getAttribute("href") || "", n3 = t4.querySelector("img"), i2 = (null == n3 ? void 0 : n3.getAttribute("alt")) || "";
                e4 && r3.push(`<img src="${(0, o.escapeHtml)(e4)}" alt="${(0, o.escapeHtml)(i2)}" />`);
              })), r3.join("\n");
            }
            extractLinkCard(t3) {
              var e3, r3, n3, i2;
              const s2 = t3.querySelector("a.status-card[href]");
              if (!s2) return "";
              const a = s2.getAttribute("href") || "", l = (null === (r3 = null === (e3 = s2.querySelector(".status-card__title")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "", c = (null === (i2 = null === (n3 = s2.querySelector(".status-card__description")) || void 0 === n3 ? void 0 : n3.textContent) || void 0 === i2 ? void 0 : i2.trim()) || "", u = s2.querySelector(".status-card__image-image");
              if (!l && !a) return "";
              let d = "";
              if (u) {
                const t4 = u.getAttribute("src") || "";
                t4 && (d += `<a href="${(0, o.escapeHtml)(a)}"><img src="${(0, o.escapeHtml)(t4)}" alt="${(0, o.escapeHtml)(l)}" /></a>
`);
              }
              return d += `<p><a href="${(0, o.escapeHtml)(a)}">${(0, o.escapeHtml)(l || a)}</a></p>`, c && (d += `
<p>${(0, o.escapeHtml)(c)}</p>`), d;
            }
            extractComments(t3) {
              if (0 === t3.length) return "";
              let e3 = 0;
              const r3 = t3.map(((t4, r4) => {
                const n3 = this.getFullHandle(t4), o2 = this.getDisplayName(t4), i2 = this.extractPostContent(t4), s2 = this.getReplyDate(t4), a = this.getReplyPermalink(t4);
                return t4.querySelector(".status--first-in-thread") || 0 === r4 ? e3 = 0 : e3++, { author: o2 ? `${o2} @${n3}` : `@${n3}`, date: s2, content: i2, depth: e3, url: a || void 0 };
              }));
              return (0, i.buildCommentTree)(r3);
            }
          }
          e2.MastodonExtractor = s;
        }, 1756(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.MediumExtractor = void 0;
          const n2 = r2(2279);
          class o extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              super(t3, e3, r3, n3), this.article = t3.querySelector("article.meteredContent") || t3.querySelector("article");
            }
            canExtract() {
              var t3, e3, r3;
              if (!this.article) return false;
              if (null === (t3 = this.article.classList) || void 0 === t3 ? void 0 : t3.contains("meteredContent")) return true;
              const n3 = (null === (e3 = this.document.querySelector('meta[property="og:site_name"]')) || void 0 === e3 ? void 0 : e3.getAttribute("content")) || "", o2 = (null === (r3 = this.document.querySelector('meta[property="al:android:app_name"]')) || void 0 === r3 ? void 0 : r3.getAttribute("content")) || "";
              return "Medium" === n3 || "Medium" === o2;
            }
            extract() {
              const t3 = this.getTitle(), e3 = this.getSubtitle(), r3 = this.getAuthor(), n3 = this.getPublication();
              this.cleanArticle();
              return { content: "", contentHtml: "", contentSelector: "article", extractedContent: { publication: n3 }, variables: { title: t3, author: r3, site: n3 || "Medium", description: e3 || this.getDescription() } };
            }
            cleanArticle() {
              if (!this.article) return;
              this.article.querySelectorAll('figure [role="button"]').forEach(((t4) => {
                t4.replaceWith(...Array.from(t4.childNodes));
              })), this.article.querySelectorAll('[role="tooltip"]').forEach(((t4) => {
                t4.removeAttribute("role");
              })), this.article.querySelectorAll('a[href*="medium.com/plans"]').forEach(((t4) => {
                const e3 = t4.closest("div");
                e3 && e3 !== this.article ? e3.remove() : t4.remove();
              })), this.article.querySelectorAll('[data-testid="post-preview"]').forEach(((t4) => t4.remove())), this.article.querySelectorAll('[data-testid*="Clap"], [data-testid*="Bookmark"], [data-testid*="Share"], [data-testid*="Response"]').forEach(((t4) => t4.remove())), this.article.querySelectorAll('[data-testid="authorPhoto"], [data-testid="authorName"], [data-testid="storyReadTime"]').forEach(((t4) => t4.remove()));
              const t3 = /* @__PURE__ */ new Set(["Member-only story", "Listen", "Share", "Top highlight", "·", "Press enter or click to view image in full size"]);
              this.article.querySelectorAll("p, span, div").forEach(((e3) => {
                var r3;
                const n3 = (null === (r3 = e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
                n3 && (t3.has(n3) || /^\w{3}\s+\d{1,2},\s+\d{4}/.test(n3) && n3.length < 30 || /^\xb7\s*\d+\s*\w+\s*ago$/.test(n3) || /^\xb7?\s*\d+\s*min\s*read$/.test(n3)) && e3.remove();
              }));
            }
            getTitle() {
              var t3, e3, r3, n3;
              const o2 = this.document.querySelector('[data-testid="storyTitle"]');
              return o2 ? (null === (t3 = o2.textContent) || void 0 === t3 ? void 0 : t3.trim()) || "" : (null === (n3 = null === (r3 = null === (e3 = this.article) || void 0 === e3 ? void 0 : e3.querySelector("h1")) || void 0 === r3 ? void 0 : r3.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "";
            }
            getSubtitle() {
              var t3, e3;
              return (null === (e3 = null === (t3 = this.document.querySelector(".pw-subtitle-paragraph")) || void 0 === t3 ? void 0 : t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
            }
            getAuthor() {
              var t3, e3;
              return (null === (e3 = null === (t3 = this.document.querySelector('[data-testid="authorName"]')) || void 0 === t3 ? void 0 : t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
            }
            getPublication() {
              var t3;
              const e3 = this.document.querySelector('meta[property="og:site_name"]'), r3 = (null == e3 ? void 0 : e3.getAttribute("content")) || "";
              if (r3 && "Medium" !== r3) return r3;
              const n3 = Array.isArray(this.schemaOrgData) ? this.schemaOrgData : [this.schemaOrgData];
              for (const e4 of n3) if (null === (t3 = null == e4 ? void 0 : e4.publisher) || void 0 === t3 ? void 0 : t3.name) return e4.publisher.name;
              return "";
            }
            getDescription() {
              var t3;
              if (!this.article) return "";
              const e3 = this.article.querySelectorAll("p");
              for (const r3 of Array.from(e3)) {
                const e4 = (null === (t3 = r3.textContent) || void 0 === t3 ? void 0 : t3.trim()) || "";
                if (!(e4.length < 3 || /^[\d\W]+$/.test(e4))) return e4.slice(0, 140).replace(/\s+/g, " ");
              }
              return "";
            }
          }
          e2.MediumExtractor = o;
        }, 8090(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.NytimesExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = "data-defuddle-nyt";
          class s extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              var s2;
              if (super(t3, e3, r3, n3), this.preloadedData = null, this.contentSelector = null, this.preloadedData = this.extractPreloadData(), this.preloadedData) {
                const e4 = this.preloadedData.sprinkledBody || this.preloadedData.body;
                if (null === (s2 = null == e4 ? void 0 : e4.content) || void 0 === s2 ? void 0 : s2.length) {
                  if (!t3.querySelector(`[${i}]`)) {
                    const r4 = t3.createElement("div");
                    r4.setAttribute(i, ""), r4.appendChild((0, o.parseHTML)(t3, this.renderBlocks(e4.content))), t3.body.appendChild(r4);
                  }
                  this.contentSelector = `[${i}]`;
                }
              }
            }
            canExtract() {
              return null !== this.contentSelector;
            }
            extract() {
              var t3, e3, r3;
              const n3 = this.preloadedData, o2 = (null === (t3 = n3.headline) || void 0 === t3 ? void 0 : t3.default) || "", i2 = ((null === (r3 = null === (e3 = n3.bylines) || void 0 === e3 ? void 0 : e3[0]) || void 0 === r3 ? void 0 : r3.creators) || []).map(((t4) => t4.displayName)).filter(Boolean).join(", "), s2 = n3.firstPublished || "", a = n3.summary || "";
              return { content: "", contentHtml: "", contentSelector: this.contentSelector, variables: { title: o2, author: i2, published: s2, description: a } };
            }
            extractPreloadData() {
              var t3, e3;
              const r3 = this.document.querySelectorAll("script:not([src])");
              for (const n3 of r3) {
                const r4 = n3.textContent || "";
                if (!r4.includes("window.__preloadedData")) continue;
                const o2 = r4.match(/window\.__preloadedData\s*=\s*({[\s\S]+})\s*;?\s*$/);
                if (o2) try {
                  const r5 = o2[1].replace(/(?<=:)undefined(?=[,}\]])/g, "null");
                  return (null === (e3 = null === (t3 = JSON.parse(r5).initialData) || void 0 === t3 ? void 0 : t3.data) || void 0 === e3 ? void 0 : e3.article) || null;
                } catch (t4) {
                  return null;
                }
              }
              return null;
            }
            renderBlocks(t3) {
              var e3, r3, n3;
              const o2 = [];
              for (const i2 of t3) switch (i2.__typename) {
                case "ParagraphBlock":
                  o2.push(`<p>${this.renderInlines(i2.content)}</p>`);
                  break;
                case "Heading2Block":
                  o2.push(`<h2>${this.renderInlines(i2.content)}</h2>`);
                  break;
                case "Heading3Block":
                  o2.push(`<h3>${this.renderInlines(i2.content)}</h3>`);
                  break;
                case "Heading4Block":
                  o2.push(`<h4>${this.renderInlines(i2.content)}</h4>`);
                  break;
                case "ImageBlock": {
                  const t4 = i2.media;
                  if (!t4) break;
                  const n4 = this.getBestImageUrl(t4);
                  if (!n4) break;
                  const s2 = this.escapeAttr(t4.altText || (null === (e3 = t4.caption) || void 0 === e3 ? void 0 : e3.text) || ""), a = [(null === (r3 = t4.caption) || void 0 === r3 ? void 0 : r3.text) || "", t4.credit || ""].filter(Boolean);
                  a.length ? o2.push(`<figure><img src="${this.escapeAttr(n4)}" alt="${s2}"><figcaption>${this.escapeHtml(a.join(" "))}</figcaption></figure>`) : o2.push(`<img src="${this.escapeAttr(n4)}" alt="${s2}">`);
                  break;
                }
                case "HeaderBasicBlock":
                case "Dropzone":
                  break;
                default: {
                  const t4 = i2;
                  (null === (n3 = t4.content) || void 0 === n3 ? void 0 : n3.length) && o2.push(`<p>${this.renderInlines(t4.content)}</p>`);
                  break;
                }
              }
              return o2.join("\n");
            }
            renderInlines(t3) {
              return t3 ? t3.map(((t4) => {
                var e3;
                let r3 = this.escapeHtml(t4.text || "");
                if (!(null === (e3 = t4.formats) || void 0 === e3 ? void 0 : e3.length)) return r3;
                for (const e4 of t4.formats) switch (e4.__typename) {
                  case "BoldFormat":
                    r3 = `<strong>${r3}</strong>`;
                    break;
                  case "ItalicFormat":
                    r3 = `<em>${r3}</em>`;
                    break;
                  case "LinkFormat":
                    e4.url && (r3 = `<a href="${this.escapeAttr(e4.url)}">${r3}</a>`);
                }
                return r3;
              })).join("") : "";
            }
            getBestImageUrl(t3) {
              var e3, r3;
              const n3 = null == t3 ? void 0 : t3.crops;
              if (!(null == n3 ? void 0 : n3.length)) return null;
              const o2 = ["superJumbo", "jumbo", "articleLarge"];
              for (const t4 of o2) for (const r4 of n3) {
                const n4 = null === (e3 = r4.renditions) || void 0 === e3 ? void 0 : e3.find(((e4) => e4.name === t4));
                if (null == n4 ? void 0 : n4.url) return n4.url;
              }
              for (const t4 of n3) if ((null === (r3 = t4.renditions) || void 0 === r3 ? void 0 : r3.length) && t4.renditions[0].url) return t4.renditions[0].url;
              return null;
            }
            escapeHtml(t3) {
              return t3.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }
            escapeAttr(t3) {
              return t3.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }
          }
          e2.NytimesExtractor = s;
        }, 5959(t2, e2, r2) {
          var n2 = this && this.__awaiter || function(t3, e3, r3, n3) {
            return new (r3 || (r3 = Promise))((function(o2, i2) {
              function s2(t4) {
                try {
                  l(n3.next(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function a2(t4) {
                try {
                  l(n3.throw(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function l(t4) {
                var e4;
                t4.done ? o2(t4.value) : (e4 = t4.value, e4 instanceof r3 ? e4 : new r3((function(t5) {
                  t5(e4);
                }))).then(s2, a2);
              }
              l((n3 = n3.apply(t3, e3 || [])).next());
            }));
          };
          Object.defineProperty(e2, "__esModule", { value: true }), e2.RedditExtractor = void 0;
          const o = r2(2279), i = r2(639), s = r2(6077);
          class a extends o.BaseExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.shredditPost = t3.querySelector("shreddit-post"), this.isOldReddit = !!t3.querySelector(".thing.link");
            }
            canExtract() {
              return !!this.shredditPost || this.isOldReddit;
            }
            canExtractAsync() {
              return this.isCommentsPage() && !this.isOldReddit;
            }
            prefersAsync() {
              const t3 = "undefined" != typeof window && this.document.defaultView === window;
              return this.isCommentsPage() && !this.isOldReddit && !t3;
            }
            isCommentsPage() {
              return /\/r\/.+\/comments\//.test(this.url);
            }
            extractAsync() {
              return n2(this, void 0, void 0, (function* () {
                var t3, e3;
                const r3 = new URL(this.url);
                r3.hostname = "old.reddit.com";
                const n3 = yield this.fetch(r3.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; Defuddle/1.0)" } });
                if (!n3.ok) throw new Error(`Failed to fetch old.reddit.com: ${n3.status}`);
                const o2 = yield n3.text(), i2 = null !== (e3 = null === (t3 = this.document.defaultView) || void 0 === t3 ? void 0 : t3.DOMParser) && void 0 !== e3 ? e3 : "undefined" != typeof DOMParser ? DOMParser : null;
                if (!i2) throw new Error("DOMParser is not available in this environment");
                const s2 = new i2().parseFromString(o2, "text/html");
                return this.extractOldReddit(s2);
              }));
            }
            extract() {
              var t3, e3;
              if (this.isOldReddit) return this.extractOldReddit(this.document);
              const r3 = (null === (e3 = null === (t3 = this.document.querySelector("h1")) || void 0 === t3 ? void 0 : t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "", n3 = this.getSubreddit(), o2 = this.getPostAuthor(), i2 = this.getPostContent(), s2 = this.createDescription(i2), a2 = false !== this.options.includeReplies ? this.extractComments() : "", l = this.createContentHtml(i2, a2);
              return { content: l, contentHtml: l, extractedContent: { postId: this.getPostId(), subreddit: n3, postAuthor: o2 }, variables: { title: r3, author: o2, site: `r/${n3}`, description: s2 } };
            }
            extractOldReddit(t3) {
              var e3, r3;
              const n3 = t3.querySelector(".thing.link"), o2 = (null === (r3 = null === (e3 = null == n3 ? void 0 : n3.querySelector("a.title")) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "", a2 = (null == n3 ? void 0 : n3.getAttribute("data-author")) || "", l = (null == n3 ? void 0 : n3.getAttribute("data-subreddit")) || "", c = null == n3 ? void 0 : n3.querySelector(".usertext-body .md"), u = c ? (0, i.serializeHTML)(c) : "";
              let d = "";
              if (false !== this.options.includeReplies) {
                const e4 = t3.querySelector(".commentarea .sitetable"), r4 = e4 ? this.collectOldRedditComments(e4) : [];
                d = r4.length > 0 ? (0, s.buildCommentTree)(r4) : "";
              }
              const h = this.createContentHtml(u, d), m = this.createDescription(u);
              return { content: h, contentHtml: h, extractedContent: { postId: this.getPostId(), subreddit: l, postAuthor: a2 }, variables: { title: o2, author: a2, site: `r/${l}`, description: m } };
            }
            getPostContent() {
              var t3, e3, r3;
              const n3 = null === (t3 = this.shredditPost) || void 0 === t3 ? void 0 : t3.querySelector('[slot="text-body"]');
              return (n3 ? (0, i.serializeHTML)(n3) : "") + ((null === (r3 = null === (e3 = this.shredditPost) || void 0 === e3 ? void 0 : e3.querySelector("#post-image")) || void 0 === r3 ? void 0 : r3.outerHTML) || "");
            }
            createContentHtml(t3, e3) {
              return (0, s.buildContentHtml)("reddit", t3, e3);
            }
            extractComments() {
              const t3 = Array.from(this.document.querySelectorAll("shreddit-comment"));
              return this.processComments(t3);
            }
            getPostId() {
              const t3 = this.url.match(/comments\/([a-zA-Z0-9]+)/);
              return (null == t3 ? void 0 : t3[1]) || "";
            }
            getSubreddit() {
              const t3 = this.url.match(/\/r\/([^/]+)/);
              return (null == t3 ? void 0 : t3[1]) || "";
            }
            getPostAuthor() {
              var t3;
              return (null === (t3 = this.shredditPost) || void 0 === t3 ? void 0 : t3.getAttribute("author")) || "";
            }
            createDescription(t3) {
              var e3;
              if (!t3) return "";
              const r3 = this.document.createElement("div");
              return r3.appendChild((0, i.parseHTML)(this.document, t3)), (null === (e3 = r3.textContent) || void 0 === e3 ? void 0 : e3.trim().slice(0, 140).replace(/\s+/g, " ")) || "";
            }
            collectOldRedditComments(t3, e3 = 0) {
              var r3, n3;
              const o2 = [], s2 = Array.from(t3.querySelectorAll(":scope > .thing.comment"));
              for (const t4 of s2) {
                const s3 = t4.getAttribute("data-author") || "", a2 = t4.getAttribute("data-permalink") || "", l = (null === (n3 = null === (r3 = t4.querySelector(".entry .tagline .score.unvoted")) || void 0 === r3 ? void 0 : r3.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "", c = t4.querySelector(".entry .tagline time[datetime]"), u = (null == c ? void 0 : c.getAttribute("datetime")) || "", d = u ? new Date(u).toISOString().split("T")[0] : "", h = t4.querySelector(".entry .usertext-body .md"), m = h ? (0, i.serializeHTML)(h) : "";
                o2.push({ author: s3, date: d, content: m, depth: e3, score: l || void 0, url: a2 ? `https://reddit.com${a2}` : void 0 });
                const f = t4.querySelector(".child > .sitetable");
                f && o2.push(...this.collectOldRedditComments(f, e3 + 1));
              }
              return o2;
            }
            processComments(t3) {
              var e3;
              const r3 = [];
              for (const n3 of t3) {
                const t4 = parseInt(n3.getAttribute("depth") || "0"), o2 = n3.getAttribute("author") || "", s2 = n3.getAttribute("score") || "0", a2 = n3.getAttribute("permalink") || "", l = n3.querySelector('[slot="comment"]'), c = l ? (0, i.serializeHTML)(l) : "", u = n3.getAttribute("created") || (null === (e3 = n3.querySelector("time")) || void 0 === e3 ? void 0 : e3.getAttribute("datetime")) || "", d = u ? new Date(u).toISOString().split("T")[0] : "";
                r3.push({ author: o2, date: d, content: c, depth: t4, score: `${s2} points`, url: a2 ? `https://reddit.com${a2}` : void 0 });
              }
              return (0, s.buildCommentTree)(r3);
            }
          }
          e2.RedditExtractor = a;
        }, 6581(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.SubstackExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = "data-defuddle-substack-post";
          class s extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              var s2, a;
              if (super(t3, e3, r3, n3), this.noteText = null, this.noteImage = null, this.postData = null, this.postContentSelector = null, t3.querySelector("div.body.markup")) return this.postData = this.extractPreloadData(), void (this.postContentSelector = "div.body.markup");
              if (this.postData = this.extractPreloadData(), null === (s2 = this.postData) || void 0 === s2 ? void 0 : s2.body_html) {
                if (!t3.querySelector(`[${i}]`)) {
                  const e4 = t3.createElement("div");
                  e4.setAttribute(i, ""), e4.appendChild((0, o.parseHTML)(t3, this.postData.body_html)), t3.body.appendChild(e4);
                }
                return void (this.postContentSelector = `[${i}]`);
              }
              const l = t3.querySelector('[class*="feedPermalinkUnit"]');
              if (this.noteText = (l || t3).querySelector("div.ProseMirror.FeedProseMirror"), this.noteText) {
                const t4 = this.noteText.closest('[class*="feedCommentBody"]:not([class*="feedCommentBodyInner"])');
                if (t4) {
                  const e4 = [t4.nextElementSibling, null === (a = t4.parentElement) || void 0 === a ? void 0 : a.nextElementSibling];
                  for (const t5 of e4) if (t5 && (t5.getAttribute("class") || "").includes("imageGrid")) {
                    this.noteImage = t5;
                    break;
                  }
                }
              }
            }
            canExtract() {
              return null !== this.postContentSelector || null !== this.noteText;
            }
            extract() {
              return this.postContentSelector ? this.extractPost() : this.extractNote();
            }
            extractPost() {
              var t3, e3, r3, n3, o2, i2, s2, a, l, c;
              const u = (null === (t3 = this.postData) || void 0 === t3 ? void 0 : t3.title) || (null === (e3 = this.document.querySelector('meta[property="og:title"]')) || void 0 === e3 ? void 0 : e3.getAttribute("content")) || "", d = (null === (r3 = this.postData) || void 0 === r3 ? void 0 : r3.subtitle) || (null === (n3 = this.document.querySelector('meta[property="og:description"]')) || void 0 === n3 ? void 0 : n3.getAttribute("content")) || "", h = (null === (s2 = null === (i2 = null === (o2 = this.postData) || void 0 === o2 ? void 0 : o2.publishedBylines) || void 0 === i2 ? void 0 : i2[0]) || void 0 === s2 ? void 0 : s2.name) || (null === (l = null === (a = this.document.querySelector('a[href*="substack.com/@"]')) || void 0 === a ? void 0 : a.textContent) || void 0 === l ? void 0 : l.trim()) || "", m = (null === (c = this.postData) || void 0 === c ? void 0 : c.post_date) || this.parseDateFromByline() || "";
              return { content: "", contentHtml: "", contentSelector: this.postContentSelector, variables: { title: u, author: h, site: "Substack", description: d, published: m } };
            }
            extractNote() {
              var t3, e3;
              const r3 = this.noteText.outerHTML, n3 = this.buildImageHtml(), o2 = n3 ? `${r3}
${n3}` : r3, i2 = (null === (t3 = this.document.querySelector('meta[property="og:title"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content")) || "", s2 = (null === (e3 = this.document.querySelector('meta[property="og:description"]')) || void 0 === e3 ? void 0 : e3.getAttribute("content")) || "", a = i2.replace(/\s*\(@[^)]+\)\s*$/, "").trim();
              return { content: o2, contentHtml: o2, variables: { title: i2, author: a, site: "Substack", description: s2 } };
            }
            parseDateFromByline() {
              const t3 = this.document.querySelector('[class*="byline-wrapper"]');
              if (!t3) return "";
              const e3 = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" }, r3 = (t3.textContent || "").trim().replace(/([a-z])([A-Z])/g, "$1 $2").match(new RegExp("\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+(\\d{1,2}),?\\s+(\\d{4})\\b"));
              if (r3) {
                const t4 = e3[r3[1]], n3 = r3[2].padStart(2, "0");
                return `${r3[3]}-${t4}-${n3}T00:00:00+00:00`;
              }
              return "";
            }
            extractPreloadData() {
              var t3, e3;
              const r3 = Array.from(this.document.querySelectorAll("script"));
              for (const n3 of r3) {
                const r4 = n3.textContent || "";
                if (!r4.includes("window._preloads") || !r4.includes("body_html")) continue;
                const o2 = r4.indexOf('JSON.parse("');
                if (-1 === o2) continue;
                const i2 = o2 + 12;
                let s2 = i2;
                for (; s2 < r4.length; ) if ("\\" === r4[s2]) s2 += 2;
                else {
                  if ('"' === r4[s2]) break;
                  s2++;
                }
                try {
                  const n4 = r4.slice(i2, s2), o3 = JSON.parse('"' + n4 + '"'), a = JSON.parse(o3), l = null === (e3 = null === (t3 = null == a ? void 0 : a.feedData) || void 0 === t3 ? void 0 : t3.initialPost) || void 0 === e3 ? void 0 : e3.post;
                  if (null == l ? void 0 : l.body_html) return l;
                } catch (t4) {
                }
              }
              return null;
            }
            buildImageHtml() {
              var t3;
              if (!this.noteImage) return "";
              const e3 = null === (t3 = this.document.querySelector('meta[property="og:image"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content");
              if (e3) return `<img src="${(0, o.escapeHtml)(e3)}" alt="" />`;
              const r3 = this.noteImage.querySelector("img");
              if (!r3) return "";
              const n3 = this.getLargestSrc(r3);
              return n3 ? `<img src="${(0, o.escapeHtml)(n3)}" alt="" />` : "";
            }
            getLargestSrc(t3) {
              const e3 = t3.getAttribute("srcset") || "";
              if (e3) {
                const t4 = /(.+?)\s+(\d+(?:\.\d+)?)w/g;
                let r3, n3 = "", o2 = 0, i2 = 0;
                for (; null !== (r3 = t4.exec(e3)); ) {
                  let e4 = r3[1].trim();
                  i2 > 0 && (e4 = e4.replace(/^,\s*/, "")), i2 = t4.lastIndex;
                  const s2 = parseFloat(r3[2]);
                  e4 && s2 > o2 && (o2 = s2, n3 = e4);
                }
                if (n3) return n3.replace(/,w_\d+/g, "").replace(/,c_\w+/g, "");
              }
              return t3.getAttribute("src") || "";
            }
          }
          e2.SubstackExtractor = s;
        }, 9970(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.ThreadsExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              super(t3, e3, r3, n3), this.pagelets = [], this.regionContainer = null;
              const o2 = Array.from(t3.querySelectorAll('[data-pagelet^="threads_post_page_"]'));
              if (this.pagelets = o2.filter(((t4) => t4.querySelector('a[href^="/@"], time[datetime]'))), 0 === this.pagelets.length) {
                const e4 = t3.querySelector('div[role="region"]');
                (null == e4 ? void 0 : e4.querySelector('a[href^="/@"]')) && (this.regionContainer = e4);
              }
            }
            canExtract() {
              return this.pagelets.length > 0 || !!this.regionContainer;
            }
            extract() {
              var t3, e3;
              if (0 === this.pagelets.length && this.regionContainer) return this.extractFromRegion(this.regionContainer);
              const r3 = this.getUsername(this.pagelets[0]), n3 = [], o2 = [];
              let s2 = false;
              for (const t4 of this.pagelets) {
                const e4 = this.getPostsFromPagelet(t4);
                0 !== e4.length && (s2 || e4[0].username !== r3 || 1 !== e4.length ? (s2 = true, o2.push(e4)) : n3.push(e4[0]));
              }
              const a = n3.map(((t4) => t4.content)).join("\n<hr>\n"), l = false !== this.options.includeReplies ? this.extractComments(o2) : "", c = (0, i.buildContentHtml)("threads", a, l), u = `@${r3}`, d = this.createDescription(null === (t3 = n3[0]) || void 0 === t3 ? void 0 : t3.element), h = this.postTitle(u, "Threads"), m = (null === (e3 = n3[0]) || void 0 === e3 ? void 0 : e3.date) || "";
              return { content: c, contentHtml: c, extractedContent: { postAuthor: r3 }, variables: Object.assign({ title: h, author: u, site: "Threads", description: d }, m && { published: m }) };
            }
            extractFromRegion(t3) {
              const e3 = this.getUsername(t3);
              if (!e3) return { content: "", contentHtml: "" };
              const r3 = `@${e3}`, n3 = this.extractPostContent(t3), o2 = false !== this.options.includeReplies ? this.extractCommentsFromJson(e3) : "", s2 = (0, i.buildContentHtml)("threads", n3, o2), a = this.createDescription(t3), l = this.getDate(t3);
              return { content: s2, contentHtml: s2, extractedContent: { postAuthor: e3 }, variables: Object.assign({ title: this.postTitle(r3, "Threads"), author: r3, site: "Threads", description: a }, l && { published: l }) };
            }
            extractCommentsFromJson(t3) {
              const e3 = this.document.querySelectorAll('script[type="application/json"]'), r3 = [], n3 = /* @__PURE__ */ new Set();
              for (const t4 of Array.from(e3)) {
                const e4 = t4.textContent || "";
                if (!((e4.match(/"text_fragments"/g) || []).length < 2) && e4.includes('"username"')) try {
                  const t5 = JSON.parse(e4);
                  for (const e5 of this.findPostsInJson(t5, 0)) {
                    const t6 = e5.username + ":" + e5.text.slice(0, 80);
                    n3.has(t6) || (n3.add(t6), r3.push(e5));
                  }
                } catch (t5) {
                }
              }
              if (r3.length < 2) return "";
              const s2 = [];
              let a = true;
              for (const e4 of r3) a && e4.username === t3 ? a = false : s2.push({ author: `@${e4.username}`, date: "", content: `<p>${(0, o.escapeHtml)(e4.text)}</p>`, depth: 0 });
              return s2.length > 0 ? (0, i.buildCommentTree)(s2) : "";
            }
            findPostsInJson(t3, e3, r3 = []) {
              var n3;
              if (e3 > 35 || null == t3 || "object" != typeof t3) return r3;
              if ((null === (n3 = t3.user) || void 0 === n3 ? void 0 : n3.username) && "string" == typeof t3.user.username) {
                const e4 = this.extractTextFromJson(t3, 0);
                e4 && r3.push({ username: t3.user.username, text: e4 });
              }
              for (const n4 of Object.keys(t3)) "quoted_post" !== n4 && this.findPostsInJson(t3[n4], e3 + 1, r3);
              return r3;
            }
            extractTextFromJson(t3, e3) {
              var r3;
              if (e3 > 10 || null == t3 || "object" != typeof t3) return null;
              if (null === (r3 = t3.text_fragments) || void 0 === r3 ? void 0 : r3.fragments) return t3.text_fragments.fragments.map(((t4) => {
                var e4;
                return t4.plaintext ? t4.plaintext : (null === (e4 = t4.mention_fragment) || void 0 === e4 ? void 0 : e4.username) ? `@${t4.mention_fragment.username}` : t4.linkified_web_url ? t4.linkified_web_url : "";
              })).join("");
              for (const r4 of Object.keys(t3)) {
                if ("quoted_post" === r4) continue;
                const n3 = this.extractTextFromJson(t3[r4], e3 + 1);
                if (n3) return n3;
              }
              return null;
            }
            getPostsFromPagelet(t3) {
              var e3;
              const r3 = t3.querySelectorAll("[data-pressable-container]"), n3 = [];
              for (const t4 of Array.from(r3)) {
                if (null === (e3 = t4.parentElement) || void 0 === e3 ? void 0 : e3.closest("[data-pressable-container]")) continue;
                const r4 = this.getUsername(t4);
                r4 && n3.push({ username: r4, date: this.getDate(t4), permalink: this.getPermalink(t4), content: this.extractPostContent(t4), element: t4 });
              }
              return n3;
            }
            extractComments(t3) {
              const e3 = [];
              for (const r3 of t3) for (let t4 = 0; t4 < r3.length; t4++) e3.push(this.toCommentData(r3[t4], 1 === r3.length ? 0 : t4));
              return e3.length > 0 ? (0, i.buildCommentTree)(e3) : "";
            }
            toCommentData(t3, e3) {
              return { author: `@${t3.username}`, date: t3.date, content: t3.content, depth: e3, url: t3.permalink || void 0 };
            }
            getUsername(t3) {
              var e3, r3;
              const n3 = t3.querySelectorAll('a[href^="/@"][role="link"]');
              for (const t4 of Array.from(n3)) {
                const r4 = null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim();
                if (r4 && !r4.includes("profile picture")) return r4;
              }
              const o2 = t3.querySelector('a[href^="/@"]');
              if (o2) {
                const t4 = null === (r3 = o2.getAttribute("href")) || void 0 === r3 ? void 0 : r3.match(/\/@([^/]+)/);
                return t4 ? t4[1] : "";
              }
              return "";
            }
            getDate(t3) {
              const e3 = t3.querySelector("time[datetime]");
              if (!e3) return "";
              const r3 = e3.getAttribute("datetime") || "";
              try {
                return new Date(r3).toISOString().split("T")[0];
              } catch (t4) {
                return "";
              }
            }
            getPermalink(t3) {
              const e3 = t3.querySelector('a[href*="/post/"]');
              if (!e3) return "";
              const r3 = e3.getAttribute("href") || "";
              return r3.startsWith("http") ? r3 : `https://www.threads.com${r3}`;
            }
            extractPostContent(t3) {
              var e3;
              const r3 = [], n3 = Array.from(t3.querySelectorAll('span[dir="auto"]'));
              for (const t4 of n3) {
                if (t4.closest('a[href^="/@"], a[href*="/post/"], a[href*="l.threads.com"], time')) continue;
                if (t4.closest('[role="button"]')) continue;
                const n4 = (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
                if (!n4 || "Author" === n4 || "·" === n4 || "Top" === n4 || "View activity" === n4) continue;
                if (/^\d{2}\/\d{2}\/\d{2}$/.test(n4) || /^@?\w+\/post\/\w+$/.test(n4)) continue;
                if (!this.stripThreadNumber(n4)) continue;
                const o3 = this.cleanText(t4);
                o3 && r3.push(`<p>${o3}</p>`);
              }
              const o2 = this.extractImages(t3);
              o2 && r3.push(o2);
              const i2 = this.extractLinkCard(t3);
              i2 && r3.push(i2);
              const s2 = this.extractQuotedPost(t3);
              return s2 && r3.push(s2), r3.join("\n");
            }
            cleanText(t3) {
              const e3 = t3.cloneNode(true);
              this.removeThreadNumbers(e3), e3.querySelectorAll("a").forEach(((t4) => {
                var r4;
                const n3 = t4.getAttribute("href") || "", o2 = (null === (r4 = t4.textContent) || void 0 === r4 ? void 0 : r4.trim()) || "";
                if (n3.match(/\/@[\w.]+\/post\//)) return void t4.remove();
                const i2 = e3.ownerDocument.createElement("a");
                if (n3.includes("l.threads.com")) i2.setAttribute("href", this.unwrapRedirectUrl(n3));
                else {
                  if (n3.startsWith("/@")) {
                    const e4 = n3.replace(/^\/@/, "");
                    return i2.setAttribute("href", `https://www.threads.com/@${e4}`), i2.textContent = `@${e4}`, void t4.replaceWith(i2);
                  }
                  i2.setAttribute("href", n3.startsWith("http") ? n3 : `https://www.threads.com${n3}`);
                }
                i2.textContent = o2, t4.replaceWith(i2);
              })), e3.querySelectorAll("span, div").forEach(((t4) => {
                t4.replaceWith(...Array.from(t4.childNodes));
              }));
              let r3 = (e3.innerHTML || e3.textContent || "").trim();
              return r3 = r3.replace(/<!--.*?-->/g, ""), r3 = r3.replace(/\s+/g, " ").trim(), r3 || "";
            }
            stripThreadNumber(t3) {
              return t3.replace(/\s*\d+\s*\/\s*\d+\s*$/, "").trim();
            }
            removeThreadNumbers(t3) {
              var e3;
              const r3 = Array.from(t3.querySelectorAll("div"));
              for (const t4 of r3) {
                const r4 = (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
                /^\d+\/\d+$/.test(r4) && t4.querySelectorAll("span").length >= 2 && t4.remove();
              }
            }
            unwrapRedirectUrl(t3) {
              try {
                const e3 = new URL(t3).searchParams.get("u");
                return e3 ? decodeURIComponent(e3) : t3;
              } catch (e3) {
                return t3;
              }
            }
            extractImages(t3) {
              const e3 = [];
              return t3.querySelectorAll("img").forEach(((t4) => {
                const r3 = t4.getAttribute("alt") || "", n3 = t4.getAttribute("src") || "";
                if (r3.includes("profile picture") || !n3) return;
                if (t4.closest('a[href*="l.threads.com"]')) return;
                const i2 = parseInt(t4.getAttribute("width") || "0");
                i2 > 0 && i2 <= 48 || e3.push(`<img src="${(0, o.escapeHtml)(n3)}" alt="${(0, o.escapeHtml)(r3)}" />`);
              })), e3.join("\n");
            }
            extractLinkCard(t3) {
              const e3 = t3.querySelectorAll('a[href*="l.threads.com"]');
              for (const t4 of Array.from(e3)) {
                const e4 = t4.querySelector("img");
                if (!e4) continue;
                const r3 = t4.getAttribute("href") || "", n3 = this.unwrapRedirectUrl(r3), i2 = e4.getAttribute("src") || "", s2 = e4.getAttribute("alt") || "";
                if (i2) return `<a href="${(0, o.escapeHtml)(n3)}"><img src="${(0, o.escapeHtml)(i2)}" alt="${(0, o.escapeHtml)(s2)}" /></a>`;
              }
              return "";
            }
            extractQuotedPost(t3) {
              var e3;
              const r3 = t3.querySelector("[data-pressable-container]");
              if (r3) return this.extractQuotedPostFrom(r3);
              const n3 = t3.querySelectorAll('a[href*="/post/"]');
              for (const t4 of Array.from(n3)) {
                const r4 = (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
                if (/^\d{2}\/\d{2}\/\d{2}$/.test(r4)) continue;
                const n4 = t4.getAttribute("href") || "", s2 = n4.match(/\/@([^/]+)\/post\//);
                if (!s2) continue;
                const a = s2[1], l = `<p>${(0, o.escapeHtml)(r4)}</p>`, c = n4.startsWith("http") ? n4 : `https://www.threads.com${n4}`;
                return (0, i.buildQuotedPost)({ author: `@${a}`, content: l, url: c });
              }
              return "";
            }
            extractQuotedPostFrom(t3) {
              var e3, r3;
              const n3 = this.getUsername(t3), s2 = this.getDate(t3), a = Array.from(t3.querySelectorAll('span[dir="auto"]'));
              let l = "";
              for (const t4 of a) {
                if (t4.closest('[role="button"], time')) continue;
                const n4 = t4.closest('a[href^="/@"]');
                if (n4 && !(null === (e3 = n4.getAttribute("href")) || void 0 === e3 ? void 0 : e3.includes("/post/"))) continue;
                const i2 = null === (r3 = t4.textContent) || void 0 === r3 ? void 0 : r3.trim();
                if (!i2 || "·" === i2 || "Author" === i2) continue;
                if (/^\d{2}\/\d{2}\/\d{2}$/.test(i2)) continue;
                const s3 = this.stripThreadNumber(i2);
                s3 && (l += `<p>${(0, o.escapeHtml)(s3)}</p>
`);
              }
              return (0, i.buildQuotedPost)({ author: n3 ? `@${n3}` : void 0, date: s2 || void 0, content: l.trim() });
            }
            createDescription(t3) {
              var e3;
              if (!t3) return "";
              const r3 = t3.querySelectorAll('span[dir="auto"]');
              for (const t4 of Array.from(r3)) {
                if (t4.closest('a[href^="/@"], [role="button"], a[href*="/post/"], time')) continue;
                const r4 = (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
                if (!r4 || "Author" === r4 || "·" === r4 || "Top" === r4 || "View activity" === r4) continue;
                if (/^\d{2}\/\d{2}\/\d{2}$/.test(r4)) continue;
                const n3 = this.stripThreadNumber(r4);
                if (n3) return n3.slice(0, 140).replace(/\s+/g, " ");
              }
              return "";
            }
          }
          e2.ThreadsExtractor = s;
        }, 2248(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.TwitterExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = r2(6077);
          class s extends n2.BaseExtractor {
            constructor(t3, e3) {
              super(t3, e3), this.mainTweet = null, this.threadTweets = [], this.replyTweets = [], this.replyDepths = [], this.classifyCells(this.conversationCells()), this.mainTweet || (this.mainTweet = t3.querySelector('article[data-testid="tweet"]'));
            }
            conversationCells() {
              const t3 = [];
              for (const e3 of Array.from(this.document.querySelectorAll('[data-testid="cellInnerDiv"], section, h2'))) if ("cellInnerDiv" === e3.getAttribute("data-testid")) t3.push(e3);
              else if (t3.length && !e3.closest('article[data-testid="tweet"]')) break;
              return t3;
            }
            classifyCells(t3) {
              let e3 = "", r3 = false, n3 = false, o2 = 0;
              for (const i2 of t3) {
                const t4 = i2.querySelector('article[data-testid="tweet"]');
                if (!t4) {
                  n3 = false;
                  continue;
                }
                if (!this.mainTweet) {
                  this.mainTweet = t4, e3 = this.getHandle(t4), n3 = true;
                  continue;
                }
                const s2 = this.getHandle(t4);
                r3 || !s2 || s2 !== e3 ? (r3 = true, o2 = n3 ? o2 + 1 : 0, this.replyTweets.push(t4), this.replyDepths.push(o2), n3 = true) : (this.threadTweets.push(t4), n3 = true);
              }
            }
            canExtract() {
              return !!this.mainTweet;
            }
            extract() {
              const t3 = [this.extractTweetContent(this.mainTweet)];
              for (const e4 of this.threadTweets) t3.push(this.extractTweetContent(e4));
              const e3 = t3.join("\n<hr>\n"), r3 = false !== this.options.includeReplies ? this.extractComments() : "", n3 = (0, i.buildContentHtml)("twitter", e3, r3), o2 = this.getTweetId(), s2 = this.getTweetAuthor(), a = this.createDescription(this.mainTweet);
              return { content: n3, contentHtml: n3, extractedContent: { tweetId: o2, tweetAuthor: s2 }, variables: { title: this.postTitle(s2, "X"), author: s2, site: "X (Twitter)", description: a } };
            }
            extractComments() {
              if (0 === this.replyTweets.length) return "";
              const t3 = this.replyTweets.map(((t4, e3) => {
                const r3 = this.extractUserInfo(t4), n3 = this.extractTweetContent(t4);
                return { author: r3.fullName ? `${r3.fullName} ${r3.handle}` : r3.handle, date: r3.date, content: n3, depth: this.replyDepths[e3], url: r3.permalink };
              }));
              return (0, i.buildCommentTree)(t3);
            }
            getHandle(t3) {
              var e3;
              const r3 = t3.querySelector('[data-testid="User-Name"]');
              if (!r3) return "";
              const n3 = Array.from(r3.querySelectorAll("a"));
              for (const t4 of n3) {
                const r4 = (null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
                if (/^@\w{1,15}$/.test(r4)) return r4;
              }
              for (const t4 of n3) {
                const e4 = (t4.getAttribute("href") || "").match(/^(?:https?:\/\/[^/]+)?\/(\w{1,15})(?:\/|$)/);
                if (e4 && !s.RESERVED_PATHS.has(e4[1].toLowerCase())) return `@${e4[1]}`;
              }
              const o2 = (r3.textContent || "").match(/@(\w{1,15})/);
              return o2 ? `@${o2[1]}` : "";
            }
            formatTweetText(t3) {
              if (!t3) return "";
              const e3 = this.document.createElement("div");
              e3.appendChild((0, o.parseHTML)(this.document, t3)), e3.querySelectorAll("a").forEach(((t4) => {
                var e4;
                const r3 = (null === (e4 = t4.textContent) || void 0 === e4 ? void 0 : e4.trim()) || "";
                t4.replaceWith(r3);
              })), e3.querySelectorAll("span, div").forEach(((t4) => {
                t4.replaceWith(...Array.from(t4.childNodes));
              }));
              return (0, o.serializeHTML)(e3).split("\n").map(((t4) => t4.trim())).filter(((t4) => t4)).map(((t4) => `<p>${t4}</p>`)).join("\n");
            }
            replaceEmojiImages(t3) {
              t3.querySelectorAll('img[src*="/emoji/"]').forEach(((t4) => {
                const e3 = t4.getAttribute("alt");
                e3 && t4.replaceWith(e3);
              }));
            }
            findQuotedTweet(t3) {
              var e3, r3;
              return (null === (r3 = null === (e3 = t3.querySelector('[aria-labelledby*="id__"]')) || void 0 === e3 ? void 0 : e3.querySelector('[data-testid="User-Name"]')) || void 0 === r3 ? void 0 : r3.closest('[aria-labelledby*="id__"]')) || null;
            }
            extractTweetContent(t3) {
              if (!t3) return "";
              const e3 = t3.cloneNode(true);
              this.replaceEmojiImages(e3);
              const r3 = e3.querySelector('[data-testid="tweetText"]'), n3 = r3 ? (0, o.serializeHTML)(r3) : "", i2 = this.formatTweetText(n3), s2 = this.findQuotedTweet(t3), a = this.extractImages(t3, s2), l = s2 ? this.extractQuotedTweet(s2) : "", c = this.extractCard(t3);
              let u = "";
              return i2 && (u += i2), a.length && (u += `
${a.join("\n")}`), c && (u += `
${c}`), l && (u += `
${l}`), u;
            }
            extractQuotedTweet(t3) {
              const e3 = t3.cloneNode(true);
              this.replaceEmojiImages(e3);
              const r3 = e3.querySelector('[data-testid="tweetText"]'), n3 = r3 ? (0, o.serializeHTML)(r3) : "", s2 = this.formatTweetText(n3), a = this.extractUserInfo(t3), l = this.extractImages(t3, null);
              let c = "";
              s2 && (c += s2), l.length && (c += `
${l.join("\n")}`);
              const u = a.fullName ? `${a.fullName} ${a.handle}` : a.handle;
              return (0, i.buildQuotedPost)({ author: u || void 0, date: a.date || void 0, content: c });
            }
            extractUserInfo(t3) {
              var e3, r3, n3;
              const o2 = t3.querySelector('[data-testid="User-Name"]');
              if (!o2) return { fullName: "", handle: "", date: "", permalink: "" };
              const i2 = this.getHandle(t3);
              let s2 = Array.from(o2.querySelectorAll("a")).map(((t4) => {
                var e4;
                return t4.querySelector("time") ? "" : (null === (e4 = t4.textContent) || void 0 === e4 ? void 0 : e4.trim()) || "";
              })).find(((t4) => t4 && t4 !== i2 && !t4.startsWith("@"))) || "";
              if (!s2) {
                const t4 = (null === (r3 = null === (e3 = o2.children[0]) || void 0 === e3 ? void 0 : e3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
                t4 && !t4.startsWith("@") && (s2 = t4);
              }
              const a = t3.querySelector("time"), l = (null == a ? void 0 : a.getAttribute("datetime")) || "", c = l ? new Date(l).toISOString().split("T")[0] : "", u = (null === (n3 = null == a ? void 0 : a.closest("a")) || void 0 === n3 ? void 0 : n3.href) || "";
              return { fullName: s2, handle: i2, date: c, permalink: u };
            }
            extractImages(t3, e3) {
              const r3 = ['[data-testid="tweetPhoto"]', '[data-testid="tweet-image"]', 'img[src*="media"]'], n3 = [];
              for (const i2 of r3) {
                t3.querySelectorAll(i2).forEach(((t4) => {
                  var r4, i3;
                  if (!(null == e3 ? void 0 : e3.contains(t4)) && "img" === t4.tagName.toLowerCase() && t4.getAttribute("alt")) {
                    const e4 = (null === (r4 = t4.getAttribute("src")) || void 0 === r4 ? void 0 : r4.replace(/&name=\w+$/, "&name=large")) || "", s2 = (null === (i3 = t4.getAttribute("alt")) || void 0 === i3 ? void 0 : i3.replace(/\s+/g, " ").trim()) || "";
                    n3.push(`<img src="${(0, o.escapeHtml)(e4)}" alt="${(0, o.escapeHtml)(s2)}" />`);
                  }
                }));
              }
              return n3;
            }
            extractCard(t3) {
              var e3;
              const r3 = t3.querySelector('[data-testid="card.wrapper"]');
              if (!r3) return "";
              const n3 = r3.querySelector("a[href]");
              if (!n3) return "";
              const i2 = n3.getAttribute("href") || "", s2 = (null === (e3 = (n3.getAttribute("aria-label") || "").split(/\n/)[0]) || void 0 === e3 ? void 0 : e3.trim()) || i2;
              return `<p><a href="${(0, o.escapeHtml)(i2)}">${(0, o.escapeHtml)(s2)}</a></p>`;
            }
            getTweetId() {
              const t3 = this.url.match(/status\/(\d+)/);
              return (null == t3 ? void 0 : t3[1]) || "";
            }
            getTweetAuthor() {
              const t3 = this.getHandle(this.mainTweet);
              return t3.startsWith("@") ? t3 : `@${t3}`;
            }
            createDescription(t3) {
              var e3;
              if (!t3) return "";
              return ((null === (e3 = t3.querySelector('[data-testid="tweetText"]')) || void 0 === e3 ? void 0 : e3.textContent) || "").trim().slice(0, 140).replace(/\s+/g, " ");
            }
          }
          e2.TwitterExtractor = s, s.RESERVED_PATHS = /* @__PURE__ */ new Set(["i", "home", "explore", "search", "notifications", "messages", "settings", "compose", "hashtag", "intent"]);
        }, 2144(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.WikipediaExtractor = void 0;
          const n2 = r2(2279);
          class o extends n2.BaseExtractor {
            canExtract() {
              return null !== this.document.querySelector("#mw-content-text");
            }
            extract() {
              var t3;
              const e3 = (null === (t3 = this.document.querySelector('meta[property="og:title"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content")) || "";
              return { content: "", contentHtml: "", contentSelector: "#mw-content-text", variables: { title: e3.replace(/\s*[-\u2013\u2014]\s*Wikipedia\s*$/, "") || e3, author: "Wikipedia", site: "Wikipedia" } };
            }
          }
          e2.WikipediaExtractor = o;
        }, 1064(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.XArticleExtractor = void 0;
          const n2 = r2(2279), o = r2(639), i = '[data-testid="twitterArticleReadView"]', s = '[data-testid="twitterArticleRichTextView"]', a = '[data-testid="twitter-article-title"]', l = '[itemprop="author"]', c = 'meta[itemprop="name"]', u = 'meta[itemprop="additionalName"]', d = '[data-testid="tweetPhoto"] img', h = ".longform-unstyled, .public-DraftStyleDefault-block", m = 'span[style*="font-weight: bold"]', f = "[data-offset-key]", p = '[data-testid="simpleTweet"]', g = '[data-testid="tweetText"]', v = '[data-testid="User-Name"]', y = '[data-testid="markdown-code-block"]';
          class b extends n2.BaseExtractor {
            constructor(t3, e3, r3) {
              super(t3, e3, r3), this.articleContainer = t3.querySelector(s);
            }
            canExtract() {
              return !!this.articleContainer;
            }
            extract() {
              const t3 = this.extractTitle(), e3 = this.extractAuthor(), r3 = this.extractContent(), n3 = this.createDescription();
              return { content: r3, contentHtml: r3, extractedContent: { articleId: this.getArticleId() }, variables: { title: t3, author: e3, site: "X (Twitter)", description: n3 } };
            }
            extractTitle() {
              var t3;
              const e3 = this.document.querySelector(a);
              return (null === (t3 = null == e3 ? void 0 : e3.textContent) || void 0 === t3 ? void 0 : t3.trim()) || "Untitled X Article";
            }
            extractAuthor() {
              var t3, e3;
              const r3 = this.document.querySelector(l);
              if (!r3) return this.getAuthorFromUrl();
              const n3 = null === (t3 = r3.querySelector(c)) || void 0 === t3 ? void 0 : t3.getAttribute("content"), o2 = null === (e3 = r3.querySelector(u)) || void 0 === e3 ? void 0 : e3.getAttribute("content");
              return n3 && o2 ? `${n3} (@${o2})` : n3 || o2 || this.getAuthorFromUrl();
            }
            getAuthorFromUrl() {
              const t3 = this.url.match(/\/([a-zA-Z0-9_][a-zA-Z0-9_]{0,14})\/(article|status)\/\d+/);
              return t3 ? `@${t3[1]}` : this.getAuthorFromOgTitle();
            }
            getAuthorFromOgTitle() {
              var t3;
              const e3 = ((null === (t3 = this.document.querySelector('meta[property="og:title"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content")) || "").match(/^(?:\(\d+\)\s+)?(.+?)\s+on\s+X\s*:/);
              return e3 ? e3[1].trim() : "Unknown";
            }
            getArticleId() {
              const t3 = this.url.match(/article\/(\d+)/);
              return t3 ? t3[1] : "";
            }
            extractContent() {
              if (!this.articleContainer) return "";
              const t3 = this.articleContainer.cloneNode(true);
              this.cleanContent(t3);
              return `<article class="x-article">${this.extractHeaderImage()}${(0, o.serializeHTML)(t3)}</article>`;
            }
            extractHeaderImage() {
              var t3;
              const e3 = this.document.querySelector(i);
              if (!e3) return "";
              const r3 = e3.querySelector(d);
              if (!r3) return "";
              if (this.articleContainer.contains(r3)) return "";
              const n3 = r3.getAttribute("src");
              if (!n3) return "";
              const s2 = (null === (t3 = r3.getAttribute("alt")) || void 0 === t3 ? void 0 : t3.replace(/\s+/g, " ").trim()) || "Image";
              return `<img src="${(0, o.escapeHtml)(this.upgradeImageSrc(n3))}" alt="${(0, o.escapeHtml)(s2)}">`;
            }
            cleanContent(t3) {
              const e3 = t3.ownerDocument || this.document;
              this.convertEmbeddedTweets(t3, e3), this.convertCodeBlocks(t3, e3), this.convertHeaders(t3, e3), this.unwrapLinkedImages(t3, e3), this.upgradeImageQuality(t3), this.convertBoldSpans(t3, e3), this.convertDraftParagraphs(t3, e3), this.removeDraftAttributes(t3), this.repairSurrogatePairs(t3);
            }
            convertEmbeddedTweets(t3, e3) {
              t3.querySelectorAll(p).forEach(((t4) => {
                var r3, n3, o2, i2, s2;
                const a2 = e3.createElement("blockquote");
                a2.className = "embedded-tweet";
                const l2 = t4.querySelector(v), c2 = null == l2 ? void 0 : l2.querySelectorAll("a"), u2 = (null === (n3 = null === (r3 = null == c2 ? void 0 : c2[0]) || void 0 === r3 ? void 0 : r3.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "", d2 = (null === (i2 = null === (o2 = null == c2 ? void 0 : c2[1]) || void 0 === o2 ? void 0 : o2.textContent) || void 0 === i2 ? void 0 : i2.trim()) || "", h2 = t4.querySelector(g), m2 = (null === (s2 = null == h2 ? void 0 : h2.textContent) || void 0 === s2 ? void 0 : s2.trim()) || "";
                if (u2 || d2) {
                  const t5 = e3.createElement("cite");
                  t5.textContent = d2 ? `${u2} ${d2}` : u2, a2.appendChild(t5);
                }
                if (m2) {
                  const t5 = e3.createElement("p");
                  t5.textContent = m2, a2.appendChild(t5);
                }
                t4.replaceWith(a2);
              }));
            }
            convertCodeBlocks(t3, e3) {
              t3.querySelectorAll(y).forEach(((t4) => {
                var r3;
                const n3 = t4.querySelector("pre"), o2 = t4.querySelector("code");
                if (!n3 || !o2) return;
                let i2 = "";
                const s2 = o2.className.match(/language-(\w+)/);
                if (s2) i2 = s2[1];
                else {
                  const e4 = t4.querySelector("span");
                  i2 = (null === (r3 = null == e4 ? void 0 : e4.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
                }
                const a2 = e3.createElement("pre"), l2 = e3.createElement("code");
                i2 && (l2.setAttribute("data-lang", i2), l2.className = `language-${i2}`), l2.textContent = o2.textContent || "", a2.appendChild(l2), t4.replaceWith(a2);
              }));
            }
            convertHeaders(t3, e3) {
              t3.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(((t4) => {
                var r3;
                const n3 = t4.tagName.toLowerCase(), o2 = (null === (r3 = t4.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "";
                if (!o2) return;
                const i2 = e3.createElement(n3);
                i2.textContent = o2, t4.replaceWith(i2);
              }));
            }
            unwrapLinkedImages(t3, e3) {
              t3.querySelectorAll(d).forEach(((r3) => {
                var n3;
                const o2 = r3.closest("a");
                if (!o2 || !t3.contains(o2)) return;
                const i2 = r3.getAttribute("src") || "", s2 = (null === (n3 = r3.getAttribute("alt")) || void 0 === n3 ? void 0 : n3.replace(/\s+/g, " ").trim()) || "Image", a2 = e3.createElement("img");
                a2.setAttribute("src", this.upgradeImageSrc(i2)), a2.setAttribute("alt", s2), o2.replaceWith(a2);
              }));
            }
            upgradeImageQuality(t3) {
              t3.querySelectorAll(d).forEach(((t4) => {
                const e3 = t4.getAttribute("src");
                e3 && t4.setAttribute("src", this.upgradeImageSrc(e3));
              }));
            }
            upgradeImageSrc(t3) {
              return t3.includes("&name=") ? t3.replace(/&name=\w+/, "&name=large") : t3.includes("?") ? `${t3}&name=large` : `${t3}?name=large`;
            }
            convertDraftParagraphs(t3, e3) {
              t3.querySelectorAll(h).forEach(((t4) => {
                const r3 = e3.createElement("p"), n3 = (t5) => {
                  if (3 === t5.nodeType) r3.appendChild(e3.createTextNode(t5.textContent || ""));
                  else if (1 === t5.nodeType) {
                    const o2 = t5, i2 = o2.tagName.toLowerCase();
                    if ("strong" === i2) {
                      const t6 = e3.createElement("strong");
                      t6.textContent = o2.textContent || "", r3.appendChild(t6);
                    } else if ("a" === i2) {
                      const t6 = e3.createElement("a");
                      t6.setAttribute("href", o2.getAttribute("href") || ""), t6.textContent = o2.textContent || "", r3.appendChild(t6);
                    } else if ("code" === i2) {
                      const t6 = e3.createElement("code");
                      t6.textContent = o2.textContent || "", r3.appendChild(t6);
                    } else o2.childNodes.forEach(((t6) => n3(t6)));
                  }
                };
                t4.childNodes.forEach(((t5) => n3(t5))), t4.replaceWith(r3);
              }));
            }
            convertBoldSpans(t3, e3) {
              t3.querySelectorAll(m).forEach(((t4) => {
                const r3 = e3.createElement("strong");
                r3.textContent = t4.textContent || "", t4.replaceWith(r3);
              }));
            }
            removeDraftAttributes(t3) {
              t3.querySelectorAll(f).forEach(((t4) => {
                t4.removeAttribute("data-offset-key");
              }));
            }
            repairSurrogatePairs(t3) {
              const e3 = (t3.ownerDocument || this.document).createTreeWalker(t3, 4);
              let r3, n3 = null;
              for (; r3 = e3.nextNode(); ) {
                const t4 = r3;
                if (n3) {
                  const e4 = n3.textContent || "", r4 = t4.textContent || "";
                  if (e4 && r4) {
                    const o2 = e4.charCodeAt(e4.length - 1), i2 = r4.charCodeAt(0);
                    o2 >= 55296 && o2 <= 56319 && i2 >= 56320 && i2 <= 57343 && (n3.textContent = e4.slice(0, -1), t4.textContent = e4.slice(-1) + r4);
                  }
                }
                n3 = t4;
              }
            }
            createDescription() {
              var t3, e3;
              const r3 = (null === (e3 = null === (t3 = this.articleContainer) || void 0 === t3 ? void 0 : t3.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
              return r3.slice(0, 140) + (r3.length > 140 ? "..." : "");
            }
          }
          e2.XArticleExtractor = b;
        }, 5666(t2, e2, r2) {
          var n2 = this && this.__awaiter || function(t3, e3, r3, n3) {
            return new (r3 || (r3 = Promise))((function(o2, i2) {
              function s2(t4) {
                try {
                  l(n3.next(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function a2(t4) {
                try {
                  l(n3.throw(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function l(t4) {
                var e4;
                t4.done ? o2(t4.value) : (e4 = t4.value, e4 instanceof r3 ? e4 : new r3((function(t5) {
                  t5(e4);
                }))).then(s2, a2);
              }
              l((n3 = n3.apply(t3, e3 || [])).next());
            }));
          };
          Object.defineProperty(e2, "__esModule", { value: true }), e2.XOembedExtractor = void 0;
          const o = r2(2279), i = r2(639), s = r2(6077);
          class a extends o.BaseExtractor {
            canExtract() {
              return false;
            }
            extract() {
              return { content: "", contentHtml: "" };
            }
            canExtractAsync() {
              return /\/(status|article)\/\d+/.test(this.url);
            }
            prefersAsync() {
              return !("undefined" != typeof window && this.document.defaultView == window);
            }
            extractAsync() {
              return n2(this, void 0, void 0, (function* () {
                const t3 = yield this.tryExtractFxTwitter();
                return t3 || this.extractOembed();
              }));
            }
            extractOembed() {
              return n2(this, void 0, void 0, (function* () {
                const t3 = `https://publish.twitter.com/oembed?url=${encodeURIComponent(this.url)}&omit_script=true`, e3 = yield this.fetch(t3);
                if (!e3.ok) throw new Error(`oEmbed request failed: ${e3.status}`);
                const r3 = yield e3.json(), n3 = this.document.createElement("div");
                n3.appendChild((0, i.parseHTML)(this.document, r3.html));
                const o2 = n3.querySelector("blockquote"), a2 = (null == o2 ? void 0 : o2.querySelectorAll("p")) || [], l = Array.from(a2).map(((t4) => `<p>${(0, i.serializeHTML)(t4)}</p>`)).join("\n"), c = r3.author_url ? `@${r3.author_url.split("/").pop()}` : "", u = (0, s.buildContentHtml)("twitter", l, ""), d = c || r3.author_name, h = l.replace(/<[^>]*>/g, "").trim().slice(0, 140).replace(/\s+/g, " ");
                return { content: u, contentHtml: u, variables: { title: this.postTitle(d, "X"), author: d, site: "X (Twitter)", description: h } };
              }));
            }
            tryExtractFxTwitter() {
              return n2(this, void 0, void 0, (function* () {
                var t3, e3;
                const r3 = this.url.match(/\/([a-zA-Z0-9_][a-zA-Z0-9_]{0,14})\/(status|article)\/(\d+)/);
                if (!r3) return null;
                try {
                  const n3 = yield this.fetchFxTwitter(r3[1], r3[3]);
                  return (null === (t3 = n3.tweet) || void 0 === t3 ? void 0 : t3.article) ? this.buildArticleResult(n3) : (null === (e3 = n3.tweet) || void 0 === e3 ? void 0 : e3.text) ? this.buildTweetResult(n3) : null;
                } catch (t4) {
                  return null;
                }
              }));
            }
            fetchFxTwitter(t3, e3) {
              return n2(this, void 0, void 0, (function* () {
                const r3 = `https://api.fxtwitter.com/${t3}/status/${e3}`, n3 = yield this.fetch(r3, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Defuddle/1.0; +https://defuddle.md)" } });
                if (!n3.ok) throw new Error(`FxTwitter API request failed: ${n3.status}`);
                return n3.json();
              }));
            }
            toDateString(t3) {
              if (t3) try {
                return new Date(t3).toISOString().split("T")[0];
              } catch (t4) {
                return;
              }
            }
            buildArticleResult(t3) {
              var e3;
              const r3 = t3.tweet.article, { blocks: n3, entityMap: o2 } = r3.content, i2 = r3.media_entities || [], s2 = this.renderArticle(n3, o2, r3.cover_media, i2), a2 = `@${t3.tweet.author.screen_name}`, l = null !== (e3 = this.toDateString(r3.created_at)) && void 0 !== e3 ? e3 : this.toDateString(t3.tweet.created_at);
              return { content: s2, contentHtml: s2, variables: Object.assign({ title: r3.title, author: a2, site: "X (Twitter)", description: r3.preview_text }, l && { published: l }) };
            }
            buildTweetResult(t3) {
              const e3 = t3.tweet, r3 = `@${e3.author.screen_name}`, n3 = this.renderTweet(e3), o2 = (0, s.buildContentHtml)("twitter", n3, ""), i2 = this.toDateString(e3.created_at), a2 = (e3.text || "").trim().slice(0, 140).replace(/\s+/g, " ");
              return { content: o2, contentHtml: o2, variables: Object.assign({ title: this.postTitle(r3, "X"), author: r3, site: "X (Twitter)", description: a2 }, i2 && { published: i2 }) };
            }
            codePointToUtf16Index(t3, e3) {
              let r3 = 0, n3 = 0;
              for (const o2 of t3) {
                if (n3 >= e3) break;
                r3 += o2.length, n3 += 1;
              }
              return r3;
            }
            adjustFacetIndicesToUtf16(t3, e3) {
              return 0 === e3.length ? e3 : /[\uD800-\uDBFF]/.test(t3) ? e3.map(((e4) => {
                const [r3, n3] = e4.indices;
                return Object.assign(Object.assign({}, e4), { indices: [this.codePointToUtf16Index(t3, r3), this.codePointToUtf16Index(t3, n3)] });
              })) : e3;
            }
            renderTweet(t3) {
              var e3, r3, n3;
              const o2 = (null === (e3 = t3.raw_text) || void 0 === e3 ? void 0 : e3.text) || t3.text, s2 = ((null === (r3 = t3.raw_text) || void 0 === r3 ? void 0 : r3.facets) || []).filter(((t4) => "media" !== t4.type)), a2 = this.adjustFacetIndicesToUtf16(o2, s2), l = o2.split(/\n\n+/);
              let c = 0;
              const u = [];
              for (const t4 of l) {
                const e4 = o2.indexOf(t4, c), r4 = e4 + t4.length;
                c = r4;
                const n4 = t4.trimStart().startsWith(">");
                let i2 = n4 ? t4.trimStart().slice(1).trimStart() : t4;
                const s3 = n4 ? e4 + (t4.length - t4.trimStart().length) + 1 + (t4.trimStart().slice(1).length - t4.trimStart().slice(1).trimStart().length) : e4, l2 = this.applyFacets(i2, s3, r4, a2).replace(/\n/g, "<br>");
                n4 ? u.push(`<blockquote><p>${l2}</p></blockquote>`) : l2.trim() && u.push(`<p>${l2}</p>`);
              }
              if (null === (n3 = t3.media) || void 0 === n3 ? void 0 : n3.photos) for (const e4 of t3.media.photos) u.push(`<img src="${(0, i.escapeHtml)(e4.url)}" alt="">`);
              return u.join("\n");
            }
            applyMarkers(t3, e3) {
              if (0 === e3.length) return (0, i.escapeHtml)(t3);
              e3.sort(((t4, e4) => t4.offset !== e4.offset ? t4.offset - e4.offset : "close" === t4.type && "open" === e4.type ? -1 : "open" === t4.type && "close" === e4.type ? 1 : 0));
              let r3 = "", n3 = 0;
              for (const o2 of e3) o2.offset > n3 && (r3 += (0, i.escapeHtml)(t3.slice(n3, o2.offset))), r3 += o2.tag, n3 = o2.offset;
              return n3 < t3.length && (r3 += (0, i.escapeHtml)(t3.slice(n3))), r3;
            }
            applyFacets(t3, e3, r3, n3) {
              const o2 = [];
              for (const s2 of n3) {
                const [n4, a2] = s2.indices;
                if (a2 <= e3 || n4 >= r3) continue;
                const l = Math.max(0, n4 - e3), c = Math.min(t3.length, a2 - e3);
                if ("italic" === s2.type) o2.push({ offset: l, type: "open", tag: "<em>" }), o2.push({ offset: c, type: "close", tag: "</em>" });
                else if ("mention" === s2.type && s2.text) {
                  const t4 = `https://x.com/${(0, i.escapeHtml)(s2.text)}`;
                  o2.push({ offset: l, type: "open", tag: `<a href="${t4}">` }), o2.push({ offset: c, type: "close", tag: "</a>" });
                } else if ("url" === s2.type && s2.original) {
                  const t4 = (0, i.escapeHtml)(s2.original);
                  o2.push({ offset: l, type: "open", tag: `<a href="${t4}">` }), o2.push({ offset: c, type: "close", tag: "</a>" });
                }
              }
              return this.applyMarkers(t3, o2);
            }
            renderArticle(t3, e3, r3, n3) {
              var o2;
              const s2 = [];
              (null === (o2 = null == r3 ? void 0 : r3.media_info) || void 0 === o2 ? void 0 : o2.original_img_url) && s2.push(`<img src="${(0, i.escapeHtml)(r3.media_info.original_img_url)}" alt="Cover image">`);
              let a2 = 0;
              for (; a2 < t3.length; ) {
                const r4 = t3[a2];
                if ("unordered-list-item" === r4.type) {
                  const r5 = [];
                  for (; a2 < t3.length && "unordered-list-item" === t3[a2].type; ) r5.push(`<li>${this.renderInlineContent(t3[a2], e3)}</li>`), a2++;
                  s2.push(`<ul>${r5.join("")}</ul>`);
                  continue;
                }
                const o3 = this.renderBlock(r4, e3, n3);
                o3 && s2.push(o3), a2++;
              }
              return `<article class="x-article">${s2.join("\n")}</article>`;
            }
            renderBlock(t3, e3, r3) {
              switch (t3.type) {
                case "unstyled":
                default:
                  return t3.text.trim() ? `<p>${this.renderInlineContent(t3, e3)}</p>` : "";
                case "header-two":
                  return `<h2>${this.renderInlineContent(t3, e3)}</h2>`;
                case "header-three":
                  return `<h3>${this.renderInlineContent(t3, e3)}</h3>`;
                case "atomic":
                  return this.renderAtomicBlock(t3, e3, r3);
              }
            }
            renderAtomicBlock(t3, e3, r3) {
              var n3, o2;
              if (0 === t3.entityRanges.length) return "";
              const s2 = e3.find(((e4) => e4.key === String(t3.entityRanges[0].key)));
              if (!s2) return "";
              const a2 = s2.value;
              switch (a2.type) {
                case "MEDIA": {
                  const t4 = a2.data.mediaItems || [], e4 = a2.data.caption, s3 = [];
                  for (const a3 of t4) {
                    const t5 = null == r3 ? void 0 : r3.find(((t6) => String(t6.media_id) === String(a3.mediaId)));
                    if (!t5) continue;
                    const l = t5.media_info;
                    if ("ApiImage" === l.__typename && l.original_img_url) s3.push(`<img src="${(0, i.escapeHtml)(l.original_img_url)}" alt="${e4 ? (0, i.escapeHtml)(e4) : ""}">`);
                    else if ("ApiVideo" === l.__typename && (null === (n3 = l.preview_image) || void 0 === n3 ? void 0 : n3.original_img_url)) {
                      const t6 = null === (o2 = (l.variants || []).filter(((t7) => "video/mp4" === t7.content_type && t7.bit_rate)).sort(((t7, e5) => (e5.bit_rate || 0) - (t7.bit_rate || 0)))[0]) || void 0 === o2 ? void 0 : o2.url, r4 = l.preview_image.original_img_url;
                      t6 ? s3.push(`<video src="${(0, i.escapeHtml)(t6)}" poster="${(0, i.escapeHtml)(r4)}" controls></video>`) : s3.push(`<img src="${(0, i.escapeHtml)(r4)}" alt="${e4 ? (0, i.escapeHtml)(e4) : ""}">`);
                    }
                  }
                  return s3.length > 0 && e4 ? `<figure>${s3.join("\n")}<figcaption>${(0, i.escapeHtml)(e4)}</figcaption></figure>` : s3.length > 0 ? s3.map(((t5) => `<figure>${t5}</figure>`)).join("\n") : e4 ? `<figure><figcaption>${(0, i.escapeHtml)(e4)}</figcaption></figure>` : "";
                }
                case "MARKDOWN": {
                  const t4 = a2.data.markdown || "", e4 = t4.match(/^```(\w*)\n([\s\S]*?)\n?```$/);
                  if (e4) {
                    const t5 = e4[1], r4 = e4[2];
                    return `<pre><code${t5 ? ` class="language-${(0, i.escapeHtml)(t5)}" data-lang="${(0, i.escapeHtml)(t5)}"` : ""}>${(0, i.escapeHtml)(r4)}</code></pre>`;
                  }
                  return `<pre><code>${(0, i.escapeHtml)(t4)}</code></pre>`;
                }
                default:
                  return "";
              }
            }
            renderInlineContent(t3, e3) {
              var r3, n3;
              const o2 = t3.text;
              if (!o2) return "";
              const s2 = [];
              for (const e4 of t3.inlineStyleRanges) "Bold" === e4.style && (s2.push({ offset: e4.offset, type: "open", tag: "<strong>" }), s2.push({ offset: e4.offset + e4.length, type: "close", tag: "</strong>" }));
              for (const r4 of t3.entityRanges) {
                const t4 = e3.find(((t5) => t5.key === String(r4.key)));
                if ("LINK" === (null == t4 ? void 0 : t4.value.type) && t4.value.data.url) {
                  const e4 = (0, i.escapeHtml)(t4.value.data.url);
                  s2.push({ offset: r4.offset, type: "open", tag: `<a href="${e4}">` }), s2.push({ offset: r4.offset + r4.length, type: "close", tag: "</a>" });
                }
              }
              if (null === (r3 = t3.data) || void 0 === r3 ? void 0 : r3.mentions) for (const e4 of t3.data.mentions) {
                const t4 = `https://x.com/${(0, i.escapeHtml)(e4.text)}`;
                s2.push({ offset: e4.fromIndex, type: "open", tag: `<a href="${t4}">` }), s2.push({ offset: e4.toIndex, type: "close", tag: "</a>" });
              }
              if (null === (n3 = t3.data) || void 0 === n3 ? void 0 : n3.urls) for (const e4 of t3.data.urls) {
                const t4 = (0, i.escapeHtml)(e4.text);
                s2.push({ offset: e4.fromIndex, type: "open", tag: `<a href="${t4}">` }), s2.push({ offset: e4.toIndex, type: "close", tag: "</a>" });
              }
              return this.applyMarkers(o2, s2);
            }
          }
          e2.XOembedExtractor = a;
        }, 3258(t2, e2, r2) {
          var n2 = this && this.__awaiter || function(t3, e3, r3, n3) {
            return new (r3 || (r3 = Promise))((function(o2, i2) {
              function s2(t4) {
                try {
                  l2(n3.next(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function a2(t4) {
                try {
                  l2(n3.throw(t4));
                } catch (t5) {
                  i2(t5);
                }
              }
              function l2(t4) {
                var e4;
                t4.done ? o2(t4.value) : (e4 = t4.value, e4 instanceof r3 ? e4 : new r3((function(t5) {
                  t5(e4);
                }))).then(s2, a2);
              }
              l2((n3 = n3.apply(t3, e3 || [])).next());
            }));
          };
          Object.defineProperty(e2, "__esModule", { value: true }), e2.YoutubeExtractor = void 0;
          const o = r2(2279), i = r2(639), s = r2(2552), a = r2(1497), l = "」』）", c = new RegExp(`[.!?。！？]["'\\u2019\\u201D)${l}]*\\s*$`), u = new RegExp(`[?\\uFF1F]["'\\u2019\\u201D)${l}]*\\s*$`), d = /^(>>|-\s)/, h = /^(>>\s*|-\s+)/, m = /,\s*$/, f = new RegExp(`^(.*[.!?]["'\\u2019\\u201D)]*)\\s+([A-Z].*)$|^(.*[。！？][${l}]*)([${s.CJK_CHAR_RANGES}].*)$`), p = 4e3, g = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false", v = "20.10.38", y = { client: { clientName: "ANDROID", clientVersion: v } }, b = `com.google.android.youtube/${v} (Linux; U; Android 14)`, x = { client: { clientName: "IOS", clientVersion: "20.10.3" } }, C = { client: { clientName: "WEB", clientVersion: "2.20240101.00.00" } }, S = { segments: "ytd-transcript-segment-renderer", timestamp: ".segment-timestamp", text: ".segment-text" }, E = { segments: "transcript-segment-view-model", timestamp: ".ytwTranscriptSegmentViewModelTimestamp", text: "span.yt-core-attributed-string", chapters: "timeline-chapter-view-model h3" };
          class A extends o.BaseExtractor {
            constructor(t3, e3, r3, n3) {
              super(t3, e3, r3, n3), this.inlineJsonCache = /* @__PURE__ */ new Map(), this.videoElement = t3.querySelector("video"), this.schemaOrgData = r3;
            }
            canExtract() {
              return true;
            }
            canExtractAsync() {
              return true;
            }
            prefersAsync() {
              return true;
            }
            extract() {
              return this.buildResult(this.extractTranscriptFromExistingDom());
            }
            extractAsync() {
              return n2(this, void 0, void 0, (function* () {
                const t3 = this.extractTranscriptFromExistingDom();
                if (this.shouldUseExistingDomTranscript(t3)) return this.buildResult(t3);
                const e3 = (yield this.fetchTranscript()) || t3 || (yield this.extractTranscriptFromOpenedDom());
                return this.buildResult(e3);
              }));
            }
            normalizeLanguageCode(t3) {
              return (t3 || "").trim().replace(/_/g, "-").toLocaleLowerCase();
            }
            languageCodeMatchesPreference(t3, e3) {
              const r3 = this.normalizeLanguageCode(t3), n3 = this.normalizeLanguageCode(e3);
              if (!r3 || !n3) return false;
              if (r3 === n3) return true;
              const o2 = r3.split("-")[0], i2 = n3.split("-")[0];
              return o2 === i2 && (r3 === o2 || n3 === i2);
            }
            shouldUseExistingDomTranscript(t3) {
              return !!t3 && (!this.options.language || this.languageCodeMatchesPreference(t3.languageCode, this.options.language));
            }
            getCaptionTracks(t3) {
              var e3, r3;
              const n3 = null === (r3 = null === (e3 = null == t3 ? void 0 : t3.captions) || void 0 === e3 ? void 0 : e3.playerCaptionsTracklistRenderer) || void 0 === r3 ? void 0 : r3.captionTracks;
              return Array.isArray(n3) ? n3 : [];
            }
            findPreferredCaptionTrack(t3, e3) {
              var r3, n3;
              const o2 = this.normalizeLanguageCode(e3);
              if (!o2) return;
              const i2 = o2.split("-")[0], s2 = t3.map(((t4) => ({ t: t4, code: this.normalizeLanguageCode(t4.languageCode) }))), a2 = (t4) => {
                var e4, r4;
                const n4 = s2.filter(t4);
                return null === (r4 = null !== (e4 = n4.find((({ t: t5 }) => "asr" !== t5.kind))) && void 0 !== e4 ? e4 : n4[0]) || void 0 === r4 ? void 0 : r4.t;
              };
              return null !== (n3 = null !== (r3 = a2((({ code: t4 }) => t4 === o2))) && void 0 !== r3 ? r3 : a2((({ code: t4 }) => t4 === i2))) && void 0 !== n3 ? n3 : a2((({ code: t4 }) => t4.split("-")[0] === i2));
            }
            pickCaptionTrack(t3) {
              const e3 = this.options.language;
              if (e3) {
                const r4 = this.findPreferredCaptionTrack(t3, e3);
                if (r4) return r4;
              }
              const r3 = t3.filter(((t4) => "asr" !== t4.kind)), n3 = r3.length > 0 ? r3 : t3;
              return n3.find(((t4) => "en" === t4.languageCode)) || n3[0];
            }
            getTrackDisplayName(t3) {
              var e3, r3, n3;
              return (null === (e3 = null == t3 ? void 0 : t3.name) || void 0 === e3 ? void 0 : e3.simpleText) || (null === (n3 = null === (r3 = null == t3 ? void 0 : t3.name) || void 0 === r3 ? void 0 : r3.runs) || void 0 === n3 ? void 0 : n3.map(((t4) => (null == t4 ? void 0 : t4.text) || "")).join("").trim()) || "";
            }
            normalizeLanguageLabel(t3) {
              return t3.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase();
            }
            getTranscriptLanguageCodeFromDom() {
              var t3;
              const e3 = this.document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] #footer yt-sort-filter-sub-menu-renderer yt-dropdown-menu button'), r3 = null === (t3 = null == e3 ? void 0 : e3.textContent) || void 0 === t3 ? void 0 : t3.trim(), n3 = this.getCaptionTracks(this.getValidatedPlayerResponse()), o2 = 1 === n3.length ? n3[0] : void 0;
              if (!r3) return null == o2 ? void 0 : o2.languageCode;
              const i2 = this.normalizeLanguageLabel(r3), s2 = n3.find(((t4) => this.normalizeLanguageLabel(this.getTrackDisplayName(t4)) === i2));
              return (null == s2 ? void 0 : s2.languageCode) || (null == o2 ? void 0 : o2.languageCode);
            }
            getInlineChapters() {
              var t3, e3, r3, n3;
              const o2 = this.getVideoId(), i2 = this.parseInlineJson("ytInitialData");
              if (!i2) return [];
              if (o2) {
                const s3 = null === (e3 = null === (t3 = null == i2 ? void 0 : i2.currentVideoEndpoint) || void 0 === t3 ? void 0 : t3.watchEndpoint) || void 0 === e3 ? void 0 : e3.videoId, a2 = null === (n3 = null === (r3 = null == i2 ? void 0 : i2.endpoint) || void 0 === r3 ? void 0 : r3.watchEndpoint) || void 0 === n3 ? void 0 : n3.videoId;
                if (s3 !== o2 && a2 !== o2) return [];
              }
              const s2 = this.extractChaptersFromPlayerBar(i2);
              return s2.length > 0 ? s2 : this.extractChaptersFromEngagementPanels(i2);
            }
            getTranscriptContainer() {
              const t3 = this.document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] #segments-container');
              return t3 || this.document.querySelector("ytm-macro-markers-list-renderer .ytm-macro-markers-list-container");
            }
            getTranscriptSelectors(t3) {
              return t3.querySelectorAll("ytd-transcript-segment-renderer").length > 0 ? S : t3.querySelectorAll("transcript-segment-view-model").length > 0 ? E : void 0;
            }
            buildTranscriptFromContainer(t3, e3) {
              var r3;
              if (0 === t3.children.length) return;
              const n3 = this.getTranscriptSelectors(t3);
              if (!n3) return;
              const o2 = [], i2 = [];
              if (n3.chapters) {
                const e4 = t3.querySelectorAll(n3.chapters);
                for (const t4 of e4) {
                  const e5 = (t4.textContent || "").trim();
                  if (!e5) continue;
                  const o3 = t4.closest("macro-markers-panel-item-view-model"), s3 = null === (r3 = null == o3 ? void 0 : o3.nextElementSibling) || void 0 === r3 ? void 0 : r3.querySelector(n3.timestamp), a2 = ((null == s3 ? void 0 : s3.textContent) || "").trim(), l3 = this.parseTimestamp(a2);
                  null !== l3 && i2.push({ title: e5, start: l3 });
                }
              }
              const s2 = t3.querySelectorAll(n3.segments);
              for (const t4 of s2) {
                const e4 = t4.querySelector(n3.timestamp), r4 = t4.querySelector(n3.text);
                if (!e4 || !r4) continue;
                const i3 = (e4.textContent || "").trim(), s3 = (r4.textContent || "").trim();
                if (!s3) continue;
                const a2 = this.parseTimestamp(i3);
                null !== a2 && o2.push({ start: a2, text: s3 });
              }
              if (0 === o2.length) return;
              const l2 = e3.length > 0 ? e3 : i2, c2 = this.groupTranscriptSegments(o2), { html: u2, text: d2 } = (0, a.buildTranscript)("youtube", c2, l2);
              return { html: u2, text: d2, languageCode: this.getTranscriptLanguageCodeFromDom() };
            }
            extractTranscriptFromExistingDom() {
              try {
                const t3 = this.getTranscriptContainer();
                if (!t3) return;
                return this.buildTranscriptFromContainer(t3, this.getInlineChapters());
              } catch (t3) {
                return void console.error("YoutubeExtractor: failed to extract transcript from existing DOM", t3);
              }
            }
            canOpenTranscriptPanel() {
              var t3;
              return "function" == typeof (null === (t3 = this.document.defaultView) || void 0 === t3 ? void 0 : t3.MutationObserver);
            }
            buildResult(t3) {
              const e3 = this.getVideoData(), r3 = this.getChannelName(e3), n3 = e3.description || "", o2 = this.formatDescription(n3);
              let i2 = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.getVideoId()}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>${o2}`;
              (null == t3 ? void 0 : t3.html) && (i2 += t3.html);
              const s2 = { title: e3.name || "", author: r3, site: "YouTube", image: Array.isArray(e3.thumbnailUrl) && e3.thumbnailUrl[0] || "", published: e3.uploadDate, description: n3.slice(0, 200).trim() };
              return (null == t3 ? void 0 : t3.text) && (s2.transcript = t3.text), (null == t3 ? void 0 : t3.languageCode) && (s2.language = t3.languageCode), { content: i2, contentHtml: i2, extractedContent: { videoId: this.getVideoId(), author: r3 }, variables: s2 };
            }
            formatDescription(t3) {
              return `<p>${(0, i.escapeHtml)(t3).replace(/\n/g, "<br>")}</p>`;
            }
            getVideoData() {
              var t3, e3, r3, n3;
              const o2 = this.getVideoId(), i2 = Array.from(this.document.querySelectorAll('script[type="application/ld+json"]'));
              let s2;
              for (const t4 of i2) try {
                const e4 = JSON.parse(t4.textContent || ""), r4 = (Array.isArray(e4) ? e4 : [e4]).find(((t5) => {
                  if ("VideoObject" !== t5["@type"]) return false;
                  if (!o2) return true;
                  return (t5["@id"] || t5.url || t5.embedUrl || "").includes(o2);
                }));
                if (r4 && r4.description) return r4;
                !r4 || !r4.comment && s2 || (s2 = r4);
              } catch (t5) {
              }
              if (s2) return s2;
              if (o2) {
                if (((null === (t3 = this.document.querySelector('meta[property="og:url"]')) || void 0 === t3 ? void 0 : t3.getAttribute("content")) || "").includes(o2)) return { name: (null === (e3 = this.document.querySelector('meta[property="og:title"]')) || void 0 === e3 ? void 0 : e3.getAttribute("content")) || "", description: (null === (r3 = this.document.querySelector('meta[property="og:description"]')) || void 0 === r3 ? void 0 : r3.getAttribute("content")) || "", thumbnailUrl: (null === (n3 = this.document.querySelector('meta[property="og:image"]')) || void 0 === n3 ? void 0 : n3.getAttribute("content")) || "" };
              }
              return {};
            }
            getChannelName(t3) {
              const e3 = this.getChannelNameFromDom();
              if (e3) return e3;
              const r3 = this.getChannelNameFromPlayerResponse();
              return r3 || ((null == t3 ? void 0 : t3.author) || "");
            }
            getChannelNameFromDom() {
              var t3;
              const e3 = ['ytd-video-owner-renderer #channel-name a[href^="/@"]', '#owner-name a[href^="/@"]'];
              for (const r3 of e3) {
                const e4 = this.document.querySelector(r3), n3 = null === (t3 = null == e4 ? void 0 : e4.textContent) || void 0 === t3 ? void 0 : t3.trim();
                if (n3) return n3;
              }
              return this.getChannelNameFromMicrodata();
            }
            getChannelNameFromMicrodata() {
              var t3;
              const e3 = this.document.querySelector('[itemprop="author"]');
              if (!e3) return "";
              const r3 = e3.querySelector('meta[itemprop="name"]');
              if (null == r3 ? void 0 : r3.getAttribute("content")) return r3.getAttribute("content").trim();
              const n3 = e3.querySelector('link[itemprop="name"]');
              if (null == n3 ? void 0 : n3.getAttribute("content")) return n3.getAttribute("content").trim();
              const o2 = e3.querySelector('[itemprop="name"], a, span');
              return (null === (t3 = null == o2 ? void 0 : o2.textContent) || void 0 === t3 ? void 0 : t3.trim()) || "";
            }
            getChannelNameFromPlayerResponse() {
              var t3, e3, r3, n3;
              const o2 = this.getValidatedPlayerResponse();
              return o2 && ((null === (t3 = o2.videoDetails) || void 0 === t3 ? void 0 : t3.author) || (null === (e3 = o2.videoDetails) || void 0 === e3 ? void 0 : e3.ownerChannelName) || (null === (n3 = null === (r3 = o2.microformat) || void 0 === r3 ? void 0 : r3.playerMicroformatRenderer) || void 0 === n3 ? void 0 : n3.ownerChannelName)) || "";
            }
            getValidatedPlayerResponse() {
              var t3, e3, r3;
              const n3 = this.getVideoId();
              if (!n3) return null;
              const o2 = this.parseInlineJson("ytInitialPlayerResponse");
              if (!o2) return null;
              const i2 = null === (t3 = o2.videoDetails) || void 0 === t3 ? void 0 : t3.videoId, s2 = null === (r3 = null === (e3 = o2.microformat) || void 0 === e3 ? void 0 : e3.playerMicroformatRenderer) || void 0 === r3 ? void 0 : r3.externalVideoId;
              return i2 === n3 || s2 === n3 ? o2 : null;
            }
            parseInlineJson(t3) {
              if (this.inlineJsonCache.has(t3)) return this.inlineJsonCache.get(t3);
              const e3 = Array.from(this.document.querySelectorAll("script"));
              for (const r3 of e3) {
                const e4 = r3.textContent || "";
                if (!e4.includes(t3)) continue;
                const n3 = e4.indexOf("{", e4.indexOf(t3));
                if (-1 === n3) continue;
                let o2 = 0;
                for (let r4 = n3; r4 < e4.length; r4++) {
                  const i2 = e4[r4];
                  if ("{" === i2) o2 += 1;
                  else if ("}" === i2 && (o2 -= 1, 0 === o2)) {
                    const o3 = e4.slice(n3, r4 + 1);
                    try {
                      const e5 = JSON.parse(o3);
                      return this.inlineJsonCache.set(t3, e5), e5;
                    } catch (t4) {
                      console.error("YoutubeExtractor: failed to parse inline JSON", t4);
                      break;
                    }
                  }
                }
              }
              return null;
            }
            fetchTranscript() {
              return n2(this, void 0, void 0, (function* () {
                try {
                  const t3 = this.getVideoId();
                  if (!t3) return;
                  const e3 = this.fetchChapters(t3), r3 = this.getInlineCaptionTrack(), n3 = r3 ? this.fetchCaptionXml(r3, e3) : void 0, o2 = yield this.fetchPlayerData(t3), i2 = o2 ? this.pickCaptionTrack(this.getCaptionTracks(o2)) : void 0, s2 = (null == i2 ? void 0 : i2.baseUrl) && i2.baseUrl !== (null == r3 ? void 0 : r3.baseUrl) ? this.fetchCaptionXml(i2, e3) : void 0, a2 = s2 ? yield s2 : void 0;
                  return a2 || (n3 ? yield n3 : void 0);
                } catch (t3) {
                  return void console.error("YoutubeExtractor: failed to fetch transcript", t3);
                }
              }));
            }
            getInlineCaptionTrack() {
              const t3 = this.getValidatedPlayerResponse(), e3 = this.getCaptionTracks(t3);
              if (0 === e3.length) return;
              const r3 = this.pickCaptionTrack(e3);
              return (null == r3 ? void 0 : r3.baseUrl) ? r3 : void 0;
            }
            fetchCaptionXml(t3, e3) {
              return n2(this, void 0, void 0, (function* () {
                try {
                  if (!new URL(t3.baseUrl).hostname.endsWith(".youtube.com")) return;
                  const r3 = { "User-Agent": "Mozilla/5.0" };
                  this.options.language && (r3["Accept-Language"] = this.options.language);
                  const n3 = yield this.fetch(t3.baseUrl, { headers: r3, signal: AbortSignal.timeout(p) });
                  if (!n3.ok) return;
                  let o2;
                  try {
                    o2 = yield n3.text();
                  } catch (t4) {
                    return;
                  }
                  if (!o2) return;
                  const i2 = yield e3;
                  return this.parseTranscriptXml(o2, t3.languageCode || "en", i2);
                } catch (t4) {
                  return;
                }
              }));
            }
            pollFor(t3, e3 = 20) {
              return new Promise(((r3) => {
                let n3 = 0;
                const o2 = () => {
                  const i2 = t3();
                  i2 ? r3(i2) : n3++ < e3 ? setTimeout(o2, 250) : r3(null);
                };
                o2();
              }));
            }
            waitForTranscriptSegments() {
              return this.pollFor((() => {
                const t3 = this.getTranscriptContainer();
                return t3 && 0 !== t3.children.length && t3.querySelectorAll(E.segments).length > 0 ? t3 : null;
              }));
            }
            waitForTranscriptContainer() {
              return this.pollFor((() => {
                const t3 = this.getTranscriptContainer();
                return t3 && t3.children.length > 0 ? t3 : null;
              }));
            }
            waitForElement(t3) {
              return this.pollFor((() => this.document.querySelector(t3)));
            }
            isMobileYoutube() {
              return !!this.document.querySelector("ytm-slim-video-metadata-section-renderer");
            }
            extractTranscriptFromOpenedDom() {
              return n2(this, void 0, void 0, (function* () {
                try {
                  if (!this.canOpenTranscriptPanel()) return;
                  if (this.isMobileYoutube()) return this.openMobileTranscriptPanel();
                  const t3 = this.document.querySelector("ytd-video-description-transcript-section-renderer button");
                  if (!t3) return;
                  t3.click();
                  const e3 = yield this.waitForTranscriptContainer();
                  if (!e3) return;
                  const r3 = this.getVideoId(), n3 = r3 ? yield this.fetchChapters(r3) : this.getInlineChapters();
                  return this.buildTranscriptFromContainer(e3, n3);
                } catch (t3) {
                  return void console.error("YoutubeExtractor: failed to extract transcript from opened DOM", t3);
                }
              }));
            }
            openMobileTranscriptPanel() {
              return n2(this, void 0, void 0, (function* () {
                try {
                  const t3 = this.document.querySelector('button[aria-label="Show more"]');
                  t3 && t3.click();
                  const e3 = yield this.waitForElement('button[aria-label="View all"]');
                  if (!e3) return;
                  e3.click();
                  const r3 = yield this.waitForElement('button[aria-label="Timeline"]');
                  if (!r3) return;
                  r3.click();
                  const n3 = yield this.waitForTranscriptSegments();
                  if (!n3) return;
                  return this.buildTranscriptFromContainer(n3, []);
                } catch (t3) {
                  return void console.error("YoutubeExtractor: failed to open mobile transcript panel", t3);
                }
              }));
            }
            fetchPlayerData(t3) {
              return n2(this, void 0, void 0, (function* () {
                try {
                  const e4 = { "Content-Type": "application/json" };
                  this.options.language && (e4["Accept-Language"] = this.options.language);
                  const r3 = yield this.fetch(g, { method: "POST", headers: e4, signal: AbortSignal.timeout(p), body: JSON.stringify({ context: x, videoId: t3 }) });
                  if (r3.ok) {
                    const t4 = yield r3.json();
                    if (this.getCaptionTracks(t4).length > 0) return t4;
                  }
                } catch (t4) {
                }
                try {
                  const e4 = { "Content-Type": "application/json", "User-Agent": b };
                  this.options.language && (e4["Accept-Language"] = this.options.language);
                  const r3 = yield this.fetch(g, { method: "POST", headers: e4, signal: AbortSignal.timeout(p), body: JSON.stringify({ context: y, videoId: t3 }) });
                  if (r3.ok) {
                    const t4 = yield r3.json();
                    if (this.getCaptionTracks(t4).length > 0) return t4;
                  }
                } catch (t4) {
                }
                try {
                  const e4 = { "Content-Type": "application/json" };
                  this.options.language && (e4["Accept-Language"] = this.options.language);
                  const r3 = yield this.fetch(g, { method: "POST", headers: e4, signal: AbortSignal.timeout(p), body: JSON.stringify({ context: C, videoId: t3 }) });
                  if (r3.ok) {
                    const t4 = yield r3.json();
                    if (this.getCaptionTracks(t4).length > 0) return t4;
                  }
                } catch (t4) {
                }
                const e3 = this.parseInlineJson("ytInitialPlayerResponse");
                if (this.getCaptionTracks(e3).length > 0) return e3;
              }));
            }
            fetchChapters(t3) {
              return n2(this, void 0, void 0, (function* () {
                const e3 = this.getInlineChapters();
                if (e3.length > 0) return e3;
                try {
                  const e4 = { "Content-Type": "application/json" };
                  this.options.language && (e4["Accept-Language"] = this.options.language);
                  const r3 = yield this.fetch("https://www.youtube.com/youtubei/v1/next?prettyPrint=false", { method: "POST", headers: e4, signal: AbortSignal.timeout(p), body: JSON.stringify({ context: C, videoId: t3 }) });
                  if (!r3.ok) return [];
                  const n3 = yield r3.json(), o2 = this.extractChaptersFromPlayerBar(n3);
                  return o2.length > 0 ? o2 : this.extractChaptersFromEngagementPanels(n3);
                } catch (t4) {
                  return [];
                }
              }));
            }
            extractChaptersFromPlayerBar(t3) {
              var e3, r3, n3, o2, i2, s2, a2, l2;
              const c2 = [], u2 = null === (s2 = null === (i2 = null === (o2 = null === (n3 = null === (r3 = null === (e3 = null == t3 ? void 0 : t3.playerOverlays) || void 0 === e3 ? void 0 : e3.playerOverlayRenderer) || void 0 === r3 ? void 0 : r3.decoratedPlayerBarRenderer) || void 0 === n3 ? void 0 : n3.decoratedPlayerBarRenderer) || void 0 === o2 ? void 0 : o2.playerBar) || void 0 === i2 ? void 0 : i2.multiMarkersPlayerBarRenderer) || void 0 === s2 ? void 0 : s2.markersMap;
              if (!Array.isArray(u2)) return c2;
              for (const t4 of u2) {
                const e4 = null === (a2 = null == t4 ? void 0 : t4.value) || void 0 === a2 ? void 0 : a2.chapters;
                if (Array.isArray(e4)) for (const t5 of e4) {
                  const e5 = null == t5 ? void 0 : t5.chapterRenderer;
                  if (!e5) continue;
                  const r4 = (null === (l2 = e5.title) || void 0 === l2 ? void 0 : l2.simpleText) || "", n4 = e5.timeRangeStartMillis;
                  r4 && "number" == typeof n4 && c2.push({ title: r4, start: n4 / 1e3 });
                }
              }
              return c2;
            }
            extractChaptersFromEngagementPanels(t3) {
              var e3, r3, n3, o2;
              const i2 = [], s2 = null == t3 ? void 0 : t3.engagementPanels;
              if (!Array.isArray(s2)) return i2;
              for (const t4 of s2) {
                const s3 = null === (e3 = null == t4 ? void 0 : t4.engagementPanelSectionListRenderer) || void 0 === e3 ? void 0 : e3.content, a2 = null === (r3 = null == s3 ? void 0 : s3.macroMarkersListRenderer) || void 0 === r3 ? void 0 : r3.contents;
                if (Array.isArray(a2)) for (const t5 of a2) {
                  const e4 = null == t5 ? void 0 : t5.macroMarkersListItemRenderer;
                  if (!e4) continue;
                  const r4 = (null === (n3 = e4.title) || void 0 === n3 ? void 0 : n3.simpleText) || "", s4 = (null === (o2 = e4.timeDescription) || void 0 === o2 ? void 0 : o2.simpleText) || "";
                  if (!r4 || !s4) continue;
                  const a3 = this.parseTimestamp(s4);
                  null !== a3 && i2.push({ title: r4, start: a3 });
                }
              }
              return i2;
            }
            parseTimestamp(t3) {
              const e3 = t3.split(":").map(Number);
              return e3.some(isNaN) ? null : 3 === e3.length ? 3600 * e3[0] + 60 * e3[1] + e3[2] : 2 === e3.length ? 60 * e3[0] + e3[1] : null;
            }
            parseTranscriptXml(t3, e3, r3 = []) {
              const n3 = [], o2 = /<p\s+t="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
              let i2;
              for (; null !== (i2 = o2.exec(t3)); ) {
                const t4 = parseInt(i2[1], 10), e4 = i2[2];
                let r4 = "";
                const o3 = /<s[^>]*>([^<]*)<\/s>/g;
                let s3;
                for (; null !== (s3 = o3.exec(e4)); ) r4 += s3[1];
                r4 || (r4 = e4.replace(/<[^>]+>/g, "")), r4 = r4.replace(/\n/g, " ").replace(/\s{2,}/g, " "), r4 = this.decodeEntities(r4), r4.trim() && n3.push({ start: t4 / 1e3, text: r4.trim() });
              }
              if (0 === n3.length) {
                const e4 = /<text\s+start="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
                for (; null !== (i2 = e4.exec(t3)); ) {
                  const t4 = parseFloat(i2[1]);
                  let e5 = this.decodeEntities(i2[2].replace(/<[^>]+>/g, "").replace(/\n/g, " ").replace(/\s{2,}/g, " "));
                  e5.trim() && n3.push({ start: t4, text: e5.trim() });
                }
              }
              if (0 === n3.length) return;
              const s2 = this.groupTranscriptSegments(n3), { html: l2, text: c2 } = (0, a.buildTranscript)("youtube", s2, r3);
              return { html: l2, text: c2, languageCode: e3 };
            }
            decodeEntities(t3) {
              return t3.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&#x([0-9a-fA-F]+);/g, ((t4, e3) => String.fromCodePoint(parseInt(e3, 16)))).replace(/&#(\d+);/g, ((t4, e3) => String.fromCodePoint(parseInt(e3, 10))));
            }
            getVideoId() {
              if (void 0 === this._videoId) {
                const t3 = new URL(this.url);
                this._videoId = "youtu.be" === t3.hostname ? t3.pathname.slice(1) : t3.pathname.includes("/shorts/") ? t3.pathname.split("/shorts/")[1].split("/")[0] : new URLSearchParams(t3.search).get("v") || "";
              }
              return this._videoId;
            }
            groupTranscriptSegments(t3) {
              if (0 === t3.length) return [];
              return t3.some(((t4) => d.test(t4.text))) ? this.groupBySpeaker(t3) : this.groupBySentence(t3);
            }
            groupBySpeaker(t3) {
              const e3 = [];
              let r3 = null, n3 = -1, o2 = "";
              for (const i3 of t3) {
                const t4 = d.test(i3.text), s2 = i3.text.replace(h, ""), a2 = m.test(o2), l2 = (c.test(o2) || !o2) && !a2;
                t4 && l2 ? (r3 && e3.push(r3), n3 = (n3 + 1) % 2, r3 = { start: i3.start, segments: [{ start: i3.start, text: s2 }], speakerChange: true, speaker: n3 }) : (r3 || (r3 = { start: i3.start, segments: [], speakerChange: false }), r3.segments.push({ start: i3.start, text: s2 })), o2 = s2;
              }
              r3 && e3.push(r3), this.splitAffirmativeTurns(e3);
              const i2 = [];
              for (const t4 of e3) {
                const e4 = void 0 === t4.speaker ? this.groupBySentence(t4.segments) : this.mergeSentenceGroupsWithinTurn(this.groupBySentence(t4.segments));
                for (let r4 = 0; r4 < e4.length; r4++) i2.push(Object.assign(Object.assign({}, e4[r4]), { speakerChange: 0 === r4 && t4.speakerChange, speaker: t4.speaker }));
              }
              return i2;
            }
            splitAffirmativeTurns(t3) {
              const e3 = /^(mhm|yeah|yes|yep|right|okay|ok|absolutely|sure|exactly|uh-huh|mm-hmm)[.!,]?\s+/i;
              for (let r3 = 0; r3 < t3.length; r3++) {
                const n3 = t3[r3];
                if (void 0 === n3.speaker || 0 === n3.segments.length) continue;
                const o2 = n3.segments[0], i2 = e3.exec(o2.text);
                if (!i2) continue;
                if (/,\s*$/.test(i2[0])) continue;
                const a2 = o2.text.slice(i2[0].length).trim(), l2 = n3.segments.slice(1);
                if ((0, s.countWords)(a2) + l2.reduce(((t4, e4) => t4 + (0, s.countWords)(e4.text)), 0) < 30) continue;
                const c2 = i2[0].trimEnd(), u2 = a2 ? [{ start: o2.start, text: a2 }, ...l2] : l2, d2 = { start: n3.start, segments: [{ start: o2.start, text: c2 }], speakerChange: n3.speakerChange, speaker: n3.speaker }, h2 = { start: u2[0].start, segments: u2, speakerChange: true, speaker: 0 === n3.speaker ? 1 : 0 };
                t3.splice(r3, 1, d2, h2), r3++;
              }
            }
            mergeSentenceGroupsWithinTurn(t3) {
              if (t3.length <= 1) return t3;
              const e3 = [];
              let r3 = Object.assign({}, t3[0]), n3 = true;
              for (let o2 = 1; o2 < t3.length; o2++) {
                const i2 = t3[o2];
                this.shouldMergeSentenceGroups(r3, i2, n3) ? r3.text = `${r3.text} ${i2.text}` : (e3.push(r3), r3 = Object.assign({}, i2), n3 = false);
              }
              return e3.push(r3), e3;
            }
            shouldMergeSentenceGroups(t3, e3, r3) {
              const n3 = (0, s.countWords)(t3.text), o2 = (0, s.countWords)(e3.text);
              return !this.isShortStandaloneUtterance(t3.text, n3) && !this.isShortStandaloneUtterance(e3.text, o2) && (!(r3 && n3 < 8) && (!u.test(t3.text) && !u.test(e3.text) && (!(n3 + o2 > 80) && !(e3.start - t3.start > 45))));
            }
            isShortStandaloneUtterance(t3, e3) {
              const r3 = null != e3 ? e3 : (0, s.countWords)(t3);
              return r3 > 0 && r3 <= 3 && c.test(t3);
            }
            groupBySentence(t3) {
              const e3 = [], r3 = [], n3 = (t4) => {
                const r4 = t4.map(((t5) => t5.text)).join(" ").trim();
                r4 && e3.push({ start: t4[0].start, text: r4, speakerChange: false });
              }, o2 = () => {
                0 !== r3.length && (n3(r3), r3.length = 0);
              };
              for (const e4 of t3) if (r3.length > 0 && e4.start - r3[r3.length - 1].start > 20 && o2(), r3.push(e4), c.test(e4.text)) o2();
              else if (e4.start - r3[0].start >= 30) {
                const t4 = this.findNaturalBreak(r3);
                t4 > 0 && t4 < r3.length ? (i2 = t4) <= 0 || n3(r3.splice(0, i2)) : o2();
              }
              var i2;
              return o2(), e3;
            }
            findNaturalBreak(t3) {
              var e3, r3;
              if (t3.length <= 1) return -1;
              const n3 = t3[0].start + 15;
              for (let o3 = t3.length - 1; o3 >= 0 && !(t3[o3].start < n3); o3--) {
                const n4 = t3[o3].text.match(f);
                if (n4) {
                  const i3 = null !== (e3 = n4[1]) && void 0 !== e3 ? e3 : n4[3], s2 = null !== (r3 = n4[2]) && void 0 !== r3 ? r3 : n4[4], a2 = t3[o3].start;
                  return t3.splice(o3, 1, { start: a2, text: i3 }, { start: a2, text: s2 }), o3 + 1;
                }
              }
              let o2 = -1, i2 = 0;
              for (let e4 = 1; e4 < t3.length; e4++) {
                if (t3[e4].start < n3) continue;
                const r4 = t3[e4].start - t3[e4 - 1].start;
                r4 >= i2 && (i2 = r4, o2 = e4);
              }
              return o2;
            }
          }
          e2.YoutubeExtractor = A;
        }, 1608(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.MetadataExtractor = void 0;
          const n2 = r2(2552);
          class o {
            static extract(t3, e3, r3) {
              var n3, o2;
              let i = "", s = "";
              try {
                if (s = (null === (n3 = t3.location) || void 0 === n3 ? void 0 : n3.href) || "", s || (s = this.getMetaContent(r3, "property", "og:url") || this.getMetaContent(r3, "property", "twitter:url") || this.getSchemaProperty(e3, "url") || this.getSchemaProperty(e3, "mainEntityOfPage.url") || this.getSchemaProperty(e3, "mainEntity.url") || this.getSchemaProperty(e3, "WebSite.url") || (null === (o2 = t3.querySelector('link[rel="canonical"]')) || void 0 === o2 ? void 0 : o2.getAttribute("href")) || ""), s) try {
                  i = new URL(s).hostname.replace(/^www\./, "");
                } catch (t4) {
                  console.warn("Failed to parse URL:", t4);
                }
              } catch (e4) {
                const r4 = t3.querySelector("base[href]");
                if (r4) try {
                  s = r4.getAttribute("href") || "", i = new URL(s).hostname.replace(/^www\./, "");
                } catch (t4) {
                  console.warn("Failed to parse base URL:", t4);
                }
              }
              const a = this.getSiteName(e3, r3), { title: l, detectedSiteName: c } = this.cleanTitle(this.getBestTitle(t3, e3, r3, i, a), a), u = this.getAuthor(t3, e3, r3), d = u && !u.includes(",") ? u : "", h = a || c || d || i || "";
              return { title: l, description: this.getDescription(t3, e3, r3), domain: i, favicon: this.getFavicon(t3, s, r3), image: this.getImage(t3, e3, r3), language: this.getLanguage(t3, e3, r3), published: this.getPublished(t3, e3, r3, s), author: u, site: h, schemaOrgData: e3, wordCount: 0, parseTime: 0 };
            }
            static isPlaceholderValue(t3) {
              return !(!/[{}]/.test(t3) && !/^#[a-zA-Z]/.test(t3)) || !/[\p{L}\p{N}]/u.test(t3);
            }
            static firstValid(t3) {
              for (const e3 of t3) {
                const t4 = e3();
                if (t4 && !this.isPlaceholderValue(t4)) return t4;
              }
              return "";
            }
            static getAuthor(t3, e3, r3) {
              var n3, o2, i;
              let s;
              if (s = this.firstValid([() => this.getMetaContent(r3, "name", "sailthru.author"), () => this.getMetaContent(r3, "property", "article:author"), () => this.getMetaContent(r3, "property", "author"), () => this.getMetaContent(r3, "name", "author"), () => this.getMetaContent(r3, "name", "byl"), () => this.getMetaContent(r3, "name", "authorList")]), s) {
                const t4 = this.cleanAuthorString(s);
                if (t4) return t4;
              }
              let a = this.getMetaContents(r3, "name", "citation_author").filter(((t4) => !this.isPlaceholderValue(t4)));
              if (0 === a.length && (a = this.getMetaContents(r3, "property", "dc.creator").filter(((t4) => !this.isPlaceholderValue(t4)))), a.length > 0) return s = a.map(((t4) => {
                if (!t4.includes(",")) return t4.trim();
                const e4 = /(.*),\s(.*)/.exec(t4);
                return e4 && 3 === e4.length ? `${e4[2]} ${e4[1]}` : t4.trim();
              })).join(", "), s;
              let l = this.getSchemaProperty(e3, "author.name") || this.getSchemaProperty(e3, "author.[].name");
              if (l) {
                const t4 = l.split(",").map(((t5) => t5.trim().replace(/,$/, "").trim())).filter(((t5) => t5 && !this.isPlaceholderValue(t5)));
                if (t4.length > 0) {
                  let e4 = [...new Set(t4)];
                  return e4.length > 10 && (e4 = e4.slice(0, 10)), e4.join(", ");
                }
              }
              const c = t3.querySelectorAll('a[rel~="author"], address[rel~="author"]');
              if (c.length > 0 && c.length <= 3) {
                const t4 = [];
                c.forEach(((e5) => {
                  const r4 = this.getVisibleText(e5), n4 = r4.toLowerCase();
                  r4 && r4.length < 100 && "author" !== n4 && "authors" !== n4 && !this.isPlaceholderValue(r4) && t4.push(r4);
                }));
                const e4 = [...new Set(t4)];
                if (e4.length > 0) return e4.join(", ");
              }
              const u = [], d = (t4) => {
                t4 && t4.split(",").forEach(((t5) => {
                  const e4 = t5.replace(/\s+/g, " ").trim().replace(/,$/, "").trim(), r4 = e4.toLowerCase();
                  e4 && "author" !== r4 && "authors" !== r4 && !this.isPlaceholderValue(e4) && u.push(e4);
                }));
              }, h = [{ selector: '[itemprop="author"]' }, { selector: ".author", maxMatches: 3 }, { selector: '[href*="/author/"]', maxMatches: 3 }, { selector: ".authors a", maxMatches: 3 }];
              for (const { selector: e4, maxMatches: r4 } of h) {
                const n4 = t3.querySelectorAll(e4);
                r4 && n4.length > r4 || n4.forEach(((t4) => d(this.getAuthorName(t4))));
              }
              if (u.length > 0) {
                let t4 = [...new Set(u.map(((t5) => t5.trim())).filter(Boolean))];
                if (t4.length > 1 && (t4 = t4.filter(((e4) => !t4.some(((t5) => t5 !== e4 && e4.includes(t5)))))), t4.length > 0) return t4.length > 10 && (t4 = t4.slice(0, 10)), t4.join(", ");
              }
              const m = t3.querySelector("h1");
              if (m) {
                let t4 = m.nextElementSibling;
                for (let e5 = 0; e5 < 3 && t4; e5++) {
                  const e6 = (null === (n3 = t4.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "", r4 = Array.from(t4.querySelectorAll("p, time")), s2 = r4.some(((t5) => {
                    var e7;
                    return !!this.parseDateText((null === (e7 = t5.textContent) || void 0 === e7 ? void 0 : e7.trim()) || "");
                  }));
                  if (!!this.parseDateText(e6) || s2) {
                    const n4 = t4.querySelectorAll("a");
                    if (1 === n4.length) {
                      const t5 = ((null === (o2 = n4[0].textContent) || void 0 === o2 ? void 0 : o2.trim()) || "").replace(/\u00a0/g, " ");
                      if (t5.length > 0 && t5.length < 100 && !this.parseDateText(t5)) return t5;
                    }
                    if (s2 && e6.length < 300) for (const t5 of r4) {
                      if ("P" !== t5.tagName) continue;
                      const e7 = ((null === (i = t5.textContent) || void 0 === i ? void 0 : i.trim()) || "").replace(/\u00a0/g, " ");
                      if (e7.length > 0 && e7.length < 150 && !this.parseDateText(e7)) return e7;
                    }
                  }
                  t4 = t4.nextElementSibling;
                }
                let e4 = m;
                for (let t5 = 0; t5 < 3 && e4; t5++) {
                  let t6 = e4.previousElementSibling;
                  for (let e5 = 0; e5 < 3 && t6; e5++) {
                    const e6 = this.extractByline(t6);
                    if (e6) return e6;
                    t6 = t6.previousElementSibling;
                  }
                  t6 = e4.nextElementSibling;
                  for (let e5 = 0; e5 < 3 && t6; e5++) {
                    const e6 = this.extractByline(t6);
                    if (e6) return e6;
                    t6 = t6.nextElementSibling;
                  }
                  e4 = e4.parentElement;
                }
              }
              return "";
            }
            static extractByline(t3) {
              var e3;
              const r3 = [t3, ...t3.querySelectorAll("p, span, address")];
              for (const t4 of r3) {
                const r4 = ((null === (e3 = t4.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "").replace(/\u00a0/g, " ");
                if (r4.length > 0 && r4.length < 50) {
                  const t5 = r4.match(/^By\s+([A-Z].+)$/i);
                  if (t5) return t5[1].trim();
                }
              }
              return null;
            }
            static cleanAuthorString(t3) {
              return (t3 = (t3 = (t3 = (t3 = t3.replace(/^by\s+/i, "")).replace(/\(?\s*https?:\/\/\S+\s*\)?/gi, "")).replace(/,?\s+and\s+/gi, ", ")).replace(/\s*[-\u2013\u2014|]\s*$/g, "")).trim();
            }
            static getSiteName(t3, e3) {
              const r3 = this.firstValid([() => this.getSchemaProperty(t3, "publisher.name"), () => this.getMetaContent(e3, "property", "og:site_name"), () => this.getMetaContent(e3, "name", "og:site_name"), () => this.getSchemaProperty(t3, "WebSite.name"), () => this.getSchemaProperty(t3, "sourceOrganization.name"), () => this.getMetaContent(e3, "name", "copyright"), () => this.getSchemaProperty(t3, "copyrightHolder.name"), () => this.getSchemaProperty(t3, "isPartOf.name"), () => this.getMetaContent(e3, "name", "application-name")]);
              return r3 && (0, n2.countWords)(r3) > 6 ? "" : r3;
            }
            static getBestTitle(t3, e3, r3, n3, o2) {
              var i, s, a, l, c;
              const u = [this.getMetaContent(r3, "property", "og:title"), this.getMetaContent(r3, "name", "twitter:title"), this.getSchemaProperty(e3, "headline"), this.getMetaContent(r3, "name", "title"), this.getMetaContent(r3, "name", "sailthru.title"), (null === (s = null === (i = t3.querySelector("title")) || void 0 === i ? void 0 : i.textContent) || void 0 === s ? void 0 : s.trim()) || "", (null === (l = null === (a = t3.querySelector("h1")) || void 0 === a ? void 0 : a.textContent) || void 0 === l ? void 0 : l.trim()) || ""].filter(((t4) => t4 && !this.isPlaceholderValue(t4)));
              if (0 === u.length) return "";
              const d = (this.getMetaContent(r3, "property", "author") || this.getMetaContent(r3, "name", "author")).trim().toLowerCase(), h = o2.trim().toLowerCase(), m = n3 ? n3.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]/g, "") : "";
              return null !== (c = u.find(((t4) => !this.isSiteIdentifier(t4, d, h, m)))) && void 0 !== c ? c : u[0];
            }
            static isSiteIdentifier(t3, e3, r3, n3) {
              const o2 = t3.trim().toLowerCase();
              if (e3 && o2 === e3) return true;
              if (r3 && o2 === r3) return true;
              if (n3) {
                if (o2.replace(/[^a-z0-9]/g, "") === n3) return true;
              }
              return false;
            }
            static cleanTitle(t3, e3) {
              if (!t3) return { title: t3, detectedSiteName: "" };
              const r3 = "[|\\-–—/·]";
              if (e3 && e3.toLowerCase() !== t3.toLowerCase() && (0, n2.countWords)(e3) <= 6) {
                const o3 = e3.toLowerCase(), i2 = e3.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), s = [`\\s*${r3}\\s*${i2}\\s*$`, `^\\s*${i2}\\s*${r3}\\s*`];
                for (const r4 of s) {
                  const n3 = new RegExp(r4, "i");
                  if (n3.test(t3)) return { title: t3.replace(n3, "").trim(), detectedSiteName: e3 };
                }
                const a = new RegExp(`\\s+${r3}\\s+`, "g");
                let l;
                const c = [];
                for (; null !== (l = a.exec(t3)); ) c.push({ index: l.index, length: l[0].length });
                if (c.length > 0) {
                  const r4 = c[c.length - 1], i3 = t3.substring(r4.index + r4.length).trim().toLowerCase();
                  if (i3 && o3.includes(i3)) {
                    let o4 = r4.index;
                    for (let e4 = c.length - 2; e4 >= 0; e4--) {
                      const r5 = c[e4], i4 = t3.substring(r5.index + r5.length, o4).trim();
                      if ((0, n2.countWords)(i4) > 3) break;
                      o4 = r5.index;
                    }
                    return { title: t3.substring(0, o4).trim(), detectedSiteName: e3 };
                  }
                  const s2 = c[0], a2 = t3.substring(0, s2.index).trim().toLowerCase();
                  if (a2 && o3.includes(a2)) {
                    let r5 = s2.index + s2.length;
                    for (let e4 = 1; e4 < c.length; e4++) {
                      const o4 = c[e4], i4 = t3.substring(r5, o4.index).trim();
                      if ((0, n2.countWords)(i4) > 3) break;
                      r5 = o4.index + o4.length;
                    }
                    return { title: t3.substring(r5).trim(), detectedSiteName: e3 };
                  }
                }
              }
              const o2 = this.trySeparatorSplit(t3, /\s+([|/\xb7])\s+/g, { guard: (t4, e4) => e4 <= 3 && t4 >= 2 && t4 >= 2 * e4 });
              if (o2) return o2;
              const i = this.trySeparatorSplit(t3, /\s+[-\u2013\u2014]\s+/g, { suffixOnly: true, guard: (t4, e4) => e4 <= 2 && t4 >= 2 && t4 > e4 });
              return i || { title: t3.trim(), detectedSiteName: "" };
            }
            static trySeparatorSplit(t3, e3, r3) {
              let o2;
              const i = [];
              for (; null !== (o2 = e3.exec(t3)); ) i.push({ index: o2.index, length: o2[0].length });
              if (0 === i.length) return null;
              const s = i[i.length - 1], a = t3.substring(0, s.index).trim(), l = t3.substring(s.index + s.length).trim();
              if (r3.guard((0, n2.countWords)(a), (0, n2.countWords)(l))) return { title: a, detectedSiteName: l };
              if (!r3.suffixOnly) {
                const e4 = i[0], o3 = t3.substring(0, e4.index).trim(), s2 = t3.substring(e4.index + e4.length).trim();
                if (r3.guard((0, n2.countWords)(s2), (0, n2.countWords)(o3))) return { title: s2, detectedSiteName: o3 };
              }
              return null;
            }
            static getDescription(t3, e3, r3) {
              return this.firstValid([() => this.getMetaContent(r3, "name", "description"), () => this.getMetaContent(r3, "property", "description"), () => this.getMetaContent(r3, "property", "og:description"), () => this.getSchemaProperty(e3, "description"), () => this.getMetaContent(r3, "name", "twitter:description"), () => this.getMetaContent(r3, "name", "sailthru.description")]);
            }
            static getImage(t3, e3, r3) {
              return this.getMetaContent(r3, "property", "og:image") || this.getMetaContent(r3, "name", "twitter:image") || this.getSchemaProperty(e3, "image.url") || this.getMetaContent(r3, "name", "sailthru.image.full") || "";
            }
            static getLanguage(t3, e3, r3) {
              var n3, o2, i, s;
              const a = null === (o2 = null === (n3 = t3.documentElement) || void 0 === n3 ? void 0 : n3.getAttribute("lang")) || void 0 === o2 ? void 0 : o2.trim();
              if (a) return this.normalizeLangCode(a);
              const l = this.getMetaContent(r3, "name", "content-language") || this.getMetaContent(r3, "property", "og:locale");
              if (l) return this.normalizeLangCode(l);
              const c = null === (s = null === (i = t3.querySelector('meta[http-equiv="Content-Language" i]')) || void 0 === i ? void 0 : i.getAttribute("content")) || void 0 === s ? void 0 : s.trim();
              if (c) return this.normalizeLangCode(c);
              const u = this.getSchemaProperty(e3, "inLanguage");
              return u ? this.normalizeLangCode(u) : "";
            }
            static normalizeLangCode(t3) {
              return t3.replace(/_/g, "-");
            }
            static getFavicon(t3, e3, r3) {
              var n3, o2;
              const i = this.getMetaContent(r3, "property", "og:image:favicon");
              if (i) return i;
              const s = null === (n3 = t3.querySelector("link[rel='icon']")) || void 0 === n3 ? void 0 : n3.getAttribute("href");
              if (s) return s;
              const a = null === (o2 = t3.querySelector("link[rel='shortcut icon']")) || void 0 === o2 ? void 0 : o2.getAttribute("href");
              if (a) return a;
              if (e3 && /^https?:\/\//.test(e3)) try {
                return new URL("/favicon.ico", e3).href;
              } catch (t4) {
              }
              return "";
            }
            static getPublished(t3, e3, r3, n3) {
              const o2 = this.firstValid([() => this.getSchemaProperty(e3, "datePublished"), () => this.getMetaContent(r3, "name", "publishDate"), () => this.getMetaContent(r3, "property", "article:published_time"), () => {
                var e4, r4;
                return (null === (r4 = null === (e4 = t3.querySelector('abbr[itemprop="datePublished"]')) || void 0 === e4 ? void 0 : e4.title) || void 0 === r4 ? void 0 : r4.trim()) || "";
              }, () => this.getTimeElement(t3, n3), () => this.getMetaContent(r3, "name", "sailthru.date")]);
              if (o2) return o2;
              const i = t3.querySelector("h1");
              if (i) {
                const t4 = (t5, e5, r4) => {
                  var n4, o3;
                  let i2 = t5;
                  for (let t6 = 0; t6 < 3 && i2; t6++) {
                    for (const t7 of Array.from(i2.querySelectorAll("p, time"))) {
                      const e6 = this.parseDateText((null === (n4 = t7.textContent) || void 0 === n4 ? void 0 : n4.trim()) || "");
                      if (e6) return e6;
                    }
                    if (!r4) {
                      const t7 = this.parseDateText((null === (o3 = i2.textContent) || void 0 === o3 ? void 0 : o3.trim()) || "");
                      if (t7) return t7;
                    }
                    i2 = e5(i2);
                  }
                  return "";
                }, e4 = this.firstValid([() => t4(i.nextElementSibling, ((t5) => t5.nextElementSibling), false), () => t4(i.previousElementSibling, ((t5) => t5.previousElementSibling), true)]);
                if (e4) return e4;
              }
              return "";
            }
            static getMetaContent(t3, e3, r3) {
              var n3;
              return null !== (n3 = this.getMetaContents(t3, e3, r3)[0]) && void 0 !== n3 ? n3 : "";
            }
            static getMetaContents(t3, e3, r3) {
              return t3.filter(((t4) => {
                const n3 = "name" === e3 ? t4.name : t4.property;
                return (null == n3 ? void 0 : n3.toLowerCase()) === r3.toLowerCase();
              })).map(((t4) => {
                var e4, r4;
                return null !== (r4 = null === (e4 = t4.content) || void 0 === e4 ? void 0 : e4.trim()) && void 0 !== r4 ? r4 : "";
              }));
            }
            static getTimeElement(t3, e3) {
              var r3, n3;
              for (const o2 of Array.from(t3.querySelectorAll("time"))) {
                if (this.isLinkedToOtherPage(o2, e3)) continue;
                const t4 = (null === (r3 = o2.getAttribute("datetime")) || void 0 === r3 ? void 0 : r3.trim()) || (null === (n3 = o2.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "";
                if (t4) return t4;
              }
              return "";
            }
            static isLinkedToOtherPage(t3, e3) {
              var r3;
              if (!e3) return false;
              const n3 = t3.closest("a[href]");
              if (!n3) return false;
              const o2 = (null === (r3 = n3.getAttribute("href")) || void 0 === r3 ? void 0 : r3.trim()) || "";
              if (!o2 || o2.startsWith("#")) return false;
              try {
                const t4 = new URL(o2, e3), r4 = new URL(e3);
                if (t4.origin !== r4.origin) return false;
                const n4 = (t5) => t5.replace(/\/+$/, "");
                return n4(t4.pathname) !== n4(r4.pathname);
              } catch (t4) {
                return false;
              }
            }
            static parseDateText(t3) {
              let e3 = t3.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
              if (e3) {
                const t4 = e3[1].padStart(2, "0"), r3 = this.MONTH_MAP[e3[2].toLowerCase()];
                return `${e3[3]}-${r3}-${t4}T00:00:00+00:00`;
              }
              if (e3 = t3.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i), e3) {
                const t4 = this.MONTH_MAP[e3[1].toLowerCase()], r3 = e3[2].padStart(2, "0");
                return `${e3[3]}-${t4}-${r3}T00:00:00+00:00`;
              }
              return "";
            }
            static getVisibleText(t3) {
              const e3 = t3.cloneNode(true);
              return e3.querySelectorAll("script, style, noscript").forEach(((t4) => t4.remove())), (e3.textContent || "").replace(/\s+/g, " ").trim();
            }
            static getAuthorName(t3) {
              const e3 = t3.cloneNode(true);
              e3.querySelectorAll("script, style, noscript").forEach(((t4) => t4.remove()));
              const r3 = (e3.textContent || "").replace(/\s+/g, " ").trim();
              if (!r3) return "";
              for (const t4 of e3.querySelectorAll("span, a, p")) {
                const e4 = (t4.textContent || "").replace(/\s+/g, " ").trim();
                if (e4.length >= 2 && e4.length <= 50 && e4 !== r3) return e4;
              }
              return r3.length <= 100 ? r3 : "";
            }
            static getSchemaProperty(t3, e3, r3 = "") {
              if (!t3) return r3;
              const n3 = (t4, e4, r4, o2 = true) => {
                if ("string" == typeof t4) return 0 === e4.length ? [t4] : [];
                if (!t4 || "object" != typeof t4) return [];
                if (Array.isArray(t4)) {
                  const i2 = e4[0];
                  if (/^\[\d+\]$/.test(i2)) {
                    const s2 = parseInt(i2.slice(1, -1));
                    return t4[s2] ? n3(t4[s2], e4.slice(1), r4, o2) : [];
                  }
                  return 0 === e4.length && t4.every(((t5) => "string" == typeof t5 || "number" == typeof t5)) ? t4.map(String) : t4.flatMap(((t5) => n3(t5, e4, r4, o2)));
                }
                const [i, ...s] = e4;
                if (!i) return "string" == typeof t4 ? [t4] : "object" == typeof t4 && t4.name ? [t4.name] : [];
                if (t4.hasOwnProperty(i)) return n3(t4[i], s, r4 ? `${r4}.${i}` : i, true);
                if (!o2) {
                  const o3 = [];
                  for (const i2 in t4) if ("object" == typeof t4[i2]) {
                    const s2 = n3(t4[i2], e4, r4 ? `${r4}.${i2}` : i2, false);
                    o3.push(...s2);
                  }
                  if (o3.length > 0) return o3;
                }
                return [];
              };
              try {
                let o2 = n3(t3, e3.split("."), "", true);
                0 === o2.length && (o2 = n3(t3, e3.split("."), "", false));
                const i = [...new Set(o2.filter(Boolean))];
                return i.length > 0 ? i.join(", ") : r3;
              } catch (t4) {
                return console.error(`Error in getSchemaProperty for ${e3}:`, t4), r3;
              }
            }
          }
          e2.MetadataExtractor = o, o.MONTH_MAP = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };
        }, 3172(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.removeEyebrowLabel = function(t3, e3, r3) {
            var n3;
            const i2 = t3.querySelector("h1") || t3.querySelector("h2");
            if (!i2) return;
            let a2 = i2;
            for (; a2.parentElement && a2.parentElement !== t3 && !a2.previousElementSibling; ) a2 = a2.parentElement;
            const l2 = a2.previousElementSibling;
            if (!l2) return;
            const c2 = (null === (n3 = l2.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "", u2 = (0, o.countWords)(c2);
            if (u2 < 1 || u2 > 6) return;
            if (c2.length > 40) return;
            if (/[.!?]/.test(c2)) return;
            if (s.test(c2)) return;
            if (l2.querySelector("img, picture, video, iframe, figure, table, pre, code, time, [datetime], h1, h2, h3, h4, h5, h6, ul, ol, blockquote")) return;
            e3 && r3 && r3.push({ step: "removeEyebrowLabel", reason: "eyebrow label", text: (0, o.textPreview)(l2) });
            l2.remove();
          }, e2.removeByContentPattern = function(t3, e3, r3, m2, R, D) {
            var B, H, j, W, F, z, U, V, J, G, K, X, Y, Q, Z, tt, et, rt, nt, ot, it, st, at, lt, ct, ut, dt, ht, mt, ft, pt, gt, vt;
            const yt = (0, i.findContentStart)(t3, m2), bt = (t4) => (0, i.isAboveContentStart)(t4, yt), xt = (0, o.normalizeText)(m2), Ct = (0, o.normalizeText)(R), St = t3.querySelector("ul, ol");
            if (St && (function(t4) {
              const e4 = t4.querySelectorAll("li");
              if (e4.length < 2 || e4.length > 8) return false;
              const r4 = Array.from(t4.querySelectorAll("a"));
              if (r4.length < 1 || r4.length >= e4.length) return false;
              if (t4.querySelector("img, p, figure, blockquote")) return false;
              for (const t5 of e4) if ((0, o.countWords)(t5.textContent || "") > 8) return false;
              let n3 = true, i2 = false, s2 = true;
              for (const t5 of r4) {
                const e5 = t5.getAttribute("href") || "";
                if (e5.startsWith("http") || e5.startsWith("//")) {
                  n3 = false;
                  break;
                }
                ("/" === e5 || /^\/[a-zA-Z0-9_-]+\/?$/.test(e5)) && (i2 = true), (t5.textContent || "").trim().split(/\s+/).filter(Boolean).length > 5 && (s2 = false);
              }
              return n3 && i2 && s2;
            })(St)) {
              let r4 = St;
              for (; r4.parentElement && r4.parentElement !== t3 && 1 === r4.parentElement.children.length; ) r4 = r4.parentElement;
              e3 && D && D.push({ step: "removeByContentPattern", reason: "breadcrumb navigation list", text: (0, o.textPreview)(r4) }), r4.remove();
            }
            const Et = t3.querySelector("h1");
            if (Et) for (const r4 of t3.querySelectorAll("a[href]")) {
              if (!r4.parentNode) continue;
              if (!(4 & r4.compareDocumentPosition(Et))) continue;
              if (!r4.querySelector("div")) continue;
              if (r4.querySelector("img, picture, video")) continue;
              const t4 = (null === (B = r4.textContent) || void 0 === B ? void 0 : B.trim()) || "";
              (0, o.countWords)(t4) > 25 || (/[.!?]\s/.test(t4) || (e3 && D && D.push({ step: "removeByContentPattern", reason: "promotional banner link", text: (0, o.textPreview)(r4) }), r4.remove()));
            }
            !(function(t4, e4, r4, n3) {
              var s2;
              const a2 = t4.querySelectorAll("time");
              if (0 === a2.length) return;
              for (const l2 of a2) {
                if (!(0, i.isAboveContentStart)(l2, e4)) continue;
                let a3 = null, c2 = l2.parentElement;
                for (; c2 && c2 !== t4; ) {
                  if (c2.querySelector("h1, h2") && c2.querySelector("time")) {
                    const t5 = (null === (s2 = c2.textContent) || void 0 === s2 ? void 0 : s2.trim()) || "", e5 = (0, o.countWords)(t5), r5 = /* @__PURE__ */ new Set();
                    for (const t6 of c2.querySelectorAll("h1, h2, h3, time, [aria-label]")) {
                      let e6 = false;
                      for (const n5 of r5) if (n5.contains(t6)) {
                        e6 = true;
                        break;
                      }
                      e6 || r5.add(t6);
                    }
                    let n4 = 0;
                    for (const t6 of r5) n4 += (0, o.countWords)(t6.textContent || "");
                    if (!(e5 - n4 < 30)) break;
                    a3 = c2;
                  }
                  c2 = c2.parentElement;
                }
                if (a3) return r4 && n3 && n3.push({ step: "removeByContentPattern", reason: "hero header block", text: (0, o.textPreview)(a3) }), void a3.remove();
              }
            })(t3, yt, e3, D);
            for (const r4 of t3.querySelectorAll("audio, video")) {
              if (!r4.parentNode) continue;
              if (!r4.getAttribute("src") && !r4.querySelector("source")) continue;
              let n3 = r4;
              for (; n3.parentElement && n3.parentElement !== t3 && !((0, o.countWords)((null === (H = n3.parentElement.textContent) || void 0 === H ? void 0 : H.trim()) || "") > 25); ) n3 = n3.parentElement;
              const i2 = (null === (j = n3.textContent) || void 0 === j ? void 0 : j.trim()) || "", s2 = /\blisten\s+to\s+(?:this\s+)?(?:article|story|post|episode|podcast)\b/i.test(i2), a2 = !s2 && bt(n3) && (0, o.countWords)(i2) <= 25;
              (s2 || a2) && (e3 && D && D.push({ step: "removeByContentPattern", reason: "audio player widget", text: (0, o.textPreview)(n3) }), n3.remove());
            }
            const At = t3.textContent || "";
            let wt = null;
            try {
              wt = new URL(r3);
            } catch (t4) {
            }
            for (const i2 of t3.querySelectorAll("ul, ol")) {
              if (!i2.parentNode) continue;
              if (i2.closest("#footnotes")) continue;
              const s2 = (null === (W = i2.textContent) || void 0 === W ? void 0 : W.trim()) || "", a2 = At.indexOf(s2.substring(0, 60));
              if (a2 < 0 || a2 > 0.3 * At.length) continue;
              const l2 = Array.from(i2.querySelectorAll("a[href]"));
              if (l2.length < 3) continue;
              if (i2.querySelector(n2.CONTENT_ELEMENT_SELECTOR)) continue;
              let c2 = 0;
              for (const t4 of l2) {
                const e4 = t4.getAttribute("href") || "";
                if (e4.startsWith("#")) c2++;
                else if (wt && e4.includes("#")) try {
                  const t5 = new URL(e4, r3);
                  t5.pathname === wt.pathname && t5.hostname === wt.hostname && c2++;
                } catch (t5) {
                }
              }
              if (c2 < 3 || c2 / l2.length < 0.8) continue;
              let u2 = i2;
              for (; u2.parentElement && u2.parentElement !== t3 && 1 === u2.parentElement.children.length; ) u2 = u2.parentElement;
              const d2 = u2.previousElementSibling;
              if (d2 && S.test(d2.tagName)) {
                const t4 = (null === (F = d2.textContent) || void 0 === F ? void 0 : F.trim()) || "";
                /^(?:table of )?contents$|^on this page$|^in this (?:article|guide|post)$/i.test(t4) && (e3 && D && D.push({ step: "removeByContentPattern", reason: "table of contents heading", text: (0, o.textPreview)(d2) }), d2.remove());
              }
              const h2 = u2.previousElementSibling, m3 = u2.nextElementSibling;
              e3 && D && D.push({ step: "removeByContentPattern", reason: "table of contents", text: (0, o.textPreview)(u2) }), u2.remove(), "HR" === (null == h2 ? void 0 : h2.tagName) && h2.remove(), "HR" === (null == m3 ? void 0 : m3.tagName) && m3.remove();
              break;
            }
            const Tt = Array.from(t3.querySelectorAll("p, span, div, time"));
            let _t = false, Lt = false;
            for (const r4 of Tt) {
              if (!r4.parentNode) continue;
              const n3 = (null === (z = r4.textContent) || void 0 === z ? void 0 : z.trim()) || "", i2 = (0, o.countWords)(n3);
              if (i2 > 15 || 0 === i2) continue;
              if (r4.closest("pre, code")) continue;
              const h2 = r4.tagName, m3 = s.test(n3);
              let f2 = -2;
              const v2 = () => (-2 === f2 && (f2 = At.indexOf(n3)), f2);
              if (p.test(n3) && v2() <= 300) {
                let n4 = r4;
                n4.parentElement && n4.parentElement !== t3 && (n4 = n4.parentElement), e3 && D && D.push({ step: "removeByContentPattern", reason: "timezone widget", text: (0, o.textPreview)(n4) }), n4.remove();
              } else if (1 === i2 && g.test(n3)) e3 && D && D.push({ step: "removeByContentPattern", reason: "pinned label", text: (0, o.textPreview)(r4) }), r4.remove();
              else {
                for (const [t4, s2] of [[xt, "duplicate title"], [Ct, "duplicate description"]]) if (t4 && i2 >= 3 && bt(r4) && (0, o.normalizeText)(n3) === t4) {
                  e3 && D && D.push({ step: "removeByContentPattern", reason: s2, text: (0, o.textPreview)(r4) }), r4.remove();
                  break;
                }
                if (r4.parentNode) if (("DIV" === h2 || "P" === h2) && i2 >= 1 && i2 <= 10 && (m3 || a.test(n3)) && !d.test(n3) && !/[.!?]/.test(n3) && bt(r4) && !Array.from(r4.querySelectorAll("p, h1, h2, h3, h4, h5, h6")).some(((t4) => (0, o.countWords)(t4.textContent || "") > 8))) e3 && D && D.push({ step: "removeByContentPattern", reason: "article metadata header block", text: (0, o.textPreview)(r4) }), r4.remove();
                else {
                  if ("DIV" === h2 && i2 >= 1 && i2 <= 5 && !/[.!?]/.test(n3) && bt(r4) && r4.querySelector("img")) {
                    const t4 = r4.querySelectorAll("a[href]");
                    if (t4.length > 0) {
                      let i3 = 0;
                      for (const e4 of t4) i3 += ((null === (U = e4.textContent) || void 0 === U ? void 0 : U.trim()) || "").length;
                      if (i3 / (n3.length || 1) >= 0.8) {
                        e3 && D && D.push({ step: "removeByContentPattern", reason: "category badge", text: (0, o.textPreview)(r4) }), r4.remove();
                        continue;
                      }
                    }
                  }
                  if (!_t && u.test(n3) && i2 >= 2 && !/[.!?]$/.test(n3) && bt(r4)) {
                    const i3 = $(r4, n3, t3);
                    e3 && D && D.push({ step: "removeByContentPattern", reason: "author byline", text: (0, o.textPreview)(i3) }), i3.remove(), _t = true;
                  } else {
                    if (l.test(n3) && (m3 ? 0 === r4.querySelectorAll("p, div, section, article").length : i2 <= 5 && bt(r4))) {
                      let i3 = n3;
                      for (const t4 of q) i3 = i3.replace(t4, "");
                      if (0 === i3.trim().length) {
                        const i4 = m3 ? r4 : $(r4, n3, t3);
                        e3 && D && D.push({ step: "removeByContentPattern", reason: "read time metadata", text: (0, o.textPreview)(i4) }), i4.remove();
                        continue;
                      }
                    }
                    if (!Lt && i2 >= 2 && i2 <= 10 && m3 && !d.test(n3) && bt(r4)) {
                      let i3 = n3;
                      for (const t4 of N) i3 = i3.replace(t4, "");
                      if (i3 = i3.trim(), i3) {
                        const s2 = i3.split(/\s+/).filter(((t4) => t4.length > 0));
                        if (s2.length >= 1 && s2.length <= 4 && s2.every(((t4) => c.test(t4)))) {
                          const i4 = $(r4, n3, t3);
                          e3 && D && D.push({ step: "removeByContentPattern", reason: "author date metadata", text: (0, o.textPreview)(i4) }), i4.remove(), Lt = true;
                          continue;
                        }
                      }
                    }
                    if (m3 && i2 <= 5 && bt(r4)) {
                      let i3 = n3;
                      for (const t4 of L) i3 = i3.replace(t4, "");
                      if (i3 = i3.replace(/[,\s/\-]+/g, "").trim(), 0 === i3.length) {
                        const i4 = $(r4, n3, t3);
                        e3 && D && D.push({ step: "removeByContentPattern", reason: "standalone date metadata", text: (0, o.textPreview)(i4) }), i4.remove();
                        continue;
                      }
                    }
                  }
                }
              }
            }
            const qt = Array.from(t3.querySelectorAll("time"));
            for (const r4 of qt) {
              if (!r4.parentNode) continue;
              let n3 = r4, i2 = (null === (V = n3.textContent) || void 0 === V ? void 0 : V.trim()) || "";
              for (; n3.parentElement && n3.parentElement !== t3; ) {
                const t4 = n3.parentElement.tagName.toLowerCase(), e4 = (null === (J = n3.parentElement.textContent) || void 0 === J ? void 0 : J.trim()) || "";
                if ("p" === t4 && e4 === i2) {
                  n3 = n3.parentElement;
                  break;
                }
                if (!["i", "em", "span", "b", "strong", "small"].includes(t4) || e4 !== i2) break;
                n3 = n3.parentElement, i2 = e4;
              }
              const s2 = (null === (G = n3.textContent) || void 0 === G ? void 0 : G.trim()) || "";
              if ((0, o.countWords)(s2) > 10) continue;
              const a2 = At.indexOf(s2), l2 = At.length - (a2 + s2.length);
              a2 > 200 && l2 > 200 || (e3 && D && D.push({ step: "removeByContentPattern", reason: "boundary date element", text: (0, o.textPreview)(n3) }), n3.remove());
            }
            const Nt = t3.querySelectorAll("ul, ol, dl");
            for (const r4 of Nt) {
              if (!r4.parentNode) continue;
              if (r4.closest("#footnotes")) continue;
              const n3 = "DL" === r4.tagName, i2 = Array.from(r4.children).filter(((t4) => n3 ? "DD" === t4.tagName : "LI" === t4.tagName)), s2 = n3 ? 1 : 2;
              if (i2.length < s2 || i2.length > 8) continue;
              const a2 = (null === (K = r4.textContent) || void 0 === K ? void 0 : K.trim()) || "", l2 = At.indexOf(a2), c2 = At.length - (l2 + a2.length);
              if (l2 > 500 && c2 > 500) continue;
              const u2 = r4.previousElementSibling;
              if (u2) {
                if (E(u2)) continue;
                if (((null === (X = u2.textContent) || void 0 === X ? void 0 : X.trim()) || "").endsWith(":")) continue;
              }
              let d2 = true;
              for (const t4 of i2) {
                const e4 = (null === (Y = t4.textContent) || void 0 === Y ? void 0 : Y.trim()) || "";
                if ((0, o.countWords)(e4) > 8) {
                  d2 = false;
                  break;
                }
                if (/[.!?]$/.test(e4)) {
                  d2 = false;
                  break;
                }
              }
              if (!d2) continue;
              if ((0, o.countWords)(a2) > 30) continue;
              const h2 = $(r4, a2, t3);
              e3 && D && D.push({ step: "removeByContentPattern", reason: "blog metadata list", text: (0, o.textPreview)(h2) }), h2.remove();
            }
            const kt = (null == wt ? void 0 : wt.pathname) || "", $t = (null == wt ? void 0 : wt.hostname.replace(/^www\./, "")) || "";
            if (kt) {
              const n3 = t3.querySelectorAll("div, span, p, a[href]"), i2 = t3.querySelector("h1, h2, h3");
              for (const s2 of n3) {
                if (!s2.parentNode) continue;
                const n4 = (null === (Q = s2.textContent) || void 0 === Q ? void 0 : Q.trim()) || "";
                if ((0, o.countWords)(n4) > 10) continue;
                if (s2.querySelectorAll("p, div, section, article").length > 0) continue;
                if (s2.matches("a[href]") && s2.parentElement && s2.parentElement !== t3) {
                  if (((null === (Z = s2.parentElement.textContent) || void 0 === Z ? void 0 : Z.trim()) || "") !== n4) {
                    if (s2.closest("p")) continue;
                    if (!i2) continue;
                    if (!(4 & s2.compareDocumentPosition(i2))) continue;
                  }
                }
                const a2 = s2.matches("a[href]") ? s2 : s2.querySelector("a[href]");
                if (a2) try {
                  const t4 = new URL(a2.getAttribute("href") || "", r3).pathname, n5 = t4.replace(/\/[^/]*$/, "/"), i3 = /^index\.(html?|php)$/i.test(t4.split("/").pop() || "") && kt.startsWith(n5);
                  "/" !== t4 && t4 !== kt && (kt.startsWith(t4) || i3) && (e3 && D && D.push({ step: "removeByContentPattern", reason: "section breadcrumb", text: (0, o.textPreview)(s2) }), s2.remove());
                } catch (t4) {
                }
              }
            }
            if ($t) {
              const n3 = t3.querySelectorAll("h2, h3, h4, h5, h6");
              for (const i2 of n3) {
                if (!i2.parentNode) continue;
                const n4 = i2.nextElementSibling;
                if (!n4 || "UL" !== n4.tagName && "OL" !== n4.tagName) continue;
                const s2 = Array.from(n4.children).filter(((t4) => "LI" === t4.tagName));
                if (s2.length < 2) continue;
                let a2 = false, l2 = n4;
                for (; l2 && l2 !== t3; ) {
                  let t4 = l2.nextElementSibling;
                  for (; t4; ) {
                    if (((null === (tt = t4.textContent) || void 0 === tt ? void 0 : tt.trim()) || "").length > 0) {
                      a2 = true;
                      break;
                    }
                    t4 = t4.nextElementSibling;
                  }
                  if (a2) break;
                  l2 = l2.parentElement;
                }
                if (a2) continue;
                let c2 = true;
                for (const t4 of s2) {
                  const e4 = t4.querySelectorAll("a[href]");
                  if (0 === e4.length) {
                    c2 = false;
                    break;
                  }
                  const n5 = (null === (et = t4.textContent) || void 0 === et ? void 0 : et.trim()) || "";
                  let o2 = 0;
                  for (const t5 of e4) {
                    o2 += ((null === (rt = t5.textContent) || void 0 === rt ? void 0 : rt.trim()) || "").length;
                    try {
                      if (new URL(t5.getAttribute("href") || "", r3).hostname.replace(/^www\./, "") === $t) {
                        c2 = false;
                        break;
                      }
                    } catch (t6) {
                    }
                  }
                  if (!c2) break;
                  if (o2 < 0.6 * n5.length) {
                    c2 = false;
                    break;
                  }
                }
                c2 && (e3 && D && (D.push({ step: "removeByContentPattern", reason: "trailing external link list", text: (0, o.textPreview)(i2) }), D.push({ step: "removeByContentPattern", reason: "trailing external link list", text: (0, o.textPreview)(n4) })), n4.remove(), i2.remove());
              }
            }
            let Pt = t3.lastElementChild;
            for (; Pt && ["HR", "BR"].includes(Pt.tagName); ) Pt = Pt.previousElementSibling;
            if (Pt && ["SECTION", "DIV", "ASIDE"].includes(Pt.tagName)) {
              const t4 = [];
              let r4 = false;
              for (const e4 of Pt.children) {
                if ((null === (nt = e4.textContent) || void 0 === nt ? void 0 : nt.trim()) || "") {
                  if ("P" === e4.tagName) t4.push(e4);
                  else if ("BR" !== e4.tagName) {
                    r4 = true;
                    break;
                  }
                }
              }
              if (t4.length >= 2 && !r4) {
                const r5 = t4.every(((t5) => {
                  var e4, r6, n3;
                  const o2 = ((null === (e4 = t5.textContent) || void 0 === e4 ? void 0 : e4.trim()) || "").replace(/\s+/g, " "), i2 = t5.querySelectorAll("a[href]");
                  if (0 === i2.length) return false;
                  let s2 = 0;
                  for (const t6 of i2) s2 += ((null === (r6 = t6.textContent) || void 0 === r6 ? void 0 : r6.trim()) || "").length;
                  if (s2 / (o2.length || 1) <= 0.6) return false;
                  let a2 = o2;
                  for (const t6 of i2) a2 = a2.split((null === (n3 = t6.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "").join("");
                  return !/[.!?]/.test(a2);
                }));
                r5 && (e3 && D && D.push({ step: "removeByContentPattern", reason: "trailing related posts block", text: (0, o.textPreview)(Pt) }), Pt.remove());
              }
            }
            const Ot = (0, o.countWords)(t3.textContent || "");
            if (Ot > 300) {
              const r4 = [];
              let i2 = 0, s2 = t3.lastElementChild;
              for (; s2; ) {
                if ("footnotes" === s2.id) {
                  s2 = s2.previousElementSibling;
                  continue;
                }
                if ("HR" === s2.tagName) {
                  r4.push(s2);
                  break;
                }
                let t4 = 0;
                for (const e5 of s2.querySelectorAll("svg")) t4 += (0, o.countWords)(e5.textContent || "");
                const e4 = (0, o.countWords)((null === (ot = s2.textContent) || void 0 === ot ? void 0 : ot.trim()) || "") - t4;
                if (e4 > 25) break;
                i2 += e4, r4.push(s2), s2 = s2.previousElementSibling;
              }
              if (r4.length >= 1 && i2 < 0.15 * Ot) {
                const t4 = r4.some(((t5) => E(t5))), i3 = r4.some(((t5) => t5.querySelector(n2.CONTENT_ELEMENT_SELECTOR)));
                let s3 = 0;
                for (const t5 of r4) "P" === t5.tagName && (0, o.countWords)(t5.textContent || "") > 5 && s3++;
                if (t4 && !i3 && s3 < 2) for (const t5 of r4) e3 && D && D.push({ step: "removeByContentPattern", reason: "trailing thin section", text: (0, o.textPreview)(t5) }), t5.remove();
              }
            }
            const Mt = t3.textContent || "", It = t3.querySelectorAll("p, div, span, section");
            for (const r4 of It) {
              if (!r4.parentNode) continue;
              if (r4.closest("pre, code")) continue;
              const n3 = (null === (it = r4.textContent) || void 0 === it ? void 0 : it.trim()) || "", i2 = (0, o.countWords)(n3);
              if (!(i2 > 50 || i2 < 1)) {
                for (const i3 of h) if (i3.test(n3)) {
                  let n4 = r4;
                  for (; n4.parentElement && n4.parentElement !== t3 && !n4.nextElementSibling; ) n4 = n4.parentElement;
                  const i4 = n4.textContent || "";
                  if (Mt.indexOf(i4) < 200) {
                    n4 === r4 || r4.nextElementSibling || (e3 && D && D.push({ step: "removeByContentPattern", reason: "boilerplate text", text: (0, o.textPreview)(r4) }), r4.remove());
                    continue;
                  }
                  O(n4, t3, e3, D);
                  break;
                }
              }
            }
            for (const r4 of t3.querySelectorAll("h2, h3, h4, h5, h6")) {
              if (!r4.parentNode) continue;
              const n3 = (null === (st = r4.textContent) || void 0 === st ? void 0 : st.trim()) || "", i2 = T.test(n3);
              if (!i2 && !w.test(n3)) continue;
              if (At.indexOf(n3) < 500) continue;
              const s2 = M(r4, t3);
              if (s2 === r4) {
                if (!i2) continue;
                P(r4, true, e3, D);
              } else I(s2, e3, D), e3 && D && D.push({ step: "removeByContentPattern", reason: "related content section", text: (0, o.textPreview)(s2) }), O(s2, t3, e3, D);
              break;
            }
            for (const r4 of t3.querySelectorAll("p")) {
              if (!r4.parentNode) continue;
              const t4 = (null === (at = r4.textContent) || void 0 === at ? void 0 : at.trim()) || "";
              _.test(t4) && ((0, o.countWords)(t4) > 20 || r4.querySelector(n2.CONTENT_ELEMENT_SELECTOR) || (e3 && D && D.push({ step: "removeByContentPattern", reason: "related content intro", text: (0, o.textPreview)(r4) }), r4.remove()));
            }
            const Rt = (0, o.countWords)(At);
            for (const r4 of t3.querySelectorAll("div")) {
              if (!r4.parentNode) continue;
              if (r4.children.length < 2) continue;
              const n3 = Array.from(r4.children), i2 = n3.filter(((t4) => t4.querySelector("img, picture") && (t4.querySelector("h2, h3, h4") || t4.querySelector("a[href]")))).length;
              if (i2 < 2 || i2 < 0.7 * n3.length) continue;
              const s2 = (null === (lt = n3[0].textContent) || void 0 === lt ? void 0 : lt.trim().substring(0, 30)) || "";
              if (s2.length < 5 || At.indexOf(s2) < 500) continue;
              const a2 = (0, o.countWords)(r4.textContent || "");
              if (Rt > 0 && a2 / Rt > 0.3) continue;
              const l2 = M(r4, t3);
              if (l2 === r4) continue;
              if (!((0, o.countWords)(l2.textContent || "") > 2 * a2 + 15) && !k(l2)) {
                I(l2, e3, D), e3 && D && D.push({ step: "removeByContentPattern", reason: "related post cards", text: (0, o.textPreview)(l2) }), P(l2, true, e3, D);
                break;
              }
            }
            for (const r4 of t3.querySelectorAll("div, section, aside")) {
              if (!r4.parentNode) continue;
              if (r4.closest("pre, code")) continue;
              if (!A(r4, 60)) continue;
              const n3 = (0, o.countWords)((null === (ct = r4.textContent) || void 0 === ct ? void 0 : ct.trim()) || "");
              let i2 = r4;
              for (; i2.parentElement && i2.parentElement !== t3; ) {
                if ((0, o.countWords)((null === (ut = i2.parentElement.textContent) || void 0 === ut ? void 0 : ut.trim()) || "") > 2 * n3 + 15) break;
                i2 = i2.parentElement;
              }
              e3 && D && D.push({ step: "removeByContentPattern", reason: "newsletter signup", text: (0, o.textPreview)(i2) }), i2.remove();
              break;
            }
            for (const r4 of t3.querySelectorAll("ul")) if (r4.parentNode && A(r4, 30)) {
              e3 && D && D.push({ step: "removeByContentPattern", reason: "newsletter signup list", text: (0, o.textPreview)(r4) }), r4.remove();
              break;
            }
            for (const r4 of t3.querySelectorAll("div, section")) {
              if (!r4.parentNode) continue;
              const n3 = (null === (dt = r4.textContent) || void 0 === dt ? void 0 : dt.trim()) || "", i2 = (0, o.countWords)(n3);
              if (i2 < 2 || i2 > 40) continue;
              const s2 = At.indexOf(n3.substring(0, 60));
              if (s2 < 0) continue;
              if (At.length - (s2 + n3.length) > 300) continue;
              const a2 = r4.querySelectorAll("div, span, p, dt, dd, li");
              let l2 = false;
              for (const t4 of a2) {
                const e4 = (null === (ht = t4.textContent) || void 0 === ht ? void 0 : ht.trim()) || "";
                if (v.test(e4)) {
                  l2 = true;
                  break;
                }
              }
              if (!l2) continue;
              if (!(x.test(n3) || C.test(n3) || r4.querySelector('a[href^="mailto:"]'))) continue;
              const c2 = M(r4, t3);
              e3 && D && D.push({ step: "removeByContentPattern", reason: "author contact block", text: (0, o.textPreview)(c2) }), c2.remove();
              break;
            }
            for (const r4 of t3.querySelectorAll("p, span, div")) {
              if (!r4.parentNode) continue;
              const n3 = (null === (mt = r4.textContent) || void 0 === mt ? void 0 : mt.trim()) || "";
              if (!y.test(n3)) continue;
              let i2 = r4;
              for (; i2.parentElement && i2.parentElement !== t3; ) {
                const t4 = i2.parentElement;
                if ((0, o.countWords)((null === (ft = t4.textContent) || void 0 === ft ? void 0 : ft.trim()) || "") > 15) break;
                i2 = t4;
              }
              i2.querySelector(b) || (e3 && D && D.push({ step: "removeByContentPattern", reason: "author/share widget", text: (0, o.textPreview)(i2) }), i2.remove());
            }
            for (const r4 of t3.querySelectorAll("a, p, div, span")) {
              if (!r4.parentNode) continue;
              const n3 = (null === (pt = r4.textContent) || void 0 === pt ? void 0 : pt.trim()) || "";
              if (!f.test(n3)) continue;
              if ("A" === r4.tagName && r4.getAttribute("href")) continue;
              if ("A" !== r4.tagName) {
                const t4 = At.indexOf(n3);
                if (At.length - (t4 + n3.length) > 200) continue;
              }
              const i2 = $(r4, n3, t3);
              e3 && D && D.push({ step: "removeByContentPattern", reason: "social engagement counter", text: (0, o.textPreview)(i2) }), i2.remove();
            }
            for (const r4 of t3.querySelectorAll("div")) {
              if (!r4.parentNode) continue;
              const t4 = (null === (gt = r4.textContent) || void 0 === gt ? void 0 : gt.trim()) || "", i2 = (0, o.countWords)(t4);
              if (i2 < 1 || i2 > 10) continue;
              if (/[.!?]/.test(t4)) continue;
              if (r4.querySelector(n2.CONTENT_ELEMENT_SELECTOR)) continue;
              const s2 = At.indexOf(t4);
              if (s2 < 0) continue;
              if (At.length - (s2 + t4.length) > 300) continue;
              const a2 = r4.querySelectorAll("a[href]");
              if (0 === a2.length) continue;
              let l2 = 0;
              for (const t5 of a2) l2 += ((null === (vt = t5.textContent) || void 0 === vt ? void 0 : vt.trim()) || "").length;
              l2 / (t4.length || 1) < 0.8 || (e3 && D && D.push({ step: "removeByContentPattern", reason: "trailing tag link block", text: (0, o.textPreview)(r4) }), r4.remove());
            }
          };
          const n2 = r2(2640), o = r2(2552), i = r2(4467), s = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i, a = /\b\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago\b/i, l = /\d+\s*min(?:ute)?s?\s+read\b|(?:read(?:ing)?\s+time)\s*:?\s*\d+\s*min(?:ute)?s?\b/i, c = new RegExp("^\\p{Lu}", "u"), u = /^(?:posted\s+)?by\s+\S/i, d = /^(?:date|published|updated|posted|from|to|subject)\s*:/i, h = [/^This (?:article|story|piece) (?:appeared|was published|originally appeared) in\b/i, /^A version of this (?:article|story) (?:appeared|was published) in\b/i, /^Originally (?:published|appeared) (?:in|on|at)\b/i, /^Any re-?use permitted\b/i, /^\xa9\s*(?:Copyright\s+)?\d{4}/i, /^Comments?$/i, /^Leave a (?:comment|reply)$/i, /^Loading\.{3}$/, /^Affiliate links\b.*\b(?:earn|commission)/i, /\bRead our Comment Policy\b/i, /^Thank you for (?:being part of|joining) our community\b/i], m = /\bsubscribe\b[\s\S]{0,40}\bnewsletter\b|\bnewsletter\b[\s\S]{0,40}\bsubscribe\b|\bsign[- ]up\b[\s\S]{0,80}\b(?:newsletter|email alert)|\b(?:don[\u2019']?t (?:want to )?miss|never miss)\b[\s\S]{0,80}\b(?:latest|best|exclusive|reports?|updates?|source)/i, f = /^\d+\s+(?:Likes?|Comments?|Shares?|Retweets?|Reposts?|Restacks?)$/i, p = /^current time in$/i, g = /^pinned$/i, v = /^(?:written by|(?:author|contact|reporter|correspondent)s?)$/i, y = /^(?:share|follow|authors?|written\s+by)$/i, b = n2.CONTENT_ELEMENT_SELECTOR.replace(/img, picture, /, ""), x = /[\w.-]+@[\w.-]+\.\w+/, C = /\(?\d{3}\)?[\s.\u2011\u2013-]?\d{3}[\s.\u2011\u2013-]?\d{4}/, S = /^H[1-6]$/;
          function E(t3) {
            return S.test(t3.tagName) || !!t3.querySelector("h1, h2, h3, h4, h5, h6");
          }
          function A(t3, e3) {
            var r3;
            const i2 = (null === (r3 = t3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "", s2 = (0, o.countWords)(i2);
            if (s2 < 2 || s2 > e3) return false;
            if (t3.querySelector(n2.CONTENT_ELEMENT_SELECTOR)) return false;
            const a2 = i2.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[\u2018\u2019]/g, "'");
            return m.test(a2);
          }
          const w = /^(?:related (?:posts?|articles?|content|stories|reads?|reading)|you (?:might|may|could) (?:also )?(?:like|enjoy|be interested in)|read (?:next|more|also)|further reading|see also|more (?:from .*|from|articles?|posts?|like this)|more to (?:read|explore)|explore more|about (?:the )?author|latest (?:news|events?|posts?|articles?|stories)(?:\s*[&+]\s*(?:news|events?|posts?|articles?|stories))?)$/i, T = /^(?:subscribe|sign up|follow us|share this|stay (?:updated|connected)|join (?:us|our)|search (?:the |our )?(?:site|blog|archives?|newsroom|website|catalog|store|shop|database))$/i, _ = /^for more (?:on|about)\b/i, L = [/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi, /\b(?:Mon(?:day)?|Tue(?:s(?:day)?)?|Wed(?:nesday)?|Thu(?:rs(?:day)?)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\b/gi, /\b\d+(?:st|nd|rd|th)?\b/g, /\d{4}[-/]\d{1,2}[-/]\d{1,2}/g], q = [...L, /\bmin(?:ute)?s?\b/gi, /\bread(?:ing)?\b/gi, /\btime\b/gi, /\bestimated\b/gi, /[/|\xb7\u2022\u2014\u2013\-,:.\s]+/g], N = [...L, /\bby\b/gi, /[/|\xb7\u2022\u2014\u2013\-,]+/g];
          function k(t3, e3 = 25) {
            let r3 = t3.nextElementSibling;
            for (; r3; ) {
              if ("P" === r3.tagName && (0, o.countWords)(r3.textContent || "") >= e3) return true;
              for (const t4 of r3.querySelectorAll("p")) if ((0, o.countWords)(t4.textContent || "") >= e3) return true;
              r3 = r3.nextElementSibling;
            }
            return false;
          }
          function $(t3, e3, r3) {
            var n3;
            let o2 = t3;
            for (; o2.parentElement && o2.parentElement !== r3 && ((null === (n3 = o2.parentElement.textContent) || void 0 === n3 ? void 0 : n3.trim()) || "") === e3; ) o2 = o2.parentElement;
            return o2;
          }
          function P(t3, e3, r3, n3) {
            let i2 = t3.nextElementSibling;
            for (; i2; ) {
              const t4 = i2.nextElementSibling;
              "footnotes" !== i2.id ? (r3 && n3 && n3.push({ step: "removeByContentPattern", reason: "trailing non-content", text: (0, o.textPreview)(i2) }), i2.remove(), i2 = t4) : i2 = t4;
            }
            e3 && (r3 && n3 && n3.push({ step: "removeByContentPattern", reason: "boilerplate text", text: (0, o.textPreview)(t3) }), t3.remove());
          }
          function O(t3, e3, r3, n3) {
            const o2 = [];
            let i2 = t3.parentElement;
            for (; i2 && i2 !== e3; ) o2.push(i2), i2 = i2.parentElement;
            P(t3, true, r3, n3);
            for (const t4 of o2) P(t4, false, r3, n3);
          }
          function M(t3, e3) {
            let r3 = t3;
            for (; r3.parentElement && r3.parentElement !== e3; ) {
              let t4 = 0, e4 = r3.previousElementSibling;
              for (; e4 && (t4 += (0, o.countWords)(e4.textContent || ""), !(t4 > 10)); ) e4 = e4.previousElementSibling;
              if (t4 > 10) break;
              r3 = r3.parentElement;
            }
            return r3;
          }
          function I(t3, e3, r3) {
            const i2 = t3.previousElementSibling;
            if (!i2) return;
            if ((0, o.countWords)(i2.textContent || "") >= 50) return;
            if (i2.querySelector(n2.CONTENT_ELEMENT_SELECTOR)) return;
            const s2 = i2.previousElementSibling;
            s2 && E(s2) || (e3 && r3 && r3.push({ step: "removeByContentPattern", reason: "thin CTA section", text: (0, o.textPreview)(i2) }), i2.remove());
          }
        }, 8983(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.removeHiddenElements = function(t3, e3, r3) {
            let i = 0;
            const s = /* @__PURE__ */ new Map(), a = /(?:^|;\s*)(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)(?:\s*;|\s*$)/i, l = t3.defaultView, c = "undefined" != typeof window && l === window, u = t3.querySelectorAll("*");
            for (const t4 of u) {
              if (t4.querySelector("math, [data-mathml], .katex-mathml") || "math" === t4.tagName.toLowerCase()) continue;
              const e4 = t4.getAttribute("style");
              if (e4 && a.test(e4)) {
                const r5 = e4.includes("display") ? "display:none" : e4.includes("visibility") ? "visibility:hidden" : "opacity:0";
                s.set(t4, r5), i++;
                continue;
              }
              if (c) try {
                const e5 = l.getComputedStyle(t4);
                let r5 = "";
                if ("none" === e5.display ? r5 = "display:none" : "hidden" === e5.visibility ? r5 = "visibility:hidden" : "0" === e5.opacity && (r5 = "opacity:0"), r5) {
                  s.set(t4, r5), i++;
                  continue;
                }
              } catch (t5) {
              }
              const r4 = t4.getAttribute("class") || "";
              if (r4) {
                const e5 = r4.split(/\s+/);
                if ((0, o.hasResponsiveShowClass)(r4)) continue;
                for (const r5 of e5) {
                  const e6 = "hidden" === r5 || "invisible" === r5, n3 = !r5.includes("[") && (r5.endsWith(":hidden") || r5.endsWith(":invisible"));
                  if (e6 || n3) {
                    s.set(t4, `class:${r5}`), i++;
                    break;
                  }
                }
              }
            }
            s.forEach(((t4, o2) => {
              e3 && r3 && r3.push({ step: "removeHiddenElements", reason: t4, text: (0, n2.textPreview)(o2) }), o2.remove();
            })), (0, n2.logDebug)(e3, "Removed hidden elements:", i);
          };
          const n2 = r2(2552), o = r2(639);
        }, 662(t2, e2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.removeMetadataBlock = function(t3) {
            var e3, n2;
            const o = t3.querySelector("h1");
            if (!o) return;
            let i = o.nextElementSibling;
            for (let t4 = 0; t4 < 3 && i; t4++) {
              const t5 = i.nextElementSibling, o2 = (null === (e3 = i.textContent) || void 0 === e3 ? void 0 : e3.trim()) || "";
              if (o2.length > 0 && o2.length < 300) {
                let t6 = r2.test(o2);
                if (!t6) {
                  for (const e4 of i.querySelectorAll("p, time")) if (r2.test((null === (n2 = e4.textContent) || void 0 === n2 ? void 0 : n2.trim()) || "")) {
                    t6 = true;
                    break;
                  }
                }
                if (t6) {
                  i.remove();
                  break;
                }
              }
              i = t5;
            }
          };
          const r2 = /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}[\s,]+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/i;
        }, 3550(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.ContentScorer = void 0;
          const n2 = r2(2640), o = r2(2552), i = r2(639), s = ["admonition", "article", "content", "entry", "image", "img", "font", "figure", "figcaption", "pre", "main", "post", "story", "table"], a = ["advertisement", "all rights reserved", "banner", "cookie", "comments", "copyright", "follow me", "follow us", "footer", "header", "homepage", "login", "menu", "more articles", "more like this", "most read", "nav", "navigation", "newsletter", "popular", "privacy", "recommended", "register", "related", "responses", "share", "sidebar", "sign in", "sign up", "signup", "social", "sponsored", "subscribe", "terms", "trending"], l = /\b(linkedin\.com\/(in|company)\/|twitter\.com\/(?!intent\b)\w|x\.com\/(?!intent\b)\w|facebook\.com\/(?!share\b)\w|instagram\.com\/\w|threads\.net\/\w|mastodon\.\w)/i, c = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i, u = /\bBy\s+[A-Z]/, d = a.map(((t3) => new RegExp(`\\b${t3.replace(/\s+/g, "\\s+")}\\b`))), h = new RegExp(a.map(((t3) => t3.replace(/\s+/g, "\\s+"))).join("|"), "i"), m = /^(?:table of )?contents$|^on this page$|^in this (?:article|guide|post)$/i, f = /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+\d{4})\b/i, p = /\b(?:by|written by|author:)\s+[A-Za-z\s]+\b/i, g = ["advert", "ad-", "ads", "banner", "cookie", "copyright", "footer", "header", "homepage", "menu", "nav", "newsletter", "popular", "privacy", "recommended", "related", "rights", "share", "sidebar", "social", "sponsored", "subscribe", "terms", "trending", "widget"];
          class v {
            constructor(t3, e3 = false) {
              this.doc = t3, this.debug = e3;
            }
            static scoreElement(t3) {
              let e3 = 0;
              const r3 = t3.textContent || "", s2 = (0, o.countWords)(r3);
              e3 += s2;
              e3 += 10 * t3.getElementsByTagName("p").length;
              e3 += r3.split(/,/).length - 1;
              e3 -= 3 * (t3.getElementsByTagName("img").length / (s2 || 1));
              try {
                const r4 = t3.getAttribute("style") || "", n3 = t3.getAttribute("align") || "";
                (r4.includes("float: right") || r4.includes("text-align: right") || "right" === n3) && (e3 += 5);
              } catch (t4) {
              }
              f.test(r3) && (e3 += 10);
              p.test(r3) && (e3 += 10);
              const a2 = (0, i.getClassName)(t3).toLowerCase();
              (a2.includes("content") || a2.includes("article") || a2.includes("post")) && (e3 += 15);
              t3.querySelector(n2.FOOTNOTE_INLINE_REFERENCES) && (e3 += 10);
              t3.querySelector(n2.FOOTNOTE_LIST_SELECTORS) && (e3 += 10);
              if (e3 -= 5 * t3.getElementsByTagName("table").length, "td" === t3.tagName.toLowerCase()) {
                const r4 = t3.closest("table");
                if (r4) {
                  const n3 = parseInt(r4.getAttribute("width") || "0"), o2 = r4.getAttribute("align") || "", s3 = (0, i.getClassName)(r4).toLowerCase();
                  if (n3 > 400 || "center" === o2 || s3.includes("content") || s3.includes("article")) {
                    const n4 = Array.from(r4.getElementsByTagName("td")), o3 = n4.indexOf(t3);
                    o3 > 0 && o3 < n4.length - 1 && (e3 += 10);
                  }
                }
              }
              const l2 = t3.getElementsByTagName("a");
              let c2 = 0;
              for (let t4 = 0; t4 < l2.length; t4++) c2 += (l2[t4].textContent || "").length;
              const u2 = r3.length || 1;
              return e3 *= 1 - Math.min(c2 / u2, 0.5), e3;
            }
            static findBestElement(t3, e3 = 50) {
              let r3 = null, n3 = 0;
              return t3.forEach(((t4) => {
                const e4 = this.scoreElement(t4);
                e4 > n3 && (n3 = e4, r3 = t4);
              })), n3 > e3 ? r3 : null;
            }
            static scoreAndRemove(t3, e3 = false, r3, i2) {
              const s2 = Date.now(), a2 = /* @__PURE__ */ new Map();
              Array.from(t3.querySelectorAll(n2.BLOCK_ELEMENTS_SELECTOR)).forEach(((t4) => {
                if (a2.has(t4)) return;
                if (i2 && t4.contains(i2)) return;
                if (t4.closest("pre")) return;
                if (t4.closest("[data-defuddle]")) return;
                if (t4.closest("td, th")) return;
                if (v.isLikelyContent(t4)) return;
                const e4 = v.scoreNonContentBlock(t4);
                e4 < 0 && a2.set(t4, e4);
              })), a2.forEach(((t4, n3) => {
                e3 && r3 && r3.push({ step: "scoreAndRemove", reason: `score: ${t4}`, text: (0, o.textPreview)(n3) }), n3.remove();
              }));
              const l2 = Date.now();
              (0, o.logDebug)(e3, "Removed non-content blocks:", { count: a2.size, processingTime: `${(l2 - s2).toFixed(2)}ms` });
            }
            static isLikelyContent(t3) {
              const e3 = t3.getAttribute("role");
              if (e3 && ["article", "main", "contentinfo"].includes(e3)) return true;
              const r3 = (0, i.getClassName)(t3).toLowerCase(), n3 = t3.id.toLowerCase();
              for (const t4 of s) if (r3.includes(t4) || n3.includes(t4)) return true;
              if (t3.querySelector("pre, table, figure, picture")) return true;
              const a2 = t3.textContent || "", c2 = (0, o.countWords)(a2), u2 = t3.querySelector("h1, h2, h3, h4, h5, h6");
              if (u2) {
                const t4 = (u2.textContent || "").trim();
                if (t4 && t4 === a2.trim()) {
                  const e4 = t4.toLowerCase();
                  if (!h.test(e4) && !m.test(e4)) return true;
                }
              }
              if (c2 < 1e3) {
                const e4 = t3.querySelectorAll("h1, h2, h3, h4, h5, h6");
                let r4 = false;
                for (let t4 = 0; t4 < e4.length; t4++) {
                  const n4 = (e4[t4].textContent || "").toLowerCase().trim();
                  if (h.test(n4)) {
                    r4 = true;
                    break;
                  }
                }
                if (r4) {
                  if (c2 < 200) return false;
                  if (t3.getElementsByTagName("a").length / (c2 || 1) > 0.2) return false;
                }
              }
              if (v.isCardGrid(t3, c2)) return false;
              if (c2 < 80) {
                const e4 = t3.getElementsByTagName("a");
                for (let t4 = 0; t4 < e4.length; t4++) {
                  const r4 = (e4[t4].getAttribute("href") || "").toLowerCase();
                  if (l.test(r4)) return false;
                }
              }
              const d2 = t3.getElementsByTagName("p").length + t3.getElementsByTagName("li").length;
              if (c2 > 50 && d2 > 1) return true;
              if (c2 > 100) return true;
              if (c2 > 30 && d2 > 0) return true;
              if (c2 >= 10 && /[.?!]/.test(a2)) {
                if (t3.getElementsByTagName("a").length / c2 < 0.1) return true;
              }
              return false;
            }
            static scoreNonContentBlock(t3) {
              try {
                if (t3.matches(n2.FOOTNOTE_LIST_SELECTORS) || t3.querySelector(n2.FOOTNOTE_LIST_SELECTORS) || t3.closest(n2.FOOTNOTE_LIST_SELECTORS)) return 0;
              } catch (t4) {
              }
              let e3 = 0;
              const r3 = t3.textContent || "", s2 = (0, o.countWords)(r3);
              if (s2 < 3) return 0;
              e3 += r3.split(/,/).length - 1;
              const a2 = r3.toLowerCase();
              let h2 = 0;
              for (const t4 of d) t4.test(a2) && h2++;
              e3 -= 10 * h2;
              const m2 = t3.getElementsByTagName("a"), f2 = m2.length;
              if (f2 / (s2 || 1) > 0.5 && (e3 -= 15), f2 > 1 && s2 < 80) {
                let t4 = 0;
                for (let e4 = 0; e4 < m2.length; e4++) t4 += (m2[e4].textContent || "").length;
                const n3 = r3.length;
                n3 > 0 && t4 / n3 > 0.8 && (e3 -= 15);
              }
              const p2 = t3.getElementsByTagName("ul").length + t3.getElementsByTagName("ol").length;
              if (p2 > 0 && f2 > 3 * p2 && (e3 -= 10), s2 < 80) {
                const r4 = t3.getElementsByTagName("a");
                for (let t4 = 0; t4 < r4.length; t4++) {
                  const n3 = (r4[t4].getAttribute("href") || "").toLowerCase();
                  if (l.test(n3)) {
                    e3 -= 15;
                    break;
                  }
                }
              }
              s2 < 15 && u.test(r3) && c.test(r3) && (e3 -= 10), v.isCardGrid(t3, s2) && (e3 -= 15);
              const y = (0, i.getClassName)(t3).toLowerCase(), b = t3.id.toLowerCase();
              for (const t4 of g) (y.includes(t4) || b.includes(t4)) && (e3 -= 8);
              return e3;
            }
            static isCardGrid(t3, e3) {
              if (e3 < 3 || e3 >= 500) return false;
              const r3 = t3.querySelectorAll("h2, h3, h4");
              if (r3.length < 3) return false;
              if (t3.querySelectorAll("img").length < 2) return false;
              let n3 = 0;
              for (let t4 = 0; t4 < r3.length; t4++) n3 += (0, o.countWords)(r3[t4].textContent || "");
              return (e3 - n3) / r3.length < 20;
            }
          }
          e2.ContentScorer = v;
        }, 7393(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.removeBySelector = function(t3, e3, r3 = true, s = true, a, l, c = false) {
            const u = Date.now();
            let d = 0, h = 0;
            const m = /* @__PURE__ */ new Map();
            if (r3) {
              t3.querySelectorAll(n2.EXACT_SELECTORS_JOINED).forEach(((t4) => {
                if (null == t4 ? void 0 : t4.parentNode) {
                  if (c) {
                    const e4 = t4.closest(n2.HIDDEN_EXACT_SKIP_SELECTOR), r4 = (t4.getAttribute("role") || "").toLowerCase();
                    if (t4.matches(n2.HIDDEN_EXACT_SELECTOR) || e4 && "dialog" === r4) return;
                  }
                  if (t4.closest("pre, code")) return;
                  if (t4.matches(n2.HIDDEN_EXACT_SELECTOR) && (0, i.hasResponsiveShowClass)((0, i.getClassName)(t4))) return;
                  m.set(t4, { type: "exact" }), d++;
                }
              }));
            }
            if (s) {
              const r4 = e3 ? n2.PARTIAL_SELECTORS.map(((t4) => ({ pattern: t4, regex: new RegExp(t4, "i"), anchored: new RegExp("^(?:" + t4 + ")$", "i") }))) : null, o2 = t3.querySelectorAll(n2.TEST_ATTRIBUTES_SELECTOR), s2 = a ? a.querySelectorAll(n2.TEST_ATTRIBUTES_SELECTOR) : [];
              (/* @__PURE__ */ new Set([...o2, ...s2])).forEach(((t4) => {
                var e4;
                if (m.has(t4)) return;
                if (t4.closest("[data-defuddle]")) return;
                const o3 = t4.tagName;
                if ("CODE" === o3 || "PRE" === o3 || t4.querySelector("pre") || t4.closest("code, pre")) return;
                const s3 = /^H[1-6]$/.test(o3), a2 = (s3 ? (0, i.getClassName)(t4) : (0, i.getClassName)(t4) + " " + (t4.getAttribute("data-component") || "") + " " + (t4.getAttribute("data-test") || "") + " " + (t4.getAttribute("data-testid") || "") + " " + (t4.getAttribute("data-test-id") || "") + " " + (t4.getAttribute("data-qa") || "") + " " + (t4.getAttribute("data-cy") || "")).toLowerCase(), l2 = s3 ? "" : (t4.id || "").toLowerCase(), c2 = "" !== a2.trim();
                if (!c2 && !l2) return;
                const u2 = c2 && n2.PARTIAL_SELECTORS_REGEX.test(a2), d2 = !!l2 && /[\s_\-:.]/.test(l2), f2 = !!l2 && (d2 ? n2.PARTIAL_SELECTORS_REGEX.test(l2) : n2.PARTIAL_SELECTORS_ANCHORED_REGEX.test(l2));
                if (u2 || f2) {
                  const n3 = u2 || d2, o4 = u2 ? a2 : l2, i2 = r4 ? null === (e4 = r4.find(((t5) => (n3 ? t5.regex : t5.anchored).test(o4)))) || void 0 === e4 ? void 0 : e4.pattern : void 0;
                  m.set(t4, { type: "partial", selector: i2 }), h++;
                }
              }));
            }
            m.forEach((({ type: t4, selector: r4 }, i2) => {
              var s2;
              if (!(a && i2.contains(a) || "A" === i2.tagName && i2.closest("h1, h2, h3, h4, h5, h6"))) {
                try {
                  if (i2.matches(n2.FOOTNOTE_LIST_SELECTORS) || i2.querySelector(n2.FOOTNOTE_LIST_SELECTORS)) return;
                  const t5 = i2.parentElement;
                  if (t5 && t5.matches(n2.FOOTNOTE_LIST_SELECTORS)) return;
                  if ((null === (s2 = i2.classList) || void 0 === s2 ? void 0 : s2.contains("footnote-backref")) && i2.closest("#footnotes")) return;
                } catch (t5) {
                }
                if ("BUTTON" === i2.tagName && i2.querySelector("img, picture, video")) {
                  const t5 = i2.parentElement;
                  if (t5) {
                    for (const e4 of Array.from(i2.querySelectorAll("img, picture, video"))) t5.insertBefore(e4, i2);
                    i2.remove();
                  }
                } else "BUTTON" === i2.tagName && i2.closest("p, li, td, th, span, h1, h2, h3, h4, h5, h6") ? i2.replaceWith(...Array.from(i2.childNodes)) : (e3 && l && l.push({ step: "removeBySelector", selector: "exact" === t4 ? "exact" : r4, reason: "exact" === t4 ? "exact selector match" : `partial match: ${r4}`, text: (0, o.textPreview)(i2) }), i2.remove());
              }
            }));
            const f = Date.now();
            (0, o.logDebug)(e3, "Removed clutter elements:", { exactSelectors: d, partialSelectors: h, total: m.size, processingTime: `${(f - u).toFixed(2)}ms` });
          };
          const n2 = r2(2640), o = r2(2552), i = r2(639);
        }, 2408(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.getElementIdentifier = u, e2.findSmallImages = function(t3, e3) {
            var r3, o2, i2;
            const d = /* @__PURE__ */ new Set();
            let h = 0;
            const m = t3.querySelectorAll("img, svg"), f = t3.defaultView, p = "undefined" != typeof window && f === window;
            for (const t4 of m) {
              const e4 = parseInt(t4.getAttribute("width") || "0"), n3 = parseInt(t4.getAttribute("height") || "0");
              let m2 = 0, g = 0;
              if ("svg" === t4.tagName.toLowerCase()) {
                const e5 = t4.getAttribute("viewBox");
                if (e5) {
                  const t5 = e5.split(/[\s,]+/);
                  4 === t5.length && (m2 = parseFloat(t5[2]) || 0, g = parseFloat(t5[3]) || 0);
                }
              }
              const v = t4.getAttribute("style") || "", y = parseInt((null === (r3 = v.match(a)) || void 0 === r3 ? void 0 : r3[1]) || "0"), b = parseInt((null === (o2 = v.match(l)) || void 0 === o2 ? void 0 : o2[1]) || "0");
              let x = 0, C = 0;
              if (p) {
                try {
                  const e5 = f.getComputedStyle(t4);
                  x = parseInt(e5.width) || 0, C = parseInt(e5.height) || 0;
                } catch (t5) {
                }
                try {
                  const e5 = t4.getBoundingClientRect();
                  e5.width > 0 && (x = x || e5.width), e5.height > 0 && (C = C || e5.height);
                } catch (t5) {
                }
              }
              const S = [e4, y, x, m2].filter(((t5) => t5 > 0)), E = [n3, b, C, g].filter(((t5) => t5 > 0));
              if (0 === S.length && 0 === E.length && "img" === t4.tagName.toLowerCase()) {
                const e5 = (t4.getAttribute("srcset") || "").match(/(\S+)\s+1x/);
                if (e5) {
                  const t5 = parseInt((null === (i2 = e5[1].match(c)) || void 0 === i2 ? void 0 : i2[1]) || "0");
                  t5 > 0 && S.push(t5);
                }
              }
              if (S.length > 0 || E.length > 0) {
                const e5 = S.length > 0 ? Math.min(...S) : 1 / 0, r4 = E.length > 0 ? Math.min(...E) : 1 / 0;
                if (e5 < 33 || r4 < 33) {
                  if ("img" === t4.tagName.toLowerCase()) {
                    const e7 = t4.getAttribute("alt") || "";
                    if (s.LOOKS_LIKE_LATEX_RE.test(e7)) continue;
                    if (t4.classList.contains("latex") || t4.classList.contains("tex")) continue;
                    if (t4.getAttribute("data-latex") || t4.getAttribute("data-math")) continue;
                  }
                  const e6 = u(t4);
                  e6 && (d.add(e6), h++);
                }
              }
            }
            return (0, n2.logDebug)(e3, "Found small elements:", h), d;
          }, e2.removeSmallImages = function(t3, e3, r3) {
            let o2 = 0;
            ["img", "svg"].forEach(((r4) => {
              const n3 = t3.getElementsByTagName(r4);
              Array.from(n3).forEach(((t4) => {
                if ("img" === r4) {
                  const e4 = t4.getAttribute("src") || "", r5 = t4.getAttribute("srcset") || t4.getAttribute("data-src") || t4.getAttribute("data-srcset") || t4.getAttribute("data-lazy-src") || t4.getAttribute("data-original");
                  if (!e4 && !r5) return t4.remove(), void o2++;
                  if (!r5 && !t4.closest("picture") && (0, i.isBase64Placeholder)(e4)) return t4.remove(), void o2++;
                }
                const n4 = u(t4);
                n4 && e3.has(n4) && (t4.remove(), o2++);
              }));
            })), (0, n2.logDebug)(r3, "Removed small elements:", o2);
          };
          const n2 = r2(2552), o = r2(639), i = r2(2649), s = r2(7282), a = /width\s*:\s*(\d+)/, l = /height\s*:\s*(\d+)/, c = /(?:width[=:/]|[/,?&]w[_:=])(\d+)/;
          function u(t3) {
            if ("img" === t3.tagName.toLowerCase()) {
              const e4 = t3.getAttribute("data-src");
              if (e4) return `src:${e4}`;
              const r4 = t3.getAttribute("src") || "", n4 = t3.getAttribute("srcset") || "", o2 = t3.getAttribute("data-srcset");
              if (r4) return `src:${r4}`;
              if (n4) return `srcset:${n4}`;
              if (o2) return `srcset:${o2}`;
            }
            const e3 = t3.id || "", r3 = (0, o.getClassName)(t3), n3 = "svg" === t3.tagName.toLowerCase() && t3.getAttribute("viewBox") || "";
            return e3 ? `id:${e3}` : n3 ? `viewBox:${n3}` : r3 ? `class:${r3}` : null;
          }
        }, 4840(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.standardizeContent = function(t3, e3, r3, s2 = false, l2) {
            d = s2;
            const E2 = l2 ? (t4, e4) => {
              var r4;
              const n3 = performance.now(), o2 = e4();
              return l2[t4] = (null !== (r4 = l2[t4]) && void 0 !== r4 ? r4 : 0) + Math.round(performance.now() - n3), o2;
            } : (t4, e4) => e4();
            E2("standardizeDropCaps", (() => (function(t4) {
              const e4 = Array.from(t4.querySelectorAll('span[data-caps="initial"]'));
              let r4 = 0;
              for (const t5 of e4) {
                if (!t5.parentNode) continue;
                const e5 = t5.nextElementSibling;
                if (e5 && "SMALL" === e5.tagName) {
                  const r5 = t5.textContent || "", n3 = e5.textContent || "", o2 = t5.ownerDocument.createTextNode(r5 + n3);
                  t5.parentNode.insertBefore(o2, t5), e5.remove(), t5.remove();
                } else g(t5);
                r4++;
              }
              r4 > 0 && t4.normalize();
              (0, c.logDebug)(d, "Standardized drop caps:", r4);
            })(t3))), E2("standardizeSpaces", (() => (function(t4) {
              const e4 = (t5) => {
                if ((0, c.isElement)(t5)) {
                  const e5 = t5.tagName.toLowerCase();
                  if ("pre" === e5 || "code" === e5 || (0, c.isSVGElement)(t5)) return;
                }
                if ((0, c.isTextNode)(t5)) {
                  const e5 = t5.textContent || "", r4 = e5.replace(/\xA0/g, " ");
                  r4 !== e5 && (t5.textContent = r4);
                }
                t5.hasChildNodes() && Array.from(t5.childNodes).forEach(e4);
              };
              e4(t4);
            })(t3))), E2("removeHtmlComments", (() => (function(t4) {
              var e4;
              let r4 = 0;
              const n3 = t4.ownerDocument, o2 = n3.createTreeWalker(t4, 128), i2 = [];
              for (; o2.nextNode(); ) i2.push(o2.currentNode);
              for (const t5 of i2) null === (e4 = t5.parentNode) || void 0 === e4 || e4.removeChild(t5), r4++;
              (0, c.logDebug)(d, "Removed HTML comments:", r4);
            })(t3))), E2("standardizeHeadings", (() => (function(t4, e4, r4) {
              const o2 = t4.getElementsByTagName("h1");
              Array.from(o2).forEach(((t5) => {
                var e5;
                const o3 = r4.createElement("h2");
                (0, u.transferContent)(t5, o3), Array.from(t5.attributes).forEach(((t6) => {
                  n2.ALLOWED_ATTRIBUTES.has(t6.name) && o3.setAttribute(t6.name, t6.value);
                })), null === (e5 = t5.parentNode) || void 0 === e5 || e5.replaceChild(o3, t5);
              }));
              const i2 = t4.getElementsByTagName("h2");
              if (i2.length > 0) {
                const t5 = i2[0];
                let r5 = "";
                for (const e5 of t5.querySelectorAll("a")) (0, a.isPermalinkAnchor)(e5) && (r5 += e5.textContent || "");
                const n3 = (0, c.normalizeText)((t5.textContent || "").replace(r5, "")), o3 = (0, c.normalizeText)(e4);
                o3 && o3 === n3 && t5.remove();
              }
            })(t3, e3.title, r3))), E2("wrapPreformattedCode", (() => (function(t4, e4) {
              var r4;
              const n3 = Array.from(t4.querySelectorAll("code"));
              for (const t5 of n3) {
                if (t5.closest("pre")) continue;
                const n4 = t5.getAttribute("style") || "";
                if (!/white-space\s*:\s*pre/.test(n4)) continue;
                const o2 = e4.createElement("pre");
                null === (r4 = t5.parentNode) || void 0 === r4 || r4.insertBefore(o2, t5), o2.appendChild(t5);
              }
            })(t3, r3))), E2("standardizeElements", (() => (function(t4, e4, r4) {
              let n3 = 0;
              const s3 = r4 ? (t5, e5) => {
                var n4;
                const o2 = performance.now(), i2 = e5();
                return r4["se:" + t5] = (null !== (n4 = r4["se:" + t5]) && void 0 !== n4 ? n4 : 0) + Math.round(performance.now() - o2), i2;
              } : (t5, e5) => e5();
              s3("wrapRawLatexDelimiters", (() => (0, i.wrapRawLatexDelimiters)(t4, e4))), s3("convertLatexImages", (() => {
                var r5;
                for (const s4 of Array.from(t4.querySelectorAll("img[src]"))) {
                  const t5 = s4.getAttribute("src");
                  if (!t5) continue;
                  let a3 = (0, i.extractLatexFromImageSrc)(t5);
                  if (!a3) {
                    const t6 = s4.getAttribute("alt") || "";
                    i.LOOKS_LIKE_LATEX_RE.test(t6) && (a3 = t6);
                  }
                  if (!a3) continue;
                  const l4 = /\\begin\{/.test(a3) || "p" === (null === (r5 = s4.parentElement) || void 0 === r5 ? void 0 : r5.tagName.toLowerCase()) && 1 === s4.parentElement.childNodes.length, c2 = (0, o.createCleanMathEl)(null, a3, l4, e4);
                  s4.replaceWith(c2), n3++;
                }
              })), h.forEach(((r5) => {
                const o2 = r5.selector.substring(0, 30);
                s3(o2, (() => {
                  if (r5.fastCheck && !t4.querySelector(r5.fastCheck)) return;
                  let o3;
                  try {
                    o3 = t4.querySelectorAll(r5.selector);
                  } catch (t5) {
                    return;
                  }
                  o3.forEach(((t5) => {
                    if (r5.transform) {
                      const o4 = r5.transform(t5, e4);
                      t5.replaceWith(o4), n3++;
                    }
                  }));
                }));
              })), Array.from(t4.querySelectorAll("code > pre")).forEach(((t5) => {
                const e5 = t5.parentElement;
                e5 && "CODE" === e5.tagName && e5.replaceWith(t5);
              }));
              const a2 = Array.from(t4.querySelectorAll("table.ltx_equation, table.ltx_eqn_table, table.ltx_equationgroup"));
              a2.forEach(((t5) => {
                const r5 = t5.querySelectorAll("math");
                if (0 === r5.length) return;
                const o2 = e4.createDocumentFragment();
                r5.forEach(((r6) => {
                  var n4;
                  const i2 = r6.getAttribute("alttext"), s4 = r6.querySelector('annotation[encoding="application/x-tex"]'), a3 = i2 || (null === (n4 = null == s4 ? void 0 : s4.textContent) || void 0 === n4 ? void 0 : n4.trim()) || "";
                  if (!a3) return;
                  const l4 = "block" === r6.getAttribute("display") || t5.classList.contains("ltx_equation") || t5.classList.contains("ltx_equationgroup"), c2 = e4.createElement("math");
                  c2.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML"), c2.setAttribute("display", l4 ? "block" : "inline"), c2.setAttribute("data-latex", a3), c2.textContent = a3, o2.appendChild(c2);
                })), o2.childNodes.length > 0 && (t5.replaceWith(o2), n3++);
              }));
              const l3 = Array.from(t4.querySelectorAll("span.ltx_note_outer"));
              l3.forEach(((t5) => {
                t5.remove(), n3++;
              }));
              const m2 = Array.from(t4.querySelectorAll("a.ltx_ref"));
              m2.forEach(((t5) => {
                if (t5.querySelector("span.ltx_ref_tag, span.ltx_text.ltx_ref_tag")) {
                  const r5 = e4.createTextNode(t5.textContent || "");
                  t5.replaceWith(r5), n3++;
                }
              }));
              for (const e5 of Array.from(t4.querySelectorAll("table"))) {
                if (!e5.parentNode) continue;
                const t5 = e5.querySelectorAll("td, th");
                t5.length > 0 && Array.from(t5).every(((t6) => !(t6.textContent || "").trim())) && !e5.querySelector("img, picture, video, audio, iframe, svg, math") && (e5.remove(), n3++);
              }
              const f2 = Array.from(t4.querySelectorAll("table"));
              f2.forEach(((t5) => {
                if (!t5.parentNode) return;
                const r5 = Array.from(t5.querySelectorAll("td, th")).filter(((e5) => (0, u.isDirectTableChild)(e5, t5)));
                if (r5.some(((t6) => "TH" === t6.tagName))) return;
                const o2 = Array.from(t5.querySelectorAll("tr")).filter(((e5) => (0, u.isDirectTableChild)(e5, t5)));
                if (0 === o2.length) return;
                if (!o2.every(((t6) => r5.filter(((e5) => e5.parentNode === t6)).length <= 1))) return;
                const i2 = e4.createDocumentFragment();
                r5.forEach(((t6) => {
                  for (; t6.firstChild; ) i2.appendChild(t6.firstChild);
                })), t5.replaceWith(i2), n3++;
              })), t4.querySelectorAll("video:not([controls])").forEach(((t5) => {
                t5.setAttribute("controls", "");
              }));
              const p2 = t4.querySelectorAll("lite-youtube");
              p2.forEach(((t5) => {
                const r5 = t5.getAttribute("videoid");
                if (!r5) return;
                const o2 = e4.createElement("iframe");
                o2.width = "560", o2.height = "315", o2.src = `https://www.youtube.com/embed/${r5}`, o2.title = t5.getAttribute("videotitle") || "YouTube video player", o2.frameBorder = "0", o2.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", o2.setAttribute("allowfullscreen", ""), t5.replaceWith(o2), n3++;
              })), (0, c.logDebug)(d, "Converted embedded elements:", n3), (function(t5) {
                var e5;
                const r5 = (t6) => {
                  let e6 = null;
                  for (const r6 of t6.children) {
                    if ("code" !== r6.tagName.toLowerCase()) return null;
                    if (e6) return null;
                    e6 = r6;
                  }
                  return e6;
                }, n4 = (t6) => {
                  var e6;
                  const r6 = (t6.getAttribute("data-lang") || "").toLowerCase();
                  if (r6) return r6;
                  const n5 = (t6.getAttribute("class") || "").match(/(?:^|\s)language-([a-z0-9_+-]+)(?:\s|$)/i);
                  return (null === (e6 = null == n5 ? void 0 : n5[1]) || void 0 === e6 ? void 0 : e6.toLowerCase()) || "";
                }, o2 = t5.querySelectorAll('pre[data-verso-code="true"]'), i2 = /* @__PURE__ */ new Set();
                for (const t6 of o2) {
                  const e6 = t6.parentElement;
                  e6 && i2.add(e6);
                }
                for (const t6 of i2) {
                  const o3 = Array.from(t6.childNodes);
                  for (let t7 = 0; t7 < o3.length; t7++) {
                    const i3 = o3[t7];
                    if (!(0, c.isElement)(i3) || "pre" !== i3.tagName.toLowerCase()) continue;
                    if ("true" !== i3.getAttribute("data-verso-code")) continue;
                    const s4 = r5(i3);
                    if (!s4) continue;
                    const a3 = n4(s4);
                    if ("lean" !== a3 && "lean4" !== a3) continue;
                    const l4 = [{ pre: i3, code: s4 }], u2 = [];
                    let d2 = t7 + 1;
                    for (; d2 < o3.length; ) {
                      const t8 = o3[d2];
                      if ((0, c.isTextNode)(t8) && !(t8.textContent || "").trim()) {
                        u2.push(t8), d2++;
                        continue;
                      }
                      if (!(0, c.isElement)(t8) || "pre" !== t8.tagName.toLowerCase()) break;
                      const e6 = t8;
                      if ("true" !== e6.getAttribute("data-verso-code")) break;
                      const i4 = r5(e6);
                      if (!i4 || n4(i4) !== a3) break;
                      l4.push({ pre: e6, code: i4 }), d2++;
                    }
                    if (l4.length <= 1) continue;
                    const h2 = l4.map((({ code: t8 }) => (t8.textContent || "").replace(/\r?\n$/, ""))).join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+|\n+$/g, "");
                    s4.textContent = h2;
                    for (let t8 = 1; t8 < l4.length; t8++) l4[t8].pre.remove();
                    for (const t8 of u2) null === (e5 = t8.parentNode) || void 0 === e5 || e5.removeChild(t8);
                    t7 = d2 - 1;
                  }
                }
              })(t4);
            })(t3, r3, l2))), E2("resolveSvgColors", (() => (function(t4, e4) {
              const r4 = t4.querySelectorAll("svg");
              if (0 === r4.length) return;
              const o2 = e4.defaultView, i2 = "undefined" != typeof window && o2 === window, s3 = /* @__PURE__ */ new Map(), a2 = (t5, r5) => {
                var a3, l3;
                if (!(t5 = t5.replace(x, ((t6, e5) => e5.trim()))).includes("var(")) return t5;
                if (i2) {
                  const n3 = s3.get(t5);
                  if (n3) return n3;
                  const i3 = r5 || e4.documentElement;
                  try {
                    const r6 = e4.createElement("div");
                    r6.style.color = t5, i3.appendChild(r6);
                    const n4 = o2.getComputedStyle(r6).color;
                    if (r6.remove(), n4 && !n4.includes("var(")) return s3.set(t5, n4), n4;
                  } catch (t6) {
                  }
                }
                const c2 = t5.match(C);
                if (c2) {
                  const t6 = null === (a3 = c2[2]) || void 0 === a3 ? void 0 : a3.trim();
                  if (t6 && !t6.includes("var(")) return t6;
                  const e5 = c2[1].toLowerCase(), r6 = e5.match(/(?:^|-)([a-z]+)-(\d{2,3})$/);
                  if (r6) {
                    const t7 = null === (l3 = n2.TAILWIND_COLORS[r6[1]]) || void 0 === l3 ? void 0 : l3[r6[2]];
                    if (t7) return t7;
                  }
                  if (e5.endsWith("-black")) return "#000";
                  if (e5.endsWith("-white")) return "#fff";
                  if (e5.includes("background") || e5.includes("card") || e5.includes("surface") || e5.includes("bg")) return "Canvas";
                  if (e5.includes("border") || e5.includes("divider") || e5.includes("separator")) return "#ccc";
                  if (e5.includes("muted") || e5.includes("subtle") || e5.includes("secondary") || e5.includes("placeholder")) return "#888";
                }
                return "currentColor";
              };
              for (const t5 of Array.from(r4)) {
                const e5 = t5.parentElement, r5 = [t5, ...Array.from(t5.querySelectorAll("*"))];
                for (const t6 of r5) {
                  for (const r7 of S) {
                    const n3 = t6.getAttribute(r7);
                    n3 && (n3.includes("var(") || n3.includes("light-dark(")) && t6.setAttribute(r7, a2(n3, e5));
                  }
                  const r6 = t6.getAttribute("style");
                  if (r6 && (r6.includes("var(") || r6.includes("light-dark("))) {
                    let n3 = r6.replace(x, ((t7, e6) => e6.trim()));
                    n3 = n3.replace(/var\(--[^,)]+(?:,\s*[^)]+)?\)/g, ((t7) => a2(t7, e5))), t6.setAttribute("style", n3);
                  }
                  q(t6);
                }
                L(t5);
              }
            })(t3, r3))), s2 ? (E2("stripUnwantedAttributes", (() => p(t3, s2))), E2("removeTrailingHeadings", (() => m(t3))), E2("stripExtraBrElements", (() => N(t3))), (0, c.logDebug)(d, "Debug mode: Skipping div flattening to preserve structure")) : (E2("replaceCustomElements", (() => (function(t4, e4) {
              const r4 = Array.from(t4.querySelectorAll("*")).filter(((t5) => t5.tagName.includes("-") && !n2.INLINE_ELEMENTS.has(t5.tagName.toLowerCase()) && !(0, c.isSVGElement)(t5))).reverse();
              let o2 = 0;
              for (const t5 of r4) {
                if (!t5.parentNode) continue;
                const r5 = e4.createElement("div");
                for (; t5.firstChild; ) r5.appendChild(t5.firstChild);
                t5.replaceWith(r5), o2++;
              }
              (0, c.logDebug)(d, "Replaced custom elements with divs:", o2);
            })(t3, r3))), E2("convertDataAsSpans", (() => (function(t4, e4) {
              let r4 = 0;
              const n3 = Array.from(t4.querySelectorAll("span[data-as]"));
              for (const t5 of n3) {
                if (!t5.parentNode) continue;
                const n4 = t5.getAttribute("data-as").toLowerCase();
                if (!b.has(n4)) continue;
                const o2 = e4.createElement(n4);
                (0, u.transferContent)(t5, o2), t5.replaceWith(o2), r4++;
              }
              (0, c.logDebug)(d, "Converted data-as spans:", r4);
            })(t3, r3))), E2("convertBlockSpans", (() => (function(t4, e4) {
              var r4;
              let n3 = 0;
              const o2 = Array.from(t4.querySelectorAll('span[class*="block"], span[style*="block"]'));
              for (const t5 of o2) {
                if (!t5.parentNode) continue;
                if (!(v.test((0, u.getClassName)(t5)) || y.test(t5.getAttribute("style") || ""))) continue;
                if (!(null === (r4 = t5.textContent) || void 0 === r4 ? void 0 : r4.trim())) continue;
                const o3 = e4.createElement("p");
                (0, u.transferContent)(t5, o3), t5.replaceWith(o3), n3++;
              }
              (0, c.logDebug)(d, "Converted block spans to paragraphs:", n3);
            })(t3, r3))), E2("unwrapLayoutTables", (() => (function(t4) {
              const e4 = Array.from(t4.querySelectorAll("table"));
              let r4 = 0;
              for (const t5 of e4) {
                if (!t5.parentNode) continue;
                if (t5.querySelector("thead, tfoot, th, caption")) continue;
                const e5 = Array.from(t5.querySelectorAll(":scope > tbody > tr > td, :scope > tr > td")).filter(((t6) => {
                  var e6;
                  return null === (e6 = t6.textContent) || void 0 === e6 ? void 0 : e6.trim();
                }));
                if (1 !== e5.length) continue;
                const o2 = e5[0], i2 = Array.from(o2.children).filter(((t6) => {
                  var e6;
                  return null === (e6 = t6.textContent) || void 0 === e6 ? void 0 : e6.trim();
                }));
                1 === i2.length && n2.BLOCK_LEVEL_ELEMENTS.has(i2[0].tagName.toLowerCase()) && (t5.replaceWith(i2[0]), r4++);
              }
              (0, c.logDebug)(d, "Unwrapped layout tables:", r4);
            })(t3))), E2("flattenWrapperElements[1]", (() => P(t3, r3))), E2("removePermalinkAnchors", (() => (0, a.removePermalinkAnchors)(t3))), E2("stripUnwantedAttributes", (() => p(t3, s2))), E2("unwrapBareSpans", (() => (function(t4) {
              const e4 = Array.from(t4.querySelectorAll("span")).reverse();
              let r4 = 0;
              for (const t5 of e4) {
                if (!t5.parentNode) continue;
                if (t5.attributes.length > 0) continue;
                const e5 = t5.parentNode;
                if (e5) {
                  for (; t5.firstChild; ) e5.insertBefore(t5.firstChild, t5);
                  t5.remove(), r4++;
                }
              }
              r4 > 0 && t4.normalize();
              (0, c.logDebug)(d, "Unwrapped bare spans:", r4);
            })(t3))), E2("unwrapSpecialLinks", (() => {
              Array.from(t3.querySelectorAll("code a")).forEach(g), Array.from(t3.querySelectorAll('a[href^="javascript:"]')).forEach(g), Array.from(t3.querySelectorAll("a")).forEach(((t4) => {
                const e4 = t4.getAttribute("href");
                if (!e4 || e4.startsWith("#")) return;
                const n3 = Array.from(t4.children).find(((t5) => /^H[1-6]$/.test(t5.nodeName)));
                if (!n3) return;
                const o2 = r3.createElement("a");
                for (o2.setAttribute("href", e4); n3.firstChild; ) o2.appendChild(n3.firstChild);
                n3.appendChild(o2), g(t4);
              })), Array.from(t3.querySelectorAll('a[href^="#"]')).forEach(((t4) => {
                t4.querySelector("h1, h2, h3, h4, h5, h6") && g(t4);
              }));
            })), E2("removeObsoleteElements", (() => t3.querySelectorAll("object, embed, applet").forEach(((t4) => t4.remove())))), E2("removeEmptyElements", (() => (function(t4) {
              let e4 = 0;
              const r4 = (t5) => {
                var e5;
                if (n2.ALLOWED_EMPTY_ELEMENTS.has(t5.tagName.toLowerCase())) return false;
                if ("DIV" === t5.tagName) {
                  const r6 = t5.children;
                  if (r6.length > 0) {
                    let t6 = true;
                    for (let n3 = 0; n3 < r6.length; n3++) {
                      const o4 = r6[n3];
                      if ("SPAN" !== o4.tagName) {
                        t6 = false;
                        break;
                      }
                      const i2 = (null === (e5 = o4.textContent) || void 0 === e5 ? void 0 : e5.trim()) || "";
                      if ("," !== i2 && "" !== i2 && " " !== i2) {
                        t6 = false;
                        break;
                      }
                    }
                    if (t6) return true;
                  }
                }
                const r5 = t5.textContent || "";
                if (r5.trim().length > 0 || r5.includes(" ")) return false;
                if (!t5.hasChildNodes()) return true;
                const o3 = t5.childNodes;
                for (let t6 = 0; t6 < o3.length; t6++) {
                  const e6 = o3[t6];
                  if ((0, c.isElement)(e6) && "br" === e6.tagName.toLowerCase()) continue;
                  if (!(0, c.isTextNode)(e6)) return false;
                  const r6 = e6.textContent || "";
                  if (r6.trim().length > 0 || r6.includes(" ")) return false;
                }
                return true;
              }, o2 = Array.from(t4.querySelectorAll("*")).reverse();
              for (const t5 of o2) t5.parentNode && r4(t5) && (t5.remove(), e4++);
              (0, c.logDebug)(d, "Removed empty elements:", e4);
            })(t3))), E2("removeTrailingHeadings", (() => m(t3))), E2("removeOrphanedDividers[1]", (() => f(t3))), E2("flattenWrapperElements[2]", (() => P(t3, r3))), E2("removeOrphanedDividers[2]", (() => f(t3))), E2("stripExtraBrElements", (() => N(t3))), E2("removeEmptyLines", (() => (function(t4, e4) {
              let r4 = 0;
              const o2 = Date.now(), i2 = (t5) => {
                var e5;
                if ((0, c.isElement)(t5)) {
                  const e6 = t5.tagName.toLowerCase();
                  if ("pre" === e6 || "code" === e6) return;
                }
                if (Array.from(t5.childNodes).forEach(i2), (0, c.isTextNode)(t5)) {
                  const n3 = t5.textContent || "";
                  if (!n3 || /^[\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/.test(n3)) null === (e5 = t5.parentNode) || void 0 === e5 || e5.removeChild(t5), r4++;
                  else {
                    const e6 = n3.replace(/[\n\r]+/g, " ").replace(/\t+/g, " ").replace(/ {2,}/g, " ").replace(/^[ ]+$/, " ").replace(/\s+([,.!?:;])/g, "$1").replace(/[\u200B\u200D\u200E\u200F\uFEFF]+/g, "").replace(/(?:\xA0){2,}/g, " ");
                    e6 !== n3 && (t5.textContent = e6, r4 += n3.length - e6.length);
                  }
                }
              }, s3 = (t5) => {
                var o3;
                if (!(0, c.isElement)(t5)) return;
                const i3 = t5.tagName.toLowerCase();
                if ("pre" === i3 || "code" === i3) return;
                Array.from(t5.childNodes).filter(c.isElement).forEach(s3), t5.normalize();
                const a3 = "block" === (null === (o3 = (0, c.getComputedStyle)(t5)) || void 0 === o3 ? void 0 : o3.display), l3 = a3 ? /^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/ : /^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/;
                for (; t5.firstChild && (0, c.isTextNode)(t5.firstChild) && (t5.firstChild.textContent || "").match(l3); ) t5.removeChild(t5.firstChild), r4++;
                for (; t5.lastChild && (0, c.isTextNode)(t5.lastChild) && (t5.lastChild.textContent || "").match(l3); ) t5.removeChild(t5.lastChild), r4++;
                if (!a3 && n2.INLINE_ELEMENTS.has(i3) && t5.parentNode && (r4 += $(t5, e4, "leading"), r4 += $(t5, e4, "trailing")), !a3) {
                  const r5 = Array.from(t5.childNodes);
                  for (let n3 = 0; n3 < r5.length - 1; n3++) {
                    const o4 = r5[n3], i4 = r5[n3 + 1];
                    if ((0, c.isElement)(o4) || (0, c.isElement)(i4)) {
                      const r6 = i4.textContent || "", n4 = o4.textContent || "", s4 = r6.match(/^[,.!?:;)\]]/), a4 = n4.match(/[,.!?:;(\[]\s*$/), l4 = (0, c.isTextNode)(o4) && (o4.textContent || "").endsWith(" ") || (0, c.isTextNode)(i4) && (i4.textContent || "").startsWith(" ");
                      if (!s4 && !a4 && !l4) {
                        const r7 = e4.createTextNode(" ");
                        t5.insertBefore(r7, i4);
                      }
                    }
                  }
                }
              };
              i2(t4), s3(t4);
              const a2 = Date.now();
              (0, c.logDebug)(d, "Removed empty lines:", { charactersRemoved: r4, processingTime: `${(a2 - o2).toFixed(2)}ms` });
            })(t3, r3))));
          }, e2.removeOrphanedDividers = f;
          const n2 = r2(2640), o = r2(6e3), i = r2(7282), s = r2(754), a = r2(7864), l = r2(2649), c = r2(2552), u = r2(639);
          let d = false;
          const h = [...o.mathRules, ...s.codeBlockRules, ...a.headingRules, ...l.imageRules, { selector: 'div[data-testid^="paragraph"], div[role="paragraph"]', element: "p", transform: (t3, e3) => {
            const r3 = e3.createElement("p");
            return (0, u.transferContent)(t3, r3), Array.from(t3.attributes).forEach(((t4) => {
              n2.ALLOWED_ATTRIBUTES.has(t4.name) && r3.setAttribute(t4.name, t4.value);
            })), r3;
          } }, { selector: 'div[role="list"]', element: "ul", transform: (t3, e3) => {
            var r3;
            const n3 = t3.querySelector('div[role="listitem"] .label'), o2 = ((null === (r3 = null == n3 ? void 0 : n3.textContent) || void 0 === r3 ? void 0 : r3.trim()) || "").match(/^\d+\)/), i2 = e3.createElement(o2 ? "ol" : "ul");
            return t3.querySelectorAll('div[role="listitem"]').forEach(((t4) => {
              const r4 = e3.createElement("li"), n4 = t4.querySelector(".content");
              if (n4) {
                n4.querySelectorAll('div[role="paragraph"]').forEach(((t5) => {
                  const r5 = e3.createElement("p");
                  (0, u.transferContent)(t5, r5), t5.replaceWith(r5);
                }));
                n4.querySelectorAll('div[role="list"]').forEach(((t5) => {
                  var r5;
                  const n5 = t5.querySelector('div[role="listitem"] .label'), o3 = ((null === (r5 = null == n5 ? void 0 : n5.textContent) || void 0 === r5 ? void 0 : r5.trim()) || "").match(/^\d+\)/), i3 = e3.createElement(o3 ? "ol" : "ul");
                  t5.querySelectorAll('div[role="listitem"]').forEach(((t6) => {
                    const r6 = e3.createElement("li"), n6 = t6.querySelector(".content");
                    if (n6) {
                      n6.querySelectorAll('div[role="paragraph"]').forEach(((t7) => {
                        const r7 = e3.createElement("p");
                        (0, u.transferContent)(t7, r7), t7.replaceWith(r7);
                      })), (0, u.transferContent)(n6, r6);
                    }
                    i3.appendChild(r6);
                  })), t5.replaceWith(i3);
                })), (0, u.transferContent)(n4, r4);
              }
              i2.appendChild(r4);
            })), i2;
          } }, { selector: 'div[role="listitem"]', element: "li", transform: (t3, e3) => {
            const r3 = t3.querySelector(".content");
            if (!r3) return t3;
            return r3.querySelectorAll('div[role="paragraph"]').forEach(((t4) => {
              const r4 = e3.createElement("p");
              (0, u.transferContent)(t4, r4), t4.replaceWith(r4);
            })), r3;
          } }];
          function m(t3) {
            let e3 = 0;
            const r3 = (e4) => {
              let n4 = "", o2 = e4.nextSibling;
              for (; o2; ) ((0, c.isTextNode)(o2) || (0, c.isElement)(o2)) && (n4 += o2.textContent || ""), o2 = o2.nextSibling;
              if (n4.trim()) return true;
              const i2 = e4.parentElement;
              return !(!i2 || i2 === t3) && r3(i2);
            }, n3 = Array.from(t3.querySelectorAll("h1, h2, h3, h4, h5, h6")).reverse();
            for (const t4 of n3) {
              if (r3(t4)) break;
              t4.remove(), e3++;
            }
            e3 > 0 && (0, c.logDebug)(d, "Removed trailing headings:", e3);
          }
          function f(t3) {
            for (; ; ) {
              let e3 = t3.firstChild;
              for (; e3 && (0, c.isTextNode)(e3) && !(e3.textContent || "").trim(); ) e3 = e3.nextSibling;
              if (!e3 || !(0, c.isElement)(e3) || "hr" !== e3.tagName.toLowerCase()) break;
              e3.remove();
            }
            for (; ; ) {
              let e3 = t3.lastChild;
              for (; e3 && (0, c.isTextNode)(e3) && !(e3.textContent || "").trim(); ) e3 = e3.previousSibling;
              if (!e3 || !(0, c.isElement)(e3) || "hr" !== e3.tagName.toLowerCase()) break;
              e3.remove();
            }
            for (const e3 of t3.querySelectorAll("hr")) {
              if (!e3.parentNode) continue;
              let t4 = e3.nextSibling;
              for (; t4; ) if (!(0, c.isTextNode)(t4) || (t4.textContent || "").trim()) {
                if (!(0, c.isElement)(t4) || "HR" !== t4.tagName) break;
                {
                  const e4 = t4.nextSibling;
                  t4.remove(), t4 = e4;
                }
              } else t4 = t4.nextSibling;
            }
          }
          function p(t3, e3) {
            let r3 = 0;
            const o2 = (t4) => {
              if ((0, c.isSVGElement)(t4)) return void (!e3 && t4.hasAttribute("class") && (t4.removeAttribute("class"), r3++));
              const o3 = Array.from(t4.attributes), i2 = t4.tagName.toLowerCase();
              o3.forEach(((o4) => {
                const s2 = o4.name.toLowerCase(), a2 = o4.value;
                "id" === s2 && (a2.startsWith("fnref:") || a2.startsWith("fn:") || "footnotes" === a2) || "class" === s2 && ("code" === i2 && a2.startsWith("language-") || "footnote-backref" === a2 || /^callout(?:-|$)/.test(a2)) || (e3 ? n2.ALLOWED_ATTRIBUTES.has(s2) || n2.ALLOWED_ATTRIBUTES_DEBUG.has(s2) || s2.startsWith("data-") || (t4.removeAttribute(o4.name), r3++) : n2.ALLOWED_ATTRIBUTES.has(s2) || (t4.removeAttribute(o4.name), r3++));
              }));
            };
            o2(t3), t3.querySelectorAll("*").forEach(o2), (0, c.logDebug)(d, "Stripped attributes:", r3);
          }
          function g(t3) {
            for (var e3; t3.firstChild; ) null === (e3 = t3.parentNode) || void 0 === e3 || e3.insertBefore(t3.firstChild, t3);
            t3.remove();
          }
          const v = /(?:^|\s)block(?:\s|$)/, y = /display\s*:\s*block/i;
          const b = /* @__PURE__ */ new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"]);
          const x = /light-dark\(\s*([^,]+?)\s*,\s*[^)]+?\)/g, C = /var\(--([^,)]+)(?:,\s*([^)]+))?\)/, S = ["fill", "stroke", "color", "stop-color", "flood-color", "lighting-color"];
          const E = /* @__PURE__ */ new Set(["path", "rect", "circle", "ellipse", "polygon"]), A = /* @__PURE__ */ new Set(["line", "polyline"]), w = /* @__PURE__ */ new Set(["text", "tspan"]), T = "defs, clipPath, mask, pattern, marker";
          function _(t3, e3) {
            const r3 = t3.getAttribute("style");
            return !!r3 && new RegExp(`(?:^|;)\\s*${e3}\\s*:`).test(r3);
          }
          function L(t3) {
            if (t3.querySelector("style")) return;
            const e3 = Array.from(t3.querySelectorAll("*"));
            let r3 = false;
            for (const t4 of e3) {
              const e4 = t4.tagName.toLowerCase();
              if (E.has(e4) && (t4.getAttribute("class") && !t4.closest(T) && !t4.hasAttribute("fill") && !_(t4, "fill"))) {
                r3 = true;
                break;
              }
            }
            if (r3) for (const t4 of e3) {
              const e4 = t4.tagName.toLowerCase(), r4 = E.has(e4), n3 = A.has(e4), o2 = w.has(e4);
              if (!r4 && !n3 && !o2) continue;
              if (!t4.getAttribute("class")) continue;
              if (t4.closest(T)) continue;
              if (o2) {
                t4.hasAttribute("fill") || _(t4, "fill") || t4.setAttribute("fill", "currentColor");
                continue;
              }
              const i2 = t4.hasAttribute("fill") && "none" !== t4.getAttribute("fill"), s2 = t4.hasAttribute("stroke") || _(t4, "stroke");
              if (!r4 || t4.hasAttribute("fill") || _(t4, "fill") || t4.setAttribute("fill", "none"), !s2) {
                if (n3) t4.setAttribute("stroke", "currentColor"), t4.hasAttribute("stroke-opacity") || t4.setAttribute("stroke-opacity", "0.2");
                else if (r4 && !i2) {
                  const e5 = t4.getAttribute("d") || "";
                  /Z\s*$/i.test(e5.trim()) || t4.setAttribute("stroke", "currentColor");
                }
              }
            }
          }
          function q(t3) {
            var e3;
            const r3 = t3.getAttribute("class");
            if (!r3) return;
            const o2 = r3.split(/\s+/), i2 = [], s2 = [];
            for (const r4 of o2) {
              let o3 = r4.match(n2.TW_COLOR_CLASS_RE);
              if (o3) {
                const [, r5, i3, s3, a2] = o3, l2 = null === (e3 = n2.TAILWIND_COLORS[i3]) || void 0 === e3 ? void 0 : e3[s3];
                if (l2) {
                  if (a2) {
                    const e4 = parseInt(a2) / 100, n3 = parseInt(l2.slice(1, 3), 16), o4 = parseInt(l2.slice(3, 5), 16), i4 = parseInt(l2.slice(5, 7), 16);
                    t3.setAttribute(r5, `rgba(${n3},${o4},${i4},${e4})`);
                  } else t3.setAttribute(r5, l2);
                  continue;
                }
              }
              o3 = r4.match(n2.TW_SPECIAL_CLASS_RE), o3 ? t3.setAttribute(o3[1], n2.TAILWIND_SPECIAL[o3[2]]) : (o3 = r4.match(n2.TW_ARBITRARY_RE), !o3 || o3[1].startsWith("#") || o3[1].startsWith("rgb") || o3[1].startsWith("hsl") ? "font-semibold" !== r4 ? "font-bold" !== r4 ? "font-medium" !== r4 ? "font-mono" !== r4 ? i2.push(r4) : s2.push("font-family:monospace") : s2.push("font-weight:500") : s2.push("font-weight:700") : s2.push("font-weight:600") : s2.push(`font-size:${o3[1]}`));
            }
            if (i2.length !== o2.length && (i2.length > 0 ? t3.setAttribute("class", i2.join(" ")) : t3.removeAttribute("class"), s2.length > 0)) {
              const e4 = t3.getAttribute("style") || "", r4 = e4 && !e4.endsWith(";") ? ";" : "";
              t3.setAttribute("style", e4 + r4 + s2.join(";"));
            }
          }
          function N(t3) {
            let e3 = 0;
            const r3 = Date.now(), o2 = Array.from(t3.getElementsByTagName("br"));
            let i2 = [];
            const s2 = () => {
              if (i2.length > 2) for (let t4 = 2; t4 < i2.length; t4++) i2[t4].remove(), e3++;
              i2 = [];
            };
            o2.forEach(((t4) => {
              let e4 = false;
              if (i2.length > 0) {
                const r4 = i2[i2.length - 1];
                k(t4, "previous") === r4 && (e4 = true);
              }
              e4 ? i2.push(t4) : (s2(), i2 = [t4]);
            })), s2();
            const a2 = Array.from(t3.getElementsByTagName("br"));
            for (const t4 of a2) {
              const r4 = t4.parentElement;
              if (!r4) continue;
              if (t4.closest("pre, code")) continue;
              const o3 = r4.tagName.toLowerCase();
              if (n2.BLOCK_LEVEL_ELEMENTS.has(o3) || "body" === o3) {
                const r5 = [t4];
                let o4 = k(t4, "next");
                for (; o4 && (0, c.isElement)(o4) && "br" === o4.tagName.toLowerCase(); ) r5.push(o4), o4 = k(o4, "next");
                const i3 = k(r5[0], "previous"), s3 = k(r5[r5.length - 1], "next"), a3 = i3 && (0, c.isElement)(i3) && n2.BLOCK_LEVEL_ELEMENTS.has(i3.tagName.toLowerCase()), l3 = s3 && (0, c.isElement)(s3) && n2.BLOCK_LEVEL_ELEMENTS.has(s3.tagName.toLowerCase());
                if (a3 && l3 || a3 && !s3 || !i3) {
                  for (const t5 of r5) t5.remove(), e3++;
                  continue;
                }
              }
              n2.BLOCK_LEVEL_ELEMENTS.has(o3) && (k(t4, "next") || (t4.remove(), e3++));
            }
            const l2 = Date.now();
            (0, c.logDebug)(d, "Standardized br elements:", { removed: e3, processingTime: `${(l2 - r3).toFixed(2)}ms` });
          }
          function k(t3, e3) {
            var r3;
            const n3 = "previous" === e3 ? "previousSibling" : "nextSibling";
            let o2 = t3[n3];
            for (; o2 && (0, c.isTextNode)(o2) && !(null === (r3 = o2.textContent) || void 0 === r3 ? void 0 : r3.trim()); ) o2 = o2[n3];
            return o2;
          }
          function $(t3, e3, r3) {
            const n3 = "leading" === r3 ? t3.firstChild : t3.lastChild;
            if (!n3 || !(0, c.isTextNode)(n3)) return 0;
            const o2 = n3.textContent || "", i2 = "leading" === r3 ? o2.replace(/^\s+/, "") : o2.replace(/\s+$/, "");
            if (i2 === o2 || !t3.parentNode) return 0;
            n3.textContent = i2;
            const s2 = "leading" === r3 ? t3.previousSibling : t3.nextSibling;
            if (!(s2 && (0, c.isTextNode)(s2) && ("leading" === r3 ? (s2.textContent || "").endsWith(" ") : (s2.textContent || "").startsWith(" ")))) {
              const n4 = "leading" === r3 ? t3 : t3.nextSibling;
              t3.parentNode.insertBefore(e3.createTextNode(" "), n4);
            }
            return 1;
          }
          function P(t3, e3) {
            let r3 = 0;
            const o2 = Date.now();
            let i2 = true;
            function s2(t4) {
              var e4;
              for (const r4 of t4.childNodes) {
                if ((0, c.isTextNode)(r4) && (null === (e4 = r4.textContent) || void 0 === e4 ? void 0 : e4.trim())) return true;
                if ((0, c.isElement)(r4) && n2.INLINE_ELEMENTS.has(r4.nodeName.toLowerCase())) return true;
              }
              return false;
            }
            const a2 = (t4) => {
              var e4;
              const r4 = t4.tagName.toLowerCase();
              if ((0, c.isSVGElement)(t4)) return true;
              if (n2.PRESERVE_ELEMENTS.has(r4)) return true;
              if (t4.getAttribute("data-callout") || (null === (e4 = t4.closest) || void 0 === e4 ? void 0 : e4.call(t4, "[data-callout]"))) return true;
              const o3 = t4.getAttribute("role");
              if (o3 && ["article", "main", "navigation", "banner", "contentinfo"].includes(o3)) return true;
              const i3 = (0, u.getClassName)(t4);
              if (i3 && i3.toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/)) return true;
              return !!Array.from(t4.children).some(((t5) => n2.PRESERVE_ELEMENTS.has(t5.tagName.toLowerCase()) || "article" === t5.getAttribute("role") || !!(0, u.getClassName)(t5) && (0, u.getClassName)(t5).toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/)));
            }, l2 = (t4) => {
              var e4;
              if (s2(t4)) return false;
              if (!(null === (e4 = t4.textContent) || void 0 === e4 ? void 0 : e4.trim())) return true;
              const r4 = Array.from(t4.children);
              if (0 === r4.length) return true;
              if (r4.every(((t5) => n2.BLOCK_LEVEL_ELEMENTS.has(t5.tagName.toLowerCase())))) return true;
              const o3 = (0, u.getClassName)(t4).toLowerCase();
              if (/(?:wrapper|container|layout|row|col|grid|flex|outer|inner|content-area)/i.test(o3)) return true;
              const i3 = Array.from(t4.childNodes).filter(((t5) => {
                var e5;
                return (0, c.isTextNode)(t5) && (null === (e5 = t5.textContent) || void 0 === e5 ? void 0 : e5.trim());
              }));
              if (0 === i3.length) return true;
              return !(!(r4.length > 0) || r4.some(((t5) => {
                const e5 = t5.tagName.toLowerCase();
                return n2.INLINE_ELEMENTS.has(e5);
              })));
            }, h2 = (o3) => {
              var i3, u2;
              if (!o3.parentNode || a2(o3)) return false;
              const d2 = o3.tagName.toLowerCase();
              if (!n2.ALLOWED_EMPTY_ELEMENTS.has(d2) && !o3.children.length && !(null === (i3 = o3.textContent) || void 0 === i3 ? void 0 : i3.trim())) return o3.remove(), r3++, true;
              if (o3.parentElement === t3) {
                const t4 = Array.from(o3.children);
                if (t4.length > 0 && !t4.some(((t5) => {
                  const e4 = t5.tagName.toLowerCase();
                  return n2.INLINE_ELEMENTS.has(e4);
                }))) {
                  const t5 = e3.createDocumentFragment();
                  for (; o3.firstChild; ) t5.appendChild(o3.firstChild);
                  return o3.replaceWith(t5), r3++, true;
                }
              }
              if (l2(o3)) {
                const t4 = e3.createDocumentFragment();
                for (; o3.firstChild; ) t4.appendChild(o3.firstChild);
                return o3.replaceWith(t4), r3++, true;
              }
              const h3 = Array.from(o3.childNodes);
              if (h3.length > 0 && h3.every(((t4) => (0, c.isTextNode)(t4) || (0, c.isElement)(t4) && n2.INLINE_ELEMENTS.has(t4.nodeName.toLowerCase()))) && (null === (u2 = o3.textContent) || void 0 === u2 ? void 0 : u2.trim())) {
                const t4 = e3.createElement("p");
                for (; o3.firstChild; ) t4.appendChild(o3.firstChild);
                return o3.replaceWith(t4), r3++, true;
              }
              if (1 === o3.children.length) {
                const t4 = o3.firstElementChild, e4 = t4.tagName.toLowerCase();
                if (n2.BLOCK_ELEMENTS_SET.has(e4) && !a2(t4)) return o3.replaceWith(t4), r3++, true;
              }
              let m3 = 0, f3 = o3.parentElement;
              for (; f3; ) {
                const t4 = f3.tagName.toLowerCase();
                n2.BLOCK_ELEMENTS_SET.has(t4) && m3++, f3 = f3.parentElement;
              }
              if (m3 > 0 && !s2(o3)) {
                const t4 = e3.createDocumentFragment();
                for (; o3.firstChild; ) t4.appendChild(o3.firstChild);
                return o3.replaceWith(t4), r3++, true;
              }
              return false;
            }, m2 = () => {
              const e4 = Array.from(t3.children).filter(((t4) => n2.BLOCK_ELEMENTS_SET.has(t4.tagName.toLowerCase())));
              let r4 = false;
              return e4.forEach(((t4) => {
                h2(t4) && (r4 = true);
              })), r4;
            }, f2 = () => {
              const e4 = Array.from(t3.querySelectorAll(n2.BLOCK_ELEMENTS_SELECTOR)).sort(((t4, e5) => {
                const r5 = (t5) => {
                  let e6 = 0, r6 = t5.parentElement;
                  for (; r6; ) {
                    const t6 = r6.tagName.toLowerCase();
                    n2.BLOCK_ELEMENTS_SET.has(t6) && e6++, r6 = r6.parentElement;
                  }
                  return e6;
                };
                return r5(e5) - r5(t4);
              }));
              let r4 = false;
              return e4.forEach(((t4) => {
                h2(t4) && (r4 = true);
              })), r4;
            }, p2 = () => {
              const o3 = Array.from(t3.querySelectorAll(n2.BLOCK_ELEMENTS_SELECTOR));
              let i3 = false;
              return o3.forEach(((t4) => {
                const n3 = Array.from(t4.children);
                if (n3.length > 0 && n3.every(((t5) => "p" === t5.tagName.toLowerCase())) || !a2(t4) && l2(t4)) {
                  const n4 = e3.createDocumentFragment();
                  for (; t4.firstChild; ) n4.appendChild(t4.firstChild);
                  t4.replaceWith(n4), r3++, i3 = true;
                }
              })), i3;
            };
            do {
              i2 = false, m2() && (i2 = true), f2() && (i2 = true), p2() && (i2 = true);
            } while (i2);
            const g2 = Date.now();
            (0, c.logDebug)(d, "Flattened wrapper elements:", { count: r3, processingTime: `${(g2 - o2).toFixed(2)}ms` });
          }
        }, 2552(t2, e2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.CJK_CHAR_RANGES = void 0, e2.isElement = function(t3) {
            return t3.nodeType === r2;
          }, e2.isTextNode = function(t3) {
            return t3.nodeType === n2;
          }, e2.isCommentNode = function(t3) {
            return t3.nodeType === o;
          }, e2.isSVGElement = function(t3) {
            var e3;
            return null !== (null === (e3 = t3.closest) || void 0 === e3 ? void 0 : e3.call(t3, "svg")) || "http://www.w3.org/2000/svg" === t3.namespaceURI;
          }, e2.getComputedStyle = function(t3) {
            const e3 = i(t3.ownerDocument);
            return e3 && "function" == typeof e3.getComputedStyle ? e3.getComputedStyle(t3) : null;
          }, e2.getWindow = i, e2.textPreview = function(t3) {
            return (t3.textContent || "").trim().substring(0, 200);
          }, e2.logDebug = function(t3, e3, ...r3) {
            t3 && console.log("Defuddle:", e3, ...r3);
          }, e2.normalizeText = function(t3) {
            return t3.replace(/\u00A0/g, " ").replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u2012\u2013\u2014\u2015]/g, "-").replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/\u2026/g, "...").replace(/\s+/g, " ").trim().toLowerCase();
          }, e2.countWords = function(t3) {
            if (!t3) return 0;
            let e3 = 0, r3 = 0, n3 = false;
            for (let o2 = 0; o2 < t3.length; o2++) {
              const i2 = t3.charCodeAt(o2);
              i2 >= 12352 && i2 <= 12447 || i2 >= 12448 && i2 <= 12543 || i2 >= 13312 && i2 <= 19903 || i2 >= 19968 && i2 <= 40959 || i2 >= 63744 && i2 <= 64255 || i2 >= 44032 && i2 <= 55215 ? (e3++, n3 = false) : i2 <= 32 ? n3 = false : n3 || (r3++, n3 = true);
            }
            return e3 + r3;
          };
          const r2 = 1, n2 = 3, o = 8;
          function i(t3) {
            return t3.defaultView ? t3.defaultView : t3.ownerWindow ? t3.ownerWindow : t3.window ? t3.window : null;
          }
          e2.CJK_CHAR_RANGES = "\\u3040-\\u309f\\u30a0-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uac00-\\ud7af";
        }, 6618(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.bbcodeToHtml = function(t3) {
            let e3 = t3;
            return e3 = e3.replace(/\[h1\]([\s\S]*?)\[\/h1\]/gi, "<h1>$1</h1>"), e3 = e3.replace(/\[h2\]([\s\S]*?)\[\/h2\]/gi, "<h2>$1</h2>"), e3 = e3.replace(/\[h3\]([\s\S]*?)\[\/h3\]/gi, "<h3>$1</h3>"), e3 = e3.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>"), e3 = e3.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>"), e3 = e3.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>"), e3 = e3.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>"), e3 = e3.replace(/\[url=["']?([^"'\]]+)["']?\]([\s\S]*?)\[\/url\]/gi, ((t4, e4, r3) => (0, n2.isDangerousUrl)(e4) ? r3 : `<a href="${e4}">${r3}</a>`)), e3 = e3.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, '<img src="$1">'), e3 = e3.replace(/\[previewyoutube=["']?([^;'"]+)[^"'\]]*["']?\]\[\/previewyoutube\]/gi, '<img src="https://www.youtube.com/watch?v=$1">'), e3 = e3.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, ((t4, e4) => `<ul>${e4.replace(/\[\*\]([\s\S]*?)(?=\[\*\]|\[\/list\]|$)/gi, "<li>$1</li>")}</ul>`)), e3 = e3.replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, ((t4, e4) => `<ol>${e4.replace(/\[\*\]([\s\S]*?)(?=\[\*\]|\[\/olist\]|$)/gi, "<li>$1</li>")}</ol>`)), e3 = e3.replace(/\[quote(?:=[^\]]+)?\]([\s\S]*?)\[\/quote\]/gi, "<blockquote>$1</blockquote>"), e3 = e3.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, "<pre><code>$1</code></pre>"), e3 = e3.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, "<details><summary>Spoiler</summary>$1</details>"), e3 = e3.replace(/\[p\]([\s\S]*?)\[\/p\]/gi, ((t4, e4) => `<p>${e4.replace(/\n/g, "<br>")}</p>`)), e3 = e3.replace(/\n/g, "<br>"), e3 = e3.replace(/\[[^\]]+\]/g, ""), e3;
          };
          const n2 = r2(639);
        }, 6077(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.buildContentHtml = function(t3, e3, r3) {
            return `
		<article data-defuddle>
			<div class="${t3} post">
				<div class="post-content">
					${e3}
				</div>
			</div>
			${r3 ? `
				<hr>
				<div class="${t3} comments">
					<h2>Comments</h2>
					${r3}
				</div>
			` : ""}
		</article>
	`.trim();
          }, e2.buildCommentTree = function(t3) {
            var e3, r3, n3;
            const i = [], s = [];
            for (const a of t3) {
              const t4 = null !== (e3 = a.depth) && void 0 !== e3 ? e3 : 0;
              if (0 === t4) {
                for (; s.length > 0; ) i.push("</blockquote>"), s.pop();
                i.push("<blockquote>"), s.push(0);
              } else {
                if (t4 < (null !== (r3 = s[s.length - 1]) && void 0 !== r3 ? r3 : -1)) for (; s.length > 0 && s[s.length - 1] >= t4; ) i.push("</blockquote>"), s.pop();
                t4 > (null !== (n3 = s[s.length - 1]) && void 0 !== n3 ? n3 : -1) && (i.push("<blockquote>"), s.push(t4));
              }
              i.push(o(a));
            }
            for (; s.length > 0; ) i.push("</blockquote>"), s.pop();
            return i.join("");
          }, e2.buildComment = o, e2.buildQuotedPost = function(t3) {
            let e3 = "";
            t3.author && (e3 += `<p><strong>${(0, n2.escapeHtml)(t3.author)}</strong>`, t3.date && (e3 += ` · ${(0, n2.escapeHtml)(t3.date)}`), e3 += "</p>");
            let r3 = "";
            if (t3.url) {
              const e4 = (0, n2.isDangerousUrl)(t3.url) ? "" : t3.url;
              e4 && (r3 = `
<p><a href="${(0, n2.escapeHtml)(e4)}">${(0, n2.escapeHtml)(e4)}</a></p>`);
            }
            return `<blockquote class="quoted-post">${e3}${t3.content}${r3}</blockquote>`;
          };
          const n2 = r2(639);
          function o(t3) {
            const e3 = `<span class="comment-author"><strong>${(0, n2.escapeHtml)(t3.author)}</strong></span>`, r3 = t3.url && !(0, n2.isDangerousUrl)(t3.url) ? t3.url : "";
            return `<div class="comment">
	<div class="comment-metadata">
		${e3} · ${r3 ? `<a href="${(0, n2.escapeHtml)(r3)}" class="comment-link">${(0, n2.escapeHtml)(t3.date)}</a>` : `<span class="comment-date">${(0, n2.escapeHtml)(t3.date)}</span>`}${t3.score ? ` · <span class="comment-points">${(0, n2.escapeHtml)(t3.score)}</span>` : ""}
	</div>
	<div class="comment-content">${t3.content}</div>
</div>`;
          }
        }, 639(t2, e2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.transferContent = function(t3, e3) {
            if ("replaceChildren" in e3) e3.replaceChildren();
            else for (; e3.firstChild; ) e3.removeChild(e3.firstChild);
            for (; t3.firstChild; ) e3.appendChild(t3.firstChild);
          }, e2.serializeHTML = function(t3) {
            return t3.innerHTML;
          }, e2.decodeHTMLEntities = function(t3, e3) {
            const r3 = t3.createElement("textarea");
            return r3.innerHTML = e3, r3.value;
          }, e2.escapeHtml = function(t3) {
            return t3.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
          }, e2.getClassName = function(t3) {
            return "string" == typeof t3.className ? t3.className : t3.getAttribute("class") || "";
          }, e2.hasResponsiveShowClass = function(t3) {
            return t3.split(/\s+/).some(((t4) => r2.test(t4)));
          }, e2.isDangerousUrl = function(t3, e3 = true) {
            const r3 = t3.replace(/[\s\u0000-\u001F]+/g, "").toLowerCase();
            if (r3.startsWith("javascript:") || r3.startsWith("blob:")) return true;
            if (r3.startsWith("data:")) return !(e3 && r3.startsWith("data:image/"));
            return false;
          }, e2.isDirectTableChild = function(t3, e3) {
            let r3 = t3.parentNode;
            for (; r3 && r3 !== e3; ) {
              if ("TABLE" === r3.nodeName) return false;
              r3 = r3.parentNode;
            }
            return r3 === e3;
          }, e2.parseHTML = function(t3, e3) {
            if (!e3) return t3.createDocumentFragment();
            const r3 = t3.createElement("template");
            if (r3.innerHTML = e3, r3.content) return r3.content;
            const n2 = t3.createElement("div");
            n2.innerHTML = e3;
            const o = t3.createDocumentFragment();
            for (; n2.firstChild; ) o.appendChild(n2.firstChild);
            return o;
          };
          const r2 = /^(sm|md|lg|xl|2xl|min-\[|max-\[):(?:block|flex|grid|inline|table|contents)/;
        }, 1497(t2, e2, r2) {
          Object.defineProperty(e2, "__esModule", { value: true }), e2.formatTimestamp = o, e2.buildTranscript = function(t3, e3, r3 = []) {
            const i = [...r3].sort(((t4, e4) => t4.start - e4.start));
            let s = 0;
            const a = [], l = [];
            for (const t4 of e3) {
              for (; s < i.length && i[s].start <= t4.start; ) {
                const t5 = i[s].title;
                a.push(`<h3>${(0, n2.escapeHtml)(t5)}</h3>`), l.length > 0 && l.push(""), l.push(`### ${t5}`), l.push(""), s++;
              }
              const e4 = o(t4.start), r4 = void 0 !== t4.speaker ? ` speaker-${t4.speaker}` : "", c = `<strong><span class="timestamp" data-timestamp="${t4.start}">${e4}</span></strong>`;
              a.push(`<p class="transcript-segment${r4}">${c} · ${(0, n2.escapeHtml)(t4.text)}</p>`), t4.speakerChange && l.length > 0 && l.push(""), l.push(`**${e4}** · ${t4.text}`);
            }
            return { html: `<div class="${t3} transcript">
<h2>Transcript</h2>
${a.join("\n")}
</div>`, text: l.join("\n") };
          };
          const n2 = r2(639);
          function o(t3) {
            const e3 = Math.floor(t3 / 3600), r3 = Math.floor(t3 % 3600 / 60), n3 = Math.floor(t3 % 60);
            return e3 > 0 ? `${e3}:${String(r3).padStart(2, "0")}:${String(n3).padStart(2, "0")}` : `${r3}:${String(n3).padStart(2, "0")}`;
          }
        } }, e = {};
        function r(n2) {
          var o = e[n2];
          if (void 0 !== o) return o.exports;
          var i = e[n2] = { exports: {} };
          return t[n2].call(i.exports, i, i.exports, r), i.exports;
        }
        var n = {};
        return (() => {
          var t2 = n;
          const e2 = r(5628);
          t2.default = e2.Defuddle;
        })(), n = n.default;
      })()));
    }
  });

  // src/genericCaptureContent.js
  var import_defuddle = __toESM(require_dist(), 1);

  // node_modules/.pnpm/dompurify@3.4.12/node_modules/dompurify/dist/purify.es.mjs
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e, n, i, u, a = [], f = true, o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) ;
        else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
      } catch (r2) {
        o = true, n = r2;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  var entries = Object.entries;
  var setPrototypeOf = Object.setPrototypeOf;
  var isFrozen = Object.isFrozen;
  var getPrototypeOf = Object.getPrototypeOf;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var freeze = Object.freeze;
  var seal = Object.seal;
  var create = Object.create;
  var _ref = typeof Reflect !== "undefined" && Reflect;
  var apply = _ref.apply;
  var construct = _ref.construct;
  if (!freeze) {
    freeze = function freeze2(x) {
      return x;
    };
  }
  if (!seal) {
    seal = function seal2(x) {
      return x;
    };
  }
  if (!apply) {
    apply = function apply2(func, thisArg) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      return func.apply(thisArg, args);
    };
  }
  if (!construct) {
    construct = function construct2(Func) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      return new Func(...args);
    };
  }
  var arrayForEach = unapply(Array.prototype.forEach);
  var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
  var arrayPop = unapply(Array.prototype.pop);
  var arrayPush = unapply(Array.prototype.push);
  var arraySplice = unapply(Array.prototype.splice);
  var arrayIsArray = Array.isArray;
  var stringToLowerCase = unapply(String.prototype.toLowerCase);
  var stringToString = unapply(String.prototype.toString);
  var stringMatch = unapply(String.prototype.match);
  var stringReplace = unapply(String.prototype.replace);
  var stringIndexOf = unapply(String.prototype.indexOf);
  var stringTrim = unapply(String.prototype.trim);
  var numberToString = unapply(Number.prototype.toString);
  var booleanToString = unapply(Boolean.prototype.toString);
  var bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
  var symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
  var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
  var objectToString = unapply(Object.prototype.toString);
  var regExpTest = unapply(RegExp.prototype.test);
  var typeErrorCreate = unconstruct(TypeError);
  function unapply(func) {
    return function(thisArg) {
      if (thisArg instanceof RegExp) {
        thisArg.lastIndex = 0;
      }
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }
      return apply(func, thisArg, args);
    };
  }
  function unconstruct(Func) {
    return function() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      return construct(Func, args);
    };
  }
  function addToSet(set, array) {
    let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
    if (setPrototypeOf) {
      setPrototypeOf(set, null);
    }
    if (!arrayIsArray(array)) {
      return set;
    }
    let l = array.length;
    while (l--) {
      let element = array[l];
      if (typeof element === "string") {
        const lcElement = transformCaseFunc(element);
        if (lcElement !== element) {
          if (!isFrozen(array)) {
            array[l] = lcElement;
          }
          element = lcElement;
        }
      }
      set[element] = true;
    }
    return set;
  }
  function cleanArray(array) {
    for (let index = 0; index < array.length; index++) {
      const isPropertyExist = objectHasOwnProperty(array, index);
      if (!isPropertyExist) {
        array[index] = null;
      }
    }
    return array;
  }
  function clone(object) {
    const newObject = create(null);
    for (const _ref2 of entries(object)) {
      var _ref3 = _slicedToArray(_ref2, 2);
      const property = _ref3[0];
      const value = _ref3[1];
      const isPropertyExist = objectHasOwnProperty(object, property);
      if (isPropertyExist) {
        if (arrayIsArray(value)) {
          newObject[property] = cleanArray(value);
        } else if (value && typeof value === "object" && value.constructor === Object) {
          newObject[property] = clone(value);
        } else {
          newObject[property] = value;
        }
      }
    }
    return newObject;
  }
  function stringifyValue(value) {
    switch (typeof value) {
      case "string": {
        return value;
      }
      case "number": {
        return numberToString(value);
      }
      case "boolean": {
        return booleanToString(value);
      }
      case "bigint": {
        return bigintToString ? bigintToString(value) : "0";
      }
      case "symbol": {
        return symbolToString ? symbolToString(value) : "Symbol()";
      }
      case "undefined": {
        return objectToString(value);
      }
      case "function":
      case "object": {
        if (value === null) {
          return objectToString(value);
        }
        const valueAsRecord = value;
        const valueToString = lookupGetter(valueAsRecord, "toString");
        if (typeof valueToString === "function") {
          const stringified = valueToString(valueAsRecord);
          return typeof stringified === "string" ? stringified : objectToString(stringified);
        }
        return objectToString(value);
      }
      default: {
        return objectToString(value);
      }
    }
  }
  function lookupGetter(object, prop) {
    while (object !== null) {
      const desc = getOwnPropertyDescriptor(object, prop);
      if (desc) {
        if (desc.get) {
          return unapply(desc.get);
        }
        if (typeof desc.value === "function") {
          return unapply(desc.value);
        }
      }
      object = getPrototypeOf(object);
    }
    function fallbackValue() {
      return null;
    }
    return fallbackValue;
  }
  function isRegex(value) {
    try {
      regExpTest(value, "");
      return true;
    } catch (_unused) {
      return false;
    }
  }
  var html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
  var svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
  var svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
  var svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
  var mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
  var mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
  var text = freeze(["#text"]);
  var html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "command", "commandfor", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]);
  var svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dominant-baseline", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-orientation", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
  var mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
  var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
  var MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
  var ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
  var TMPLIT_EXPR = seal(/\${[\w\W]*/g);
  var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
  var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
  var IS_ALLOWED_URI = seal(
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    // eslint-disable-line no-useless-escape
  );
  var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
  var ATTR_WHITESPACE = seal(
    /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
    // eslint-disable-line no-control-regex
  );
  var DOCTYPE_NAME = seal(/^html$/i);
  var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
  var ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
  var COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
  var FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
  var SELF_CLOSING_TAG = seal(/\/>/i);
  var NODE_TYPE = {
    element: 1,
    attribute: 2,
    text: 3,
    cdataSection: 4,
    entityReference: 5,
    // Deprecated
    entityNode: 6,
    // Deprecated
    processingInstruction: 7,
    comment: 8,
    document: 9,
    documentType: 10,
    documentFragment: 11,
    notation: 12
    // Deprecated
  };
  var getGlobal = function getGlobal2() {
    return typeof window === "undefined" ? null : window;
  };
  var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
    if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
      return null;
    }
    let suffix = null;
    const ATTR_NAME = "data-tt-policy-suffix";
    if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
      suffix = purifyHostElement.getAttribute(ATTR_NAME);
    }
    const policyName = "dompurify" + (suffix ? "#" + suffix : "");
    try {
      return trustedTypes.createPolicy(policyName, {
        createHTML(html2) {
          return html2;
        },
        createScriptURL(scriptUrl) {
          return scriptUrl;
        }
      });
    } catch (_) {
      console.warn("TrustedTypes policy " + policyName + " could not be created.");
      return null;
    }
  };
  var _createHooksMap = function _createHooksMap2() {
    return {
      afterSanitizeAttributes: [],
      afterSanitizeElements: [],
      afterSanitizeShadowDOM: [],
      beforeSanitizeAttributes: [],
      beforeSanitizeElements: [],
      beforeSanitizeShadowDOM: [],
      uponSanitizeAttribute: [],
      uponSanitizeElement: [],
      uponSanitizeShadowNode: []
    };
  };
  var _resolveSetOption = function _resolveSetOption2(cfg, key, fallback, options) {
    return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
  };
  function createDOMPurify() {
    let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
    const DOMPurify = (root) => createDOMPurify(root);
    DOMPurify.version = "3.4.12";
    DOMPurify.removed = [];
    if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
      DOMPurify.isSupported = false;
      return DOMPurify;
    }
    let document2 = window2.document;
    const originalDocument = document2;
    const currentScript = originalDocument.currentScript;
    window2.DocumentFragment;
    const HTMLTemplateElement = window2.HTMLTemplateElement, Node = window2.Node, Element = window2.Element, NodeFilter = window2.NodeFilter, _window$NamedNodeMap = window2.NamedNodeMap;
    _window$NamedNodeMap === void 0 ? window2.NamedNodeMap || window2.MozNamedAttrMap : _window$NamedNodeMap;
    window2.HTMLFormElement;
    const DOMParser2 = window2.DOMParser, trustedTypes = window2.trustedTypes;
    const ElementPrototype = Element.prototype;
    const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
    const remove = lookupGetter(ElementPrototype, "remove");
    const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
    const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
    const getParentNode = lookupGetter(ElementPrototype, "parentNode");
    const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
    const getAttributes = lookupGetter(ElementPrototype, "attributes");
    const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
    const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
    if (typeof HTMLTemplateElement === "function") {
      const template = document2.createElement("template");
      if (template.content && template.content.ownerDocument) {
        document2 = template.content.ownerDocument;
      }
    }
    let trustedTypesPolicy;
    let emptyHTML = "";
    let defaultTrustedTypesPolicy;
    let defaultTrustedTypesPolicyResolved = false;
    let IN_TRUSTED_TYPES_POLICY = 0;
    const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy2() {
      if (IN_TRUSTED_TYPES_POLICY > 0) {
        throw typeErrorCreate('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.');
      }
    };
    const _createTrustedHTML = function _createTrustedHTML2(html2) {
      _assertNotInTrustedTypesPolicy();
      IN_TRUSTED_TYPES_POLICY++;
      try {
        return trustedTypesPolicy.createHTML(html2);
      } finally {
        IN_TRUSTED_TYPES_POLICY--;
      }
    };
    const _createTrustedScriptURL = function _createTrustedScriptURL2(scriptUrl) {
      _assertNotInTrustedTypesPolicy();
      IN_TRUSTED_TYPES_POLICY++;
      try {
        return trustedTypesPolicy.createScriptURL(scriptUrl);
      } finally {
        IN_TRUSTED_TYPES_POLICY--;
      }
    };
    const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy2() {
      if (!defaultTrustedTypesPolicyResolved) {
        defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
        defaultTrustedTypesPolicyResolved = true;
      }
      return defaultTrustedTypesPolicy;
    };
    const _document = document2, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
    const importNode = originalDocument.importNode;
    let hooks = _createHooksMap();
    DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
    const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
    let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
    let ALLOWED_TAGS = null;
    const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
    let ALLOWED_ATTR = null;
    const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
    let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
      tagNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      attributeNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      allowCustomizedBuiltInElements: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: false
      }
    }));
    let FORBID_TAGS = null;
    let FORBID_ATTR = null;
    const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
      tagCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      attributeCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      }
    }));
    let ALLOW_ARIA_ATTR = true;
    let ALLOW_DATA_ATTR = true;
    let ALLOW_UNKNOWN_PROTOCOLS = false;
    let ALLOW_SELF_CLOSE_IN_ATTR = true;
    let SAFE_FOR_TEMPLATES = false;
    let SAFE_FOR_XML = true;
    let WHOLE_DOCUMENT = false;
    let SET_CONFIG = false;
    let SET_CONFIG_ALLOWED_TAGS = null;
    let SET_CONFIG_ALLOWED_ATTR = null;
    let FORCE_BODY = false;
    let RETURN_DOM = false;
    let RETURN_DOM_FRAGMENT = false;
    let RETURN_TRUSTED_TYPE = false;
    let SANITIZE_DOM = true;
    let SANITIZE_NAMED_PROPS = false;
    const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
    let KEEP_CONTENT = true;
    let IN_PLACE = false;
    let USE_PROFILES = {};
    let FORBID_CONTENTS = null;
    const DEFAULT_FORBID_CONTENTS = addToSet({}, [
      "annotation-xml",
      "audio",
      "colgroup",
      "desc",
      "foreignobject",
      "head",
      "iframe",
      "math",
      "mi",
      "mn",
      "mo",
      "ms",
      "mtext",
      "noembed",
      "noframes",
      "noscript",
      "plaintext",
      "script",
      // <selectedcontent> mirrors the selected <option>'s subtree, cloned by
      // the UA (customizable <select>) — including any on* handlers — and the
      // engine re-mirrors synchronously whenever a removal changes which
      // option/selectedcontent is current, even inside DOMPurify's inert
      // DOMParser document. Hoisting its children on removal re-inserts a fresh
      // mirror target ahead of the walk, which the engine refills, looping
      // forever (DoS) and amplifying output. Dropping its content on removal
      // (rather than hoisting) breaks that cascade; the content is a duplicate
      // of the option, which is sanitized on its own. See campaign-3 F1/F6.
      "selectedcontent",
      "style",
      "svg",
      "template",
      "thead",
      "title",
      "video",
      "xmp"
    ]);
    let DATA_URI_TAGS = null;
    const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
    let URI_SAFE_ATTRIBUTES = null;
    const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
    const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
    let NAMESPACE = HTML_NAMESPACE;
    let IS_EMPTY_INPUT = false;
    let ALLOWED_NAMESPACES = null;
    const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
    const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze(["mi", "mo", "mn", "ms", "mtext"]);
    let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
    const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
    let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
    const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
    let PARSER_MEDIA_TYPE = null;
    const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
    const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
    let transformCaseFunc = null;
    let CONFIG = null;
    const formElement = document2.createElement("form");
    const isRegexOrFunction = function isRegexOrFunction2(testValue) {
      return testValue instanceof RegExp || testValue instanceof Function;
    };
    const _parseConfig = function _parseConfig2() {
      let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (CONFIG && CONFIG === cfg) {
        return;
      }
      if (!cfg || typeof cfg !== "object") {
        cfg = {};
      }
      cfg = clone(cfg);
      PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
      SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
      transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
      ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, {
        transform: transformCaseFunc
      });
      ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, {
        transform: transformCaseFunc
      });
      ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, {
        transform: stringToString
      });
      URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
        transform: transformCaseFunc,
        base: DEFAULT_URI_SAFE_ATTRIBUTES
      });
      DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
        transform: transformCaseFunc,
        base: DEFAULT_DATA_URI_TAGS
      });
      FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, {
        transform: transformCaseFunc
      });
      FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone({}), {
        transform: transformCaseFunc
      });
      FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone({}), {
        transform: transformCaseFunc
      });
      USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
      ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
      ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
      ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
      ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
      SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
      SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
      WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
      RETURN_DOM = cfg.RETURN_DOM || false;
      RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
      RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
      FORCE_BODY = cfg.FORCE_BODY || false;
      SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
      SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
      KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
      IN_PLACE = cfg.IN_PLACE || false;
      IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
      NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
      MATHML_TEXT_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "MATHML_TEXT_INTEGRATION_POINTS") && cfg.MATHML_TEXT_INTEGRATION_POINTS && typeof cfg.MATHML_TEXT_INTEGRATION_POINTS === "object" ? clone(cfg.MATHML_TEXT_INTEGRATION_POINTS) : addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
      HTML_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "HTML_INTEGRATION_POINTS") && cfg.HTML_INTEGRATION_POINTS && typeof cfg.HTML_INTEGRATION_POINTS === "object" ? clone(cfg.HTML_INTEGRATION_POINTS) : addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
      const customElementHandling = objectHasOwnProperty(cfg, "CUSTOM_ELEMENT_HANDLING") && cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING === "object" ? clone(cfg.CUSTOM_ELEMENT_HANDLING) : create(null);
      CUSTOM_ELEMENT_HANDLING = create(null);
      if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) {
        CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
      }
      if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) {
        CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
      }
      if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") {
        CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
      }
      seal(CUSTOM_ELEMENT_HANDLING);
      if (SAFE_FOR_TEMPLATES) {
        ALLOW_DATA_ATTR = false;
      }
      if (RETURN_DOM_FRAGMENT) {
        RETURN_DOM = true;
      }
      if (USE_PROFILES) {
        ALLOWED_TAGS = addToSet({}, text);
        ALLOWED_ATTR = create(null);
        if (USE_PROFILES.html === true) {
          addToSet(ALLOWED_TAGS, html$1);
          addToSet(ALLOWED_ATTR, html);
        }
        if (USE_PROFILES.svg === true) {
          addToSet(ALLOWED_TAGS, svg$1);
          addToSet(ALLOWED_ATTR, svg);
          addToSet(ALLOWED_ATTR, xml);
        }
        if (USE_PROFILES.svgFilters === true) {
          addToSet(ALLOWED_TAGS, svgFilters);
          addToSet(ALLOWED_ATTR, svg);
          addToSet(ALLOWED_ATTR, xml);
        }
        if (USE_PROFILES.mathMl === true) {
          addToSet(ALLOWED_TAGS, mathMl$1);
          addToSet(ALLOWED_ATTR, mathMl);
          addToSet(ALLOWED_ATTR, xml);
        }
      }
      EXTRA_ELEMENT_HANDLING.tagCheck = null;
      EXTRA_ELEMENT_HANDLING.attributeCheck = null;
      if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
        if (typeof cfg.ADD_TAGS === "function") {
          EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
        } else if (arrayIsArray(cfg.ADD_TAGS)) {
          if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
            ALLOWED_TAGS = clone(ALLOWED_TAGS);
          }
          addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
        }
      }
      if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
        if (typeof cfg.ADD_ATTR === "function") {
          EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
        } else if (arrayIsArray(cfg.ADD_ATTR)) {
          if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
            ALLOWED_ATTR = clone(ALLOWED_ATTR);
          }
          addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
        }
      }
      if (objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") && arrayIsArray(cfg.ADD_URI_SAFE_ATTR)) {
        addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
      }
      if (objectHasOwnProperty(cfg, "FORBID_CONTENTS") && arrayIsArray(cfg.FORBID_CONTENTS)) {
        if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
          FORBID_CONTENTS = clone(FORBID_CONTENTS);
        }
        addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
      }
      if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
        if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
          FORBID_CONTENTS = clone(FORBID_CONTENTS);
        }
        addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
      }
      if (KEEP_CONTENT) {
        ALLOWED_TAGS["#text"] = true;
      }
      if (WHOLE_DOCUMENT) {
        addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
      }
      if (ALLOWED_TAGS.table) {
        addToSet(ALLOWED_TAGS, ["tbody"]);
        delete FORBID_TAGS.tbody;
      }
      if (cfg.TRUSTED_TYPES_POLICY) {
        if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
          throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        }
        if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
          throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        }
        const previousTrustedTypesPolicy = trustedTypesPolicy;
        trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
        try {
          emptyHTML = _createTrustedHTML("");
        } catch (error) {
          trustedTypesPolicy = previousTrustedTypesPolicy;
          throw error;
        }
      } else if (cfg.TRUSTED_TYPES_POLICY === null) {
        trustedTypesPolicy = void 0;
        emptyHTML = "";
      } else {
        if (trustedTypesPolicy === void 0) {
          trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
        }
        if (trustedTypesPolicy && typeof emptyHTML === "string") {
          emptyHTML = _createTrustedHTML("");
        }
      }
      if (freeze) {
        freeze(cfg);
      }
      CONFIG = cfg;
    };
    const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
    const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
    const _checkSvgNamespace = function _checkSvgNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "svg";
      }
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      return Boolean(ALL_SVG_TAGS[tagName]);
    };
    const _checkMathMlNamespace = function _checkMathMlNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "math";
      }
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      }
      return Boolean(ALL_MATHML_TAGS[tagName]);
    };
    const _checkHtmlNamespace = function _checkHtmlNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    };
    const _checkValidNamespace = function _checkValidNamespace2(element) {
      let parent = getParentNode(element);
      if (!parent || !parent.tagName) {
        parent = {
          namespaceURI: NAMESPACE,
          tagName: "template"
        };
      }
      const tagName = stringToLowerCase(element.tagName);
      const parentTagName = stringToLowerCase(parent.tagName);
      if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
        return false;
      }
      if (element.namespaceURI === SVG_NAMESPACE) {
        return _checkSvgNamespace(tagName, parent, parentTagName);
      }
      if (element.namespaceURI === MATHML_NAMESPACE) {
        return _checkMathMlNamespace(tagName, parent, parentTagName);
      }
      if (element.namespaceURI === HTML_NAMESPACE) {
        return _checkHtmlNamespace(tagName, parent, parentTagName);
      }
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
        return true;
      }
      return false;
    };
    const _forceRemove = function _forceRemove2(node) {
      arrayPush(DOMPurify.removed, {
        element: node
      });
      try {
        getParentNode(node).removeChild(node);
      } catch (_) {
        remove(node);
        if (!getParentNode(node)) {
          throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
        }
      }
    };
    const _neutralizeRoot = function _neutralizeRoot2(root) {
      _neutralizeSubtree(root);
      const childNodes = getChildNodes(root);
      if (childNodes) {
        const snapshot = [];
        arrayForEach(childNodes, (child) => {
          arrayPush(snapshot, child);
        });
        arrayForEach(snapshot, (child) => {
          try {
            remove(child);
          } catch (_) {
          }
        });
      }
      const attributes = getAttributes(root);
      if (attributes) {
        for (let i = attributes.length - 1; i >= 0; --i) {
          const attribute = attributes[i];
          const name = attribute && attribute.name;
          if (typeof name === "string") {
            try {
              root.removeAttribute(name);
            } catch (_) {
            }
          }
        }
      }
    };
    const _removeAttribute = function _removeAttribute2(name, element) {
      try {
        arrayPush(DOMPurify.removed, {
          attribute: element.getAttributeNode(name),
          from: element
        });
      } catch (_) {
        arrayPush(DOMPurify.removed, {
          attribute: null,
          from: element
        });
      }
      element.removeAttribute(name);
      if (name === "is") {
        if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
          try {
            _forceRemove(element);
          } catch (_) {
          }
        } else {
          try {
            element.setAttribute(name, "");
          } catch (_) {
          }
        }
      }
    };
    const _stripDisallowedAttributes = function _stripDisallowedAttributes2(element) {
      const attributes = getAttributes(element);
      if (!attributes) {
        return;
      }
      for (let i = attributes.length - 1; i >= 0; --i) {
        const attribute = attributes[i];
        const name = attribute && attribute.name;
        if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) {
          continue;
        }
        try {
          element.removeAttribute(name);
        } catch (_) {
        }
      }
    };
    const _neutralizeSubtree = function _neutralizeSubtree2(root) {
      const stack = [root];
      while (stack.length > 0) {
        const node = stack.pop();
        const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
        if (nodeType === NODE_TYPE.element) {
          _stripDisallowedAttributes(node);
        }
        const childNodes = getChildNodes(node);
        if (childNodes) {
          for (let i = childNodes.length - 1; i >= 0; --i) {
            stack.push(childNodes[i]);
          }
        }
      }
    };
    const _neutralizePatchLinkage = function _neutralizePatchLinkage2(root) {
      if (!SAFE_FOR_XML) {
        return;
      }
      const stack = [root];
      while (stack.length > 0) {
        const node = stack.pop();
        const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
        if (nodeType === NODE_TYPE.processingInstruction || nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, node.data)) {
          try {
            remove(node);
          } catch (_) {
          }
          continue;
        }
        if (nodeType === NODE_TYPE.element) {
          const element = node;
          const lcTag = transformCaseFunc(getNodeName ? getNodeName(node) : node.nodeName);
          try {
            if (element.hasAttribute && element.hasAttribute("patchsrc")) {
              element.removeAttribute("patchsrc");
            }
            if (element.hasAttribute && element.hasAttribute("for") && lcTag !== "label" && lcTag !== "output") {
              element.removeAttribute("for");
            }
          } catch (_) {
          }
        }
        const childNodes = getChildNodes(node);
        if (childNodes) {
          for (let i = childNodes.length - 1; i >= 0; --i) {
            stack.push(childNodes[i]);
          }
        }
      }
    };
    const _initDocument = function _initDocument2(dirty) {
      let doc = null;
      let leadingWhitespace = null;
      if (FORCE_BODY) {
        dirty = "<remove></remove>" + dirty;
      } else {
        const matches = stringMatch(dirty, /^[\r\n\t ]+/);
        leadingWhitespace = matches && matches[0];
      }
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
        dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
      }
      const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
      if (NAMESPACE === HTML_NAMESPACE) {
        try {
          doc = new DOMParser2().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
        } catch (_) {
        }
      }
      if (!doc || !doc.documentElement) {
        doc = implementation.createDocument(NAMESPACE, "template", null);
        try {
          doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
        } catch (_) {
        }
      }
      const body = doc.body || doc.documentElement;
      if (dirty && leadingWhitespace) {
        body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
      }
      if (NAMESPACE === HTML_NAMESPACE) {
        return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
      }
      return WHOLE_DOCUMENT ? doc.documentElement : body;
    };
    const _createNodeIterator = function _createNodeIterator2(root) {
      return createNodeIterator.call(
        root.ownerDocument || root,
        root,
        // eslint-disable-next-line no-bitwise
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
        null
      );
    };
    const _stripTemplateExpressions = function _stripTemplateExpressions2(value) {
      value = stringReplace(value, MUSTACHE_EXPR$1, " ");
      value = stringReplace(value, ERB_EXPR$1, " ");
      value = stringReplace(value, TMPLIT_EXPR$1, " ");
      return value;
    };
    const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
      var _node$querySelectorAl;
      node.normalize();
      const walker = createNodeIterator.call(
        node.ownerDocument || node,
        node,
        // eslint-disable-next-line no-bitwise
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
        null
      );
      let currentNode = walker.nextNode();
      while (currentNode) {
        currentNode.data = _stripTemplateExpressions(currentNode.data);
        currentNode = walker.nextNode();
      }
      const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
      if (templates) {
        arrayForEach(templates, (tmpl) => {
          if (_isDocumentFragment(tmpl.content)) {
            _scrubTemplateExpressions2(tmpl.content);
          }
        });
      }
    };
    const _isClobbered = function _isClobbered2(element) {
      const realTagName = getNodeName ? getNodeName(element) : null;
      if (typeof realTagName !== "string") {
        return false;
      }
      if (transformCaseFunc(realTagName) !== "form") {
        return false;
      }
      return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || // Realm-safe NamedNodeMap detection: equality against the cached
      // prototype getter. Clobbered .attributes (e.g. <input name="attributes">)
      // makes the direct read diverge from the cached read; a clean form
      // (same-realm OR foreign-realm) has both reads pointing at the same
      // canonical NamedNodeMap.
      element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || // NodeType clobbering probe. Cached Node.prototype.nodeType getter
      // returns the integer 1 for any Element regardless of realm; direct
      // read on a clobbered form (e.g. <input name="nodeType">) returns
      // the named child element. Cheap addition — nodeType is read from
      // an internal slot, no serialization cost — and removes a residual
      // clobbering surface used by several mXSS / PI / comment branches
      // in _sanitizeElements that compare currentNode.nodeType directly.
      element.nodeType !== getNodeType(element) || // HTMLFormElement has [LegacyOverrideBuiltIns]: a descendant named
      // "childNodes" shadows the prototype getter. Direct reads of
      // form.childNodes from a clobbered form return the named child
      // instead of the real NodeList, so any walk that reads it directly
      // skips the form's real children. Compare the direct read to the
      // cached Node.prototype getter — when the form's named-property
      // getter intercepts the read, the two values differ and we flag
      // the form. This catches every clobbering child type (input,
      // select, etc.) regardless of whether the named child happens to
      // carry a numeric .length, which a typeof-based probe would miss
      // (e.g. HTMLSelectElement.length is a defined unsigned-long).
      element.childNodes !== getChildNodes(element);
    };
    const _isDocumentFragment = function _isDocumentFragment2(value) {
      if (!getNodeType || typeof value !== "object" || value === null) {
        return false;
      }
      try {
        return getNodeType(value) === NODE_TYPE.documentFragment;
      } catch (_) {
        return false;
      }
    };
    const _isNode = function _isNode2(value) {
      if (!getNodeType || typeof value !== "object" || value === null) {
        return false;
      }
      try {
        return typeof getNodeType(value) === "number";
      } catch (_) {
        return false;
      }
    };
    function _executeHooks(hooks2, currentNode, data) {
      if (hooks2.length === 0) {
        return;
      }
      arrayForEach(hooks2, (hook) => {
        hook.call(DOMPurify, currentNode, data, CONFIG);
      });
    }
    const _isUnsafeNode = function _isUnsafeNode2(currentNode, tagName) {
      if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) {
        return true;
      }
      if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === "style" && _isNode(currentNode.firstElementChild)) {
        return true;
      }
      if (currentNode.nodeType === NODE_TYPE.processingInstruction) {
        return true;
      }
      if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) {
        return true;
      }
      return false;
    };
    const _sanitizeDisallowedNode = function _sanitizeDisallowedNode2(currentNode, tagName) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode);
        const childNodes = getChildNodes(currentNode);
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const hoisted = IN_PLACE ? childNodes[i] : cloneNode(childNodes[i], true);
            parentNode.insertBefore(hoisted, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    };
    const _sanitizeElements = function _sanitizeElements2(currentNode, root) {
      _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
      if (currentNode !== root && getParentNode(currentNode) === null) {
        return true;
      }
      if (_isClobbered(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      const tagName = transformCaseFunc(getNodeName ? getNodeName(currentNode) : currentNode.nodeName);
      _executeHooks(hooks.uponSanitizeElement, currentNode, {
        tagName,
        allowedTags: ALLOWED_TAGS
      });
      if (currentNode !== root && getParentNode(currentNode) === null) {
        return true;
      }
      if (_isUnsafeNode(currentNode, tagName)) {
        _forceRemove(currentNode);
        return true;
      }
      if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
        const removed = _sanitizeDisallowedNode(currentNode, tagName);
        if (removed === false) {
          _executeHooks(hooks.afterSanitizeElements, currentNode, null);
        }
        return removed;
      }
      const nt = getNodeType ? getNodeType(currentNode) : currentNode.nodeType;
      if (nt === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
        _forceRemove(currentNode);
        return true;
      }
      if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
        const content = _stripTemplateExpressions(currentNode.textContent);
        if (currentNode.textContent !== content) {
          arrayPush(DOMPurify.removed, {
            element: currentNode.cloneNode()
          });
          currentNode.textContent = content;
        }
      }
      _executeHooks(hooks.afterSanitizeElements, currentNode, null);
      return false;
    };
    const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
      if (FORBID_ATTR[lcName]) {
        return false;
      }
      if (SAFE_FOR_XML && lcName === "patchsrc") {
        return false;
      }
      if (SAFE_FOR_XML && lcName === "for" && lcTag !== "label" && lcTag !== "output") {
        return false;
      }
      if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
        return false;
      }
      const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
      if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) ;
      else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) ;
      else if (!nameIsPermitted) {
        if (
          // First condition does a very basic check if a) it's basically a valid custom element tagname AND
          // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
          // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
          _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
          // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
          lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
        ) ;
        else {
          return false;
        }
      } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
      else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
      else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
      else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
      else if (value) {
        return false;
      } else ;
      return true;
    };
    const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]);
    const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
      return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
    };
    const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute2(lcTag, lcName, namespaceURI, value) {
      if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) {
        switch (trustedTypes.getAttributeType(lcTag, lcName)) {
          case "TrustedHTML": {
            return _createTrustedHTML(value);
          }
          case "TrustedScriptURL": {
            return _createTrustedScriptURL(value);
          }
        }
      }
      return value;
    };
    const _setAttributeValue = function _setAttributeValue2(currentNode, name, namespaceURI, value) {
      try {
        if (namespaceURI) {
          currentNode.setAttributeNS(namespaceURI, name, value);
        } else {
          currentNode.setAttribute(name, value);
        }
        if (_isClobbered(currentNode)) {
          _forceRemove(currentNode);
        } else {
          arrayPop(DOMPurify.removed);
        }
      } catch (_) {
        _removeAttribute(name, currentNode);
      }
    };
    const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
      _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
      const attributes = currentNode.attributes;
      if (!attributes || _isClobbered(currentNode)) {
        return;
      }
      const hookEvent = {
        attrName: "",
        attrValue: "",
        keepAttr: true,
        allowedAttributes: ALLOWED_ATTR,
        forceKeepAttr: void 0
      };
      let l = attributes.length;
      const lcTag = transformCaseFunc(currentNode.nodeName);
      while (l--) {
        const attr = attributes[l];
        const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
        const lcName = transformCaseFunc(name);
        const initValue = attrValue;
        let value = name === "value" ? initValue : stringTrim(initValue);
        hookEvent.attrName = lcName;
        hookEvent.attrValue = value;
        hookEvent.keepAttr = true;
        hookEvent.forceKeepAttr = void 0;
        _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
        value = hookEvent.attrValue;
        if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
          _removeAttribute(name, currentNode);
          value = SANITIZE_NAMED_PROPS_PREFIX + value;
        }
        if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (lcName === "attributename" && stringMatch(value, "href")) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (hookEvent.forceKeepAttr) {
          continue;
        }
        if (!hookEvent.keepAttr) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (SAFE_FOR_TEMPLATES) {
          value = _stripTemplateExpressions(value);
        }
        if (!_isValidAttribute(lcTag, lcName, value)) {
          _removeAttribute(name, currentNode);
          continue;
        }
        value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
        if (value !== initValue) {
          _setAttributeValue(currentNode, name, namespaceURI, value);
        }
      }
      _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
    };
    const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
      let shadowNode = null;
      const shadowIterator = _createNodeIterator(fragment);
      _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
      while (shadowNode = shadowIterator.nextNode()) {
        _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
        _sanitizeElements(shadowNode, fragment);
        _sanitizeAttributes(shadowNode);
        if (_isDocumentFragment(shadowNode.content)) {
          _sanitizeShadowDOM2(shadowNode.content);
        }
        const shadowNodeType = getNodeType ? getNodeType(shadowNode) : shadowNode.nodeType;
        if (shadowNodeType === NODE_TYPE.element) {
          const innerSr = getShadowRoot(shadowNode);
          if (_isDocumentFragment(innerSr)) {
            _sanitizeAttachedShadowRoots(innerSr);
            _sanitizeShadowDOM2(innerSr);
          }
        }
      }
      _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
    };
    const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots2(root) {
      const stack = [{
        node: root,
        shadow: null
      }];
      while (stack.length > 0) {
        const item = stack.pop();
        if (item.shadow) {
          _sanitizeShadowDOM2(item.shadow);
          continue;
        }
        const node = item.node;
        const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
        const isElement = nodeType === NODE_TYPE.element;
        const childNodes = getChildNodes(node);
        if (childNodes) {
          for (let i = childNodes.length - 1; i >= 0; --i) {
            stack.push({
              node: childNodes[i],
              shadow: null
            });
          }
        }
        if (isElement) {
          const rootName = getNodeName ? getNodeName(node) : null;
          if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
            const content = node.content;
            if (_isDocumentFragment(content)) {
              stack.push({
                node: content,
                shadow: null
              });
            }
          }
        }
        if (isElement) {
          const sr = getShadowRoot(node);
          if (_isDocumentFragment(sr)) {
            stack.push({
              node: null,
              shadow: sr
            }, {
              node: sr,
              shadow: null
            });
          }
        }
      }
    };
    DOMPurify.sanitize = function(dirty) {
      let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      let body = null;
      let importedNode = null;
      let currentNode = null;
      let returnNode = null;
      IS_EMPTY_INPUT = !dirty;
      if (IS_EMPTY_INPUT) {
        dirty = "<!-->";
      }
      if (typeof dirty !== "string" && !_isNode(dirty)) {
        dirty = stringifyValue(dirty);
        if (typeof dirty !== "string") {
          throw typeErrorCreate("dirty is not a string, aborting");
        }
      }
      if (!DOMPurify.isSupported) {
        return dirty;
      }
      if (SET_CONFIG) {
        ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
        ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
      } else {
        _parseConfig(cfg);
      }
      if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) {
        ALLOWED_TAGS = clone(ALLOWED_TAGS);
      }
      if (hooks.uponSanitizeAttribute.length > 0) {
        ALLOWED_ATTR = clone(ALLOWED_ATTR);
      }
      DOMPurify.removed = [];
      const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
      if (inPlace) {
        _neutralizePatchLinkage(dirty);
        const nn = getNodeName ? getNodeName(dirty) : dirty.nodeName;
        if (typeof nn === "string") {
          const tagName = transformCaseFunc(nn);
          if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
            _neutralizeRoot(dirty);
            throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
          }
        }
        if (_isClobbered(dirty)) {
          _neutralizeRoot(dirty);
          throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
        }
        try {
          _sanitizeAttachedShadowRoots(dirty);
        } catch (error) {
          _neutralizeRoot(dirty);
          throw error;
        }
      } else if (_isNode(dirty)) {
        body = _initDocument("<!---->");
        importedNode = body.ownerDocument.importNode(dirty, true);
        if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
          body = importedNode;
        } else if (importedNode.nodeName === "HTML") {
          body = importedNode;
        } else {
          body.appendChild(importedNode);
        }
        _sanitizeAttachedShadowRoots(importedNode);
      } else {
        if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
        dirty.indexOf("<") === -1) {
          return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
        }
        body = _initDocument(dirty);
        if (!body) {
          return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
        }
      }
      if (body && FORCE_BODY) {
        _forceRemove(body.firstChild);
      }
      const walkRoot = inPlace ? dirty : body;
      const nodeIterator = _createNodeIterator(walkRoot);
      try {
        while (currentNode = nodeIterator.nextNode()) {
          _sanitizeElements(currentNode, walkRoot);
          _sanitizeAttributes(currentNode);
          if (_isDocumentFragment(currentNode.content)) {
            _sanitizeShadowDOM2(currentNode.content);
          }
        }
      } catch (error) {
        if (inPlace) {
          _neutralizeRoot(dirty);
          arrayForEach(DOMPurify.removed, (entry) => {
            if (entry.element) {
              _neutralizeSubtree(entry.element);
            }
          });
        }
        throw error;
      }
      if (inPlace) {
        arrayForEach(DOMPurify.removed, (entry) => {
          if (entry.element) {
            _neutralizeSubtree(entry.element);
          }
        });
        if (SAFE_FOR_TEMPLATES) {
          _scrubTemplateExpressions2(dirty);
        }
        return dirty;
      }
      if (RETURN_DOM) {
        if (SAFE_FOR_TEMPLATES) {
          _scrubTemplateExpressions2(body);
        }
        if (RETURN_DOM_FRAGMENT) {
          returnNode = createDocumentFragment.call(body.ownerDocument);
          while (body.firstChild) {
            returnNode.appendChild(body.firstChild);
          }
        } else {
          returnNode = body;
        }
        if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
          returnNode = importNode.call(originalDocument, returnNode, true);
        }
        return returnNode;
      }
      let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
      if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
        serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
      }
      if (SAFE_FOR_TEMPLATES) {
        serializedHTML = _stripTemplateExpressions(serializedHTML);
      }
      return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
    };
    DOMPurify.setConfig = function() {
      let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      _parseConfig(cfg);
      SET_CONFIG = true;
      SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
      SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
    };
    DOMPurify.clearConfig = function() {
      CONFIG = null;
      SET_CONFIG = false;
      SET_CONFIG_ALLOWED_TAGS = null;
      SET_CONFIG_ALLOWED_ATTR = null;
      trustedTypesPolicy = defaultTrustedTypesPolicy;
      emptyHTML = "";
    };
    DOMPurify.isValidAttribute = function(tag, attr, value) {
      if (!CONFIG) {
        _parseConfig({});
      }
      const lcTag = transformCaseFunc(tag);
      const lcName = transformCaseFunc(attr);
      return _isValidAttribute(lcTag, lcName, value);
    };
    DOMPurify.addHook = function(entryPoint, hookFunction) {
      if (typeof hookFunction !== "function") {
        return;
      }
      if (!objectHasOwnProperty(hooks, entryPoint)) {
        return;
      }
      arrayPush(hooks[entryPoint], hookFunction);
    };
    DOMPurify.removeHook = function(entryPoint, hookFunction) {
      if (!objectHasOwnProperty(hooks, entryPoint)) {
        return void 0;
      }
      if (hookFunction !== void 0) {
        const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
        return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
      }
      return arrayPop(hooks[entryPoint]);
    };
    DOMPurify.removeHooks = function(entryPoint) {
      if (!objectHasOwnProperty(hooks, entryPoint)) {
        return;
      }
      hooks[entryPoint] = [];
    };
    DOMPurify.removeAllHooks = function() {
      hooks = _createHooksMap();
    };
    return DOMPurify;
  }
  var purify = createDOMPurify();

  // src/capture/captureDocument.js
  var CAPTURE_DOCUMENT_SCHEMA_VERSION = 1;
  var MAX_CAPTURE_TEXT_LENGTH = 24e3;
  var MAX_CAPTURE_HTML_LENGTH = 1e6;
  var MAX_CAPTURE_IMAGE_COUNT = 8;
  function normalizeCaptureText(value, maxLength = MAX_CAPTURE_TEXT_LENGTH) {
    const text2 = String(value || "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
    return text2.length > maxLength ? text2.slice(0, maxLength).trim() : text2;
  }
  function normalizeHttpUrl(value, baseUrl = "") {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, baseUrl || void 0);
      return /^https?:$/i.test(url.protocol) ? url.toString() : "";
    } catch {
      return "";
    }
  }
  function inferSiteName(sourceUrl, fallback = "") {
    if (fallback) return normalizeCaptureText(fallback, 240);
    try {
      return new URL(sourceUrl).hostname.replace(/^www\./i, "");
    } catch {
      return "";
    }
  }
  function hashCaptureContent(value) {
    const input = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }
  function uniqueStrings(values, normalizer, limit) {
    const result = [];
    for (const value of Array.isArray(values) ? values : []) {
      const normalized = normalizer(value);
      if (normalized && !result.includes(normalized)) result.push(normalized);
      if (result.length >= limit) break;
    }
    return result;
  }
  function normalizeCaptureDocument(input = {}) {
    const sourceUrl = normalizeHttpUrl(input?.source?.url || input?.url);
    const text2 = normalizeCaptureText(input?.content?.text || input?.text);
    const markdown = normalizeCaptureText(input?.content?.markdown || input?.markdown, MAX_CAPTURE_TEXT_LENGTH);
    const safeHtml = String(input?.content?.safeHtml || input?.safeHtml || "").trim().slice(0, MAX_CAPTURE_HTML_LENGTH);
    const title = normalizeCaptureText(input?.content?.title || input?.title, 500) || "网页收藏";
    const excerpt = normalizeCaptureText(input?.content?.excerpt || input?.excerpt || text2, 500);
    const captureKind = normalizeCaptureText(input?.captureKind, 120) || "webpage";
    const status = ["complete", "partial", "link-only", "blocked"].includes(input?.status) ? input.status : text2 ? "partial" : "link-only";
    const author = normalizeCaptureText(input?.content?.author || input?.author, 240);
    const siteName = inferSiteName(sourceUrl, input?.content?.siteName || input?.siteName);
    const tags = uniqueStrings(input?.content?.tags || input?.tags, (value) => normalizeCaptureText(value, 80), 12);
    const imageUrls = uniqueStrings(
      input?.assets?.imageUrls || input?.images,
      (value) => normalizeHttpUrl(value, sourceUrl),
      MAX_CAPTURE_IMAGE_COUNT
    );
    const coverUrl = normalizeHttpUrl(input?.assets?.coverUrl || input?.coverUrl, sourceUrl) || imageUrls[0] || "";
    return {
      schemaVersion: CAPTURE_DOCUMENT_SCHEMA_VERSION,
      engine: normalizeCaptureText(input?.engine, 80) || "legacy",
      status,
      captureKind,
      source: {
        url: sourceUrl,
        canonicalUrl: normalizeHttpUrl(input?.source?.canonicalUrl || input?.canonicalUrl, sourceUrl) || sourceUrl,
        title
      },
      content: {
        title,
        text: text2,
        markdown,
        safeHtml,
        excerpt,
        author,
        authorProfileUrl: normalizeHttpUrl(input?.content?.authorProfileUrl || input?.authorProfileUrl, sourceUrl),
        siteName,
        tags
      },
      assets: {
        coverUrl,
        imageUrls
      },
      diagnostics: {
        warnings: uniqueStrings(input?.diagnostics?.warnings, (value) => normalizeCaptureText(value, 160), 12),
        contentHash: hashCaptureContent(`${sourceUrl}
${title}
${text2}`)
      }
    };
  }

  // src/capture/captureQuality.js
  var BLOCKED_PATTERNS = [
    /captcha|verify you are human|security check|access denied/i,
    /请完成安全验证|请先登录|登录后查看|滑块验证|访问受限|人机验证/i
  ];
  function assessCaptureQuality(document2) {
    const text2 = normalizeCaptureText(document2?.content?.text || document2?.content?.markdown, 24e3);
    const title = normalizeCaptureText(document2?.content?.title, 500);
    const probe = `${title}
${text2}`.slice(0, 6e3);
    const warnings = [...Array.isArray(document2?.diagnostics?.warnings) ? document2.diagnostics.warnings : []];
    const isBlocked = BLOCKED_PATTERNS.some((pattern) => pattern.test(probe));
    if (isBlocked) {
      return { status: "blocked", accepted: false, warnings: [...warnings, "blocked-or-login-page"] };
    }
    if (text2.length >= 280) {
      return { status: "complete", accepted: true, warnings };
    }
    if (text2.length >= 80) {
      return { status: "partial", accepted: true, warnings: [...warnings, "short-content"] };
    }
    return { status: "link-only", accepted: false, warnings: [...warnings, "insufficient-readable-content"] };
  }
  function applyCaptureQuality(document2) {
    const quality = assessCaptureQuality(document2);
    return {
      ...document2,
      status: quality.status,
      diagnostics: {
        ...document2?.diagnostics || {},
        warnings: quality.warnings
      }
    };
  }

  // src/capture/genericCaptureProtocol.js
  var GENERIC_CAPTURE_MESSAGE_TYPE = "redbox:generic-capture";

  // src/genericCaptureContent.js
  var GENERIC_CAPTURE_LISTENER_KEY = "__redboxGenericCaptureListenerV1__";
  function getMeta(document2, selector) {
    return document2.querySelector(selector)?.getAttribute("content") || "";
  }
  function cloneCurrentDocument(document2) {
    const parser = new DOMParser();
    const clone2 = parser.parseFromString(document2.documentElement.outerHTML, "text/html");
    const sourceBase = document2.querySelector("base[href]")?.getAttribute("href") || document2.URL;
    if (!clone2.querySelector("base[href]") && sourceBase) {
      const base = clone2.createElement("base");
      base.setAttribute("href", sourceBase);
      clone2.head?.prepend(base);
    }
    return clone2;
  }
  function sanitizeArticleHtml(html2, sourceUrl) {
    if (!html2) return "";
    const purifier = typeof purify.sanitize === "function" ? purify : purify(globalThis.window);
    const sanitized = purifier.sanitize(html2, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["base", "form", "input", "button", "textarea", "iframe", "object", "embed", "canvas", "audio", "video"],
      FORBID_ATTR: ["style"]
    });
    const parsed = new DOMParser().parseFromString(sanitized || html2, "text/html");
    for (const node of parsed.querySelectorAll("script, style, noscript, iframe, object, embed, base, form, input, button, textarea, canvas, audio, video")) {
      node.remove();
    }
    for (const element of parsed.querySelectorAll("*")) {
      for (const attribute of [...element.attributes]) {
        const name = String(attribute.name || "").toLowerCase();
        if (name.startsWith("on") || name === "style") element.removeAttribute(attribute.name);
      }
    }
    for (const element of parsed.querySelectorAll("[href], [src]")) {
      for (const attribute of ["href", "src"]) {
        if (!element.hasAttribute(attribute)) continue;
        const resolved = normalizeHttpUrl(element.getAttribute(attribute), sourceUrl);
        if (resolved) element.setAttribute(attribute, resolved);
        else element.removeAttribute(attribute);
      }
    }
    for (const anchor of parsed.querySelectorAll("a[href]")) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }
    return (parsed.body?.innerHTML || parsed.documentElement?.outerHTML || "").trim();
  }
  function collectImageUrls(document2, sourceUrl, image) {
    const urls = [];
    const push = (value) => {
      const url = normalizeHttpUrl(value, sourceUrl);
      if (url && !urls.includes(url)) urls.push(url);
    };
    push(image);
    push(getMeta(document2, 'meta[property="og:image"]'));
    push(getMeta(document2, 'meta[name="twitter:image"]'));
    for (const node of document2.querySelectorAll("img[src], img[data-src], img[data-original]")) {
      push(node.getAttribute("src"));
      push(node.getAttribute("data-src"));
      push(node.getAttribute("data-original"));
      if (urls.length >= 8) break;
    }
    return urls.slice(0, 8);
  }
  function extractDefuddledCaptureDocument(document2 = globalThis.document, sourceUrlOverride = "") {
    const sourceUrl = normalizeHttpUrl(sourceUrlOverride || document2?.URL || globalThis.location?.href);
    if (!document2?.documentElement || !sourceUrl) {
      throw new Error("当前页面缺少可读取的网页地址");
    }
    const clonedDocument = cloneCurrentDocument(document2);
    const defuddled = new import_defuddle.default(clonedDocument, { url: sourceUrl }).parse();
    const safeHtml = sanitizeArticleHtml(defuddled.content || "", sourceUrl);
    const readableDocument = new DOMParser().parseFromString(safeHtml || defuddled.content || "", "text/html");
    const text2 = normalizeCaptureText(
      readableDocument.body?.textContent || readableDocument.documentElement?.textContent
    );
    const title = normalizeCaptureText(defuddled.title || document2.title || getMeta(document2, 'meta[property="og:title"]'), 500);
    const description = normalizeCaptureText(defuddled.description || getMeta(document2, 'meta[name="description"]'), 500);
    const imageUrls = collectImageUrls(document2, sourceUrl, defuddled.image);
    const capture = normalizeCaptureDocument({
      engine: "defuddle",
      captureKind: "link-article",
      source: {
        url: sourceUrl,
        canonicalUrl: document2.querySelector('link[rel="canonical"]')?.getAttribute("href") || sourceUrl
      },
      content: {
        title,
        text: text2,
        // The current Knowledge endpoint indexes content.text and retains safeHtml.
        // Avoid loading Defuddle's Markdown renderer (about 600 KiB) for a field
        // that no current consumer reads; the schema keeps it optional for a
        // future endpoint that explicitly accepts Markdown.
        markdown: "",
        safeHtml,
        excerpt: description || text2.slice(0, 180),
        author: defuddled.author || getMeta(document2, 'meta[name="author"]'),
        siteName: defuddled.site || getMeta(document2, 'meta[property="og:site_name"]'),
        tags: []
      },
      assets: { coverUrl: imageUrls[0], imageUrls },
      diagnostics: { warnings: safeHtml ? [] : ["defuddle-returned-no-html"] }
    });
    return applyCaptureQuality(capture);
  }
  function installGenericCaptureListener() {
    if (globalThis[GENERIC_CAPTURE_LISTENER_KEY]) return;
    globalThis[GENERIC_CAPTURE_LISTENER_KEY] = true;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== GENERIC_CAPTURE_MESSAGE_TYPE) return void 0;
      try {
        const capture = extractDefuddledCaptureDocument(document);
        sendResponse({ ok: true, capture });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return true;
    });
  }
  if (globalThis.chrome?.runtime?.onMessage) {
    installGenericCaptureListener();
  }
})();
