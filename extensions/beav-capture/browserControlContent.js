(() => {
  if (typeof location !== "undefined" && /(?:^|\.)(grok\.com|chatgpt\.com|claude\.ai)$/i.test(String(location.hostname || ""))) {
    return;
  }
  // src/siteAdapters.js
  (() => {
    const registry = [];
    function register(adapter) {
      registry.push(adapter);
    }
    function text2(selector, root = document) {
      return normalize2(root.querySelector(selector)?.innerText || root.querySelector(selector)?.textContent || "");
    }
    function attr(selector, name, root = document) {
      return root.querySelector(selector)?.getAttribute(name) || "";
    }
    function normalize2(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }
    function links(selector, root = document, limit = 100) {
      return [...root.querySelectorAll(selector)].map((node) => ({
        href: node.href || node.getAttribute("href") || "",
        text: normalize2(node.innerText || node.textContent || node.getAttribute("aria-label") || "")
      })).filter((item) => item.href).slice(0, limit);
    }
    register({
      id: "youtube",
      label: "YouTube",
      matches: ({ hostname }) => hostname.includes("youtube.com") || hostname === "youtu.be",
      suggestedFields: [
        { name: "title", type: "text", source: "adapter" },
        { name: "channel", type: "text", source: "adapter" },
        { name: "views", type: "text", source: "adapter" },
        { name: "publishedAt", type: "text", source: "adapter" },
        { name: "description", type: "text", source: "adapter" },
        { name: "videoUrl", type: "url", source: "adapter" }
      ],
      extract() {
        return {
          videoUrl: location.href,
          title: text2("h1 yt-formatted-string") || document.title.replace(/ - YouTube$/, ""),
          channel: text2("#owner #channel-name a, ytd-channel-name a"),
          views: text2("#info span:nth-child(1), ytd-watch-info-text span:nth-child(1)"),
          publishedAt: text2("#info span:nth-child(3), ytd-watch-info-text span:nth-child(3)"),
          description: text2("#description, ytd-text-inline-expander"),
          recommendations: links('a#video-title, a.yt-simple-endpoint[href*="/watch"]', document, 40)
        };
      }
    });
    register({
      id: "google-maps",
      label: "Google Maps",
      matches: ({ hostname }) => hostname.includes("google.") && location.pathname.includes("/maps"),
      suggestedFields: [
        { name: "name", type: "text", source: "adapter" },
        { name: "rating", type: "number", source: "adapter" },
        { name: "reviews", type: "text", source: "adapter" },
        { name: "address", type: "text", source: "adapter" },
        { name: "phone", type: "phone", source: "adapter" },
        { name: "website", type: "url", source: "adapter" }
      ],
      extract() {
        return {
          name: text2("h1"),
          rating: text2('[role="img"][aria-label*="stars"], [aria-label*="星"]'),
          reviews: text2('button[aria-label*="reviews"], button[aria-label*="条评价"]'),
          address: text2('[data-item-id="address"], button[data-item-id="address"]'),
          phone: text2('[data-item-id^="phone"], button[data-item-id^="phone"]'),
          website: attr('a[data-item-id="authority"]', "href"),
          places: links('a[href*="/maps/place/"]', document, 100)
        };
      }
    });
    register({
      id: "xiaohongshu",
      label: "Xiaohongshu",
      matches: ({ hostname }) => hostname.includes("xiaohongshu.com") || hostname.includes("rednote.com"),
      suggestedFields: [
        { name: "title", type: "text", source: "adapter" },
        { name: "author", type: "text", source: "adapter" },
        { name: "content", type: "text", source: "adapter" },
        { name: "likes", type: "number", source: "adapter" },
        { name: "noteUrl", type: "url", source: "adapter" }
      ],
      extract() {
        return {
          noteUrl: location.href,
          title: text2("#detail-title, .title, h1"),
          author: text2('.author, .username, [class*="author"]'),
          content: text2('#detail-desc, .desc, [class*="content"]'),
          likes: text2('[class*="like"], [aria-label*="like"]'),
          noteLinks: links('a[href*="/explore/"], a[href*="/discovery/item/"]', document, 100)
        };
      }
    });
    window.XWOW_SITE_ADAPTERS = {
      all: registry,
      match() {
        const url = new URL(location.href);
        return registry.find((adapter) => {
          try {
            return adapter.matches(url);
          } catch {
            return false;
          }
        }) || null;
      }
    };
  })();

  // src/content/contentRuntimeLifecycle.js
  var CONTENT_RUNTIME_KEY = "__redboxBrowserControlContentRuntimeV1";
  function installContentRuntimeLifecycle(options = {}) {
    const root = options.globalObject || globalThis;
    const key = String(options.key || CONTENT_RUNTIME_KEY);
    const previous = root[key];
    if (previous && typeof previous.dispose === "function") previous.dispose("superseded");
    const runtime = {
      key,
      revision: Number(previous?.revision || 0) + 1,
      disposed: false,
      disposeReason: "",
      disposeHandlers: /* @__PURE__ */ new Set(),
      onDispose(handler) {
        if (typeof handler !== "function") return () => {
        };
        if (runtime.disposed) {
          handler(runtime.disposeReason || "already_disposed");
          return () => {
          };
        }
        runtime.disposeHandlers.add(handler);
        return () => runtime.disposeHandlers.delete(handler);
      },
      dispose(reason = "manual") {
        if (runtime.disposed) return;
        runtime.disposed = true;
        runtime.disposeReason = String(reason || "manual");
        for (const handler of runtime.disposeHandlers) {
          try {
            handler(runtime.disposeReason);
          } catch {
          }
        }
        runtime.disposeHandlers.clear();
        if (root[key] === runtime) delete root[key];
      }
    };
    root[key] = runtime;
    return runtime;
  }

  // src/content/controlBadge.js
  var TARGET_OVERLAY_ROOT_ID = "codex-agent-overlay-root";
  var TARGET_OVERLAY_ROOT_DATASET = "codexAgentOverlayRoot";
  var CONTROL_BADGE_ID = "xwow-browser-data-ai-control-badge";
  var CONTROL_BADGE_STYLE_ID = "xwow-browser-data-ai-control-badge-style";
  function applyControlledTabBadge(options = {}) {
    const state = normalizeBadgeState(options);
    if (!state.visible) {
      clearControlledTabBadge();
      return { success: true, visible: false };
    }
    const root = ensureOverlayRoot();
    ensureControlBadgeStyle();
    let badge = document.getElementById(CONTROL_BADGE_ID);
    if (!badge) {
      badge = document.createElement("div");
      badge.id = CONTROL_BADGE_ID;
      badge.className = "codex-agent-control-badge";
      badge.setAttribute("aria-hidden", "true");
      root.appendChild(badge);
    } else if (badge.parentElement !== root) {
      root.appendChild(badge);
    }
    badge.dataset.visible = "true";
    badge.dataset.state = state.state;
    badge.dataset.origin = state.origin;
    badge.dataset.pageRole = state.pageRole;
    badge.textContent = state.label;
    if (state.title) badge.title = state.title;
    else badge.removeAttribute("title");
    return { success: true, visible: true, state: state.state };
  }
  function clearControlledTabBadge() {
    const badge = document.getElementById(CONTROL_BADGE_ID);
    if (badge) badge.remove();
    return { success: true, visible: false };
  }
  function normalizeBadgeState(options = {}) {
    const state = String(options.state || "active").trim() || "active";
    const origin = String(options.origin || "").trim();
    const pageRole = String(options.pageRole || "").trim();
    const sessionName = String(options.sessionName || options.name || "").trim();
    const baseLabel = String(options.label || "").trim() || "Easel 控制中";
    const label = sessionName ? `${baseLabel} · ${sessionName}` : baseLabel;
    return {
      visible: options.visible !== false && options.badge !== false && state === "active",
      state,
      origin,
      pageRole,
      label: label.slice(0, 40),
      title: sessionName ? `Easel capture: ${sessionName}` : "Easel capture"
    };
  }
  function ensureOverlayRoot() {
    let root = document.getElementById(TARGET_OVERLAY_ROOT_ID);
    if (!(root instanceof HTMLDivElement) || root.dataset[TARGET_OVERLAY_ROOT_DATASET] !== "true") {
      if (root?.parentNode) root.parentNode.removeChild(root);
      root = document.createElement("div");
      root.id = TARGET_OVERLAY_ROOT_ID;
      root.dataset[TARGET_OVERLAY_ROOT_DATASET] = "true";
      root.setAttribute("aria-hidden", "true");
      document.documentElement.appendChild(root);
    }
    return root;
  }
  function ensureControlBadgeStyle() {
    if (document.getElementById(CONTROL_BADGE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = CONTROL_BADGE_STYLE_ID;
    style.textContent = `
    #codex-agent-overlay-root {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      pointer-events: none;
    }
    @media print { #codex-agent-overlay-root { display: none; } }
    #xwow-browser-data-ai-control-badge {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 40;
      max-width: min(320px, calc(100vw - 24px));
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 9px;
      border-radius: 7px;
      border: 1px solid rgba(255, 255, 255, .72);
      background: rgba(7, 17, 20, .88);
      color: #f7fffb;
      box-shadow: 0 8px 24px rgba(0, 0, 0, .22), 0 0 0 1px rgba(78, 225, 193, .22);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 650;
      line-height: 16px;
      letter-spacing: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    #xwow-browser-data-ai-control-badge::before {
      content: "";
      width: 7px;
      height: 7px;
      flex: 0 0 auto;
      border-radius: 999px;
      background: #4ee1c1;
      box-shadow: 0 0 0 3px rgba(78, 225, 193, .18), 0 0 12px rgba(78, 225, 193, .72);
    }
  `;
    document.documentElement.appendChild(style);
  }

  // src/content/cursorOverlay.js
  var XWOW_CURSOR_ARRIVED = "xwow-data-ai:cursor-arrived";
  var TARGET_CURSOR_ARRIVED = "AGENT_CURSOR_ARRIVED";
  var CURSOR_ASSET_PATH = "images/cursor-chat.png";
  var TARGET_OVERLAY_ROOT_ID2 = "codex-agent-overlay-root";
  var TARGET_OVERLAY_ROOT_DATASET2 = "codexAgentOverlayRoot";
  var LEGACY_CURSOR_ID = "xwow-browser-data-ai-cursor";
  var CURSOR_STYLE_ID = "xwow-browser-data-ai-cursor-style";
  var TARGET_CURSOR_PATH_CONFIG = {
    arcFlow: 0.5783555327868779,
    arcSize: 0.2765523188064277,
    boundsMargin: 20,
    candidateCount: 20,
    clickAngleDegrees: -44,
    endpointHandle: 0.15,
    startHandle: 0.41960295031576633
  };
  var lastCursorState = null;
  var cursorRepairObserver = null;
  var cursorAnimationFrame = null;
  var renderedCursorPoint = null;
  function moveAgentCursor(options = {}) {
    const x = Number(options.x);
    const y = Number(options.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { success: false, error: "cursor requires finite x and y" };
    const cursor = ensureAgentCursor();
    const moveSequence = Number.isInteger(options.moveSequence) ? options.moveSequence : null;
    lastCursorState = {
      isVisible: true,
      x,
      y,
      label: String(options.label || "Beav").slice(0, 12),
      moveSequence,
      animateMovement: options.animateMovement !== false
    };
    applyCursorDomState(cursor, lastCursorState, {
      animate: lastCursorState.animateMovement !== false,
      onComplete: () => notifyCursorArrived(moveSequence, options)
    });
    return { success: true, x, y, moveSequence };
  }
  function applyAgentCursorState(state = {}) {
    if (state?.isVisible === false || state?.cursor?.visible === false) {
      return hideAgentCursor();
    }
    return moveAgentCursor({
      x: state.cursor?.x,
      y: state.cursor?.y,
      label: state.label || "Beav",
      moveSequence: state.cursor?.moveSequence,
      animateMovement: state.cursor?.animateMovement,
      sessionId: state.sessionId || "",
      turnId: state.turnId || ""
    });
  }
  function hideAgentCursor() {
    const cursor = document.getElementById("xwow-browser-data-ai-cursor");
    lastCursorState = { ...lastCursorState || {}, isVisible: false };
    cancelCursorMotion();
    if (cursor) cursor.dataset.visible = "false";
    return { success: true };
  }
  function ensureAgentCursor() {
    ensureCursorRepairObserver();
    ensureAgentCursorStyle();
    const root = ensureTargetOverlayRoot();
    let cursor = document.getElementById(LEGACY_CURSOR_ID);
    if (cursor) {
      if (cursor.parentElement !== root) root.appendChild(cursor);
      if (lastCursorState) applyCursorDomState(cursor, lastCursorState, { animate: false });
      return cursor;
    }
    cursor = document.createElement("div");
    cursor.id = LEGACY_CURSOR_ID;
    cursor.className = "codex-agent-overlay";
    cursor.setAttribute("aria-hidden", "true");
    cursor.dataset.visible = "false";
    cursor.innerHTML = `
    <div data-xwow-cursor-shell>
      <img data-browser-agent-cursor-asset data-xwow-cursor-asset alt="" draggable="false" />
      <div data-xwow-cursor-dot></div>
    </div>
  `;
    const asset = cursor.querySelector("[data-xwow-cursor-asset]");
    if (asset) {
      asset.src = resolveCursorAssetUrl();
      asset.addEventListener("error", () => {
        cursor.dataset.assetLoaded = "false";
      }, { once: true });
      asset.addEventListener("load", () => {
        cursor.dataset.assetLoaded = "true";
      }, { once: true });
    }
    root.appendChild(cursor);
    if (lastCursorState) applyCursorDomState(cursor, lastCursorState, { animate: false });
    return cursor;
  }
  function ensureTargetOverlayRoot() {
    let root = document.getElementById(TARGET_OVERLAY_ROOT_ID2);
    if (!(root instanceof HTMLDivElement) || root.dataset[TARGET_OVERLAY_ROOT_DATASET2] !== "true") {
      if (root?.parentNode) root.parentNode.removeChild(root);
      root = document.createElement("div");
      root.id = TARGET_OVERLAY_ROOT_ID2;
      root.dataset[TARGET_OVERLAY_ROOT_DATASET2] = "true";
      root.setAttribute("aria-hidden", "true");
      document.documentElement.appendChild(root);
    }
    return root;
  }
  function ensureAgentCursorStyle() {
    if (document.getElementById(CURSOR_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = CURSOR_STYLE_ID;
    style.textContent = `
    #codex-agent-overlay-root {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      pointer-events: none;
    }
    @media print { #codex-agent-overlay-root { display: none; } }
    #xwow-browser-data-ai-cursor {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 20;
      pointer-events: none;
      transform: translate(-100px, -100px);
      transition: opacity 120ms ease-out;
      opacity: 0;
      will-change: transform, opacity, filter;
      transform-origin: 12px 12px;
    }
    #xwow-browser-data-ai-cursor[data-visible="true"] { opacity: 1; }
    #xwow-browser-data-ai-cursor [data-xwow-cursor-shell] {
      position: relative;
      width: 24px;
      height: 24px;
      transform: translate(-12px, -12px);
    }
    #xwow-browser-data-ai-cursor [data-xwow-cursor-asset] {
      display: block;
      width: 23px;
      height: 24px;
      transform: translate(12px, -2.5px) rotate(44deg);
      transform-origin: 0 0;
      filter: drop-shadow(0 0 6px rgba(51, 156, 255, .9)) drop-shadow(0 0 15px rgba(51, 156, 255, .48));
      user-select: none;
      -webkit-user-drag: none;
    }
    #xwow-browser-data-ai-cursor [data-xwow-cursor-dot] {
      width: 14px;
      height: 14px;
      border: 2px solid #071714;
      border-radius: 50%;
      background: #4ee1c1;
      box-shadow: 0 2px 10px rgba(0, 0, 0, .28);
      transform: translate(-7px, -7px);
      opacity: 0;
      position: absolute;
      left: 12px;
      top: 12px;
    }
    #xwow-browser-data-ai-cursor[data-asset-loaded="false"] [data-xwow-cursor-dot] {
      opacity: 1;
    }
  `;
    document.documentElement.appendChild(style);
  }
  function applyCursorDomState(cursor, state, options = {}) {
    if (!state) return;
    cursor.dataset.visible = state.isVisible === false ? "false" : "true";
    if (Number.isInteger(state.moveSequence)) cursor.dataset.moveSequence = String(state.moveSequence);
    if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) return;
    const to = clampPointToViewport({ x: Number(state.x), y: Number(state.y) });
    const from = renderedCursorPoint || to;
    const shouldAnimate = options.animate !== false && state.animateMovement !== false && distance(from, to) >= 0.5 && state.isVisible !== false;
    if (!shouldAnimate) {
      cancelCursorMotion();
      renderCursorPoint(cursor, to);
      renderedCursorPoint = to;
      cursor.dataset.motion = "none";
      options.onComplete?.();
      return;
    }
    startCursorBezierSpringMotion(cursor, from, to, options.onComplete);
  }
  function startCursorBezierSpringMotion(cursor, from, to, onComplete) {
    cancelCursorMotion();
    const path = buildCursorBezierPath(from, to, viewportBounds());
    const duration = clamp(distance(from, to) * (path.durationScale || 1.15), 140, 620);
    const startedAt = now();
    cursor.dataset.motion = path.mode;
    cursor.dataset.motionSegments = String(path.segments?.length || 1);
    if (path.targetProfile) cursor.dataset.motionProfile = path.targetProfile;
    const tick = () => {
      const elapsed = now() - startedAt;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased = springProgress(progress);
      const sample = sampleBezierPath(path, eased);
      renderCursorPoint(cursor, sample.point, sample.tangent, progress);
      renderedCursorPoint = sample.point;
      if (progress >= 1) {
        cursorAnimationFrame = null;
        renderCursorPoint(cursor, to, sample.tangent, 1);
        renderedCursorPoint = to;
        cursor.dataset.motion = "arrived";
        onComplete?.();
        return;
      }
      cursorAnimationFrame = requestAnimationFrame(tick);
    };
    cursorAnimationFrame = requestAnimationFrame(tick);
  }
  function buildCursorBezierPath(from, to, bounds) {
    const config = TARGET_CURSOR_PATH_CONFIG;
    const length = Math.max(1, distance(from, to));
    const clickTangent = unitFromDegrees(config.clickAngleDegrees);
    const delta = { x: to.x - from.x, y: to.y - from.y };
    const travelTangent = normalize(delta);
    const startHandleDistance = clamp(length * config.startHandle, 48, Math.min(640, length * 0.9));
    const endHandleDistance = clamp(length * config.endpointHandle, 48, Math.min(640, length * 0.9));
    const startControl = boundedControlPoint(bounds, from, clickTangent, startHandleDistance, config.boundsMargin);
    const endControl = boundedControlPoint(bounds, to, { x: -clickTangent.x, y: -clickTangent.y }, endHandleDistance, config.boundsMargin);
    const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    const normal = chooseNaturalArcNormal(travelTangent, clickTangent);
    const arcDistanceBase = clamp(length * config.arcSize, 50, 520);
    const arcHandleDistanceBase = clamp(length * config.arcFlow, 38, 440);
    const candidates = [
      oneSegmentPath(from, to, startControl, endControl),
      oneSegmentPath(
        from,
        to,
        boundedControlPoint(bounds, from, clickTangent, startHandleDistance * 0.65, config.boundsMargin),
        boundedControlPoint(bounds, to, { x: -clickTangent.x, y: -clickTangent.y }, endHandleDistance * 0.65, config.boundsMargin)
      )
    ];
    for (const arcDistanceScale of [0.55, 0.8, 1.05]) {
      for (const arcHandleScale of [0.65, 1, 1.35]) {
        addArcCandidates({
          arcDistance: arcDistanceBase * arcDistanceScale,
          arcHandleDistance: arcHandleDistanceBase * arcHandleScale,
          bounds,
          clickTangent,
          candidates,
          end: to,
          endControl,
          midpoint,
          normal,
          start: from,
          startControl,
          travelTangent
        });
      }
    }
    const ranked = candidates.slice(0, config.candidateCount).map((candidate) => ({ candidate, metrics: cursorPathMetrics(candidate, bounds, config.boundsMargin) })).sort((a, b) => cursorPathScore(a.candidate, a.metrics) - cursorPathScore(b.candidate, b.metrics));
    const inBounds = ranked.find((entry) => entry.metrics.staysInBounds);
    const selected = (inBounds || ranked[0])?.candidate || candidates[0];
    return {
      ...selected,
      mode: selected.segments.length > 1 ? "target-bezier-arc-spring" : "target-bezier-spring",
      targetProfile: "hehggada-cursor-path-v1",
      durationScale: clamp(0.42 + cursorPathScore(selected, cursorPathMetrics(selected, bounds, config.boundsMargin)) / Math.max(1, length) * 0.08, 0.85, 1.45)
    };
  }
  function sampleBezierPath(path, progress) {
    const t = clamp(progress, 0, 1);
    const segments = path.segments || [{ control1: path.control1, control2: path.control2, end: path.to }];
    const scaled = t === 1 ? segments.length - 1 : t * segments.length;
    const index = Math.min(segments.length - 1, Math.floor(scaled));
    const segment = segments[index];
    const start = index === 0 ? path.from : segments[index - 1].end;
    const localT = t === 1 ? 1 : scaled - index;
    const point = cubicPoint(start, segment.control1, segment.control2, segment.end, localT);
    const tangent = cubicTangent(start, segment.control1, segment.control2, segment.end, localT);
    return { point, tangent };
  }
  function oneSegmentPath(from, to, control1, control2) {
    return {
      from,
      to,
      control1,
      control2,
      segments: [{ control1, control2, end: to }]
    };
  }
  function addArcCandidates(options) {
    buildArcCandidate(options, options.normal);
    buildArcCandidate(options, { x: -options.normal.x, y: -options.normal.y });
  }
  function buildArcCandidate({ arcDistance, arcHandleDistance, bounds, candidates, clickTangent, end, endControl, midpoint, normal, start, startControl, travelTangent }, arcNormal) {
    const arc = clampPointToBounds({
      x: midpoint.x + arcNormal.x * arcDistance + clickTangent.x * distance(start, startControl) * 0.16,
      y: midpoint.y + arcNormal.y * arcDistance + clickTangent.y * distance(start, startControl) * 0.16
    }, bounds);
    const arcIn = clampPointToBounds({
      x: arc.x - travelTangent.x * arcHandleDistance,
      y: arc.y - travelTangent.y * arcHandleDistance
    }, bounds);
    const arcOut = clampPointToBounds({
      x: arc.x + travelTangent.x * arcHandleDistance,
      y: arc.y + travelTangent.y * arcHandleDistance
    }, bounds);
    candidates.push({
      from: start,
      to: end,
      arc,
      control1: startControl,
      control2: endControl,
      segments: [
        { control1: startControl, control2: arcIn, end: arc },
        { control1: arcOut, control2: endControl, end }
      ]
    });
  }
  function cursorPathMetrics(path, bounds, margin) {
    const segments = path.segments || [{ control1: path.control1, control2: path.control2, end: path.to }];
    let length = 0;
    let angleEnergy = 0;
    let totalTurn = 0;
    let maxAngleChange = 0;
    let lastAngle = null;
    let previousPoint = path.from;
    let segmentStart = path.from;
    let staysInBounds = pointInBounds(path.from, bounds, margin);
    for (const segment of segments) {
      for (let step = 1; step <= 24; step += 1) {
        const point = cubicPoint(segmentStart, segment.control1, segment.control2, segment.end, step / 24);
        staysInBounds = staysInBounds && pointInBounds(point, bounds, margin);
        const vector = { x: point.x - previousPoint.x, y: point.y - previousPoint.y };
        length += distance(previousPoint, point);
        if (distance({ x: 0, y: 0 }, vector) > 0.01) {
          const angle = Math.atan2(vector.y, vector.x);
          if (lastAngle != null) {
            const change = shortestAngleDelta(lastAngle, angle);
            angleEnergy += change * change;
            totalTurn += Math.abs(change);
            maxAngleChange = Math.max(maxAngleChange, Math.abs(change));
          }
          lastAngle = angle;
        }
        previousPoint = point;
      }
      segmentStart = segment.end;
    }
    return { angleEnergy, length, maxAngleChange, staysInBounds, totalTurn };
  }
  function cursorPathScore(path, metrics) {
    const direct = Math.max(1, distance(path.from, path.to));
    const lengthPenalty = Math.max(0, metrics.length / direct - 1) * 320;
    const arcPenalty = path.arc ? 45 : 0;
    return metrics.length + lengthPenalty + metrics.angleEnergy * 140 + metrics.maxAngleChange * 180 + metrics.totalTurn * 18 + arcPenalty;
  }
  function chooseNaturalArcNormal(travelTangent, clickTangent) {
    const normal = { x: -travelTangent.y, y: travelTangent.x };
    const direction = normal.x * clickTangent.x + normal.y * clickTangent.y >= 0 ? 1 : -1;
    return { x: normal.x * direction, y: normal.y * direction };
  }
  function boundedControlPoint(bounds, point, tangent, distanceValue, margin = 0) {
    const safeBounds = {
      width: Math.max(1, bounds.width - margin),
      height: Math.max(1, bounds.height - margin)
    };
    const safePoint = {
      x: clamp(point.x, margin, safeBounds.width),
      y: clamp(point.y, margin, safeBounds.height)
    };
    let scaled = Math.max(0, distanceValue);
    if (tangent.x < 0) scaled = Math.min(scaled, (safePoint.x - margin) / -tangent.x);
    if (tangent.x > 0) scaled = Math.min(scaled, (safeBounds.width - safePoint.x) / tangent.x);
    if (tangent.y < 0) scaled = Math.min(scaled, (safePoint.y - margin) / -tangent.y);
    if (tangent.y > 0) scaled = Math.min(scaled, (safeBounds.height - safePoint.y) / tangent.y);
    return {
      x: safePoint.x + tangent.x * Math.max(0, scaled),
      y: safePoint.y + tangent.y * Math.max(0, scaled)
    };
  }
  function cubicPoint(a, b, c, d, t) {
    const inv = 1 - t;
    return {
      x: inv ** 3 * a.x + 3 * inv ** 2 * t * b.x + 3 * inv * t ** 2 * c.x + t ** 3 * d.x,
      y: inv ** 3 * a.y + 3 * inv ** 2 * t * b.y + 3 * inv * t ** 2 * c.y + t ** 3 * d.y
    };
  }
  function cubicTangent(a, b, c, d, t) {
    const inv = 1 - t;
    return {
      x: 3 * inv ** 2 * (b.x - a.x) + 6 * inv * t * (c.x - b.x) + 3 * t ** 2 * (d.x - c.x),
      y: 3 * inv ** 2 * (b.y - a.y) + 6 * inv * t * (c.y - b.y) + 3 * t ** 2 * (d.y - c.y)
    };
  }
  function renderCursorPoint(cursor, point, tangent = { x: 1, y: 0 }, progress = 1) {
    const angle = Number.isFinite(tangent.x) && Number.isFinite(tangent.y) ? Math.atan2(tangent.y, tangent.x) * 180 / Math.PI : 0;
    const stretch = 1 + Math.sin(clamp(progress, 0, 1) * Math.PI) * 0.08;
    cursor.style.transform = `translate(${Math.round(point.x)}px, ${Math.round(point.y)}px) rotate(${round(angle)}deg) scale(${round(stretch)}, ${round(1 / stretch)})`;
  }
  function cancelCursorMotion() {
    if (cursorAnimationFrame != null) {
      cancelAnimationFrame(cursorAnimationFrame);
      cursorAnimationFrame = null;
    }
  }
  function springProgress(progress) {
    const t = clamp(progress, 0, 1);
    const value = 1 - Math.exp(-6 * t) * Math.cos(8 * t);
    return clamp(value, 0, 1);
  }
  function viewportBounds() {
    return {
      width: Math.max(1, window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || 1),
      height: Math.max(1, window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 1)
    };
  }
  function clampPointToViewport(point) {
    return clampPointToBounds(point, viewportBounds());
  }
  function clampPointToBounds(point, bounds) {
    return {
      x: clamp(Number(point.x), 0, Math.max(0, bounds.width - 1)),
      y: clamp(Number(point.y), 0, Math.max(0, bounds.height - 1))
    };
  }
  function normalize(vector) {
    const len = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (!Number.isFinite(len) || len < 1e-3) return { x: 1, y: 0 };
    return { x: vector.x / len, y: vector.y / len };
  }
  function unitFromDegrees(degrees) {
    const radians = Number(degrees || 0) * Math.PI / 180;
    return { x: Math.sin(radians), y: -Math.cos(radians) };
  }
  function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function pointInBounds(point, bounds, margin = 0) {
    return point.x >= margin && point.x <= bounds.width - margin && point.y >= margin && point.y <= bounds.height - margin;
  }
  function shortestAngleDelta(from, to) {
    let delta = to - from;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function round(value) {
    return Math.round(value * 1e3) / 1e3;
  }
  function now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
  function resolveCursorAssetUrl() {
    try {
      return chrome.runtime.getURL(CURSOR_ASSET_PATH);
    } catch {
      return CURSOR_ASSET_PATH;
    }
  }
  function ensureCursorRepairObserver() {
    if (cursorRepairObserver) return;
    cursorRepairObserver = new MutationObserver(() => {
      if (lastCursorState?.isVisible === false) return;
      if (!document.documentElement) return;
      const root = document.getElementById(TARGET_OVERLAY_ROOT_ID2);
      const cursor = document.getElementById(LEGACY_CURSOR_ID);
      const style = document.getElementById(CURSOR_STYLE_ID);
      if (root && cursor && style) return;
      ensureAgentCursor();
    });
    cursorRepairObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
  function notifyCursorArrived(moveSequence, options = {}) {
    if (!Number.isInteger(moveSequence)) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chrome.runtime.sendMessage({
          type: XWOW_CURSOR_ARRIVED,
          moveSequence,
          frameUrl: location.href
        }).catch(() => {
        });
        if (options.sessionId && options.turnId) {
          chrome.runtime.sendMessage({
            type: TARGET_CURSOR_ARRIVED,
            moveSequence,
            sessionId: options.sessionId,
            turnId: options.turnId,
            frameUrl: location.href
          }).catch(() => {
          });
        }
      });
    });
  }

  // src/content/domUtils.js
  var documentIdentity = globalThis.crypto?.randomUUID?.() || `document-${Date.now()}-${Math.random()}`;
  function toAbsoluteUrl(value) {
    try {
      return new URL(value || "", location.href).href;
    } catch {
      return value || "";
    }
  }
  function absolutizeSrcset(srcset) {
    return srcset.split(",").map((part) => {
      const [url, ...rest] = part.trim().split(/\s+/);
      if (!url) return "";
      return [toAbsoluteUrl(url), ...rest].join(" ");
    }).filter(Boolean).join(", ");
  }
  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
  function unique(items) {
    return [...new Set(items)];
  }
  function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }
  function cssPath(element) {
    const parts = [];
    let node = element;
    while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.documentElement) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part += `#${cssEscape(node.id)}`;
        parts.unshift(part);
        break;
      }
      const classes = [...node.classList].slice(0, 2).map(cssEscape);
      if (classes.length) part += `.${classes.join(".")}`;
      const parent = node.parentElement;
      if (parent) {
        const sameTag = [...parent.children].filter((child) => child.tagName === node.tagName);
        if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function cssEscape(value) {
    if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  // src/content/domReader.js
  function readFrame(options) {
    const adapter = window.XWOW_SITE_ADAPTERS?.match?.() || null;
    const clone = document.documentElement.cloneNode(true);
    cleanNodeTree(clone);
    absolutizeUrls(clone);
    const cleanText = normalizeWhitespace(clone.innerText || document.body?.innerText || "");
    const primaryListCandidate = detectPrimaryListContainer();
    const cleanHtml = clone.outerHTML || "";
    return {
      schemaVersion: 1,
      url: location.href,
      title: document.title || "",
      language: document.documentElement.lang || "",
      websiteTextContent: buildTextContent(cleanText),
      websiteMarkdownContent: cleanHtml,
      extractedData: {
        emails: extractEmails(document.body?.innerText || ""),
        phones: extractPhones(document.body?.innerText || ""),
        images: extractImages(options),
        links: extractLinks(options),
        primaryListCandidate,
        primaryListCandidates: primaryListCandidate ? [primaryListCandidate] : [],
        meta: extractMeta(),
        adapter: adapter ? {
          id: adapter.id,
          label: adapter.label,
          suggestedFields: adapter.suggestedFields || [],
          data: safeAdapterExtract(adapter)
        } : null
      },
      metadata: {
        frameUrl: location.href,
        referrer: document.referrer || "",
        capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
        scroll: {
          x: window.scrollX,
          y: window.scrollY,
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        }
      }
    };
  }
  var snapshotCache = null;
  var snapshotSequence = 0;
  function readDomSnapshot(options = {}) {
    options.assertActive?.();
    const cursor = Math.max(0, Number(options.cursor || 0));
    const maxChars = Math.min(2e5, Math.max(1e3, Number(options.maxChars || 6e3)));
    if (cursor > 0 && (!options.snapshotId || snapshotCache?.id !== options.snapshotId)) {
      return { success: false, error: "stale_snapshot: inspect from cursor 0 again", documentId: documentIdentity };
    }
    if (cursor === 0) {
      const roots = options.selector ? [...document.querySelectorAll(options.selector)] : [document.documentElement];
      if (roots.length !== 1) return { success: false, error: `snapshot_scope_requires_one_element: found ${roots.length}` };
      const root = roots[0];
      const clone = root.cloneNode(true);
      const liveNodes = [root, ...root.querySelectorAll("*")];
      const cloneNodes = [clone, ...clone.querySelectorAll("*")];
      const keep = /* @__PURE__ */ new Set(["id", "class", "role", "name", "type", "href", "src", "alt", "title", "placeholder", "for", "data-testid", "aria-label", "aria-labelledby", "aria-expanded", "aria-checked", "aria-disabled", "aria-selected", "disabled", "checked", "selected", "multiple", "contenteditable"]);
      for (let index = 0; index < cloneNodes.length; index += 1) {
        const node = cloneNodes[index];
        const live = liveNodes[index];
        if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(node.tagName) || live.hasAttribute("data-xwow-ignore")) {
          if (node === clone) return { success: false, error: "snapshot_scope_not_observable" };
          node.remove();
          continue;
        }
        for (const attr of [...node.attributes]) if (!keep.has(attr.name)) node.removeAttribute(attr.name);
        if (live.type === "password" || live.type === "hidden") {
          node.removeAttribute("value");
          node.textContent = "";
        } else if (["INPUT", "TEXTAREA", "SELECT"].includes(live.tagName)) {
          node.setAttribute("value", live.value || "");
          if (live.checked) node.setAttribute("checked", "");
          else node.removeAttribute("checked");
        }
        if (["VIDEO", "AUDIO"].includes(live.tagName)) {
          node.setAttribute("data-current-time", String(live.currentTime || 0));
          node.setAttribute("data-duration", String(live.duration || 0));
          node.setAttribute("data-paused", String(live.paused));
        }
      }
      const content2 = clone.outerHTML || "";
      snapshotCache = { id: `${documentIdentity}:${++snapshotSequence}`, content: content2.slice(0, 2e6), sourceTruncated: content2.length > 2e6, url: location.href, title: document.title || "" };
    }
    const content = snapshotCache.content.slice(cursor, cursor + maxChars);
    const nextCursor = cursor + content.length;
    return {
      success: true,
      documentId: documentIdentity,
      snapshotId: snapshotCache.id,
      url: snapshotCache.url,
      title: snapshotCache.title,
      cursor,
      nextCursor: nextCursor < snapshotCache.content.length ? nextCursor : null,
      truncated: nextCursor < snapshotCache.content.length,
      sourceTruncated: snapshotCache.sourceTruncated,
      totalChars: snapshotCache.content.length,
      byteLength: new Blob([content]).size,
      dom_snapshot: content
    };
  }
  function extractImages(options) {
    const minWidth = Number(options.minImageWidth || 40);
    const minHeight = Number(options.minImageHeight || 40);
    return [...document.images].map((image) => ({
      src: image.currentSrc || image.src || "",
      alt: image.alt || "",
      title: image.title || "",
      width: image.naturalWidth || image.width || 0,
      height: image.naturalHeight || image.height || 0
    })).filter((image) => image.src && !image.src.startsWith("data:") && image.width >= minWidth && image.height >= minHeight).slice(0, 300);
  }
  function extractLinks(options) {
    const limit = Number(options.maxLinks || 500);
    return [...document.links].map((link) => ({
      href: link.href || "",
      text: normalizeWhitespace(link.innerText || link.textContent || ""),
      title: link.title || ""
    })).filter((link) => link.href && /^https?:\/\//i.test(link.href)).slice(0, limit);
  }
  function safeAdapterExtract(adapter) {
    try {
      return adapter.extract ? adapter.extract() : {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
  function buildTextContent(text2) {
    const lines = [
      `Website URL: ${location.href}`,
      `Website Title: ${document.title || ""}`,
      "",
      text2
    ];
    return lines.join("\n").trim();
  }
  function cleanNodeTree(root) {
    const removeSelectors = [
      "script",
      "style",
      "svg",
      "canvas",
      "noscript",
      "template",
      "iframe",
      "frame",
      "input",
      "textarea",
      "select",
      "[data-thunderbit-ignore]",
      "[data-xwow-ignore]",
      '[aria-hidden="true"]'
    ];
    for (const node of [...root.querySelectorAll(removeSelectors.join(","))]) {
      node.remove();
    }
    for (const node of [...root.querySelectorAll("*")]) {
      const style = window.getComputedStyle(findLiveNode(node) || node);
      if (style && (style.display === "none" || style.visibility === "hidden")) {
        node.remove();
        continue;
      }
      stripAttributes(node);
      if (!node.textContent?.trim() && !node.querySelector("img,a,table,li")) {
        node.remove();
      }
    }
  }
  function stripAttributes(node) {
    const keep = /* @__PURE__ */ new Set([
      "href",
      "src",
      "srcset",
      "alt",
      "title",
      "aria-label",
      "role",
      "data-url",
      "data-link",
      "data-testid"
    ]);
    for (const attr of [...node.attributes]) {
      if (!keep.has(attr.name)) node.removeAttribute(attr.name);
    }
  }
  function absolutizeUrls(root) {
    for (const node of root.querySelectorAll("[href]")) {
      node.setAttribute("href", toAbsoluteUrl(node.getAttribute("href")));
    }
    for (const node of root.querySelectorAll("[src]")) {
      const src = node.getAttribute("src") || "";
      if (src.startsWith("data:")) {
        node.removeAttribute("src");
      } else {
        node.setAttribute("src", toAbsoluteUrl(src));
      }
    }
    for (const node of root.querySelectorAll("[srcset]")) {
      node.setAttribute("srcset", absolutizeSrcset(node.getAttribute("srcset") || ""));
    }
  }
  function extractEmails(text2) {
    return unique((text2.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).slice(0, 100));
  }
  function extractPhones(text2) {
    const matches = text2.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
    return unique(matches.map((item) => item.trim()).filter((item) => /\d{7,}/.test(item.replace(/\D/g, ""))).slice(0, 100));
  }
  function extractMeta() {
    const out = {};
    for (const meta of document.querySelectorAll("meta[name],meta[property]")) {
      const key = meta.getAttribute("name") || meta.getAttribute("property");
      const content = meta.getAttribute("content");
      if (key && content && Object.keys(out).length < 80) out[key] = content;
    }
    return out;
  }
  function detectPrimaryListContainer() {
    const candidates = [];
    const elements = [...document.body.querySelectorAll('main,section,article,div,ul,ol,table,[role="list"],[role="feed"],[role="grid"]')];
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 240 || rect.height < 160) continue;
      const children = [...element.children].filter((child) => {
        const childRect = child.getBoundingClientRect();
        return childRect.width > 40 && childRect.height > 20;
      });
      if (children.length < 3) continue;
      const signatures = children.map(childSignature);
      const repeated = maxFrequency(signatures);
      const textLength = normalizeWhitespace(element.innerText || "").length;
      const linkCount = element.querySelectorAll("a[href]").length;
      const areaRatio = Math.min(1, rect.width * rect.height / Math.max(1, window.innerWidth * window.innerHeight));
      const repeatScore = repeated / Math.max(1, children.length);
      const itemScore = Math.min(1, children.length / 20);
      const textScore = Math.min(1, textLength / 3e3);
      const linkPenalty = linkCount > children.length * 5 ? 0.2 : 0;
      const score = repeatScore * 0.35 + itemScore * 0.25 + areaRatio * 0.2 + textScore * 0.2 - linkPenalty;
      candidates.push({
        selector: cssPath(element),
        tagName: element.tagName.toLowerCase(),
        itemCount: children.length,
        repeatedItemRatio: Number(repeatScore.toFixed(3)),
        score: Number(score.toFixed(3)),
        textSample: normalizeWhitespace(element.innerText || "").slice(0, 600)
      });
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  }
  function childSignature(element) {
    const classes = [...element.classList].slice(0, 2).join(".");
    return `${element.tagName}:${classes}:${element.children.length}`;
  }
  function maxFrequency(items) {
    const counts = /* @__PURE__ */ new Map();
    for (const item of items) counts.set(item, (counts.get(item) || 0) + 1);
    return Math.max(0, ...counts.values());
  }
  function findLiveNode(clonedNode) {
    if (!clonedNode || clonedNode === document.documentElement) return document.documentElement;
    return null;
  }

  // src/content/faviconBadge.js
  var XWOW_FAVICON_BADGE_MARK = "xwow-favicon-badge";
  var TARGET_FAVICON_BADGE_MARK = "codex-favicon-badge";
  var TARGET_FAVICON_BADGE_MARK_ATTR = "data-codex-favicon-badge";
  function applyTabFaviconBadge(options = {}) {
    const badge = options.badge || null;
    if (!badge) {
      clearTabFaviconBadge();
      return { success: true, restored: true };
    }
    if (!["active", "handoff", "deliverable", "unseen-handoff", "unseen-deliverable"].includes(badge)) {
      return { success: false, error: `unsupported favicon badge: ${badge}` };
    }
    const preservedHref = document.querySelector('link[data-xwow-favicon-badge="true"]')?.dataset.xwowOriginalFaviconHref || "";
    const faviconHref = String(preservedHref || options.faviconDataUrl || options.faviconUrl || "").trim();
    if (!faviconHref) return { success: false, error: "favicon badge requires faviconDataUrl" };
    clearTabFaviconBadge();
    const links = currentFaviconLinks();
    const targets = links.length ? links : [createFaviconLink()];
    for (const link of targets) {
      const originalHref = link.getAttribute("href");
      const createdByXwow = !links.length;
      link.href = buildBadgedFaviconDataUrl(badge, faviconHref);
      link.dataset.xwowFaviconBadge = "true";
      link.dataset.xwowFaviconBadgeCreated = createdByXwow ? "true" : "false";
      if (originalHref) link.dataset.xwowOriginalFaviconHref = originalHref;
    }
    return { success: true, badge };
  }
  function clearTabFaviconBadge() {
    for (const link of document.querySelectorAll('link[data-xwow-favicon-badge="true"]')) {
      const created = link.dataset.xwowFaviconBadgeCreated === "true";
      const originalHref = link.dataset.xwowOriginalFaviconHref || "";
      delete link.dataset.xwowFaviconBadge;
      delete link.dataset.xwowFaviconBadgeCreated;
      delete link.dataset.xwowOriginalFaviconHref;
      if (created) {
        link.remove();
      } else if (originalHref) {
        link.href = originalHref;
      } else {
        link.removeAttribute("href");
      }
    }
  }
  function currentFaviconLinks() {
    return [...document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]')].filter((link) => link.dataset.xwowFaviconBadge !== "true");
  }
  function createFaviconLink() {
    const link = document.createElement("link");
    link.rel = "icon";
    (document.head || document.documentElement).appendChild(link);
    return link;
  }
  function buildBadgedFaviconDataUrl(badge, faviconHref) {
    const normalizedBadge = normalizeBadgeKind(badge);
    const opacity = normalizedBadge === "active" ? ' opacity="0.34"' : "";
    const marker = `${TARGET_FAVICON_BADGE_MARK_ATTR}="${TARGET_FAVICON_BADGE_MARK}" data-${XWOW_FAVICON_BADGE_MARK}="true"`;
    const overlay = faviconBadgeSvgOverlay(badge);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${marker} width="32" height="32" viewBox="0 0 32 32"><image href="${escapeSvgAttribute(faviconHref)}" width="32" height="32"${opacity} />${overlay}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  function faviconBadgeSvgOverlay(badge) {
    const normalizedBadge = normalizeBadgeKind(badge);
    if (normalizedBadge === "active") {
      return '<path d="M3.045 4.453C2.758 3.603 3.603 2.758 4.453 3.045L14.183 6.334C15.164 6.666 15.087 8.08 14.072 8.39L10.299 9.543C9.939 9.653 9.653 9.939 9.543 10.299L8.39 14.072C8.08 15.087 6.666 15.164 6.334 14.183L3.045 4.453Z" fill="#071714" stroke="white" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke fill" transform="translate(-2 -2) scale(2.1)" />';
    }
    const fill = normalizedBadge === "deliverable" ? "#22c55e" : "#facc15";
    const base = `<circle cx="24" cy="24" r="7" fill="${fill}" stroke="white" stroke-width="1.5" />`;
    if (!String(badge || "").startsWith("unseen-")) return base;
    return `<circle cx="24" cy="24" r="10" fill="none" stroke="#38bdf8" stroke-width="2" /><circle cx="24" cy="24" r="7" fill="${fill}" stroke="white" stroke-width="1.5" /><circle cx="29" cy="17" r="3" fill="#38bdf8" stroke="white" stroke-width="1" />`;
  }
  function normalizeBadgeKind(badge) {
    if (badge === "unseen-deliverable") return "deliverable";
    if (badge === "unseen-handoff") return "handoff";
    return badge;
  }
  function escapeSvgAttribute(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  // src/content/pageAssetInventory.js
  function readPageAssets(options = {}) {
    const imageLimit = clampNumber(options.maxImages || options.limit || 300, 1, 1e3);
    const linkLimit = clampNumber(options.maxLinks || 500, 1, 2e3);
    const mediaLimit = clampNumber(options.maxMedia || 100, 1, 500);
    const resourceLimit = clampNumber(options.maxResources || 200, 1, 1e3);
    const images = extractImages(options).slice(0, imageLimit).map((image) => ({
      type: "image",
      url: image.src,
      alt: image.alt,
      title: image.title,
      width: image.width,
      height: image.height
    }));
    const links = extractLinks({ ...options, maxLinks: linkLimit }).map((link) => ({
      type: "link",
      url: link.href,
      text: link.text,
      title: link.title
    }));
    const videos = [...document.querySelectorAll("video,video source")].map((node) => mediaAssetFromNode(node, "video")).filter(Boolean).slice(0, mediaLimit);
    const audios = [...document.querySelectorAll("audio,audio source")].map((node) => mediaAssetFromNode(node, "audio")).filter(Boolean).slice(0, mediaLimit);
    const icons = [...document.querySelectorAll('link[rel~="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]')].map((link) => iconAssetFromLink(link)).filter((asset) => asset.url).slice(0, resourceLimit);
    const manifests = [...document.querySelectorAll('link[rel="manifest"]')].map((link) => resourceAssetFromUrl("manifest", link.getAttribute("href") || "", { rel: link.getAttribute("rel") || "" })).filter((asset) => asset.url).slice(0, resourceLimit);
    const stylesheets = [...document.querySelectorAll('link[rel~="stylesheet"]')].map((link) => resourceAssetFromUrl("stylesheet", link.getAttribute("href") || "", { media: link.getAttribute("media") || "" })).filter((asset) => asset.url).slice(0, resourceLimit);
    const scripts = [...document.scripts].map((script) => resourceAssetFromUrl("script", script.getAttribute("src") || "", { async: script.async === true, defer: script.defer === true })).filter((asset) => asset.url).slice(0, resourceLimit);
    const inlineSvgs = [...document.querySelectorAll("svg")].map((node, index) => inlineSvgFromNode(node, index)).filter(Boolean).slice(0, resourceLimit);
    const byType = {
      images: uniqueAssets(images),
      links: uniqueAssets(links),
      videos: uniqueAssets(videos),
      audios: uniqueAssets(audios),
      icons: uniqueAssets(icons),
      manifests: uniqueAssets(manifests),
      stylesheets: uniqueAssets(stylesheets),
      scripts: uniqueAssets(scripts)
    };
    return {
      schemaVersion: 1,
      url: location.href,
      title: document.title || "",
      capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
      counts: Object.fromEntries(Object.entries(byType).map(([key, value]) => [key, value.length])),
      inlineSvgs,
      ...byType
    };
  }
  function mediaAssetFromNode(node, type) {
    const url = toAbsoluteUrl(node.currentSrc || node.src || node.getAttribute("src") || "");
    if (!url || url.startsWith("data:")) return null;
    return {
      type,
      url,
      mimeType: node.getAttribute("type") || "",
      title: node.getAttribute("title") || ""
    };
  }
  function iconAssetFromLink(link) {
    const href = link.dataset.xwowOriginalFaviconHref || link.getAttribute("href") || "";
    return resourceAssetFromUrl("icon", href, {
      rel: link.getAttribute("rel") || "",
      sizes: link.getAttribute("sizes") || "",
      mimeType: link.getAttribute("type") || ""
    });
  }
  function resourceAssetFromUrl(type, value, extra = {}) {
    const raw = String(value || "").trim();
    if (!raw || raw.startsWith("data:")) return { type, url: "", ...extra };
    return { type, url: toAbsoluteUrl(raw), ...extra };
  }
  function inlineSvgFromNode(node, index) {
    const markup = node.outerHTML || "";
    if (!markup) return null;
    const label = node.getAttribute("aria-label") || node.getAttribute("title") || node.id || `inline-svg-${index + 1}`;
    return {
      id: node.id || `inline-svg-${index + 1}`,
      name: label,
      markup
    };
  }
  function uniqueAssets(items = []) {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const item of items) {
      const key = `${item.type}:${item.url}`;
      if (!item.url || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  // src/content/pageActions.js
  var nodeIds = /* @__PURE__ */ new WeakMap();
  var nodesById = /* @__PURE__ */ new Map();
  var nextNodeId = 1;
  async function scrollPage(options) {
    assertDocument(options);
    const maxSteps = Number(options.maxSteps || 8);
    const delayMs = Number(options.delayMs || 450);
    const direction = String(options.direction || "down").toLowerCase();
    const explicitPixels = Number(options.pixels || 0);
    const scrollX = Number(options.scrollX ?? options.scroll_x ?? 0);
    const scrollY = Number(options.scrollY ?? options.scroll_y ?? 0);
    const scrollTarget = document.scrollingElement || document.documentElement;
    const before = pageScrollSnapshot(scrollTarget);
    if ("scrollX" in options || "scrollY" in options || "scroll_x" in options || "scroll_y" in options) {
      scrollTarget.scrollBy({ left: scrollX, top: scrollY, behavior: options.behavior || "auto" });
      await actionDelay(Number(options.delayMs || options.waitAfterScrollMs || 80), options);
      return {
        success: true,
        mode: "target-delta",
        scrollX,
        scrollY,
        before,
        after: pageScrollSnapshot(scrollTarget)
      };
    }
    let previousHeight = 0;
    let steps = 0;
    for (let i = 0; i < maxSteps; i += 1) {
      steps = i + 1;
      const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const top = direction === "up" ? Math.max(0, window.scrollY - (explicitPixels || Math.floor(window.innerHeight * 0.85))) : explicitPixels ? window.scrollY + explicitPixels : height;
      window.scrollTo({ top, behavior: "smooth" });
      for (const scroller of scrollableContainers()) {
        scroller.scrollTop = direction === "up" ? Math.max(0, scroller.scrollTop - (explicitPixels || Math.floor(scroller.clientHeight * 0.85))) : explicitPixels ? scroller.scrollTop + explicitPixels : scroller.scrollHeight;
      }
      await actionDelay(delayMs, options);
      const nextHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      if (nextHeight === previousHeight && window.scrollY + window.innerHeight >= nextHeight - 12) break;
      previousHeight = nextHeight;
    }
    return {
      success: true,
      mode: "legacy-auto",
      direction,
      pixels: explicitPixels,
      steps,
      before,
      after: pageScrollSnapshot(scrollTarget)
    };
  }
  async function clickNextButton(options) {
    const selectors = [
      options.selector,
      'a[rel="next"]',
      'button[aria-label*="Next"]',
      'a[aria-label*="Next"]',
      'button[aria-label*="下一"]',
      'a[aria-label*="下一"]',
      'button[class*="next"]',
      'a[class*="next"]'
    ].filter(Boolean);
    const bySelector = selectors.flatMap((selector) => [...document.querySelectorAll(selector)]).find(isClickable);
    const byText = bySelector || [...document.querySelectorAll('button,a,[role="button"]')].find((node) => {
      const label = normalizeWhitespace(node.innerText || node.textContent || node.getAttribute("aria-label") || "");
      return /^(next|more|load more|下一页|下页|更多|加载更多|继续)$/i.test(label) && isClickable(node);
    });
    if (!byText) return { success: false, error: "Next button not found" };
    byText.scrollIntoView({ block: "center", inline: "center" });
    await actionDelay(180, options);
    byText.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    byText.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    byText.click();
    return { success: true, selector: cssPath(byText), text: normalizeWhitespace(byText.innerText || byText.textContent || "") };
  }
  async function clickElement(options) {
    const target = findClickTarget(options);
    if (!target) return { success: false, error: "Clickable element not found" };
    const label = elementLabel(target);
    target.scrollIntoView({ block: "center", inline: "center" });
    await actionDelay(Number(options.beforeClickDelayMs || 160), options);
    const point = assertActionTarget(target, options);
    if (options.prepareOnly === true) {
      const rect = target.getBoundingClientRect();
      let x = point.x;
      let y = point.y;
      let frame = window;
      try {
        while (frame !== frame.top) {
          const owner = frame.frameElement;
          if (!owner) throw new Error("cross_origin_frame");
          const bounds = owner.getBoundingClientRect();
          if (frame.parent.getComputedStyle(owner).transform !== "none" || Math.abs(bounds.width - owner.offsetWidth) > 1 || Math.abs(bounds.height - owner.offsetHeight) > 1) throw new Error("transformed_frame");
          x += bounds.left + owner.clientLeft;
          y += bounds.top + owner.clientTop;
          frame = frame.parent;
          const hit = frame.document.elementFromPoint(x, y);
          if (hit !== owner) throw new Error("frame_obscured");
        }
      } catch {
        throw new Error("browser_input_frame_unavailable: use explicit inputMode=dom or select a supported frame");
      }
      return { success: true, documentId: documentIdentity, selector: cssPath(target), text: label, x, y };
    }
    dispatchElementClick(target, options);
    return {
      success: true,
      outcome: "events_dispatched",
      inputMode: "dom",
      selector: cssPath(target),
      locator: locatorReceipt(options, target),
      text: label,
      href: target.href || target.getAttribute("href") || "",
      button: normalizeMouseButtonName(options.button),
      modifiers: normalizeEventModifierNames(options),
      clickCount: normalizeClickCount(options)
    };
  }
  async function hoverElement(options) {
    const target = findHoverTarget(options);
    if (!target) return { success: false, error: "Hover element not found" };
    const label = elementLabel(target);
    target.scrollIntoView({ block: "center", inline: "center" });
    await actionDelay(Number(options.beforeHoverDelayMs || 120), options);
    assertActionTarget(target, options);
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    for (const type of ["pointerover", "mouseover", "pointerenter", "mouseenter", "pointermove", "mousemove"]) {
      const event = type.startsWith("pointer") ? new PointerEvent(type, { bubbles: !type.endsWith("enter"), cancelable: true, view: window, clientX: x, clientY: y, pointerType: "mouse" }) : new MouseEvent(type, { bubbles: !type.endsWith("enter"), cancelable: true, view: window, clientX: x, clientY: y });
      target.dispatchEvent(event);
    }
    if (options.focus === true && typeof target.focus === "function") target.focus();
    return {
      success: true,
      outcome: "events_dispatched",
      inputMode: "dom",
      selector: cssPath(target),
      locator: locatorReceipt(options, target),
      text: label,
      rect: {
        x,
        y,
        width: rect.width,
        height: rect.height
      }
    };
  }
  async function typeElement(options) {
    const target = await waitForInputTarget(options);
    if (!target) return { success: false, error: "Input element not found" };
    const label = elementLabel(target);
    const text2 = normalizeTypeValue(options);
    const previousValue = readElementTextValue(target);
    const replace = normalizeTypeReplace(options);
    const nextValue = replace ? text2 : `${previousValue}${text2}`;
    target.scrollIntoView({ block: "center", inline: "center" });
    await actionDelay(Number(options.beforeTypeDelayMs || 120), options);
    assertActionTarget(target, options);
    target.focus();
    if (replace) {
      setInputValue(target, "");
    }
    setInputValue(target, nextValue);
    target.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, inputType: replace ? "insertReplacementText" : "insertText", data: text2 }));
    target.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    return {
      success: target.isConnected && readElementTextValue(target) === nextValue,
      error: target.isConnected && readElementTextValue(target) === nextValue ? void 0 : "input_value_not_applied",
      selector: cssPath(target),
      locator: locatorReceipt(options, target),
      textLength: text2.length,
      label,
      value: readElementTextValue(target),
      requestedValue: nextValue,
      applied: target.isConnected && readElementTextValue(target) === nextValue,
      previousValue,
      replace
    };
  }
  async function selectElement(options) {
    const target = findSelectTarget(options);
    if (!target) return { success: false, error: "Select element not found" };
    const label = elementLabel(target);
    const selections = normalizeSelectSelections(options);
    const selectedOptions = selections.map((selection) => findSelectOption(target, selection)).filter(Boolean);
    if (!selectedOptions.length) return { success: false, error: "Select option not found", selector: cssPath(target), text: label };
    target.scrollIntoView({ block: "center", inline: "center" });
    await actionDelay(Number(options.beforeSelectDelayMs || 120), options);
    assertActionTarget(target, options);
    target.focus();
    if (target.multiple) {
      const selected = new Set(selectedOptions.map((option) => option.value));
      for (const option of target.options) option.selected = selected.has(option.value);
    } else {
      const option = selectedOptions[0];
      target.value = option.value;
      option.selected = true;
    }
    const selectedValues = [...target.selectedOptions].map((option) => option.value);
    target.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, inputType: "insertReplacementText", data: selectedValues.join(",") }));
    target.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    const applied = target.isConnected && selectedOptions.every((option) => option.selected);
    return {
      success: applied,
      error: applied ? void 0 : "selection_not_applied",
      selector: cssPath(target),
      locator: locatorReceipt(options, target),
      label,
      value: target.value,
      values: [...target.selectedOptions].map((option) => option.value),
      selectedIndex: target.selectedIndex,
      selectedText: [...target.selectedOptions].map((option) => normalizeWhitespace(option.textContent || option.label || "")).join(","),
      selections: selectedOptions.map((option) => ({
        value: option.value,
        label: normalizeWhitespace(option.textContent || option.label || ""),
        index: [...target.options].indexOf(option)
      }))
    };
  }
  async function checkElement(options = {}) {
    const target = findCheckTarget(options);
    if (!target) return { success: false, error: "Checkable element not found" };
    const label = elementLabel(target);
    if (!isCheckableInput(target)) {
      return { success: false, error: "Element is not checkbox or radio input", selector: cssPath(target), text: label };
    }
    const desired = normalizeCheckedValue(options);
    target.scrollIntoView({ block: "center", inline: "center" });
    await actionDelay(Number(options.beforeCheckDelayMs || 120), options);
    assertActionTarget(target, options);
    target.focus();
    if (target.checked !== desired) {
      setCheckedValue(target, desired);
      target.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, inputType: "insertReplacementText", data: String(desired) }));
      target.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    }
    return {
      success: target.isConnected && target.checked === desired,
      error: target.isConnected && target.checked === desired ? void 0 : "checked_state_not_applied",
      selector: cssPath(target),
      locator: locatorReceipt(options, target),
      label,
      checked: Boolean(target.checked),
      value: Boolean(target.checked),
      inputType: target.type || ""
    };
  }
  function isCheckedElement(options = {}) {
    const target = findCheckTarget(options);
    if (!target) return { success: false, error: "Checkable element not found" };
    if (!isCheckableInput(target)) {
      return { success: false, error: "Element is not checkbox or radio input", selector: cssPath(target), text: elementLabel(target) };
    }
    return {
      success: true,
      selector: cssPath(target),
      locator: locatorReceipt(options, target),
      label: elementLabel(target),
      checked: Boolean(target.checked),
      value: Boolean(target.checked),
      inputType: target.type || ""
    };
  }
  function isElementVisible(options = {}) {
    const target = findAnyTarget(options);
    if (!target) return { success: false, error: "Element not found" };
    return {
      success: true,
      selector: cssPath(target),
      locator: locatorReceipt(options, target),
      label: elementLabel(target),
      value: isVisibleElement(target),
      visible: isVisibleElement(target),
      element: elementDescriptor(target)
    };
  }
  function getElementValue(options = {}) {
    const target = findAnyTarget(options);
    if (!target) return { success: false, error: "Element not found" };
    const value = readElementValue(target);
    return {
      success: true,
      selector: cssPath(target),
      label: elementLabel(target),
      value,
      values: readElementValues(target),
      element: elementDescriptor(target)
    };
  }
  function getElementValues(options = {}) {
    const target = findAnyTarget(options);
    if (!target) return { success: false, error: "Element not found" };
    return {
      success: true,
      selector: cssPath(target),
      label: elementLabel(target),
      values: readElementValues(target),
      value: readElementValue(target),
      element: elementDescriptor(target)
    };
  }
  function getElementAttribute(options = {}) {
    const target = findAnyTarget(options);
    if (!target) return { success: false, error: "Element not found" };
    const name = String(options.name || options.attribute || "").trim();
    if (!name) return { success: false, error: "page.getAttribute requires name" };
    return {
      success: true,
      selector: cssPath(target),
      name,
      value: target.getAttribute(name),
      element: elementDescriptor(target)
    };
  }
  function queryElements(options = {}) {
    const relativeSelector = String(options.relativeSelector || options.relative_selector || "").trim();
    const baseNodes = collectLocatorTargets(options);
    if (!baseNodes.length) return { success: false, error: "Element not found" };
    const rawNodes = relativeSelector ? baseNodes.flatMap((base) => [...base.querySelectorAll(relativeSelector)]) : baseNodes;
    const limit = normalizeLocatorLimit(options.limit ?? options.maxResults);
    const nodes = rawNodes.slice(0, limit);
    const values = nodes.map((node) => node instanceof Element ? elementReadSnapshot(node) : null).filter(Boolean);
    return {
      success: true,
      selector: cssPath(baseNodes[0]),
      locator: locatorReceipt(options, baseNodes[0]),
      relativeSelector: relativeSelector || null,
      count: rawNodes.length,
      returnedCount: values.length,
      first: values[0] || null,
      elements: values,
      values,
      textContents: values.map((item) => item.text_content ?? ""),
      innerTexts: values.map((item) => item.inner_text ?? ""),
      allTextContents: values.map((item) => item.text_content ?? ""),
      allInnerTexts: values.map((item) => item.inner_text ?? ""),
      isEnabled: values[0]?.enabled ?? false,
      isVisible: values[0]?.visible ?? false,
      textContent: values[0]?.text_content ?? null,
      innerText: values[0]?.inner_text ?? null
    };
  }
  function detectBrowserAutomationBlocker(options = {}) {
    const maxTextLength = Math.max(500, Math.min(2e4, Number(options.maxTextLength || 8e3)));
    const text2 = normalizeWhitespace(document.body?.innerText || document.body?.textContent || "").slice(0, maxTextLength);
    const title = String(document.title || "").slice(0, 240);
    const selectorMatch = [
      'iframe[src*="captcha" i]',
      'iframe[src*="challenge" i]',
      '[class*="captcha" i]',
      '[id*="captcha" i]',
      '[class*="verify" i]',
      '[id*="verify" i]',
      "[data-sitekey]"
    ].some((selector) => {
      try {
        return Boolean(document.querySelector(selector));
      } catch {
        return false;
      }
    });
    const patterns = [
      ["captcha", /(captcha|hcaptcha|recaptcha)/i],
      ["security_verification", /(verify you are human|security check|unusual traffic|access denied|请完成验证|安全验证|滑块验证|行为验证|访问受限)/i],
      ["login_required", /(sign in to continue|log in to continue|请先登录|登录后继续)/i]
    ];
    const matched = patterns.find(([, pattern]) => pattern.test(`${title}
${text2}`));
    const reason = matched?.[0] || (selectorMatch ? "captcha" : "");
    return {
      success: true,
      blocked: Boolean(reason),
      reason: reason || null,
      evidence: {
        titleMatched: Boolean(matched && title),
        selectorMatched: selectorMatch,
        textScanned: Math.min(text2.length, maxTextLength)
      }
    };
  }
  function inspectPoint(options = {}) {
    const x = Number(options.x);
    const y = Number(options.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { success: false, error: "page.inspectPoint requires finite x and y" };
    }
    const includeNonInteractable = options.includeNonInteractable === true || options.include_non_interactable === true;
    const candidates = [...document.elementsFromPoint(x, y)].filter((node) => node instanceof Element).filter((node) => includeNonInteractable || isInteractableCandidate(node)).slice(0, Number(options.limit || 20)).map(elementDescriptor);
    return {
      success: true,
      x,
      y,
      includeNonInteractable,
      elements: candidates
    };
  }
  async function clickNode(options = {}) {
    const target = findNodeById(options);
    if (!target) return { success: false, error: "Node not found", nodeId: normalizeNodeId(options) };
    const label = elementLabel(target);
    target.scrollIntoView({ block: "center", inline: "center" });
    await actionDelay(Number(options.beforeClickDelayMs || 120), options);
    assertActionTarget(target, options);
    dispatchElementClick(target, options);
    return {
      success: true,
      nodeId: getNodeId(target),
      selector: cssPath(target),
      text: label,
      element: elementDescriptor(target)
    };
  }
  function scrollNode(options = {}) {
    const nodeId = normalizeNodeId(options);
    const target = nodeId ? findNodeById(options) : null;
    const scrollX = Number(options.scrollX ?? options.scroll_x ?? 0);
    const scrollY = Number(options.scrollY ?? options.scroll_y ?? 0);
    if (nodeId && !target) return { success: false, error: "Node not found", nodeId };
    const scrollTarget = target || document.scrollingElement || document.documentElement;
    if ("scrollX" in options || "scrollY" in options || "scroll_x" in options || "scroll_y" in options) {
      scrollTarget.scrollBy({ left: scrollX, top: scrollY, behavior: options.behavior || "auto" });
    } else if (target) {
      target.scrollIntoView({ block: options.block || "center", inline: options.inline || "center" });
    }
    return {
      success: true,
      nodeId: target ? getNodeId(target) : null,
      scrollX,
      scrollY,
      selector: target ? cssPath(target) : null,
      element: target ? elementDescriptor(target) : null
    };
  }
  async function waitForNode(options = {}) {
    const nodeId = normalizeNodeId(options);
    if (!nodeId) return { success: false, error: "page.waitForNode requires node_id" };
    const timeoutMs = Number(options.timeoutMs || options.timeout_ms || 8e3);
    const startedAt = Date.now();
    while (Date.now() - startedAt <= timeoutMs) {
      const target = findNodeById(options);
      if (target) {
        return {
          success: true,
          nodeId,
          elapsedMs: Date.now() - startedAt,
          element: elementDescriptor(target)
        };
      }
      await actionDelay(100, options);
    }
    return {
      success: false,
      error: "node_wait_timeout",
      nodeId,
      elapsedMs: Date.now() - startedAt
    };
  }
  async function waitForSelector(options = {}) {
    const selector = String(options.selector || "").trim();
    if (!selector) return { success: false, error: "page.waitForSelector requires selector" };
    const state = normalizeSelectorWaitState(options.state);
    const timeoutMs = Number(options.timeoutMs || options.timeout_ms || 8e3);
    const startedAt = Date.now();
    while (Date.now() - startedAt <= timeoutMs) {
      const node = document.querySelector(selector);
      const visible = node ? isVisibleElement(node) : false;
      if (state === "attached" && node || state === "detached" && !node || state === "visible" && visible || state === "hidden" && (!node || !visible)) {
        return {
          success: true,
          selector,
          state,
          elapsedMs: Date.now() - startedAt,
          element: node ? elementDescriptor(node) : null
        };
      }
      await actionDelay(100, options);
    }
    return {
      success: false,
      error: "selector_wait_timeout",
      selector,
      state,
      elapsedMs: Date.now() - startedAt
    };
  }
  async function waitForDomStable(options) {
    const timeoutMs = Number(options.timeoutMs || 8e3);
    const quietMs = Number(options.quietMs || 500);
    const startedAt = Date.now();
    let lastMutationAt = Date.now();
    let mutationCount = 0;
    const observer = new MutationObserver(() => {
      mutationCount += 1;
      lastMutationAt = Date.now();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true
    });
    try {
      while (Date.now() - startedAt < timeoutMs) {
        if (document.readyState === "complete" && Date.now() - lastMutationAt >= quietMs) {
          return {
            success: true,
            readyState: document.readyState,
            elapsedMs: Date.now() - startedAt,
            mutationCount,
            scrollHeight: document.documentElement.scrollHeight
          };
        }
        await actionDelay(100, options);
      }
      return {
        success: false,
        error: "dom_stable_timeout",
        readyState: document.readyState,
        elapsedMs: Date.now() - startedAt,
        mutationCount
      };
    } finally {
      observer.disconnect();
    }
  }
  function setInputValue(target, value) {
    if (target.isContentEditable) {
      target.textContent = value;
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), "value");
    if (descriptor?.set) {
      descriptor.set.call(target, value);
    } else {
      target.value = value;
    }
  }
  async function waitForInputTarget(options = {}) {
    const timeoutMs = Number(options.timeoutMs || options.timeout_ms || 0);
    if (!timeoutMs) return findInputTarget(options);
    const startedAt = Date.now();
    while (Date.now() - startedAt <= timeoutMs) {
      const target = findInputTarget(options);
      if (target) return target;
      await actionDelay(100, options);
    }
    return null;
  }
  function normalizeTypeValue(options = {}) {
    if (options.value != null) return String(options.value);
    return String(options.text || "");
  }
  function normalizeTypeReplace(options = {}) {
    if (typeof options.replace === "boolean") return options.replace;
    if (typeof options.clear === "boolean") return options.clear;
    return true;
  }
  function readElementTextValue(target) {
    if (target.isContentEditable) return target.textContent || "";
    return target.value ?? "";
  }
  function pageScrollSnapshot(target) {
    return {
      scrollLeft: Math.round(Number(target?.scrollLeft ?? window.scrollX ?? 0)),
      scrollTop: Math.round(Number(target?.scrollTop ?? window.scrollY ?? 0)),
      scrollWidth: Math.round(Number(target?.scrollWidth ?? document.documentElement.scrollWidth ?? 0)),
      scrollHeight: Math.round(Number(target?.scrollHeight ?? document.documentElement.scrollHeight ?? 0)),
      viewportWidth: Math.round(window.visualViewport?.width ?? window.innerWidth),
      viewportHeight: Math.round(window.visualViewport?.height ?? window.innerHeight)
    };
  }
  function setCheckedValue(target, value) {
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), "checked");
    if (descriptor?.set) {
      descriptor.set.call(target, value);
    } else {
      target.checked = value;
    }
  }
  function findClickTarget(options) {
    const locatorTarget = resolveLocatorActionTarget(options, isClickable);
    if (locatorTarget !== void 0) return locatorTarget;
    if (options.selector) {
      const bySelector = [...document.querySelectorAll(options.selector)].find(isClickable);
      if (bySelector) return bySelector;
    }
    const text2 = String(options.text || options.label || "").trim();
    const textRegex = options.textRegex ? new RegExp(options.textRegex, options.flags || "i") : null;
    if (!text2 && !textRegex) return null;
    return [...document.querySelectorAll('button,a,input,[role="button"],[tabindex]')].find((node) => {
      if (!isClickable(node)) return false;
      const label = normalizeWhitespace(
        node.innerText || node.textContent || node.value || node.getAttribute("aria-label") || node.getAttribute("title") || ""
      );
      if (text2 && label === text2) return true;
      if (textRegex && textRegex.test(label)) return true;
      return false;
    }) || null;
  }
  function findHoverTarget(options) {
    const locatorTarget = resolveLocatorActionTarget(options, isHoverable);
    if (locatorTarget !== void 0) return locatorTarget;
    if (options.selector) {
      const bySelector = [...document.querySelectorAll(options.selector)].find(isHoverable);
      if (bySelector) return bySelector;
    }
    const text2 = String(options.text || options.label || "").trim();
    const textRegex = options.textRegex ? new RegExp(options.textRegex, options.flags || "i") : null;
    if (!text2 && !textRegex) return null;
    return [...document.querySelectorAll('button,a,input,textarea,select,[role="button"],[tabindex],[aria-label],[title]')].find((node) => {
      if (!isHoverable(node)) return false;
      const label = elementLabel(node);
      if (text2 && label === text2) return true;
      if (textRegex && textRegex.test(label)) return true;
      return false;
    }) || null;
  }
  function findInputTarget(options) {
    const locatorTarget = resolveLocatorActionTarget({ ...options, text: void 0 }, (node) => isInputLike(node) && isClickable(node));
    if (locatorTarget !== void 0) return locatorTarget;
    if (options.selector) {
      const bySelector = [...document.querySelectorAll(options.selector)].find((node) => isInputLike(node) && isClickable(node));
      if (bySelector) return bySelector;
    }
    const text2 = String(options.label || options.textLabel || "").trim();
    if (!text2) return null;
    const labels = [...document.querySelectorAll("label")];
    const label = labels.find((node) => normalizeWhitespace(node.innerText || node.textContent || "") === text2);
    if (label?.htmlFor) {
      const target = document.getElementById(label.htmlFor);
      if (target && isInputLike(target) && isClickable(target)) return target;
    }
    return [...document.querySelectorAll('input,textarea,[contenteditable="true"]')].find((node) => {
      if (!isClickable(node)) return false;
      const candidate = elementLabel(node);
      return candidate === text2;
    }) || null;
  }
  function findSelectTarget(options) {
    const locatorTarget = resolveLocatorActionTarget(options, (node) => node.tagName?.toLowerCase() === "select" && isClickable(node));
    if (locatorTarget !== void 0) return locatorTarget;
    if (options.selector) {
      const bySelector = [...document.querySelectorAll(options.selector)].find((node) => node.tagName?.toLowerCase() === "select" && isClickable(node));
      if (bySelector) return bySelector;
    }
    const text2 = String(options.label || options.textLabel || "").trim();
    if (!text2) return null;
    const labels = [...document.querySelectorAll("label")];
    const label = labels.find((node) => normalizeWhitespace(node.innerText || node.textContent || "") === text2);
    if (label?.htmlFor) {
      const target = document.getElementById(label.htmlFor);
      if (target?.tagName?.toLowerCase() === "select" && isClickable(target)) return target;
    }
    return [...document.querySelectorAll("select")].find((node) => {
      if (!isClickable(node)) return false;
      return elementLabel(node) === text2;
    }) || null;
  }
  function findCheckTarget(options) {
    const locatorTarget = resolveLocatorActionTarget(options, (node) => isCheckableInput(node) && (options.force === true || isClickable(node)));
    if (locatorTarget !== void 0) return locatorTarget;
    if (options.selector) {
      const bySelector = [...document.querySelectorAll(options.selector)].find((node) => isCheckableInput(node) && (options.force === true || isClickable(node)));
      if (bySelector) return bySelector;
    }
    const text2 = String(options.label || options.textLabel || "").trim();
    if (!text2) return null;
    const labels = [...document.querySelectorAll("label")];
    const label = labels.find((node) => normalizeWhitespace(node.innerText || node.textContent || "") === text2);
    if (label?.htmlFor) {
      const target = document.getElementById(label.htmlFor);
      if (isCheckableInput(target) && (options.force === true || isClickable(target))) return target;
    }
    if (label) {
      const nested = label.querySelector('input[type="checkbox"],input[type="radio"]');
      if (isCheckableInput(nested) && (options.force === true || isClickable(nested))) return nested;
    }
    return [...document.querySelectorAll('input[type="checkbox"],input[type="radio"]')].find((node) => {
      if (options.force !== true && !isClickable(node)) return false;
      return elementLabel(node) === text2;
    }) || null;
  }
  function findAnyTarget(options) {
    const locatorTarget = resolveLocatorActionTarget(options, (node) => node instanceof Element);
    if (locatorTarget !== void 0) return locatorTarget;
    if (options.selector) {
      const node = document.querySelector(options.selector);
      if (node instanceof Element) return node;
    }
    const text2 = String(options.label || options.textLabel || options.text || "").trim();
    if (!text2) return null;
    const labels = [...document.querySelectorAll("label")];
    const label = labels.find((node) => normalizeWhitespace(node.innerText || node.textContent || "") === text2);
    if (label?.htmlFor) {
      const target = document.getElementById(label.htmlFor);
      if (target instanceof Element) return target;
    }
    return [...document.querySelectorAll("input,textarea,select,button,a,[role],[aria-label],[title],[data-testid]")].find((node) => elementLabel(node) === text2) || null;
  }
  function collectLocatorTargets(options = {}) {
    if (isObject(options.locatorAst)) {
      const nodes2 = resolveLocatorAst(options.locatorAst);
      return selectLocatorNodes(nodes2, options);
    }
    let nodes = [];
    if (options.selector) {
      nodes = [...document.querySelectorAll(String(options.selector))];
    } else {
      const text2 = String(options.label || options.textLabel || options.name || options.text || "").trim();
      const exact = options.exact !== false;
      const role = String(options.role || "").trim().toLowerCase();
      const candidates = [...document.querySelectorAll("input,textarea,select,button,a,[role],[aria-label],[title],[data-testid]")];
      nodes = candidates.filter((node) => {
        if (!(node instanceof Element)) return false;
        if (role) {
          const nodeRole = String(node.getAttribute("role") || implicitRole(node) || "").toLowerCase();
          if (nodeRole !== role) return false;
        }
        if (!text2) return true;
        const label = elementLabel(node);
        return exact ? label === text2 : label.toLowerCase().includes(text2.toLowerCase());
      });
    }
    if (options.visible === true) {
      nodes = nodes.filter(isElementActuallyVisible);
    } else if (options.visible === false) {
      nodes = nodes.filter((node) => !isElementActuallyVisible(node));
    }
    const nth = Number(options.nth ?? options.index);
    if (Number.isInteger(nth) && nth >= 0) return nodes[nth] ? [nodes[nth]] : [];
    if (options.first === true) return nodes[0] ? [nodes[0]] : [];
    if (options.last === true) return nodes.length ? [nodes[nodes.length - 1]] : [];
    if (options.all === true || options.multiple === true || options.mode === "all" || options.mode === "count") {
      return nodes;
    }
    return nodes[0] ? [nodes[0]] : [];
  }
  var LOCATOR_AST_MAX_DEPTH = 16;
  var LOCATOR_AST_MAX_NODES = 5e3;
  function resolveLocatorActionTarget(options = {}, predicate) {
    assertDocument(options);
    let ast = options.locatorAst;
    if (!isObject(ast)) {
      if (options.selector) ast = { kind: "css", selector: options.selector };
      else if (options.role) ast = { kind: "role", role: options.role, name: options.text || options.label, exact: true };
      else if (options.placeholder) ast = { kind: "placeholder", placeholder: options.placeholder, exact: true };
      else if (options.label || options.textLabel) ast = { kind: "label", text: options.label || options.textLabel, exact: true };
      else if (options.text) ast = { kind: "text", text: options.text, exact: true };
      else return void 0;
    }
    const nodes = resolveLocatorAst(ast).filter((node) => predicate(node));
    if (!nodes.length) return null;
    const selected = selectLocatorNodes(nodes, { ...options, all: false, multiple: false, mode: "" });
    return selected[0] || null;
  }
  function selectLocatorNodes(nodes, options = {}) {
    const bounded = uniqueElements(nodes).slice(0, LOCATOR_AST_MAX_NODES);
    const nth = Number(options.nth ?? options.index);
    if (Number.isInteger(nth) && nth >= 0) return bounded[nth] ? [bounded[nth]] : [];
    if (options.first === true) return bounded[0] ? [bounded[0]] : [];
    if (options.last === true) return bounded.length ? [bounded[bounded.length - 1]] : [];
    if (options.all === true || options.multiple === true || options.mode === "all" || options.mode === "count") return bounded;
    if (options.strict !== false && bounded.length !== 1) {
      const candidates = bounded.slice(0, 5).map((node) => ({ selector: cssPath(node), role: node.getAttribute("role") || implicitRole(node), text: elementLabel(node).slice(0, 120) }));
      throw new Error(`locator_strict_mode_violation: expected 1 element, found ${bounded.length}; candidates=${JSON.stringify(candidates)}`);
    }
    return bounded[0] ? [bounded[0]] : [];
  }
  function resolveLocatorAst(ast, root = document, depth = 0) {
    if (!isObject(ast)) throw new Error("locator_ast_invalid");
    if (depth > LOCATOR_AST_MAX_DEPTH) throw new Error("locator_ast_too_deep");
    const kind = String(ast.kind || "").trim();
    switch (kind) {
      case "css":
        return queryLocatorScope(root, String(ast.selector || ""));
      case "role":
        return queryLocatorScope(root, "*").filter((node) => matchesLocatorRole(node, ast));
      case "text":
        return preferSmallestTextMatches(queryLocatorScope(root, "*").filter((node) => matchesText(node, ast.text, ast.exact)));
      case "label":
        return resolveLabelLocator(root, ast);
      case "placeholder":
        return queryLocatorScope(root, 'input,textarea,[contenteditable="true"],[placeholder]').filter((node) => matchesTextValue(node.getAttribute("placeholder") || "", ast.placeholder, ast.exact));
      case "testId":
        return queryLocatorScope(root, "[data-testid],[data-test],[data-test-id]").filter((node) => [node.getAttribute("data-testid"), node.getAttribute("data-test"), node.getAttribute("data-test-id")].some((value) => String(value || "") === String(ast.testId || "")));
      case "within": {
        const parents = resolveLocatorAst(ast.parent, root, depth + 1);
        return uniqueElements(parents.flatMap((parent) => resolveLocatorAst(ast.child, parent, depth + 1)));
      }
      case "and": {
        const items = Array.isArray(ast.items) ? ast.items : [];
        if (items.length < 2 || items.length > 8) throw new Error("locator_and_requires_2_to_8_items");
        const [first, ...rest] = items.map((item) => resolveLocatorAst(item, root, depth + 1));
        return first.filter((node) => rest.every((nodes) => nodes.includes(node)));
      }
      case "or": {
        const items = Array.isArray(ast.items) ? ast.items : [];
        if (items.length < 2 || items.length > 8) throw new Error("locator_or_requires_2_to_8_items");
        return uniqueElements(items.flatMap((item) => resolveLocatorAst(item, root, depth + 1)));
      }
      case "filter":
        return resolveLocatorFilter(ast, root, depth + 1);
      case "first": {
        const nodes = resolveLocatorAst(ast.base, root, depth + 1);
        return nodes[0] ? [nodes[0]] : [];
      }
      case "last": {
        const nodes = resolveLocatorAst(ast.base, root, depth + 1);
        return nodes.length ? [nodes[nodes.length - 1]] : [];
      }
      case "nth": {
        const index = Number(ast.index);
        if (!Number.isInteger(index) || index < 0) throw new Error("locator_nth_requires_non_negative_index");
        const nodes = resolveLocatorAst(ast.base, root, depth + 1);
        return nodes[index] ? [nodes[index]] : [];
      }
      default:
        throw new Error(`locator_ast_unsupported_kind:${kind || "<empty>"}`);
    }
  }
  function resolveLocatorFilter(ast, root, depth) {
    let nodes = resolveLocatorAst(ast.base, root, depth + 1);
    if (ast.hasText != null) nodes = nodes.filter((node) => matchesText(node, ast.hasText, false));
    if (ast.hasNotText != null) nodes = nodes.filter((node) => !matchesText(node, ast.hasNotText, false));
    if (typeof ast.visible === "boolean") nodes = nodes.filter((node) => isElementActuallyVisible(node) === ast.visible);
    if (isObject(ast.has)) {
      const descendants = new Set(resolveLocatorAst(ast.has, root, depth + 1));
      nodes = nodes.filter((node) => [...descendants].some((descendant) => node !== descendant && node.contains(descendant)));
    }
    if (isObject(ast.hasNot)) {
      const descendants = new Set(resolveLocatorAst(ast.hasNot, root, depth + 1));
      nodes = nodes.filter((node) => ![...descendants].some((descendant) => node !== descendant && node.contains(descendant)));
    }
    return nodes;
  }
  function queryLocatorScope(root, selector) {
    const normalized = String(selector || "").trim();
    if (!normalized) throw new Error("locator_css_requires_selector");
    try {
      return [...root.querySelectorAll(normalized)].filter((node) => node instanceof Element).slice(0, LOCATOR_AST_MAX_NODES);
    } catch {
      throw new Error("locator_css_invalid_selector");
    }
  }
  function resolveLabelLocator(root, ast) {
    const labelText = String(ast.label || "").trim();
    if (!labelText) return [];
    const labels = queryLocatorScope(root, "label").filter((label) => matchesText(label, labelText, ast.exact));
    const labelled = labels.flatMap((label) => {
      const byId = label.htmlFor ? document.getElementById(label.htmlFor) : null;
      const nested = label.querySelector('input,textarea,select,[contenteditable="true"]');
      return [byId, nested].filter((node) => node instanceof Element);
    });
    const aria = queryLocatorScope(root, "input,textarea,select,button,[aria-label],[aria-labelledby]").filter((node) => matchesTextValue(accessibleName(node), labelText, ast.exact));
    return uniqueElements([...labelled, ...aria]);
  }
  function matchesLocatorRole(node, ast) {
    const expectedRole = String(ast.role || "").trim().toLowerCase();
    if (!expectedRole) return false;
    const role = String(node.getAttribute("role") || implicitRole(node) || "").toLowerCase();
    if (role !== expectedRole) return false;
    if (ast.name == null) return true;
    return matchesTextValue(accessibleName(node), ast.name, ast.exact);
  }
  function accessibleName(node) {
    const labelledBy = String(node.getAttribute("aria-labelledby") || "").trim();
    if (labelledBy) {
      const labelled = labelledBy.split(/\s+/).map((id) => document.getElementById(id)).filter((item) => item instanceof Element).map((item) => item.textContent || "").join(" ");
      if (normalizeWhitespace(labelled)) return normalizeWhitespace(labelled);
    }
    return elementLabel(node);
  }
  function matchesText(node, expected, exact) {
    return matchesTextValue(normalizeWhitespace(node.innerText || node.textContent || ""), expected, exact);
  }
  function matchesTextValue(value, expected, exact) {
    const left = normalizeWhitespace(String(value || ""));
    const right = normalizeWhitespace(String(expected || ""));
    if (!right) return false;
    return exact === false ? left.toLowerCase().includes(right.toLowerCase()) : left === right;
  }
  function preferSmallestTextMatches(nodes) {
    const matching = new Set(nodes);
    return nodes.filter((node) => ![...node.children].some((child) => matching.has(child)));
  }
  function uniqueElements(nodes) {
    return [...new Set(nodes.filter((node) => node instanceof Element))];
  }
  function locatorReceipt(options = {}, node) {
    if (!isObject(options.locatorAst) || !(node instanceof Element)) return null;
    return {
      kind: "locator_receipt",
      documentId: documentIdentity,
      nodeId: getNodeId(node),
      selector: cssPath(node),
      matchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      strict: options.strict !== false
    };
  }
  function isObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }
  function normalizeLocatorLimit(value) {
    const limit = Number(value || 50);
    return Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 50;
  }
  function findSelectOption(select, options) {
    const optionValue = options.value != null ? String(options.value) : "";
    const optionText = String(options.optionText || options.text || options.label || options.labelText || "").trim();
    const optionIndex = options.index != null ? Number(options.index) : null;
    const entries = [...select.options];
    if (optionValue) {
      const option = entries.find((entry) => entry.value === optionValue);
      if (option) return option;
    }
    if (optionText) {
      const option = entries.find((entry) => normalizeWhitespace(entry.textContent || entry.label || "") === optionText);
      if (option) return option;
    }
    if (Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < entries.length) return entries[optionIndex];
    return null;
  }
  function normalizeSelectSelections(options = {}) {
    if (Array.isArray(options.selections) && options.selections.length) {
      return options.selections.filter((item) => item && typeof item === "object");
    }
    return [{
      value: options.value,
      label: options.label,
      text: options.optionText || options.text || options.labelText,
      index: options.index
    }];
  }
  function readElementValue(node) {
    const tag = node.tagName?.toLowerCase();
    if (tag === "select") {
      const selected = [...node.selectedOptions || []];
      if (node.multiple) return selected[0]?.value ?? null;
      return node.value ?? null;
    }
    if (tag === "input") {
      const type = String(node.type || "").toLowerCase();
      if (["checkbox", "radio"].includes(type)) return node.checked ? node.value || "on" : null;
      return node.value ?? "";
    }
    if (tag === "textarea") return node.value ?? "";
    if (node.isContentEditable) return node.textContent ?? "";
    return node.getAttribute("value") ?? (normalizeWhitespace(node.innerText || node.textContent || "") || null);
  }
  function readElementValues(node) {
    const tag = node.tagName?.toLowerCase();
    if (tag === "select") return [...node.selectedOptions || []].map((option) => option.value);
    if (tag === "input") {
      const type = String(node.type || "").toLowerCase();
      if (["checkbox", "radio"].includes(type)) return node.checked ? [node.value || "on"] : [];
      return [node.value ?? ""];
    }
    const value = readElementValue(node);
    return value == null ? [] : [String(value)];
  }
  function elementReadSnapshot(node) {
    return {
      documentId: documentIdentity,
      nodeId: getNodeId(node),
      attributes: Object.fromEntries([...node.attributes || []].map((attr) => [attr.name, attr.value])),
      inner_text: normalizeWhitespace(node.innerText || ""),
      text_content: node.textContent,
      value: readElementValue(node),
      enabled: isElementEnabled(node),
      visible: isElementActuallyVisible(node),
      selector: cssPath(node),
      descriptor: elementDescriptor(node)
    };
  }
  function isElementEnabled(node) {
    if (!(node instanceof Element)) return false;
    if (node.hasAttribute("disabled")) return false;
    if (String(node.getAttribute("aria-disabled") || "").toLowerCase() === "true") return false;
    return true;
  }
  function isElementActuallyVisible(node) {
    if (!(node instanceof Element)) return false;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
  function normalizeCheckedValue(options = {}) {
    if (typeof options.checked === "boolean") return options.checked;
    if (typeof options.value === "boolean") return options.value;
    return true;
  }
  function isInputLike(node) {
    if (!node) return false;
    const tag = node.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || node.isContentEditable;
  }
  function isCheckableInput(node) {
    if (!node || node.tagName?.toLowerCase() !== "input") return false;
    return ["checkbox", "radio"].includes(String(node.type || "").toLowerCase());
  }
  function elementLabel(node) {
    return normalizeWhitespace(
      node.innerText || node.textContent || node.value || node.getAttribute("aria-label") || node.getAttribute("title") || node.getAttribute("placeholder") || ""
    );
  }
  function isClickable(node) {
    if (!node || !node.isConnected) return false;
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    const disabled = node.disabled || node.getAttribute("aria-disabled") === "true";
    return !disabled && rect.width > 4 && rect.height > 4 && style.display !== "none" && style.visibility !== "hidden" && style.pointerEvents !== "none";
  }
  function isHoverable(node) {
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return rect.width > 4 && rect.height > 4 && style.display !== "none" && style.visibility !== "hidden" && style.pointerEvents !== "none";
  }
  function isInteractableCandidate(node) {
    if (!node) return false;
    const style = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return false;
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || style.pointerEvents === "none") return false;
    return true;
  }
  function isVisibleElement(node) {
    if (!node) return false;
    const style = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1 && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }
  function normalizeSelectorWaitState(value) {
    const state = String(value || "visible").trim();
    if (["attached", "detached", "visible", "hidden"].includes(state)) return state;
    return "visible";
  }
  function elementDescriptor(node) {
    const rect = node.getBoundingClientRect();
    const selector = cssPath(node);
    const text2 = visibleText(node);
    const ariaName = node.getAttribute("aria-label") || node.getAttribute("title") || node.getAttribute("alt") || null;
    const testId = node.getAttribute("data-testid") || node.getAttribute("data-test") || node.getAttribute("data-test-id") || null;
    return {
      documentId: documentIdentity,
      nodeId: getNodeId(node),
      tagName: node.tagName.toLowerCase(),
      role: node.getAttribute("role") || implicitRole(node) || null,
      visibleText: text2 || null,
      ariaName,
      testId,
      boundingBox: {
        x: Number(rect.left.toFixed(3)),
        y: Number(rect.top.toFixed(3)),
        width: Number(rect.width.toFixed(3)),
        height: Number(rect.height.toFixed(3))
      },
      preview: buildElementPreview(node, text2, ariaName),
      selector: {
        primary: selector || null,
        candidates: selector ? [selector] : [],
        frameSelectors: []
      }
    };
  }
  function getNodeId(node) {
    if (!(node instanceof Element)) return null;
    const existing = nodeIds.get(node);
    if (existing) return existing;
    const id = nextNodeId;
    nextNodeId += 1;
    nodeIds.set(node, id);
    nodesById.set(id, node);
    return id;
  }
  function findNodeById(options = {}) {
    assertDocument(options);
    const nodeId = normalizeNodeId(options);
    if (!nodeId) return null;
    const node = nodesById.get(nodeId);
    if (!(node instanceof Element) || !node.isConnected) {
      nodesById.delete(nodeId);
      return null;
    }
    return node;
  }
  function normalizeNodeId(options = {}) {
    const raw = options.nodeId ?? options.node_id;
    const nodeId = Number(raw);
    return Number.isInteger(nodeId) && nodeId > 0 ? nodeId : 0;
  }
  function dispatchElementClick(target, options = {}) {
    const rect = target.getBoundingClientRect();
    const x = Number.isFinite(Number(options.x)) ? Number(options.x) : rect.left + rect.width / 2;
    const y = Number.isFinite(Number(options.y)) ? Number(options.y) : rect.top + rect.height / 2;
    const clickCount = normalizeClickCount(options);
    const init = mouseEventInit(options, x, y);
    for (let index = 0; index < clickCount; index += 1) {
      for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
        const event = type.startsWith("pointer") ? new PointerEvent(type, { ...init, pointerType: "mouse" }) : new MouseEvent(type, init);
        target.dispatchEvent(event);
      }
    }
    if (clickCount > 1) {
      target.dispatchEvent(new MouseEvent("dblclick", init));
    }
  }
  function mouseEventInit(options, x, y) {
    const button = normalizeMouseButton(options.button);
    return {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      button,
      buttons: button === 0 ? 1 : button === 1 ? 4 : button === 2 ? 2 : 0,
      ...eventModifierFlags(options)
    };
  }
  function eventModifierFlags(options = {}) {
    const modifiers = normalizeEventModifierNames(options);
    return {
      altKey: modifiers.includes("Alt"),
      ctrlKey: modifiers.includes("Control"),
      metaKey: modifiers.includes("Meta"),
      shiftKey: modifiers.includes("Shift")
    };
  }
  function normalizeEventModifierNames(options = {}) {
    const raw = [
      ...Array.isArray(options.modifiers) ? options.modifiers : [],
      ...Array.isArray(options.keys) ? options.keys : []
    ];
    const modifiers = /* @__PURE__ */ new Set();
    for (const item of raw) {
      const key = normalizeModifierName(item);
      if (key) modifiers.add(key);
    }
    return [...modifiers].sort();
  }
  function normalizeModifierName(value) {
    switch (String(value || "").replace(/[\s_-]/g, "").toLowerCase()) {
      case "alt":
      case "option":
        return "Alt";
      case "control":
      case "ctrl":
        return "Control";
      case "controlormeta":
      case "cmdorctrl":
      case "commandorcontrol":
        return isMacPlatform() ? "Meta" : "Control";
      case "meta":
      case "cmd":
      case "command":
        return "Meta";
      case "shift":
        return "Shift";
      default:
        return "";
    }
  }
  function normalizeMouseButton(value) {
    switch (String(value || "left").toLowerCase()) {
      case "middle":
        return 1;
      case "right":
        return 2;
      case "left":
      default:
        return 0;
    }
  }
  function normalizeMouseButtonName(value) {
    switch (normalizeMouseButton(value)) {
      case 1:
        return "middle";
      case 2:
        return "right";
      case 0:
      default:
        return "left";
    }
  }
  function normalizeClickCount(options = {}) {
    const explicit = Number(options.clickCount || options.click_count || 0);
    if (Number.isInteger(explicit) && explicit > 1) return Math.min(explicit, 2);
    return options.doubleClick === true || options.double_click === true ? 2 : 1;
  }
  function isMacPlatform() {
    return /mac/i.test(String(globalThis.navigator?.platform || globalThis.navigator?.userAgent || ""));
  }
  function visibleText(node) {
    return normalizeWhitespace(
      node.innerText || node.textContent || node.value || ""
    ).slice(0, 240);
  }
  function buildElementPreview(node, text2, ariaName) {
    const parts = [node.tagName.toLowerCase()];
    const id = node.getAttribute("id");
    if (id) parts.push(`#${id}`);
    const role = node.getAttribute("role") || implicitRole(node);
    if (role) parts.push(`[role=${role}]`);
    if (ariaName) parts.push(`aria="${ariaName.slice(0, 120)}"`);
    if (text2) parts.push(`text="${text2.slice(0, 120)}"`);
    return parts.join(" ");
  }
  function implicitRole(node) {
    const tag = node.tagName?.toLowerCase();
    if (tag === "button") return "button";
    if (tag === "a" && node.getAttribute("href")) return "link";
    if (tag === "select") return "combobox";
    if (tag === "textarea") return "textbox";
    if (tag === "input") {
      const type = String(node.getAttribute("type") || "text").toLowerCase();
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "button" || type === "submit" || type === "reset") return "button";
      return "textbox";
    }
    if (tag === "img") return "img";
    return null;
  }
  function scrollableContainers() {
    return [...document.querySelectorAll("main,section,div,ul,ol")].filter((node) => {
      const style = window.getComputedStyle(node);
      return /(auto|scroll)/.test(`${style.overflow}${style.overflowY}`) && node.scrollHeight > node.clientHeight + 120;
    }).slice(0, 20);
  }
  function assertDocument(options = {}) {
    options.assertActive?.();
    if (options.documentId && options.documentId !== documentIdentity) throw new Error("stale_document: inspect the current document again");
  }
  async function actionDelay(ms, options = {}) {
    assertDocument(options);
    if (!options.signal) await sleep(ms);
    else await new Promise((resolve, reject) => {
      const done = () => {
        options.signal.removeEventListener("abort", cancel);
        resolve();
      };
      const timer = setTimeout(done, ms);
      const cancel = () => {
        clearTimeout(timer);
        options.signal.removeEventListener("abort", cancel);
        reject(options.signal.reason || new DOMException("Cancelled", "AbortError"));
      };
      options.signal.addEventListener("abort", cancel, { once: true });
      if (options.signal.aborted) cancel();
    });
    assertDocument(options);
  }
  function assertActionTarget(target, options = {}) {
    assertDocument(options);
    if (!target.isConnected || target.ownerDocument !== document) throw new Error("stale_target: inspect the current document again");
    if (!isClickable(target)) throw new Error("target_not_actionable");
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
    const y = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
    const hit = document.elementFromPoint(x, y);
    if (!hit || hit !== target && !target.contains(hit)) throw new Error("target_obscured: inspect before retrying");
    return { x, y };
  }
  function focusElement(options = {}) {
    assertDocument(options);
    const target = options.selector ? findAnyTarget(options) : document.activeElement;
    if (!target) return { success: false, error: "focus_target_not_found" };
    assertActionTarget(target, options);
    target.focus();
    return { success: document.activeElement === target, documentId: documentIdentity, selector: cssPath(target) };
  }

  // src/content/siteResearchExtractor.js
  var DEFAULT_ITEM_LIMIT = 20;
  var DEFAULT_COMMENT_LIMIT = 8;
  var SITE_CARD_SELECTORS = Object.freeze({
    xiaohongshu: Object.freeze([
      'a[href*="/explore/"]',
      'a[href*="/discovery/item/"]',
      'a[href*="/user/profile/"] [href*="/explore/"]'
    ]),
    douyin: Object.freeze([
      'a[href*="/video/"]'
    ])
  });
  var SITE_DETAIL_CLOSE_SELECTORS = Object.freeze({
    xiaohongshu: Object.freeze([
      '[class*="note-detail"] [class*="close"]',
      '[class*="modal"] [class*="close"]',
      'button[aria-label*="关闭"]',
      'button[aria-label*="close" i]',
      '[role="dialog"] [class*="close"]'
    ]),
    douyin: Object.freeze([
      '[role="dialog"] [class*="close"]',
      '[class*="modal"] [class*="close"]',
      'button[aria-label*="关闭"]',
      'button[aria-label*="close" i]'
    ])
  });
  var DETAIL_SURFACES = /* @__PURE__ */ new Set(["detail", "detail_overlay"]);
  var RESULT_LIST_OPERATIONS = /* @__PURE__ */ new Set(["search", "author_scan"]);
  var MAX_INTERACTION_ANCESTORS = 6;
  var SITE_SEARCH_UI = Object.freeze({
    xiaohongshu: Object.freeze({
      inputs: Object.freeze([
        "#search-input-in-feeds",
        "#search-input",
        'textarea[id*="search-input"]',
        'input[id*="search"]',
        "input.search-input",
        '[role="search"] input',
        'input[placeholder*="搜索"]',
        'input[type="search"]'
      ]),
      submits: Object.freeze([
        ".input-button",
        'button[type="submit"]',
        '[role="search"] button'
      ])
    }),
    douyin: Object.freeze({
      inputs: Object.freeze([
        'input[data-e2e="searchbar-input"]',
        '[role="search"] input',
        'input[placeholder*="搜索"]',
        'input[type="search"]'
      ]),
      submits: Object.freeze([
        '[data-e2e="searchbar-button"]',
        'button[type="submit"]',
        '[role="search"] button',
        '[class*="search"] button'
      ])
    })
  });
  var SITE_FILTER_UI = Object.freeze({
    xiaohongshu: Object.freeze({
      sort: Object.freeze({
        group: ["排序方式", "排序"],
        values: { relevance: ["综合", "综合排序"], latest: ["最新", "最新发布"], most_liked: ["最多点赞"] }
      }),
      contentType: Object.freeze({
        group: ["笔记类型", "内容形式", "内容类型"],
        values: { all: ["不限", "全部"], image_text: ["图文"], video: ["视频"] }
      }),
      publishTime: Object.freeze({
        group: ["发布时间"],
        values: { all: ["不限", "全部"], day: ["一天内", "24小时内"], week: ["一周内"], half_year: ["半年内"] }
      })
    }),
    douyin: Object.freeze({
      sort: Object.freeze({
        group: ["排序方式", "排序"],
        values: { relevance: ["综合排序", "综合"], latest: ["最新发布", "最新"], most_liked: ["最多点赞"] }
      }),
      contentType: Object.freeze({
        group: ["内容形式", "内容类型"],
        values: { all: ["不限", "全部"], image_text: ["图文"], video: ["视频"] }
      }),
      publishTime: Object.freeze({
        group: ["发布时间"],
        values: { all: ["不限", "全部"], day: ["一天内", "24小时内"], week: ["一周内"], half_year: ["半年内"] }
      })
    })
  });
  function extractSiteResearch(input = {}) {
    const site = normalizeSite(input.site?.id || input.siteId || input.site || input.platform || inferSite(location.hostname));
    const operation = String(input.operation || input.researchOperation || "content_scan").trim().toLowerCase();
    const detailOpenMode = normalizeDetailOpenMode(input.detailOpenMode);
    const limit = clamp2(input.limit, 1, 100, DEFAULT_ITEM_LIMIT);
    const commentLimit = clamp2(input.commentLimit, 0, 100, DEFAULT_COMMENT_LIMIT);
    const pageState = readPageState(site);
    if (operation === "search") {
      const inputSelector = SITE_SEARCH_UI[site]?.inputs.find((selector) => firstVisible([selector])) || "";
      pageState.search = readSearchSubmissionState(site, inputSelector, input.query || input.keyword || "");
    }
    const base = {
      success: true,
      site,
      operation,
      sourceUrl: location.href,
      title: document.title || "",
      capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
      pageState
    };
    if (pageState.blocker) return { ...base, success: false, reason: pageState.blocker };
    if (operation === "content_scan" && detailOpenMode === "page_click" && !DETAIL_SURFACES.has(pageState.surface)) {
      return {
        ...base,
        success: false,
        reason: "detail_surface_unavailable",
        message: "social-media detail extraction requires a detail page opened from the source page UI"
      };
    }
    const extracted = site === "xiaohongshu" ? extractXiaohongshu(operation, limit, commentLimit, detailOpenMode) : site === "douyin" ? extractDouyin(operation, limit, commentLimit, detailOpenMode) : site === "youtube" ? extractYouTube(commentLimit) : extractGenericWeb(limit);
    if (RESULT_LIST_OPERATIONS.has(operation)) {
      pageState.results = extracted.resultState || {
        status: Array.isArray(extracted.items) && extracted.items.length ? "ready" : "loading",
        candidateCount: Array.isArray(extracted.items) ? extracted.items.length : 0,
        interactableCount: Array.isArray(extracted.items) ? extracted.items.length : 0
      };
    }
    const { resultState: _resultState, ...result } = extracted;
    return { ...base, ...result };
  }
  async function submitSiteResearchSearch(input = {}) {
    const site = normalizeSite(input.site?.id || input.siteId || input.site || input.platform || inferSite(location.hostname));
    const query = String(input.query || input.keyword || "").trim();
    const pageState = readPageState(site);
    if (pageState.blocker) return { success: false, reason: pageState.blocker, sourceUrl: location.href };
    if (!query) return { success: false, reason: "search_query_missing", message: "page UI search requires query", sourceUrl: location.href };
    const spec = SITE_SEARCH_UI[site];
    if (!spec) return { success: false, reason: "search_ui_site_unsupported", message: `${site} does not support page UI search`, sourceUrl: location.href };
    const inputSelector = spec.inputs.find((selector) => firstVisible([selector]));
    if (!inputSelector) {
      return { success: false, reason: "search_input_unavailable", message: "platform search input is not visible", sourceUrl: location.href };
    }
    const before = readSearchSubmissionState(site, inputSelector, query);
    const typed = await typeElement({ selector: inputSelector, text: query, replace: true, timeoutMs: 3e3 });
    if (typed?.success !== true) {
      return { success: false, reason: "search_input_failed", message: typed?.error || "platform search input failed", sourceUrl: location.href };
    }
    await delay(80);
    const submitSelector = spec.submits.find((selector) => firstVisible([selector]));
    if (submitSelector) {
      const clicked = await clickElement({ selector: submitSelector });
      if (clicked?.success === true) {
        return searchSubmissionReceipt(site, inputSelector, query, before, {
          method: "click",
          submitSelector
        });
      }
    }
    const inputNode = firstVisible([inputSelector]);
    if (!inputNode) {
      return { success: false, reason: "search_input_detached", message: "platform search input was replaced before submit", sourceUrl: location.href };
    }
    for (const type of ["keydown", "keypress", "keyup"]) {
      inputNode.dispatchEvent(new KeyboardEvent(type, {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
    }
    return searchSubmissionReceipt(site, inputSelector, query, before, { method: "enter" });
  }
  async function prepareSiteResearchItemClick(input = {}) {
    const site = normalizeSite(input.site?.id || input.siteId || input.site || input.platform || inferSite(location.hostname));
    if (normalizeDetailOpenMode(input.detailOpenMode) !== "page_click") {
      return { success: false, reason: "page_click_site_unsupported", sourceUrl: location.href };
    }
    const interactionRef = input.interactionRef && typeof input.interactionRef === "object" ? input.interactionRef : input.item?.interactionRef && typeof input.item.interactionRef === "object" ? input.item.interactionRef : {};
    if (interactionRef.kind !== "site_card" || normalizeSite(interactionRef.site) !== site) {
      return {
        success: false,
        reason: "item_interaction_ref_invalid",
        message: "social-media card opening requires the typed interactionRef from the source-page extractor",
        sourceUrl: location.href
      };
    }
    const itemId = String(interactionRef.itemId || input.item?.id || input.itemId || "").trim();
    const expectedUrl = normalizeUrl(interactionRef.sourceUrl || input.item?.sourceUrl || input.sourceUrl || "");
    let match = findSiteCardTarget(site, { itemId, expectedUrl });
    if (!match) {
      return {
        success: false,
        reason: "item_click_target_unavailable",
        message: "the selected social-media card is no longer present on the source page",
        itemId,
        sourceUrl: location.href
      };
    }
    match.target.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    await delay(160);
    match = findSiteCardTarget(site, { itemId, expectedUrl });
    if (!match) {
      return {
        success: false,
        reason: "item_click_target_detached",
        message: "the selected social-media card changed while preparing the page click",
        itemId,
        sourceUrl: location.href
      };
    }
    const clickPoint = findVisibleClickPoint(match.target);
    if (!clickPoint) {
      return {
        success: false,
        reason: "item_click_target_not_visible",
        itemId,
        sourceUrl: location.href
      };
    }
    const observedUrl = match.href;
    return {
      success: true,
      site,
      itemId: externalIdFromUrl(observedUrl) || itemId,
      sourceUrl: location.href,
      observedUrl,
      clickPoint
    };
  }
  async function prepareSiteResearchItemClose(input = {}) {
    const site = normalizeSite(input.site?.id || input.siteId || input.site || input.platform || inferSite(location.hostname));
    const closeTarget = firstVisible(SITE_DETAIL_CLOSE_SELECTORS[site] || []);
    if (!closeTarget) {
      return { success: false, reason: "detail_close_target_unavailable", sourceUrl: location.href };
    }
    closeTarget.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    await delay(80);
    const rect = closeTarget.getBoundingClientRect();
    if (rect.width <= 4 || rect.height <= 4) {
      return { success: false, reason: "detail_close_target_not_visible", sourceUrl: location.href };
    }
    return {
      success: true,
      site,
      sourceUrl: location.href,
      clickPoint: {
        x: Number((rect.left + rect.width / 2).toFixed(3)),
        y: Number((rect.top + rect.height / 2).toFixed(3)),
        coordinateSpace: "viewport"
      }
    };
  }
  async function applySiteResearchFilters(input = {}) {
    const site = normalizeSite(input.site?.id || input.site || input.siteId || input.platform || inferSite(location.hostname));
    const filters = input.filters && typeof input.filters === "object" && !Array.isArray(input.filters) ? input.filters : {};
    const siteSpec = SITE_FILTER_UI[site];
    if (!siteSpec) return { success: false, reason: "filter_site_unsupported", message: `${site} does not support filters` };
    const applied = {};
    for (const [filter, value] of Object.entries(filters)) {
      const filterSpec = siteSpec[filter];
      const optionTexts = filterSpec?.values?.[value];
      if (!filterSpec || !optionTexts) {
        return { success: false, reason: "filter_option_unsupported", filter, value };
      }
      let option = findFilterOption(filterSpec.group, optionTexts);
      if (!option) {
        const trigger = findVisibleExactText(["筛选", "搜索筛选"]);
        if (trigger) {
          trigger.click();
          await delay(160);
          option = findFilterOption(filterSpec.group, optionTexts);
        }
      }
      if (!option) {
        return {
          success: false,
          reason: "filter_option_unavailable",
          message: `filter option is not visible: ${filter}=${value}`,
          filter,
          value
        };
      }
      if (!isSelectedOption(option)) {
        option.click();
        await delay(180);
      }
      applied[filter] = value;
    }
    return { success: true, applied };
  }
  function findFilterOption(groupTexts, optionTexts) {
    const groupLabel = findVisibleExactText(groupTexts);
    if (groupLabel) {
      let root = groupLabel.parentElement;
      for (let depth = 0; root && depth < 6; depth += 1, root = root.parentElement) {
        const scoped = findVisibleExactText(optionTexts, root);
        if (scoped) return scoped;
      }
    }
    return findVisibleExactText(optionTexts);
  }
  function findVisibleExactText(values, root = document) {
    const candidates = root.querySelectorAll('button, [role="button"], [role="option"], [role="menuitem"], label, li, span, div');
    for (const candidate of candidates) {
      const candidateText = text(candidate);
      if (values.includes(candidateText) && isVisible(candidate)) return candidate;
    }
    return null;
  }
  function isSelectedOption(node) {
    return node.getAttribute("aria-selected") === "true" || node.getAttribute("aria-checked") === "true" || node.getAttribute("data-selected") === "true" || /(^|\s)(active|selected|checked)(\s|$)/i.test(String(node.className || ""));
  }
  function isVisible(node) {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function searchSubmissionReceipt(site, inputSelector, query, before, details = {}) {
    return {
      success: true,
      submitted: true,
      ...details,
      inputSelector,
      query: String(query || "").trim(),
      before,
      sourceUrl: location.href
    };
  }
  function readSearchSubmissionState(site, inputSelector, requestedQuery) {
    const inputNode = inputSelector ? firstVisible([inputSelector]) : null;
    const observedQuery = String(inputNode?.value || inputNode?.textContent || "").trim();
    const query = normalizeSearchQuery(requestedQuery);
    const normalizedObserved = normalizeSearchQuery(observedQuery);
    const normalizedUrl = normalizeSearchQuery(readSearchQueryFromUrl(location.href));
    return {
      requestedQuery: String(requestedQuery || "").trim(),
      observedQuery,
      queryMatched: Boolean(query) && (normalizedObserved === query || normalizedUrl === query),
      surface: detectSiteSurface(site, null),
      url: location.href,
      resultFingerprint: readResultFingerprint(site),
      explicitlyEmpty: detectExplicitEmptyResults()
    };
  }
  function readSearchQueryFromUrl(value) {
    try {
      const url = new URL(value, location.href);
      for (const key of ["keyword", "query", "q", "search_query"]) {
        const candidate = url.searchParams.get(key);
        if (candidate) return candidate;
      }
      const parts = decodeURIComponent(url.pathname).split("/").filter(Boolean);
      const searchIndex = parts.findIndex((part) => /^search(?:_result)?$/i.test(part));
      return searchIndex >= 0 ? parts[searchIndex + 1] || "" : "";
    } catch {
      return "";
    }
  }
  function normalizeSearchQuery(value) {
    return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function readResultFingerprint(site) {
    const urls = [];
    const seen = /* @__PURE__ */ new Set();
    for (const selector of SITE_CARD_SELECTORS[site] || []) {
      for (const anchor of document.querySelectorAll(selector)) {
        const href = normalizeUrl(anchor.href || anchor.getAttribute("href") || "");
        if (!href || seen.has(href)) continue;
        seen.add(href);
        urls.push(href);
        if (urls.length >= 30) break;
      }
      if (urls.length >= 30) break;
    }
    if (!urls.length) return "";
    return stableStringId(urls.join("\n"), "results");
  }
  function extractXiaohongshu(operation, limit, commentLimit, detailOpenMode) {
    if (operation === "search" || operation === "author_scan") {
      const cards = extractCards(SITE_CARD_SELECTORS.xiaohongshu, limit, {
        title: ['[class*="title"]', ".title", "[data-v-note-title]"],
        author: ['[class*="author"]', '[class*="name"]', ".username"],
        engagement: ['[class*="like"]', '[class*="count"]']
      }, "xiaohongshu", detailOpenMode);
      return {
        items: cards.items,
        resultState: cards.resultState,
        author: operation === "author_scan" ? extractAuthorHeader() : null,
        hasMore: cards.items.length >= limit
      };
    }
    return extractContent({
      title: ["#detail-title", '[class*="note-detail"] [class*="title"]', "h1"],
      author: ['[class*="author"] [class*="name"]', '[class*="author"]', ".username"],
      body: ["#detail-desc", '[class*="note-detail"] [class*="desc"]', '[class*="content"]'],
      comments: ['[class*="comment-item"]', '[class*="commentItem"]', '[data-testid*="comment"]'],
      commentLimit
    });
  }
  function extractDouyin(operation, limit, commentLimit, detailOpenMode) {
    if (operation === "search" || operation === "author_scan") {
      const cards = extractCards(SITE_CARD_SELECTORS.douyin, limit, {
        title: ['[class*="title"]', '[data-e2e*="desc"]'],
        author: ['[class*="author"]', '[data-e2e*="author"]'],
        engagement: ['[class*="count"]', '[data-e2e*="like"]']
      }, "douyin", detailOpenMode);
      return {
        items: cards.items,
        resultState: cards.resultState,
        author: operation === "author_scan" ? extractAuthorHeader() : null,
        hasMore: cards.items.length >= limit
      };
    }
    return extractContent({
      title: ['[data-e2e="video-desc"]', '[class*="video-info"] h1', "h1"],
      author: ['[data-e2e*="author"]', '[class*="author"]'],
      body: ['[data-e2e="video-desc"]', '[class*="desc"]'],
      comments: ['[data-e2e*="comment-item"]', '[class*="comment-item"]', '[class*="commentItem"]'],
      commentLimit
    });
  }
  function extractYouTube(commentLimit) {
    return extractContent({
      title: ["h1 yt-formatted-string", "h1"],
      author: ["#owner #channel-name a", "ytd-channel-name a"],
      body: ["#description-inline-expander", "#description", "ytd-text-inline-expander"],
      comments: ["ytd-comment-thread-renderer"],
      commentLimit
    });
  }
  function extractGenericWeb(limit) {
    const main = firstNode(["main", "article", '[role="main"]', "body"]);
    return {
      content: {
        title: text(firstNode(["h1"])) || document.title || "",
        author: readMeta(["author", "article:author"]),
        body: text(main).slice(0, 8e4),
        sourceUrl: location.href,
        comments: [],
        media: extractMedia(12, { root: main, strict: true })
      },
      items: []
    };
  }
  function extractContent({ title, author, body, comments, commentLimit }) {
    const bodyNode = firstNode(body);
    const mediaRoot = bodyNode?.closest('article, main, [role="main"], [role="dialog"]') || firstNode(["article", "main", '[role="main"]', '[role="dialog"]']) || document;
    return {
      content: {
        title: text(firstNode(title)) || document.title || "",
        author: text(firstNode(author)),
        body: text(bodyNode).slice(0, 8e4),
        sourceUrl: location.href,
        comments: extractComments(comments, commentLimit),
        media: extractMedia(40, { root: mediaRoot, strict: false })
      },
      items: []
    };
  }
  function extractCards(selectors, limit, fields, site = "web", detailOpenMode = "direct_url") {
    const seen = /* @__PURE__ */ new Set();
    const items = [];
    let candidateCount = 0;
    let interactableCount = 0;
    const requireInteractionTarget = detailOpenMode === "page_click";
    for (const { anchor, target, href, itemId } of iterateCardAnchors(selectors)) {
      candidateCount += 1;
      if (target) interactableCount += 1;
      if (requireInteractionTarget && !target) continue;
      if (seen.has(href)) continue;
      const root = anchor.closest('article, li, section, [role="listitem"]') || target || anchor.parentElement || anchor;
      const title = text(firstNode(fields.title || [], root)) || text(anchor);
      if (!title && !isLikelyContentUrl(href)) continue;
      seen.add(href);
      items.push({
        id: itemId,
        sourceUrl: href,
        title: title.slice(0, 500),
        author: text(firstNode(fields.author || [], root)).slice(0, 200),
        engagementText: text(firstNode(fields.engagement || [], root)).slice(0, 120),
        previewText: text(root).slice(0, 1e3),
        interactionRef: {
          kind: "site_card",
          action: requireInteractionTarget ? "page_click" : "open",
          site,
          itemId,
          sourceUrl: href,
          rank: items.length
        }
      });
      if (items.length >= limit) break;
    }
    return {
      items,
      resultState: {
        status: items.length > 0 || candidateCount > 0 ? "ready" : detectExplicitEmptyResults() ? "empty" : "loading",
        candidateCount,
        interactableCount
      }
    };
  }
  function extractComments(selectors, limit) {
    if (!limit) return [];
    const comments = [];
    const seen = /* @__PURE__ */ new Set();
    for (const selector of selectors) {
      for (const node of document.querySelectorAll(selector)) {
        const content = text(node).slice(0, 2e3);
        if (!content || seen.has(content)) continue;
        seen.add(content);
        comments.push({
          id: node.getAttribute("data-id") || node.id || `comment-${comments.length + 1}`,
          parentId: node.getAttribute("data-parent-id") || null,
          author: text(firstNode(['[class*="author"]', '[class*="name"]', "a"], node)).slice(0, 200),
          content
        });
        if (comments.length >= limit) return comments;
      }
    }
    return comments;
  }
  function extractAuthorHeader() {
    return {
      id: externalIdFromUrl(location.href),
      name: text(firstNode(['[class*="user-name"]', '[class*="nickname"]', '[class*="username"]', "h1"])).slice(0, 200),
      bio: text(firstNode(['[class*="user-desc"]', '[class*="bio"]', '[class*="signature"]'])).slice(0, 2e3),
      sourceUrl: location.href
    };
  }
  function extractMedia(limit, options = {}) {
    const root = options.root?.querySelectorAll ? options.root : document;
    const strict = options.strict === true;
    const items = [];
    const seen = /* @__PURE__ */ new Set();
    for (const node of root.querySelectorAll("img[src], video[src], video source[src]")) {
      const mediaNode = node.tagName === "SOURCE" && node.parentElement?.tagName === "VIDEO" ? node.parentElement : node;
      const sourceUrl = normalizeUrl(node.currentSrc || node.src || node.getAttribute("src") || "");
      if (!sourceUrl || sourceUrl.startsWith("data:") || seen.has(sourceUrl)) continue;
      const rendered = mediaNode.getBoundingClientRect();
      const naturalWidth = Number(mediaNode.naturalWidth || mediaNode.videoWidth || 0);
      const naturalHeight = Number(mediaNode.naturalHeight || mediaNode.videoHeight || 0);
      const width = Math.round(naturalWidth || rendered.width || Number(mediaNode.getAttribute?.("width")) || 0);
      const height = Math.round(naturalHeight || rendered.height || Number(mediaNode.getAttribute?.("height")) || 0);
      const visible = mediaNode.isConnected && mediaNode.getAttribute?.("aria-hidden") !== "true" && getComputedStyle(mediaNode).display !== "none" && getComputedStyle(mediaNode).visibility !== "hidden" && rendered.width > 0 && rendered.height > 0;
      const chromeZone = Boolean(mediaNode.closest("header, footer, nav, aside"));
      const markerText = [
        sourceUrl,
        mediaNode.id,
        mediaNode.className,
        mediaNode.getAttribute?.("role"),
        mediaNode.getAttribute?.("data-testid"),
        mediaNode.getAttribute?.("aria-label")
      ].map((value) => String(value || "")).join(" ").toLowerCase();
      const decorative = chromeZone || mediaNode.getAttribute?.("role") === "presentation" || /(?:^|[\/_.\s-])(avatar|badge|logo|icon|sprite|emoji|favicon|profile-photo|author-photo)(?:[\/_.\s-]|$)/i.test(markerText);
      const tooSmall = width > 0 && height > 0 && (width < 160 || height < 90);
      const eligible = visible && !decorative && !tooSmall;
      if (strict && !eligible) continue;
      const figure = mediaNode.closest("figure");
      const caption = text(figure?.querySelector("figcaption")).slice(0, 500);
      const context = text(
        figure || mediaNode.closest('p, section, article, [role="main"]') || mediaNode.parentElement
      ).slice(0, 800);
      const alt = mediaNode.tagName === "IMG" ? String(mediaNode.alt || "").slice(0, 500) : "";
      const withinMain = Boolean(mediaNode.closest('main, article, [role="main"]'));
      const area = width * height;
      const relevanceScore = (withinMain ? 30 : 0) + (figure ? 20 : 0) + (caption ? 15 : 0) + (alt ? 10 : 0) + (area >= 8e5 ? 20 : area >= 2e5 ? 10 : 0) - (mediaNode.tagName === "VIDEO" ? 5 : 0) - (decorative ? 100 : 0) - (tooSmall ? 60 : 0);
      seen.add(sourceUrl);
      items.push({
        id: stableMediaId(sourceUrl),
        type: mediaNode.tagName === "IMG" ? "image" : "video",
        sourceUrl,
        alt,
        caption,
        context,
        naturalWidth: width,
        naturalHeight: height,
        renderedWidth: Math.round(rendered.width),
        renderedHeight: Math.round(rendered.height),
        visible,
        withinMain,
        role: decorative ? "decorative" : figure ? "figure" : "content",
        eligible,
        relevanceScore
      });
      if (items.length >= limit) break;
    }
    return items;
  }
  function stableMediaId(sourceUrl) {
    return stableStringId(sourceUrl, "media");
  }
  function stableStringId(value, prefix) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${prefix}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  function readPageState(site) {
    const modal = firstVisible([
      '[class*="login-modal"]',
      '[class*="login-container"]',
      '[data-testid*="login"]',
      'iframe[src*="login"]'
    ]);
    const security = firstVisible([
      '[class*="captcha"]',
      '[class*="verify"]',
      '[class*="security"]',
      'iframe[src*="captcha"]'
    ]);
    const path = `${location.pathname}${location.search}`.toLowerCase();
    const unavailableText = `${document.title || ""}
${String(document.body?.innerText || "").slice(0, 4e3)}`;
    const unavailable = /\/404(?:\/|\?|$)/.test(location.pathname.toLowerCase()) || /(?:你访问的页面不见了|当前笔记暂时无法浏览|视频已失效|内容不存在)/i.test(unavailableText);
    const blocker = unavailable ? "content_unavailable" : security ? "security_verification_required" : modal || /\/(login|signin)(\/|\?|$)/.test(path) ? "login_required" : null;
    return {
      site,
      blocker,
      loggedIn: blocker === "login_required" || blocker === "security_verification_required" ? false : null,
      surface: detectSiteSurface(site, blocker),
      url: location.href
    };
  }
  function detectSiteSurface(site, blocker) {
    if (blocker) return "blocked";
    const pathname = location.pathname.toLowerCase();
    if (site === "xiaohongshu") {
      if (firstVisible(["#detail-title", "#detail-desc", '[class*="note-detail"]'])) {
        return /\/(explore|discovery\/item)\//.test(pathname) ? "detail" : "detail_overlay";
      }
      if (/\/(explore|discovery\/item)\//.test(pathname)) return "detail";
      if (/search_result/.test(pathname)) return "search_results";
      return "entry";
    }
    if (site === "douyin") {
      if (firstVisible(['[data-e2e="video-desc"]', '[class*="video-info"]', '[role="dialog"] [class*="video"]'])) {
        return /\/video\//.test(pathname) ? "detail" : "detail_overlay";
      }
      if (/\/video\//.test(pathname)) return "detail";
      if (/search/.test(pathname)) return "search_results";
      return "entry";
    }
    return "page";
  }
  function findSiteCardTarget(site, { itemId, expectedUrl }) {
    const selectors = SITE_CARD_SELECTORS[site] || [];
    let urlMatch = null;
    let idMatch = null;
    for (const match of iterateCardAnchors(selectors)) {
      if (!match.target) continue;
      if (expectedUrl && match.href === expectedUrl) urlMatch ||= match;
      if (itemId && match.itemId === itemId) idMatch ||= match;
    }
    return urlMatch || idMatch;
  }
  function* iterateCardAnchors(selectors) {
    for (const selector of selectors) {
      for (const anchor of document.querySelectorAll(selector)) {
        const href = normalizeUrl(anchor.href || anchor.getAttribute("href") || "");
        if (!href) continue;
        yield {
          anchor,
          target: resolveInteractionTarget(anchor),
          href,
          itemId: externalIdFromUrl(href)
        };
      }
    }
  }
  function resolveInteractionTarget(anchor) {
    let candidate = anchor;
    for (let depth = 0; candidate && depth <= MAX_INTERACTION_ANCESTORS; depth += 1) {
      if (candidate === document.body || candidate === document.documentElement) break;
      if (isRenderable(candidate) && findVisibleClickPoint(candidate)) return candidate;
      candidate = candidate.parentElement;
    }
    return null;
  }
  function findVisibleClickPoint(node) {
    if (!node?.isConnected) return null;
    const rect = node.getBoundingClientRect();
    const viewportWidth = Math.max(0, document.documentElement?.clientWidth || window.innerWidth || 0);
    const viewportHeight = Math.max(0, document.documentElement?.clientHeight || window.innerHeight || 0);
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(viewportWidth, rect.right);
    const bottom = Math.min(viewportHeight, rect.bottom);
    if (right - left <= 4 || bottom - top <= 4) return null;
    const points = [
      [0.5, 0.5],
      [0.3, 0.3],
      [0.7, 0.3],
      [0.3, 0.7],
      [0.7, 0.7]
    ];
    for (const [xRatio, yRatio] of points) {
      const x = left + (right - left) * xRatio;
      const y = top + (bottom - top) * yRatio;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === node || node.contains(hit))) {
        return {
          x: Number(x.toFixed(3)),
          y: Number(y.toFixed(3)),
          coordinateSpace: "viewport"
        };
      }
    }
    return null;
  }
  function detectExplicitEmptyResults() {
    const statusText = Array.from(document.querySelectorAll('[role="status"], [aria-live], [class*="empty" i]')).filter((node) => isRenderable(node)).map((node) => text(node)).join(" ").slice(0, 2e3);
    return /(?:暂无(?:相关)?(?:内容|结果)|没有找到|无搜索结果|no results|nothing found)/i.test(statusText);
  }
  function isRenderable(node) {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && style.pointerEvents !== "none" && rect.width > 4 && rect.height > 4;
  }
  function firstVisible(selectors) {
    for (const selector of selectors) {
      for (const node of document.querySelectorAll(selector)) {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const disabled = node.disabled || node.getAttribute?.("aria-disabled") === "true";
        if (!disabled && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && style.pointerEvents !== "none" && rect.width > 4 && rect.height > 4) return node;
      }
    }
    return null;
  }
  function firstNode(selectors, root = document) {
    for (const selector of selectors || []) {
      try {
        const node = root.querySelector(selector);
        if (node) return node;
      } catch {
      }
    }
    return null;
  }
  function text(node) {
    return String(node?.innerText || node?.textContent || "").replace(/\s+/g, " ").trim();
  }
  function readMeta(names) {
    for (const name of names) {
      const value = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content;
      if (value) return String(value).trim();
    }
    return "";
  }
  function normalizeSite(value) {
    const aliases = { xhs: "xiaohongshu", redbook: "xiaohongshu", rednote: "xiaohongshu", dy: "douyin", yt: "youtube", generic_web: "web", generic: "web" };
    const normalized = String(value || "").trim().toLowerCase();
    return aliases[normalized] || normalized || "web";
  }
  function normalizeDetailOpenMode(value) {
    return String(value || "direct_url").trim().toLowerCase() === "page_click" ? "page_click" : "direct_url";
  }
  function inferSite(hostname) {
    const host = String(hostname || "").toLowerCase();
    if (host.includes("xiaohongshu.com") || host.includes("rednote.com")) return "xiaohongshu";
    if (host.includes("douyin.com")) return "douyin";
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    return "web";
  }
  function normalizeUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return /^https?:$/.test(url.protocol) ? url.toString() : "";
    } catch {
      return "";
    }
  }
  function externalIdFromUrl(value) {
    try {
      const parts = new URL(value, location.href).pathname.split("/").filter(Boolean);
      return parts.at(-1) || "";
    } catch {
      return "";
    }
  }
  function isLikelyContentUrl(value) {
    return /\/(explore|discovery\/item|video|watch)\//.test(value) || /[?&]v=/.test(value);
  }
  function clamp2(value, minimum, maximum, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, Math.floor(number))) : fallback;
  }

  // src/browserControlContent.js
  var XWOW_READ_FRAME = "xwow-data-ai:read-frame";
  var XWOW_DOM_SNAPSHOT = "xwow-data-ai:dom-snapshot";
  var XWOW_SITE_RESEARCH_EXTRACT = "xwow-data-ai:site-research-extract";
  var XWOW_SITE_RESEARCH_APPLY_FILTERS = "xwow-data-ai:site-research-apply-filters";
  var XWOW_SITE_RESEARCH_SUBMIT_SEARCH = "xwow-data-ai:site-research-submit-search";
  var XWOW_SITE_RESEARCH_PREPARE_ITEM_CLICK = "xwow-data-ai:site-research-prepare-item-click";
  var XWOW_SITE_RESEARCH_PREPARE_ITEM_CLOSE = "xwow-data-ai:site-research-prepare-item-close";
  var XWOW_SCROLL_PAGE = "xwow-data-ai:scroll-page";
  var XWOW_CLICK_NEXT = "xwow-data-ai:click-next";
  var XWOW_CLICK_ELEMENT = "xwow-data-ai:click-element";
  var XWOW_CLICK_NODE = "xwow-data-ai:click-node";
  var XWOW_HOVER_ELEMENT = "xwow-data-ai:hover-element";
  var XWOW_INSPECT_POINT = "xwow-data-ai:inspect-point";
  var XWOW_SCROLL_NODE = "xwow-data-ai:scroll-node";
  var XWOW_SELECT_ELEMENT = "xwow-data-ai:select-element";
  var XWOW_TYPE_ELEMENT = "xwow-data-ai:type-element";
  var XWOW_WAIT_STABLE = "xwow-data-ai:wait-stable";
  var XWOW_WAIT_SELECTOR = "xwow-data-ai:wait-selector";
  var XWOW_WAIT_NODE = "xwow-data-ai:wait-node";
  var XWOW_CHECK_ELEMENT = "xwow-data-ai:check-element";
  var XWOW_IS_CHECKED = "xwow-data-ai:is-checked";
  var XWOW_IS_VISIBLE = "xwow-data-ai:is-visible";
  var XWOW_GET_VALUE = "xwow-data-ai:get-value";
  var XWOW_GET_VALUES = "xwow-data-ai:get-values";
  var XWOW_GET_ATTRIBUTE = "xwow-data-ai:get-attribute";
  var XWOW_QUERY_ELEMENTS = "xwow-data-ai:query-elements";
  var XWOW_DETECT_BROWSER_BLOCKER = "xwow-data-ai:detect-browser-blocker";
  var XWOW_PAGE_ASSETS = "xwow-data-ai:page-assets";
  var XWOW_CURSOR_MOVE = "xwow-data-ai:cursor-move";
  var XWOW_CURSOR_HIDE = "xwow-data-ai:cursor-hide";
  var XWOW_CONTENT_PING = "xwow-data-ai:content-ping";
  var XWOW_CONTROL_BADGE = "xwow-data-ai:control-badge";
  var TARGET_CONTENT_PING = "CONTENT_PING";
  var TARGET_CONTROL_BADGE = "AGENT_CONTROL_BADGE";
  var XWOW_TAB_FAVICON_BADGE = "TAB_FAVICON_BADGE";
  var TARGET_CURSOR_STATE = "AGENT_CURSOR_STATE";
  var TARGET_GET_CURSOR_STATE = "GET_AGENT_CURSOR_STATE";
  var TARGET_GET_CONTROL_BADGE_STATE = "GET_AGENT_CONTROL_BADGE_STATE";
  var contentRuntime = installContentRuntimeLifecycle();
  var pendingContentRequests = /* @__PURE__ */ new Map();
  function handleContentRuntimeMessage(message, sender, sendResponse) {
    if (message?.type === "xwow-data-ai:cancel-request") {
      pendingContentRequests.get(message.requestId)?.abort();
      sendResponse({ success: true });
      return false;
    }
    if (contentRuntime.disposed) return false;
    const requestController = new AbortController();
    if (message?.requestId) pendingContentRequests.set(message.requestId, requestController);
    message = { ...message, options: { ...message?.options, signal: requestController.signal, assertActive: () => {
      requestController.signal.throwIfAborted();
      if (contentRuntime.disposed) throw new Error("content_runtime_disposed");
    } } };
    void (async () => {
      if (message?.type === XWOW_CONTENT_PING || message?.type === TARGET_CONTENT_PING) {
        sendResponse({ success: true, ok: true, frameUrl: location.href });
        return;
      }
      if (message?.type === XWOW_READ_FRAME) {
        sendResponse({ success: true, data: readFrame(message.options || {}) });
        return;
      }
      if (message?.type === XWOW_DOM_SNAPSHOT) {
        sendResponse(readDomSnapshot(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SITE_RESEARCH_EXTRACT) {
        sendResponse(extractSiteResearch(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SITE_RESEARCH_APPLY_FILTERS) {
        sendResponse(await applySiteResearchFilters(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SITE_RESEARCH_SUBMIT_SEARCH) {
        sendResponse(await submitSiteResearchSearch(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SITE_RESEARCH_PREPARE_ITEM_CLICK) {
        sendResponse(await prepareSiteResearchItemClick(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SITE_RESEARCH_PREPARE_ITEM_CLOSE) {
        sendResponse(await prepareSiteResearchItemClose(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SCROLL_PAGE) {
        sendResponse(await scrollPage(message.options || {}));
        return;
      }
      if (message?.type === XWOW_CLICK_NEXT) {
        sendResponse(await clickNextButton(message.options || {}));
        return;
      }
      if (message?.type === XWOW_CLICK_ELEMENT) {
        sendResponse(await clickElement(message.options || {}));
        return;
      }
      if (message?.type === XWOW_CLICK_NODE) {
        sendResponse(await clickNode(message.options || {}));
        return;
      }
      if (message?.type === XWOW_HOVER_ELEMENT) {
        sendResponse(await hoverElement(message.options || {}));
        return;
      }
      if (message?.type === XWOW_INSPECT_POINT) {
        sendResponse(inspectPoint(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SCROLL_NODE) {
        sendResponse(scrollNode(message.options || {}));
        return;
      }
      if (message?.type === XWOW_SELECT_ELEMENT) {
        sendResponse(await selectElement(message.options || {}));
        return;
      }
      if (message?.type === "xwow-data-ai:focus-element") {
        sendResponse(focusElement(message.options || {}));
        return;
      }
      if (message?.type === XWOW_TYPE_ELEMENT) {
        sendResponse(await typeElement(message.options || {}));
        return;
      }
      if (message?.type === XWOW_WAIT_STABLE) {
        sendResponse(await waitForDomStable(message.options || {}));
        return;
      }
      if (message?.type === XWOW_WAIT_SELECTOR) {
        sendResponse(await waitForSelector(message.options || {}));
        return;
      }
      if (message?.type === XWOW_WAIT_NODE) {
        sendResponse(await waitForNode(message.options || {}));
        return;
      }
      if (message?.type === XWOW_CHECK_ELEMENT) {
        sendResponse(await checkElement(message.options || {}));
        return;
      }
      if (message?.type === XWOW_IS_CHECKED) {
        sendResponse(isCheckedElement(message.options || {}));
        return;
      }
      if (message?.type === XWOW_IS_VISIBLE) {
        sendResponse(isElementVisible(message.options || {}));
        return;
      }
      if (message?.type === XWOW_GET_VALUE) {
        sendResponse(getElementValue(message.options || {}));
        return;
      }
      if (message?.type === XWOW_GET_VALUES) {
        sendResponse(getElementValues(message.options || {}));
        return;
      }
      if (message?.type === XWOW_GET_ATTRIBUTE) {
        sendResponse(getElementAttribute(message.options || {}));
        return;
      }
      if (message?.type === XWOW_QUERY_ELEMENTS) {
        sendResponse(queryElements(message.options || {}));
        return;
      }
      if (message?.type === XWOW_DETECT_BROWSER_BLOCKER) {
        sendResponse(detectBrowserAutomationBlocker(message.options || {}));
        return;
      }
      if (message?.type === XWOW_PAGE_ASSETS) {
        sendResponse({ success: true, assets: readPageAssets(message.options || {}) });
        return;
      }
      if (message?.type === XWOW_CURSOR_MOVE) {
        sendResponse(moveAgentCursor(message.options || {}));
        return;
      }
      if (message?.type === TARGET_CURSOR_STATE) {
        sendResponse(applyAgentCursorState(message.state || message.options?.state || message.options || {}));
        return;
      }
      if (message?.type === XWOW_CURSOR_HIDE) {
        sendResponse(hideAgentCursor());
        return;
      }
      if (message?.type === XWOW_TAB_FAVICON_BADGE) {
        sendResponse(applyTabFaviconBadge(message.options || {}));
        return;
      }
      if (message?.type === XWOW_CONTROL_BADGE || message?.type === TARGET_CONTROL_BADGE) {
        sendResponse(applyControlledTabBadge(message.state || message.options || {}));
        return;
      }
      sendResponse({ success: false, error: "Unknown content message type" });
    })().catch((error) => {
      sendResponse({ success: false, cancelled: requestController.signal.aborted, error: error instanceof Error ? error.message : String(error) });
    }).finally(() => {
      if (message?.requestId) pendingContentRequests.delete(message.requestId);
    });
    return true;
  }
  chrome.runtime.onMessage.addListener(handleContentRuntimeMessage);
  contentRuntime.onDispose(() => {
    for (const controller of pendingContentRequests.values()) controller.abort();
    pendingContentRequests.clear();
    chrome.runtime.onMessage.removeListener(handleContentRuntimeMessage);
  });
  chrome.runtime.sendMessage({ type: TARGET_GET_CURSOR_STATE }).then((response) => {
    if (contentRuntime.disposed) return;
    if (response?.state) applyAgentCursorState(response.state);
  }).catch(() => {
  });
  chrome.runtime.sendMessage({ type: TARGET_GET_CONTROL_BADGE_STATE }).then((response) => {
    if (contentRuntime.disposed) return;
    if (response?.state) applyControlledTabBadge(response.state);
  }).catch(() => {
  });
})();
