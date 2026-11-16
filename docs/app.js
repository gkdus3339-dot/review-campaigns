/* 체험단 노트 — login-free static UI. Data stays in localStorage. */
(function () {
  "use strict";

  const RN = window.RN;
  const view = document.getElementById("view");
  const nav = document.getElementById("nav");
  const toastRoot = document.getElementById("toast-root");

  if (!RN) {
    view.innerHTML = '<div class="card error-box"><p>앱 파일을 불러오지 못했습니다.</p></div>';
    return;
  }

  const FIELD_LABEL = {
    platform: "체험단",
    phone: "연락할 번호",
    business_name: "업체명",
    category: "카테고리",
    offer: "제공 내역",
    amount: "제공 금액",
    region: "주소/지역",
    visit_start: "방문 시작일",
    visit_end: "방문 종료일",
    visit_time_start: "방문 시작 시간",
    visit_time_end: "방문 종료 시간",
    visit_date: "방문 예약일",
    deadline: "리뷰 마감일",
    won_date: "당첨일",
    keywords: "필수 키워드",
    mission: "미션",
    guide: "가이드 메모",
    campaign_url: "캠페인 링크",
    status: "상태",
  };

  const SAMPLE = `[레뷰] 캠페인 선정 안내
[서울 마포] '오늘도파스타' 캠페인에 선정되셨습니다🎉
■ 제공내역 : 파스타 2종 + 음료 2잔 (5만원 상당)
■ 방문기간 : 11.15(토) ~ 11.30(일)
■ 리뷰 등록기간 : 11.16 ~ 12.07
■ 주소 : 서울 마포구 동교로 123 1층
■ 필수 키워드 : 연남동 파스타, 연남동 맛집
■ 가이드
- 사진 15장 이상, 지도 첨부 필수
https://www.revu.net/campaign/123456`;

  const TITLES = {
    home: "체험단 노트",
    new: "체험단 추가",
    edit: "캠페인 수정",
    list: "캠페인 목록",
    calendar: "캘린더",
    stats: "절약 금액",
    settings: "설정",
    detail: "캠페인 상세",
  };

  const state = {
    ready: false,
    error: null,
    today: "",
    campaigns: [],
    platforms: RN.DEFAULT_PLATFORMS.slice(),
    toast: null,
    toastTimer: 0,
    statusTimer: 0,
  };

  let currentKey = null;
  let viewState = {};

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function linkify(text) {
    return String(text).split(/(https?:\/\/[^\s<>"']+)/gi).map((part) => {
      if (!/^https?:\/\//i.test(part)) return esc(part);
      const href = part.replace(/[),.;]+$/, "");
      const trail = part.slice(href.length);
      if (!RN.isSafeUrl(href)) return esc(part);
      return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(href)}</a>${esc(trail)}`;
    }).join("");
  }

  function telHref(phone) {
    const digits = String(phone).replace(/\D/g, "");
    return digits ? `tel:${digits}` : "";
  }

  function icon(size, body, sw, cls) {
    return `<svg class="${cls || ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  const icons = {
    home: (s) => icon(s, '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    calendar: (s) => icon(s, '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
    list: (s) => icon(s, '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>'),
    chart: (s) => icon(s, '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    plus: (s) => icon(s, '<path d="M12 5v14M5 12h14"/>'),
    settings: (s) => icon(s, '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    check: (s) => icon(s, '<path d="m5 12.5 4.5 4.5L19 7.5"/>', 3),
    left: (s) => icon(s, '<path d="m15 18-6-6 6-6"/>'),
    right: (s) => icon(s, '<path d="m9 18 6-6-6-6"/>'),
    down: (s) => icon(s, '<path d="m6 9 6 6 6-6"/>', 2, "chev"),
    clipboard: (s) => icon(s, '<rect x="8" y="2.5" width="8" height="4" rx="1"/><path d="M16 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2"/><path d="M9 13h6M9 17h4"/>'),
    link: (s) => icon(s, '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    pin: (s) => icon(s, '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
    search: (s) => icon(s, '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    trash: (s) => icon(s, '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
    spark: (s) => icon(s, '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'),
  };

  function boot() {
    try {
      const stored = RN.loadLocal();
      state.campaigns = stored.campaigns;
      state.platforms = stored.platforms;
      state.error = null;
    } catch (error) {
      state.error = error instanceof Error ? error.message : "불러오지 못했습니다";
    }
    state.today = RN.todayISO();
    state.ready = true;
  }

  function replaceCampaign(campaign) {
    state.campaigns = state.campaigns.map((item) => (item.id === campaign.id ? campaign : item));
  }

  function findCampaign(id) {
    return state.campaigns.find((item) => item.id === id) || null;
  }

  function parseRoute() {
    const rawHash = location.hash.replace(/^#/, "");
    const q = rawHash.indexOf("?");
    const query = q >= 0 ? rawHash.slice(q + 1) : "";
    const pathPart = q >= 0 ? rawHash.slice(0, q) : rawHash;
    const parts = pathPart.split("/").filter(Boolean);
    const params = new URLSearchParams(query);
    const path = `/${parts.join("/")}`;
    if (parts.length === 0) return { name: "home", path: "/", params, id: null };
    if (parts[0] === "new") return { name: "new", path, params, id: null };
    if (parts[0] === "calendar") return { name: "calendar", path, params, id: null };
    if (parts[0] === "list") return { name: "list", path, params, id: null };
    if (parts[0] === "stats") return { name: "stats", path, params, id: null };
    if (parts[0] === "settings") return { name: "settings", path, params, id: null };
    if (parts[0] === "c" && parts[1] && parts[2] === "edit") {
      return { name: "edit", path, params, id: decodeURIComponent(parts[1]) };
    }
    if (parts[0] === "c" && parts[1]) return { name: "detail", path, params, id: decodeURIComponent(parts[1]) };
    return { name: "home", path: "/", params, id: null };
  }

  function freshView(route) {
    if (route.name === "new" || route.name === "edit") {
      const campaign = route.name === "edit" ? findCampaign(route.id) : null;
      if (route.name === "edit" && !campaign) return { missing: true, mode: "edit" };
      const initial = {};
      if (campaign) {
        for (const key of RN.CAMPAIGN_FIELDS) initial[key] = campaign[key];
      } else {
        Object.assign(initial, RN.emptyCampaign(state.today));
      }
      return {
        missing: false,
        mode: route.name === "edit" ? "edit" : "create",
        id: campaign ? campaign.id : null,
        form: initial,
        amountText: initial.amount != null ? initial.amount.toLocaleString("ko-KR") : "",
        auto: new Set(),
        pasteOpen: route.name === "new",
        message: "",
        parseNote: null,
        saving: false,
        error: null,
      };
    }
    if (route.name === "list") {
      return {
        status: route.params.get("filter") === "unwritten" ? "unwritten" : "",
        platform: "",
        query: "",
        sort: "urgent",
      };
    }
    if (route.name === "calendar") return { month: null, selected: null };
    if (route.name === "stats") return { open: null };
    if (route.name === "settings") return { list: state.platforms.slice(), name: "", status: null };
    if (route.name === "detail") return { copied: false, busy: false };
    return {};
  }

  function render() {
    const routeKey = location.hash || "#/";
    const routeChanged = routeKey !== currentKey;
    const active = document.activeElement;
    const focusId = !routeChanged && active && active.id ? active.id : "";
    const selection = !routeChanged && focusId && active && "selectionStart" in active
      ? [active.selectionStart, active.selectionEnd]
      : null;
    try {
      if (routeChanged) {
        currentKey = routeKey;
        viewState = freshView(parseRoute());
      }
      const route = parseRoute();
      view.innerHTML = pageHtml(route);
      nav.innerHTML = navHtml(route);
      document.title = TITLES[route.name] || "체험단 노트";
      if (routeChanged) window.scrollTo(0, 0);
      if (focusId) {
        const el = document.getElementById(focusId);
        if (el) {
          el.focus();
          if (selection && el.setSelectionRange) {
            try { el.setSelectionRange(selection[0], selection[1]); } catch (error) { /* date inputs */ }
          }
        }
      }
    } catch (error) {
      view.innerHTML = errorBox(error instanceof Error ? error.message : "화면을 그리지 못했습니다");
    }
  }

  function replaceHash(hash) {
    history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
    render();
  }

  function pageHtml(route) {
    if (!state.ready) {
      return '<div class="stack"><div class="skeleton tall"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
    }
    if (state.error) return errorBox(state.error);
    if (route.name === "home") return dashboard();
    if (route.name === "new" || route.name === "edit") return formPage();
    if (route.name === "list") return listPage();
    if (route.name === "calendar") return calendarPage();
    if (route.name === "stats") return statsPage();
    if (route.name === "settings") return settingsPage();
    if (route.name === "detail") return detailPage(route.id);
    return dashboard();
  }

  function navHtml(route) {
    const tabs = [
      ["/", "홈", "home", false],
      ["/calendar", "캘린더", "calendar", false],
      ["/new", "추가", "plus", true],
      ["/list", "목록", "list", false],
      ["/stats", "통계", "chart", false],
    ];
    return tabs.map(([href, label, name, primary]) => {
      const active = href === "/" ? route.path === "/" : route.path.startsWith(href);
      return `<a href="#${href}" class="tab${active ? " active" : ""}${primary ? " primary" : ""}"${active ? ' aria-current="page"' : ""}><span class="tab-icon">${icons[name](primary ? 24 : 22)}</span><span class="tab-label">${label}</span></a>`;
    }).join("");
  }

  function errorBox(message) {
    return `<div class="card error-box"><p>${esc(message)}</p><button type="button" class="btn" data-action="reload">다시 시도</button></div>`;
  }

  function emptyBox(title, inner) {
    return `<div class="empty"><p class="empty-title">${esc(title)}</p>${inner || ""}</div>`;
  }

  function pageHeader(title, subHtml, actionHtml) {
    const action = actionHtml || `<a href="#/settings" class="icon-btn" aria-label="설정">${icons.settings(20)}</a>`;
    return `<header class="page-header"><div><h1>${esc(title)}</h1>${subHtml ? `<p class="sub">${subHtml}</p>` : ""}</div>${action}</header>`;
  }

  function backButton() {
    return `<button type="button" class="icon-btn" data-action="back" aria-label="뒤로">${icons.left(20)}</button>`;
  }

  function statusBadge(status) {
    const cls = {
      "당첨": "s-won",
      "방문 예정": "s-planned",
      "방문 완료": "s-visited",
      "리뷰 작성 완료": "s-reviewed",
      "종료": "s-closed",
      "취소": "s-cancel",
    }[status] || "s-won";
    return `<span class="badge status ${cls}">${esc(status)}</span>`;
  }

  function ddayBadge(date, today) {
    const days = RN.diffDays(today, date);
    const tone = days < 0 ? "overdue" : days === 0 ? "today" : days <= 3 ? "soon" : "later";
    return `<span class="badge dday ${tone}">${esc(RN.dDayLabel(days))}</span>`;
  }

  function reviewToggle(campaign, compact) {
    if (campaign.status === "취소") return "";
    const done = RN.isReviewDone(campaign.status);
    return `<button type="button" role="switch" aria-checked="${done ? "true" : "false"}" aria-label="${esc(campaign.business_name)} 리뷰 작성 완료" class="review-toggle${done ? " on" : ""}${compact ? " compact" : ""}" data-action="review" data-id="${esc(campaign.id)}"><span class="box">${done ? icons.check(14) : ""}</span><span class="txt">리뷰 완료</span></button>`;
  }

  function campaignCard(campaign, today, event) {
    const shown = event === undefined ? (RN.upcomingEvents([campaign], today)[0] ?? null) : event;
    const overdue = shown ? RN.diffDays(today, shown.date) < 0 : false;
    const cancelled = campaign.status === "취소";
    const eventHtml = shown
      ? `<p class="cc-event k-${shown.kind}"><span class="cc-event-label">${esc(RN.EVENT_LABEL[shown.kind])}</span><span>${esc(RN.formatShort(shown.date))}</span>${ddayBadge(shown.date, today)}${overdue ? '<span class="overdue-text">지남</span>' : ""}</p>`
      : (campaign.visit_start || campaign.visit_end)
        ? `<p class="cc-event muted">방문 ${esc(RN.formatRange(campaign.visit_start, campaign.visit_end))}</p>`
        : "";
    const offerHtml = (campaign.offer || campaign.amount != null)
      ? `<p class="cc-offer">${campaign.offer ? `<span class="ellipsis">${esc(campaign.offer.split("\n")[0])}</span>` : ""}${campaign.amount != null ? `<span class="cc-amount">${esc(RN.formatWon(campaign.amount))}</span>` : ""}</p>`
      : "";
    return `<div class="campaign-card${overdue ? " overdue" : ""}${cancelled ? " cancelled" : ""}"><a class="cc-main" href="#/c/${encodeURIComponent(campaign.id)}"><div class="cc-meta">${campaign.platform ? `<span class="chip platform">${esc(campaign.platform)}</span>` : ""}${campaign.category ? `<span class="cc-category">${esc(campaign.category)}</span>` : ""}${statusBadge(campaign.status)}</div><p class="cc-name">${esc(campaign.business_name)}</p>${eventHtml}${offerHtml}</a>${cancelled ? "" : reviewToggle(campaign, true)}</div>`;
  }

  function dashboard() {
    const today = state.today;
    const date = RN.parseISO(today);
    const events = RN.upcomingEvents(state.campaigns, today);
    const overdue = events.filter((event) => RN.diffDays(today, event.date) < 0);
    const soon = events.filter((event) => {
      const days = RN.diffDays(today, event.date);
      return days >= 0 && days <= 30;
    });
    const later = events.length - overdue.length - soon.length;
    const unwritten = state.campaigns.filter((campaign) => RN.needsReview(campaign.status));
    const overdueReviews = unwritten.filter((campaign) => campaign.deadline && campaign.deadline < today);
    const undated = unwritten.filter((campaign) => !campaign.deadline && !events.some((event) => event.campaign.id === campaign.id));
    const thisMonth = RN.monthlySavings(state.campaigns).get(RN.monthKey(today));
    const tone = overdueReviews.length ? " alert" : unwritten.length ? " warn" : "";
    const foot = overdueReviews.length
      ? `마감 지남 ${overdueReviews.length}건`
      : unwritten.length
        ? "작성 대기 중"
        : "모두 완료!";
    let body = "";
    if (state.campaigns.length === 0) {
      body = emptyBox(
        "아직 등록된 체험단이 없어요",
        `<p>당첨 문자나 카톡을 붙여넣으면 자동으로 채워 드려요.</p><div class="row gap"><a href="#/new" class="btn primary">${icons.clipboard(18)} 당첨 메시지 붙여넣기</a><a href="#/new" class="btn">${icons.plus(18)} 직접 입력</a></div>`,
      );
    } else {
      if (overdue.length) {
        body += `<section class="section"><h2 class="section-title danger">기한 지남 <span class="count">${overdue.length}</span></h2><div class="stack-sm">${overdue.map((event) => campaignCard(event.campaign, today, event)).join("")}</div></section>`;
      }
      body += `<section class="section"><h2 class="section-title">다가오는 일정 <span class="count">${soon.length}</span></h2>${soon.length === 0 ? '<p class="muted pad">앞으로 30일 안에 예정된 방문이나 마감이 없어요.</p>' : `<div class="stack-sm">${soon.map((event) => campaignCard(event.campaign, today, event)).join("")}</div>`}${later > 0 ? `<a href="#/calendar" class="more-link">이후 일정 ${later}건 캘린더에서 보기 →</a>` : ""}</section>`;
      if (undated.length) {
        body += `<section class="section"><h2 class="section-title">날짜 미정 · 리뷰 미작성 <span class="count">${undated.length}</span></h2><div class="stack-sm">${undated.map((campaign) => campaignCard(campaign, today, null)).join("")}</div></section>`;
      }
      body += `<p class="muted small center">오늘 ${esc(RN.formatShort(today))} 기준 · 방문일과 리뷰 마감일이 가까운 순서</p>`;
    }
    return `<div class="stack">${pageHeader("체험단 노트", `${date.getMonth() + 1}월 ${date.getDate()}일 ${RN.WEEKDAYS[date.getDay()]}요일`)}<div class="summary-grid"><a href="#/stats" class="summary savings"><span class="summary-label">${date.getMonth() + 1}월 절약 금액</span><strong class="summary-value">${esc(RN.formatWon(thisMonth?.total ?? 0))}</strong><span class="summary-foot">캠페인 ${thisMonth?.campaigns.length ?? 0}건</span></a><a href="#/list?filter=unwritten" class="summary unwritten${tone}"><span class="summary-label">미작성 리뷰</span><strong class="summary-value">${unwritten.length}건</strong><span class="summary-foot">${esc(foot)}</span></a></div>${body}</div>`;
  }

  function field(opts) {
    const head = `<span class="field-label">${esc(opts.label)}${opts.required ? "<em>*</em>" : ""}${opts.auto ? '<span class="auto-tag">자동 입력</span>' : ""}${opts.hint ? `<span class="hint">${esc(opts.hint)}</span>` : ""}${opts.extra ? `<span class="field-extra">${opts.extra}</span>` : ""}</span>`;
    const cls = `field${opts.auto ? " auto" : ""}`;
    const attr = opts.autoKey ? ` data-auto="${esc(opts.autoKey)}"` : "";
    if (opts.group) return `<div class="${cls}" role="group" aria-label="${esc(opts.label)}"${attr}>${head}${opts.body}</div>`;
    return `<label class="${cls}"${attr}>${head}${opts.body}</label>`;
  }

  function choiceChips(options, current, action, dangerValue) {
    return `<div class="chips wrap">${options.map((option) => {
      const active = current === option ? " active" : "";
      const danger = option === dangerValue ? " danger" : "";
      return `<button type="button" class="chip-btn${active}${danger}" data-action="${action}" data-value="${esc(option)}">${esc(option)}</button>`;
    }).join("")}</div>`;
  }

  function formPage() {
    if (viewState.missing) return `<div class="stack">${pageHeader(viewState.mode === "edit" ? "캠페인 수정" : "체험단 추가", "", backButton())}${emptyBox("캠페인을 찾을 수 없어요")}</div>`;
    const form = viewState.form;
    const auto = (key) => viewState.auto.has(key);
    const platforms = form.platform && !state.platforms.includes(form.platform) ? state.platforms.concat(form.platform) : state.platforms;
    const categories = form.category && !RN.CATEGORIES.includes(form.category) ? RN.CATEGORIES.concat(form.category) : RN.CATEGORIES.slice();
    const paste = `<section class="card paste${viewState.pasteOpen ? " open" : ""}"><button type="button" class="paste-head" data-action="toggle-paste" aria-expanded="${viewState.pasteOpen ? "true" : "false"}"><span class="paste-icon">${icons.clipboard(20)}</span><span class="paste-title"><strong>당첨 메시지 붙여넣기</strong><span class="muted small">문자·카톡·메일 내용을 붙여넣으면 자동으로 채워져요</span></span>${icons.down(18)}</button>${viewState.pasteOpen ? `<div class="paste-body"><textarea id="paste-box" rows="7" aria-label="당첨 메시지" placeholder="예) [레뷰] 캠페인 선정 안내&#10;■ 제공내역 : 2인 코스 (6만원 상당)&#10;■ 방문기간 : 11.15 ~ 11.30&#10;■ 리뷰 마감 : 12.07">${esc(viewState.message)}</textarea><div class="row gap wrap"><button type="button" class="btn primary" id="parse-btn" data-action="parse" ${viewState.message.trim() ? "" : "disabled"}>${icons.spark(18)} 자동 채우기</button><button type="button" class="btn" data-action="clipboard">클립보드에서 붙여넣기</button><button type="button" class="btn ghost small" data-action="sample">예시로 해보기</button></div></div>` : ""}</section>`;
    const note = viewState.parseNote ? `<p class="parse-note" role="status">${icons.spark(16)} ${esc(viewState.parseNote)}</p>` : "";
    const basics = `<section class="card fields">${field({
      label: "체험단",
      group: true,
      auto: auto("platform"),
      autoKey: "platform",
      hint: "카테고리와 별개예요",
      extra: '<a href="#/settings" class="link small">편집</a>',
      body: choiceChips(platforms, form.platform, "set-platform"),
    })}${field({
      label: "업체명",
      required: true,
      auto: auto("business_name"),
      autoKey: "business_name",
      body: `<input id="f-business_name" data-field="business_name" value="${esc(form.business_name)}" placeholder="예) 오늘도파스타" maxlength="120" required>`,
    })}${field({
      label: "카테고리",
      group: true,
      auto: auto("category"),
      autoKey: "category",
      body: choiceChips(categories, form.category, "set-category"),
    })}${field({
      label: "제공 내역",
      auto: auto("offer"),
      autoKey: "offer",
      body: `<textarea id="f-offer" data-field="offer" rows="2" placeholder="예) 2인 코스 + 음료" maxlength="1000">${esc(form.offer)}</textarea>`,
    })}${field({
      label: "제공 금액",
      auto: auto("amount"),
      autoKey: "amount",
      body: `<div class="input-suffix"><input id="f-amount" data-field="amount" inputmode="numeric" value="${esc(viewState.amountText)}" placeholder="0" aria-label="제공 금액"><span>원</span></div>`,
    })}${field({
      label: "주소/지역",
      auto: auto("region"),
      autoKey: "region",
      body: `<input id="f-region" data-field="region" value="${esc(form.region)}" placeholder="예) 서울 마포구 동교로 123" maxlength="300">`,
    })}${field({
      label: "연락할 번호",
      auto: auto("phone"),
      autoKey: "phone",
      body: `<input id="f-phone" data-field="phone" type="tel" inputmode="tel" value="${esc(form.phone)}" placeholder="예) 010-1234-5678" maxlength="40">`,
    })}</section>`;
    const dates = `<section class="card fields">${field({
      label: "방문 가능 기간",
      auto: auto("visit_start") || auto("visit_end"),
      autoKey: "visit_start visit_end",
      body: `<div class="date-range"><input id="f-visit_start" data-field="visit_start" type="date" value="${esc(form.visit_start ?? "")}" aria-label="방문 시작일"><span>~</span><input id="f-visit_end" data-field="visit_end" type="date" value="${esc(form.visit_end ?? "")}" aria-label="방문 종료일"></div>`,
    })}${field({
      label: "방문 가능 시간",
      auto: auto("visit_time_start") || auto("visit_time_end"),
      autoKey: "visit_time_start visit_time_end",
      hint: "예) 11:00–15:00",
      body: `<div class="date-range"><input id="f-visit_time_start" data-field="visit_time_start" type="time" value="${esc(form.visit_time_start ?? "")}" aria-label="방문 시작 시간"><span>~</span><input id="f-visit_time_end" data-field="visit_time_end" type="time" value="${esc(form.visit_time_end ?? "")}" aria-label="방문 종료 시간"></div>`,
    })}<div class="two-col">${field({
      label: "방문 예약일",
      auto: auto("visit_date"),
      autoKey: "visit_date",
      body: `<input id="f-visit_date" data-field="visit_date" type="date" value="${esc(form.visit_date ?? "")}">`,
    })}${field({
      label: "리뷰 마감일",
      auto: auto("deadline"),
      autoKey: "deadline",
      body: `<input id="f-deadline" data-field="deadline" type="date" value="${esc(form.deadline ?? "")}">`,
    })}</div>${field({
      label: "당첨일",
      auto: auto("won_date"),
      autoKey: "won_date",
      hint: "방문일이 없을 때 절약 금액 집계 기준",
      body: `<input id="f-won_date" data-field="won_date" type="date" value="${esc(form.won_date ?? "")}">`,
    })}${field({
      label: "상태",
      group: true,
      auto: auto("status"),
      autoKey: "status",
      body: choiceChips(RN.STATUSES, form.status, "set-status", "취소"),
    })}</section>`;
    const notes = `<section class="card fields">${field({
      label: "필수 키워드",
      auto: auto("keywords"),
      autoKey: "keywords",
      hint: "쉼표로 구분",
      body: `<input id="f-keywords" data-field="keywords" value="${esc(form.keywords)}" placeholder="예) 연남동 맛집, 홍대 데이트" maxlength="1000">`,
    })}${field({
      label: "미션",
      auto: auto("mission"),
      autoKey: "mission",
      hint: "번호와 링크를 그대로 붙여 넣어요",
      body: `<textarea id="f-mission" data-field="mission" rows="8" placeholder="1. 제목에 키워드를 넣어 주세요" maxlength="8000">${esc(form.mission)}</textarea>${form.mission ? `<div class="mission preview">${linkify(form.mission)}</div>` : ""}`,
    })}${field({
      label: "가이드 메모",
      auto: auto("guide"),
      autoKey: "guide",
      body: `<textarea id="f-guide" data-field="guide" rows="4" placeholder="사진 장수, 필수 문구, 지도 첨부 등" maxlength="5000">${esc(form.guide)}</textarea>`,
    })}${field({
      label: "캠페인 링크",
      auto: auto("campaign_url"),
      autoKey: "campaign_url",
      body: `<input id="f-campaign_url" data-field="campaign_url" type="url" inputmode="url" value="${esc(form.campaign_url)}" placeholder="https://" maxlength="2000">`,
    })}${field({
      label: "작성한 리뷰 URL",
      body: `<input id="f-review_url" data-field="review_url" type="url" inputmode="url" value="${esc(form.review_url)}" placeholder="https://blog.naver.com/..." maxlength="2000">`,
    })}</section>`;
    const error = viewState.error ? `<p class="form-error" role="alert">${esc(viewState.error)}</p>` : "";
    return `<div class="stack">${pageHeader(viewState.mode === "edit" ? "캠페인 수정" : "체험단 추가", "", backButton())}<form id="campaign-form" data-form="campaign" class="stack form" autocomplete="off">${paste}${note}${basics}${dates}${notes}${error}<div class="sticky-actions"><button type="submit" class="btn primary block" ${viewState.saving ? "disabled" : ""}>${viewState.saving ? "저장 중..." : viewState.mode === "edit" ? "수정 완료" : "저장하기"}</button></div></form></div>`;
  }

  function listPage() {
    const today = state.today;
    const q = viewState.query.trim().toLowerCase();
    const names = state.platforms.slice();
    for (const campaign of state.campaigns) {
      if (campaign.platform && !names.includes(campaign.platform)) names.push(campaign.platform);
    }
    let filtered = state.campaigns.filter((campaign) => {
      if (viewState.status === "unwritten" ? !RN.needsReview(campaign.status) : viewState.status && campaign.status !== viewState.status) return false;
      if (viewState.platform && campaign.platform !== viewState.platform) return false;
      if (!q) return true;
      return [campaign.business_name, campaign.platform, campaign.category, campaign.offer, campaign.region, campaign.phone, campaign.keywords, campaign.mission, campaign.guide].join(" ").toLowerCase().includes(q);
    });
    if (viewState.sort !== "recent") {
      const next = new Map(filtered.map((campaign) => [campaign.id, RN.upcomingEvents([campaign], today)[0]?.date ?? null]));
      filtered = filtered.slice().sort((a, b) => {
        const da = next.get(a.id);
        const db = next.get(b.id);
        if (da && db) return da.localeCompare(db);
        if (da) return -1;
        if (db) return 1;
        return 0;
      });
    }
    const unwrittenCount = state.campaigns.filter((campaign) => RN.needsReview(campaign.status)).length;
    const chips = [{ value: "", label: "전체" }, { value: "unwritten", label: `미작성 리뷰 ${unwrittenCount}` }].concat(RN.STATUSES.map((status) => ({ value: status, label: status })));
    const chipHtml = chips.map((chip) => `<button type="button" class="chip-btn${viewState.status === chip.value ? " active" : ""}${chip.value === "unwritten" ? " warn" : ""}" data-action="list-status" data-value="${esc(chip.value)}">${esc(chip.label)}</button>`).join("");
    const options = names.map((name) => `<option value="${esc(name)}"${viewState.platform === name ? " selected" : ""}>${esc(name)}</option>`).join("");
    const list = filtered.length === 0
      ? emptyBox(state.campaigns.length ? "조건에 맞는 캠페인이 없어요" : "아직 등록된 캠페인이 없어요")
      : `<div class="stack-sm">${filtered.map((campaign) => campaignCard(campaign, today)).join("")}</div>`;
    return `<div class="stack">${pageHeader("캠페인 목록", `전체 ${state.campaigns.length}건`)}<div class="search">${icons.search(18)}<input id="search-q" type="search" placeholder="업체명, 지역, 키워드 검색" value="${esc(viewState.query)}" aria-label="검색"></div><div class="chips scroll" role="group" aria-label="상태 필터">${chipHtml}</div><div class="row gap"><select id="filter-platform" class="select" aria-label="체험단"><option value="">모든 체험단</option>${options}</select><select id="filter-sort" class="select" aria-label="정렬"><option value="urgent"${viewState.sort === "urgent" ? " selected" : ""}>급한 순</option><option value="recent"${viewState.sort === "recent" ? " selected" : ""}>최근 등록순</option></select></div>${list}</div>`;
  }

  function calendarPage() {
    const today = state.today;
    const byDate = new Map();
    for (const event of RN.campaignEvents(state.campaigns)) {
      const list = byDate.get(event.date) || [];
      list.push(event);
      byDate.set(event.date, list);
    }
    const current = viewState.month || RN.monthKey(today);
    const day = viewState.selected || today;
    const [year, month] = current.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = Array(first.getDay()).fill(null).concat(Array.from({ length: daysInMonth }, (_, index) => `${current}-${RN.pad(index + 1)}`));
    while (cells.length % 7) cells.push(null);
    const monthEvents = Array.from(byDate.values()).flat().filter((event) => event.date.startsWith(current));
    const visits = monthEvents.filter((event) => event.kind !== "deadline").length;
    const deadlines = monthEvents.filter((event) => event.kind === "deadline").length;
    const dayEvents = byDate.get(day) || [];
    const monthAgenda = RN.upcomingEvents(state.campaigns, today).filter((event) => event.date.startsWith(current) && event.date >= day);
    const dows = RN.WEEKDAYS.map((name, index) => `<div class="cal-dow${index === 0 ? " sun" : index === 6 ? " sat" : ""}">${name}</div>`).join("");
    const cellHtml = cells.map((date, index) => {
      if (!date) return `<div class="cal-blank"></div>`;
      const list = byDate.get(date) || [];
      const dow = RN.parseISO(date).getDay();
      const pills = list.slice(0, 3).map((event) => `<span class="cal-pill k-${event.kind}${event.done ? " done" : ""}${!event.done && date < today ? " late" : ""}">${esc(event.campaign.business_name)}</span>`).join("");
      const more = list.length > 3 ? `<span class="cal-more">+${list.length - 3}</span>` : "";
      return `<button type="button" class="cal-cell${date === today ? " today" : ""}${date === day ? " selected" : ""}${dow === 0 ? " sun" : dow === 6 ? " sat" : ""}" data-action="cal-day" data-date="${date}" aria-label="${esc(RN.formatShort(date))} 일정 ${list.length}건"><span class="cal-num">${Number(date.slice(8))}</span><span class="cal-pills">${pills}${more}</span></button>`;
    }).join("");
    let agenda;
    if (dayEvents.length === 0) {
      agenda = `<p class="muted pad">이 날은 일정이 없어요.</p>${monthAgenda.length ? `<h2 class="section-title">${Number(current.slice(5))}월 남은 일정 <span class="count">${monthAgenda.length}</span></h2><div class="stack-sm">${monthAgenda.map((event) => campaignCard(event.campaign, today, event)).join("")}</div>` : ""}`;
    } else {
      agenda = `<div class="stack-sm">${dayEvents.map((event) => `<div><p class="event-caption k-${event.kind}">${esc(RN.EVENT_LABEL[event.kind])}${event.done ? " · 완료" : ""}</p>${campaignCard(event.campaign, today, event.done ? null : event)}</div>`).join("")}</div>`;
    }
    return `<div class="stack">${pageHeader("캘린더", `방문 ${visits}건 · 리뷰 마감 ${deadlines}건`)}<div class="card calendar"><div class="cal-head"><button type="button" class="icon-btn" data-action="cal-prev" aria-label="이전 달">${icons.left(20)}</button><button type="button" class="cal-title" data-action="cal-today">${esc(RN.monthLabel(current))}</button><button type="button" class="icon-btn" data-action="cal-next" aria-label="다음 달">${icons.right(20)}</button></div><div class="cal-grid">${dows}${cellHtml}</div><div class="cal-legend"><span><i class="dot k-visit"></i> 방문</span><span><i class="dot k-visitEnd"></i> 방문 기한</span><span><i class="dot k-deadline"></i> 리뷰 마감</span></div></div><section class="section"><h2 class="section-title">${esc(RN.formatShort(day))} ${day === today ? '<span class="chip">오늘</span>' : ""}<span class="count">${dayEvents.length}</span></h2>${agenda}</section></div>`;
  }

  function statsPage() {
    const today = state.today;
    const months = RN.monthlySavings(state.campaigns);
    const current = RN.monthKey(today);
    const year = today.slice(0, 4);
    const summary = RN.yearSummary(months, year);
    const chart = RN.recentMonths(months, current, 6);
    const max = Math.max(1, ...chart.map((item) => item.total));
    const list = Array.from(months.values()).sort((a, b) => b.key.localeCompare(a.key));
    const expanded = viewState.open ?? current;
    const missingAmount = state.campaigns.filter((campaign) => campaign.status !== "취소" && campaign.amount == null).length;
    const bars = chart.map((item) => {
      const pct = Math.round((item.total / max) * 100);
      const height = Math.max(pct, item.total ? 4 : 0);
      return `<button type="button" class="bar-col${item.key === current ? " current" : ""}${item.key === expanded ? " picked" : ""}" data-action="stat-month" data-key="${item.key}" aria-label="${esc(RN.monthLabel(item.key))} ${esc(RN.formatWon(item.total))}"><span class="bar-value">${esc(RN.formatManwon(item.total))}</span><span class="bar-track"><span class="bar" style="height:${height}%"></span></span><span class="bar-label">${Number(item.key.slice(5))}월</span></button>`;
    }).join("");
    const rows = list.length === 0
      ? '<p class="muted pad">아직 집계할 캠페인이 없어요.</p>'
      : `<div class="card month-list">${list.map((item) => {
        const isOpen = item.key === expanded;
        const items = item.campaigns.slice().sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)).map((campaign) => `<li><a href="#/c/${encodeURIComponent(campaign.id)}"><span class="mi-name">${esc(campaign.business_name)}<span class="muted small">${esc([campaign.platform, campaign.visit_date ? `방문 ${RN.formatShort(campaign.visit_date)}` : null].filter(Boolean).join(" · "))}</span></span>${statusBadge(campaign.status)}<span class="mi-amount${campaign.amount == null ? " muted" : ""}">${campaign.amount == null ? "금액 미입력" : esc(RN.formatWon(campaign.amount))}</span></a></li>`).join("");
        return `<div class="month-row${isOpen ? " open" : ""}"><button type="button" class="month-head" data-action="month-toggle" data-key="${item.key}" aria-expanded="${isOpen ? "true" : "false"}"><span class="month-name">${esc(RN.monthLabel(item.key))}${item.key === current ? '<span class="chip">이번 달</span>' : ""}</span><span class="month-total">${esc(RN.formatWon(item.total))}</span><span class="month-count">${item.campaigns.length}건</span>${icons.down(18)}</button>${isOpen ? `<ul class="month-items">${items}</ul>` : ""}</div>`;
      }).join("")}</div>`;
    return `<div class="stack">${pageHeader("절약 금액", "체험단으로 아낀 금액 (취소 제외, 방문월 기준)")}<div class="summary-grid"><div class="summary savings"><span class="summary-label">${year}년 누적</span><strong class="summary-value">${esc(RN.formatWon(summary.total))}</strong><span class="summary-foot">캠페인 ${summary.count}건</span></div><div class="summary plain"><span class="summary-label">이번 달</span><strong class="summary-value">${esc(RN.formatWon(months.get(current)?.total ?? 0))}</strong><span class="summary-foot">캠페인 ${months.get(current)?.campaigns.length ?? 0}건</span></div></div><section class="card chart-card"><h2 class="section-title">최근 6개월</h2><div class="bar-chart" role="img" aria-label="최근 월별 절약 금액 막대그래프">${bars}</div></section><section class="section"><h2 class="section-title">월별 내역</h2>${rows}${missingAmount > 0 ? `<p class="muted small pad">제공 금액이 비어 있는 캠페인 ${missingAmount}건은 0원으로 계산돼요.</p>` : ""}</section></div>`;
  }

  function settingsPage() {
    const rows = viewState.list.map((name, index) => `<li><span>${esc(name)}</span><div class="row gap-sm"><button type="button" class="icon-btn sm" data-action="platform-move" data-index="${index}" data-delta="-1" ${index === 0 ? "disabled" : ""} aria-label="${esc(name)} 위로">↑</button><button type="button" class="icon-btn sm" data-action="platform-move" data-index="${index}" data-delta="1" ${index === viewState.list.length - 1 ? "disabled" : ""} aria-label="${esc(name)} 아래로">↓</button><button type="button" class="icon-btn sm danger-text" data-action="platform-remove" data-value="${esc(name)}" aria-label="${esc(name)} 삭제">${icons.trash(16)}</button></div></li>`).join("");
    return `<div class="stack">${pageHeader("설정", "", backButton())}<section class="card"><div class="card-title-row"><h3 class="card-title">체험단 목록</h3>${viewState.status ? `<span class="muted small">${esc(viewState.status)}</span>` : ""}</div><p class="muted small">입력 화면에 표시되고, 당첨 메시지에서 이 이름을 찾아 자동으로 선택해요.</p><ul class="platform-list">${rows}</ul><form class="row gap" data-form="platform"><input id="platform-name" value="${esc(viewState.name)}" placeholder="새 체험단 이름" maxlength="40"><button id="platform-add" type="submit" class="btn primary" ${!viewState.name.trim() || viewState.list.length >= 30 ? "disabled" : ""}>추가</button></form><button type="button" class="btn ghost small" data-action="platform-reset">기본값으로 되돌리기</button></section><p class="muted small center">로그인 없이 이 브라우저에만 저장돼요. 다른 휴대폰이나 PC에서는 비어 있고, 새로고침하거나 탭을 닫아도 여기 데이터는 남아요.</p></div>`;
  }

  function infoRow(label, valueHtml) {
    return `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value">${valueHtml}</span></div>`;
  }

  function safeLink(href, label) {
    if (!RN.isSafeUrl(href)) return `<p class="muted small">${esc(label)}: 잘못된 링크</p>`;
    return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="link-row">${icons.link(18)}<span><strong>${esc(label)}</strong><span class="muted small ellipsis">${esc(href)}</span></span></a>`;
  }

  function detailPage(id) {
    const campaign = findCampaign(id);
    if (!campaign) {
      return `<div class="stack">${pageHeader("캠페인 상세", "", backButton())}${emptyBox("캠페인을 찾을 수 없어요", '<a href="#/list" class="btn">목록으로</a>')}</div>`;
    }
    const keywords = campaign.keywords.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    const stepIndex = RN.FLOW_STATUSES.indexOf(campaign.status);
    const visitOpen = RN.needsVisit(campaign.status);
    const reviewOpen = !RN.isReviewDone(campaign.status) && campaign.status !== "취소";
    const steps = RN.FLOW_STATUSES.map((status, index) => `<li class="${index < stepIndex ? "past" : ""}${index === stepIndex ? " current" : ""}"><button type="button" data-action="flow-status" data-value="${esc(status)}" ${viewState.busy ? "disabled" : ""}><span class="step-dot">${index + 1}</span><span class="step-label">${esc(status)}</span></button></li>`).join("");
    const visitRange = RN.formatRange(campaign.visit_start, campaign.visit_end);
    const timeRange = RN.formatTimeRange(campaign.visit_time_start, campaign.visit_time_end);
    const phoneLink = campaign.phone && telHref(campaign.phone);
    const rows = [
      infoRow("체험단", campaign.platform ? esc(campaign.platform) : '<span class="muted">미정</span>'),
      infoRow("연락할 번호", phoneLink ? `<a class="icon-link" href="${esc(phoneLink)}">${esc(campaign.phone)}</a>` : '<span class="muted">미정</span>'),
      infoRow("방문 가능 기간", `${visitRange ? esc(visitRange) : '<span class="muted">미정</span>'}${visitOpen && !campaign.visit_date && campaign.visit_end ? ddayBadge(campaign.visit_end, state.today) : ""}`),
      infoRow("방문 가능 시간", timeRange ? esc(timeRange) : '<span class="muted">미정</span>'),
      infoRow("방문 예약일", `${campaign.visit_date ? esc(RN.formatShort(campaign.visit_date)) : '<span class="muted">미정</span>'}${visitOpen && campaign.visit_date ? ddayBadge(campaign.visit_date, state.today) : ""}`),
      infoRow("리뷰 마감일", `${campaign.deadline ? esc(RN.formatShort(campaign.deadline)) : '<span class="muted">미정</span>'}${reviewOpen && campaign.deadline ? ddayBadge(campaign.deadline, state.today) : ""}`),
    ];
    if (campaign.won_date) rows.push(infoRow("당첨일", esc(RN.formatShort(campaign.won_date))));
    if (campaign.region) {
      rows.push(infoRow("주소/지역", `<span class="wrap-text">${esc(campaign.region)}</span><a class="icon-link" href="https://map.naver.com/p/search/${encodeURIComponent(campaign.region)}" target="_blank" rel="noopener noreferrer" aria-label="네이버 지도에서 보기">${icons.pin(16)} 지도</a>`));
    }
    const keywordBlock = keywords.length
      ? `<section class="card"><div class="card-title-row"><h3 class="card-title">필수 키워드</h3><button type="button" class="btn small ghost" data-action="copy-keywords">${viewState.copied ? "복사됨" : "복사"}</button></div><div class="chips wrap">${keywords.map((keyword) => `<span class="chip keyword">${esc(keyword)}</span>`).join("")}</div></section>`
      : "";
    const mission = `<section class="card"><h3 class="card-title">미션</h3>${campaign.mission ? `<div class="mission">${linkify(campaign.mission)}</div>` : '<p class="muted">미정</p>'}</section>`;
    const guide = campaign.guide ? `<section class="card"><h3 class="card-title">가이드 메모</h3><p class="pre">${esc(campaign.guide)}</p></section>` : "";
    const links = (campaign.campaign_url || campaign.review_url)
      ? `<section class="card links">${campaign.campaign_url ? safeLink(campaign.campaign_url, "캠페인 페이지") : ""}${campaign.review_url ? safeLink(campaign.review_url, "작성한 리뷰") : ""}</section>`
      : "";
    return `<div class="stack">${pageHeader("캠페인 상세", "", `<div class="row gap-sm">${backButton()}<a href="#/c/${encodeURIComponent(campaign.id)}/edit" class="btn small">수정</a></div>`)}<section class="card hero${campaign.status === "취소" ? " cancelled" : ""}"><div class="cc-meta">${campaign.platform ? `<span class="chip platform">${esc(campaign.platform)}</span>` : ""}${campaign.category ? `<span class="cc-category">${esc(campaign.category)}</span>` : ""}${statusBadge(campaign.status)}</div><h2 class="hero-name">${esc(campaign.business_name)}</h2>${campaign.offer ? `<p class="hero-offer">${esc(campaign.offer)}</p>` : ""}${campaign.amount != null ? `<p class="hero-amount">${esc(RN.formatWon(campaign.amount))} 상당</p>` : ""}${campaign.status !== "취소" ? `<div class="hero-toggle">${reviewToggle(campaign, false)}</div>` : ""}</section><section class="card"><h3 class="card-title">진행 상태</h3><ol class="stepper">${steps}</ol><button type="button" class="btn small ghost${campaign.status === "취소" ? "" : " danger-text"}" data-action="cancel-toggle" ${viewState.busy ? "disabled" : ""}>${campaign.status === "취소" ? "취소 되돌리기" : "캠페인 취소로 표시"}</button></section><section class="card info">${rows.join("")}</section>${keywordBlock}${mission}${guide}${links}<button type="button" class="btn ghost danger-text" data-action="delete-campaign" data-id="${esc(campaign.id)}">${icons.trash(16)} 삭제</button></div>`;
  }

  function showToast(message, undo) {
    clearTimeout(state.toastTimer);
    state.toast = { message, undo: undo || null };
    paintToast();
    state.toastTimer = setTimeout(() => {
      state.toast = null;
      paintToast();
    }, 4000);
  }

  function paintToast() {
    if (!state.toast) {
      toastRoot.innerHTML = "";
      return;
    }
    toastRoot.innerHTML = `<div class="toast" role="status"><span>${esc(state.toast.message)}</span>${state.toast.undo ? '<button type="button" data-action="undo-toast">되돌리기</button>' : ""}</div>`;
  }

  function setReviewDone(campaign, done) {
    const status = done ? "리뷰 작성 완료" : "방문 완료";
    const previous = campaign.status;
    try {
      replaceCampaign(RN.updateLocal(campaign.id, { status }));
      showToast(
        done ? `'${campaign.business_name}' 리뷰 완료!` : `'${campaign.business_name}' 리뷰 미작성으로 변경`,
        () => {
          replaceCampaign(RN.updateLocal(campaign.id, { status: previous }));
          render();
        },
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "저장하지 못했습니다");
    }
    render();
  }

  function updateStatus(id, status) {
    viewState.busy = true;
    render();
    try {
      replaceCampaign(RN.updateLocal(id, { status }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장하지 못했습니다");
    }
    viewState.busy = false;
    render();
  }

  function clearAuto(keys) {
    for (const key of keys) viewState.auto.delete(key);
    document.querySelectorAll("[data-auto]").forEach((node) => {
      const names = node.getAttribute("data-auto").split(/\s+/);
      if (!names.some((name) => viewState.auto.has(name))) {
        node.classList.remove("auto");
        node.querySelectorAll(".auto-tag").forEach((tag) => tag.remove());
      }
    });
  }

  function onField(el) {
    if (!viewState.form) return;
    const key = el.dataset.field;
    if (key === "amount") {
      const digits = el.value.replace(/[^\d]/g, "").slice(0, 10);
      viewState.amountText = digits ? Number(digits).toLocaleString("ko-KR") : "";
      el.value = viewState.amountText;
      clearAuto(["amount"]);
      return;
    }
    const value = el.type === "date" || el.type === "time" ? (el.value || null) : el.value;
    viewState.form[key] = value;
    if (key === "visit_start" || key === "visit_end") clearAuto(["visit_start", "visit_end"]);
    else if (key === "visit_time_start" || key === "visit_time_end") clearAuto(["visit_time_start", "visit_time_end"]);
    else clearAuto([key]);
    if (key === "mission") {
      let preview = el.parentElement && el.parentElement.querySelector(".mission.preview");
      if (String(value).trim()) {
        if (!preview && el.parentElement) {
          el.insertAdjacentHTML("afterend", '<div class="mission preview"></div>');
          preview = el.parentElement.querySelector(".mission.preview");
        }
        if (preview) preview.innerHTML = linkify(value);
      } else if (preview) {
        preview.remove();
      }
    }
    if (key === "visit_date" && value && viewState.form.status === "당첨") {
      viewState.form.status = "방문 예정";
      clearAuto(["status"]);
      document.querySelectorAll('[data-action="set-status"]').forEach((button) => {
        button.classList.toggle("active", button.dataset.value === viewState.form.status);
      });
    }
  }

  function applyParse(text) {
    const parsed = RN.parseWinMessage(text, { today: state.today, platforms: state.platforms });
    if (parsed.filled.length === 0) {
      viewState.parseNote = "인식된 항목이 없어요. 메시지를 확인하거나 직접 입력해 주세요.";
      viewState.message = text;
      render();
      return;
    }
    viewState.form = Object.assign({}, viewState.form, parsed.fields);
    if (parsed.fields.amount !== undefined) {
      viewState.amountText = parsed.fields.amount != null ? parsed.fields.amount.toLocaleString("ko-KR") : "";
    }
    viewState.auto = new Set(parsed.filled);
    const names = parsed.filled.map((key) => FIELD_LABEL[key]).filter(Boolean);
    viewState.parseNote = `${names.length}개 항목을 채웠어요: ${names.join(", ")}. 아래에서 확인 후 저장하세요.`;
    viewState.pasteOpen = false;
    viewState.message = text;
    render();
  }

  function submitCampaign(event) {
    event.preventDefault();
    if (!viewState.form.business_name.trim()) {
      viewState.error = "업체명을 입력해 주세요";
      render();
      return;
    }
    const digits = viewState.amountText.replace(/[^\d]/g, "");
    const input = Object.assign({}, viewState.form, { amount: digits ? Number(digits) : null });
    viewState.saving = true;
    viewState.error = null;
    try {
      if (viewState.mode === "edit") {
        const id = viewState.id;
        replaceCampaign(RN.updateLocal(id, input));
        replaceHash(`#/c/${encodeURIComponent(id)}`);
      } else {
        const campaign = RN.createLocal(input);
        state.campaigns = [campaign].concat(state.campaigns.filter((item) => item.id !== campaign.id));
        replaceHash(`#/c/${encodeURIComponent(campaign.id)}`);
      }
    } catch (error) {
      viewState.saving = false;
      viewState.error = error instanceof Error ? error.message : "저장하지 못했습니다";
      render();
    }
  }

  function savePlatforms(next) {
    try {
      state.platforms = RN.savePlatformsLocal(next);
      viewState.list = state.platforms.slice();
      viewState.status = "저장했어요";
    } catch (error) {
      viewState.list = state.platforms.slice();
      viewState.status = error instanceof Error ? error.message : "저장하지 못했습니다";
    }
    render();
    clearTimeout(state.statusTimer);
    const token = currentKey;
    state.statusTimer = setTimeout(() => {
      if (currentKey === token && viewState) {
        viewState.status = null;
        render();
      }
    }, 1500);
  }

  function shiftMonth(delta) {
    const current = viewState.month || RN.monthKey(state.today);
    const next = RN.addMonths(current, delta);
    viewState.month = next;
    viewState.selected = next === RN.monthKey(state.today) ? state.today : `${next}-01`;
    render();
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "reload") {
      currentKey = null;
      boot();
      render();
      return;
    }
    if (action === "back") {
      if (history.length > 1) history.back();
      else replaceHash("#/");
      return;
    }
    if (action === "undo-toast") {
      const undo = state.toast && state.toast.undo;
      state.toast = null;
      clearTimeout(state.toastTimer);
      paintToast();
      Promise.resolve(undo && undo()).catch(() => {
        boot();
        currentKey = null;
        render();
      });
      return;
    }
    if (action === "review") {
      event.preventDefault();
      const campaign = findCampaign(target.dataset.id);
      if (campaign) setReviewDone(campaign, !RN.isReviewDone(campaign.status));
      return;
    }
    if (action === "toggle-paste") {
      viewState.pasteOpen = !viewState.pasteOpen;
      render();
      return;
    }
    if (action === "parse") {
      applyParse(viewState.message);
      return;
    }
    if (action === "sample") {
      applyParse(SAMPLE);
      return;
    }
    if (action === "clipboard") {
      navigator.clipboard.readText().then((text) => {
        if (text) applyParse(text);
      }).catch(() => {
        viewState.parseNote = "클립보드에 접근할 수 없어요. 입력칸에 길게 눌러 붙여넣어 주세요.";
        render();
      });
      return;
    }
    if (action === "set-platform" || action === "set-category" || action === "set-status") {
      const key = action === "set-platform" ? "platform" : action === "set-category" ? "category" : "status";
      const value = target.dataset.value;
      if (key === "status") viewState.form[key] = value;
      else viewState.form[key] = viewState.form[key] === value ? "" : value;
      clearAuto([key]);
      render();
      return;
    }
    if (action === "list-status") {
      viewState.status = target.dataset.value;
      render();
      return;
    }
    if (action === "cal-prev") return shiftMonth(-1);
    if (action === "cal-next") return shiftMonth(1);
    if (action === "cal-today") {
      viewState.month = RN.monthKey(state.today);
      viewState.selected = state.today;
      render();
      return;
    }
    if (action === "cal-day") {
      viewState.selected = target.dataset.date;
      render();
      return;
    }
    if (action === "stat-month") {
      viewState.open = target.dataset.key;
      render();
      return;
    }
    if (action === "month-toggle") {
      const key = target.dataset.key;
      const expanded = viewState.open ?? RN.monthKey(state.today);
      viewState.open = expanded === key ? "" : key;
      render();
      return;
    }
    if (action === "platform-move") {
      const index = Number(target.dataset.index);
      const delta = Number(target.dataset.delta);
      const next = viewState.list.slice();
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      savePlatforms(next);
      return;
    }
    if (action === "platform-remove") {
      savePlatforms(viewState.list.filter((name) => name !== target.dataset.value));
      return;
    }
    if (action === "platform-reset") {
      savePlatforms(RN.DEFAULT_PLATFORMS.slice());
      return;
    }
    if (action === "flow-status") {
      const campaign = findCampaign(parseRoute().id);
      if (campaign) updateStatus(campaign.id, target.dataset.value);
      return;
    }
    if (action === "cancel-toggle") {
      const campaign = findCampaign(parseRoute().id);
      if (campaign) updateStatus(campaign.id, campaign.status === "취소" ? "당첨" : "취소");
      return;
    }
    if (action === "copy-keywords") {
      const campaign = findCampaign(parseRoute().id);
      if (!campaign) return;
      const text = campaign.keywords.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).join(", ");
      navigator.clipboard.writeText(text).then(() => {
        viewState.copied = true;
        render();
        const token = currentKey;
        setTimeout(() => {
          if (currentKey === token) {
            viewState.copied = false;
            render();
          }
        }, 1500);
      }).catch(() => {});
      return;
    }
    if (action === "delete-campaign") {
      const campaign = findCampaign(target.dataset.id);
      if (!campaign) return;
      if (!confirm(`'${campaign.business_name}' 캠페인을 삭제할까요?`)) return;
      try {
        RN.removeLocal(campaign.id);
        state.campaigns = state.campaigns.filter((item) => item.id !== campaign.id);
        replaceHash("#/list");
      } catch (error) {
        alert(error instanceof Error ? error.message : "삭제하지 못했습니다");
      }
    }
  });

  document.addEventListener("input", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.id === "paste-box") {
      viewState.message = el.value;
      const button = document.getElementById("parse-btn");
      if (button) button.disabled = !el.value.trim();
      return;
    }
    if (el.id === "search-q") {
      viewState.query = el.value;
      render();
      return;
    }
    if (el.id === "platform-name") {
      viewState.name = el.value;
      const button = document.getElementById("platform-add");
      if (button) button.disabled = !el.value.trim() || viewState.list.length >= 30;
      return;
    }
    if (el.dataset.field) onField(el);
  });

  document.addEventListener("change", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.id === "filter-platform") {
      viewState.platform = el.value;
      render();
      return;
    }
    if (el.id === "filter-sort") {
      viewState.sort = el.value;
      render();
      return;
    }
    if (el.dataset.field) onField(el);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.form === "campaign") {
      submitCampaign(event);
      return;
    }
    if (form.dataset.form === "platform") {
      event.preventDefault();
      const name = viewState.name.trim();
      if (!name || viewState.list.includes(name) || viewState.list.length >= 30) return;
      viewState.name = "";
      savePlatforms(viewState.list.concat(name));
    }
  });

  window.addEventListener("hashchange", () => render());
  boot();
  render();
})();
