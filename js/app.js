(() => {
  'use strict';

  const C = window.BACHAL;
  const M = Object.assign({ notices: {}, scenery: [], coach: [], recipe: [] }, window.MEDIA || {});
  const KEY = 'bachal1.v1';
  const DAY_MS = 86400000;

  // ---------- 기본 설정 ----------
  const DEFAULT_EX = [
    { id: 'stretch', name: '폼롤러·스트레칭', kind: 'minutes', target: 10, on: true },
    { id: 'walk', name: '걷기', kind: 'km', target: 3, on: true, group: 'cardio' },
    { id: 'stairs', name: '계단 오르기', kind: 'floors', target: 20, on: true, group: 'cardio' },
    { id: 'hang', name: '매달리기', kind: 'seconds', target: 60, on: true },
    { id: 'jacks', name: '팔벌려뛰기', kind: 'sets', target: 30, sets: 3, on: true },
    { id: 'band', name: '밴드 운동', kind: 'sets', target: 20, sets: 3, on: true },
    { id: 'squat', name: '맨몸 스쿼트', kind: 'reps', target: 50, on: true },
    { id: 'calf', name: '종아리 운동', kind: 'sets', target: 30, sets: 3, on: false },
    { id: 'shoulder', name: '어깨 회전 10회', kind: 'check', on: true },
    { id: 'shrug', name: '견갑 으쓱으쓱 10회', kind: 'check', on: true },
  ];
  const KINDS = {
    minutes: { unit: '분', step: 5, label: '시간(분)' },
    km: { unit: 'km', step: 0.5, label: '거리(km)' },
    steps: { unit: '보', step: 1000, label: '걸음 수' },
    floors: { unit: '층', step: 5, label: '층수' },
    seconds: { unit: '초', step: 5, label: '시간(초)' },
    reps: { unit: '회', step: 10, label: '횟수' },
    sets: { unit: '회', step: 5, label: '회 × 세트' },
    check: { unit: '', step: 0, label: '완료 체크' },
  };
  const DIET_CHECKS = [
    { id: 'egg', label: '아침 계란 2알' },
    { id: 'before6', label: '저녁 6시 전' },
    { id: 'noLate', label: '야식 없음' },
    { id: 'noFlour', label: '밀가루·튀김 X' },
    { id: 'noSugar', label: '빵·과자·음료 X' },
    { id: 'fast', label: '공복 시간 달성' },
  ];
  const MEALS = [['breakfast', '아침'], ['lunch', '점심'], ['snack', '간식'], ['dinner', '저녁']];
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  const defaultSettings = () => ({
    name: '',
    waterTarget: 2000,
    cup: 250,
    wakeTarget: '08:00',
    sleepTarget: '23:30',
    fastTarget: 15,
    exercises: JSON.parse(JSON.stringify(DEFAULT_EX)),
  });

  // ---------- 저장소 ----------
  function load() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* 저장소 없음 */ }
    if (!data || typeof data !== 'object') data = {};
    data.settings = Object.assign(defaultSettings(), data.settings || {});
    if (!Array.isArray(data.settings.exercises) || !data.settings.exercises.length) {
      data.settings.exercises = defaultSettings().exercises;
    }
    data.days = data.days || {};
    data.ui = data.ui || {};
    return data;
  }
  let S = load();
  let storageOk = true;
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
      storageOk = true;
    } catch (e) {
      if (storageOk) toast('⚠️ 저장에 실패했어요. 백업 파일을 내보내 두세요.');
      storageOk = false;
    }
  }

  // ---------- 날짜 유틸 ----------
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const todayKey = () => ymd(new Date());
  const diffDays = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / DAY_MS);
  const labelDate = (s) => { const d = parseYmd(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`; };

  function bachalLabel(key) {
    const n = diffDays(C.startDate, key) + 1;
    if (n < 1) return '';
    const week = Math.ceil(n / 7);
    if (week <= 6) return `${week}주차 · ${n}일째`;
    return `바챌 ${n}일째`;
  }

  const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  // 취침 시각: 정오 이전이면 다음날 새벽으로 간주
  const nightMin = (t) => { const m = toMin(t); return m == null ? null : (m < 720 ? m + 1440 : m); };
  const fmtTime = (t) => { if (!t) return ''; const [h, m] = t.split(':'); return `${Number(h)}:${m}`; };
  const fmtHours = (h) => (Math.round(h * 10) / 10).toString().replace(/\.0$/, '');
  const fmtLiters = (ml) => (ml / 1000).toFixed(2).replace(/0$/, '');

  // ---------- 하루 데이터 ----------
  function getDay(key) { return S.days[key] || {}; }
  function ensureDay(key) {
    if (!S.days[key]) S.days[key] = {};
    return S.days[key];
  }
  function hasData(day) {
    if (!day) return false;
    if (day.wake || day.sleep || day.water || day.memo) return true;
    if (day.meals && Object.values(day.meals).some(Boolean)) return true;
    if (day.diet && Object.values(day.diet).some(Boolean)) return true;
    if (day.ex && Object.values(day.ex).some((v) => v && (v.v || v.done || v.reps))) return true;
    return false;
  }

  function fastingHours(key) {
    const prev = toMin(getDay(addDays(key, -1)).lastMeal);
    const first = toMin(getDay(key).firstMeal);
    if (prev == null || first == null) return null;
    return (1440 - prev + first) / 60;
  }
  function sleepHours(key) {
    const slept = nightMin(getDay(addDays(key, -1)).sleep);
    const woke = toMin(getDay(key).wake);
    if (slept == null || woke == null) return null;
    const h = (woke + 1440 - slept) / 60;
    return h > 0 && h < 16 ? h : null;
  }

  const activeEx = () => S.settings.exercises.filter((e) => e.on);
  function exRatio(ex, rec) {
    if (!rec) return 0;
    if (ex.kind === 'check') return rec.done ? 1 : 0;
    if (ex.kind === 'sets') {
      const goal = (ex.target || 1) * (ex.sets || 1);
      return Math.min(((rec.reps || 0) * (rec.sets || 0)) / goal, 1);
    }
    return Math.min((rec.v || 0) / (ex.target || 1), 1);
  }
  function exUnits() {
    const units = [];
    const seen = {};
    activeEx().forEach((ex) => {
      if (ex.group) {
        if (seen[ex.group]) { seen[ex.group].push(ex); return; }
        seen[ex.group] = [ex];
        units.push(seen[ex.group]);
      } else units.push([ex]);
    });
    return units;
  }

  function score(key) {
    const day = getDay(key);
    const s = S.settings;
    const parts = {};
    const w = toMin(day.wake);
    parts.wake = w == null ? 0 : (w <= toMin(s.wakeTarget) ? 1 : 0.5);
    parts.water = Math.min((day.water || 0) / (s.waterTarget || 2000), 1);
    const diet = day.diet || {};
    parts.diet = DIET_CHECKS.filter((c) => diet[c.id]).length / DIET_CHECKS.length;
    const units = exUnits();
    if (units.length) {
      const ex = day.ex || {};
      parts.ex = units.reduce((sum, u) => sum + Math.max(...u.map((e) => exRatio(e, ex[e.id]))), 0) / units.length;
    }
    const sl = nightMin(day.sleep);
    parts.sleep = sl == null ? 0 : (sl <= nightMin(s.sleepTarget) ? 1 : 0.5);
    const vals = Object.values(parts);
    return { parts, pct: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) };
  }

  // ---------- 공통 UI ----------
  const view = document.getElementById('view');
  const modalRoot = document.getElementById('modal-root');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  const ui = {
    tab: 'today',
    date: todayKey(),
    calMonth: todayKey().slice(0, 7),
    metric: 'pct',
    libTab: 'notice',
  };

  function setTab(tab) {
    ui.tab = tab;
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    const today = todayKey();
    const n = diffDays(C.startDate, today) + 1;
    document.getElementById('dday').textContent = n > 0 ? `D+${n}` : '';
    if (ui.tab === 'today') view.innerHTML = renderToday();
    else if (ui.tab === 'records') view.innerHTML = renderRecords();
    else view.innerHTML = renderLibrary();
  }

  // ---------- 오늘 인증 ----------
  function ringSvg(pct) {
    const r = 32, c = 2 * Math.PI * r;
    return `<div class="ring"><svg viewBox="0 0 76 76"><circle class="ring-bg" cx="38" cy="38" r="${r}" fill="none" stroke-width="8"/><circle class="ring-fg" cx="38" cy="38" r="${r}" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg><b>${pct}%</b></div>`;
  }
  function scoreBadges(parts) {
    const names = { wake: '기상', water: '물', diet: '식단', ex: '운동', sleep: '취침' };
    return Object.entries(parts).map(([k, v]) => {
      const cls = v >= 1 ? 'ok' : v > 0 ? 'warn' : '';
      const mark = v >= 1 ? '✓' : v > 0 ? `${Math.round(v * 100)}%` : '—';
      return `<span class="badge ${cls}">${names[k]} ${mark}</span>`;
    }).join('');
  }

  function installHint() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone || S.ui.hideInstall) return '';
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return `<div class="card install-hint">
      <h2><span><span class="h-emoji">📲</span>홈 화면에 추가하세요</span><button class="btn ghost small" data-act="hide-install">닫기</button></h2>
      ${ios
        ? '<ol><li>Safari 아래쪽 <b>공유 버튼(□↑)</b>을 누르고</li><li><b>홈 화면에 추가</b>를 누르면 앱처럼 열려요.</li></ol>'
        : '<ol><li>Chrome 오른쪽 위 <b>⋮ 메뉴</b>를 누르고</li><li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 누르세요.</li></ol>'}
      ${deferredInstall ? '<button class="btn primary block" data-act="install" style="margin-top:10px">바로 설치하기</button>' : ''}
      <p class="small muted" style="margin:8px 0 0">기록은 이 휴대폰 안에만 저장돼요. 설정에서 가끔 백업해 두면 안전해요.</p>
    </div>`;
  }

  function renderToday() {
    const key = ui.date;
    const today = todayKey();
    const day = getDay(key);
    const s = S.settings;
    const sc = score(key);
    const water = day.water || 0;
    const cups = Math.ceil((s.waterTarget || 2000) / (s.cup || 250));
    const filled = Math.floor(water / (s.cup || 250));
    const prevKey = addDays(key, -1);
    const fh = fastingHours(key);
    const diet = day.diet || {};
    const meals = day.meals || {};

    let exHtml = '';
    let lastGroup = null;
    activeEx().forEach((ex) => {
      if (ex.group && ex.group === lastGroup) exHtml += '<div class="ex-or">또는</div>';
      lastGroup = ex.group || null;
      exHtml += renderEx(ex, (day.ex || {})[ex.id]);
    });

    return `
      ${!s.name ? `<div class="card"><h2><span><span class="h-emoji">👋</span>반가워요!</span></h2>
        <p style="margin:0 0 10px">카톡 인증 글에 들어갈 이름을 먼저 알려주세요.</p>
        <div class="row"><input type="text" id="first-name" placeholder="예) 김바챌" class="grow"><button class="btn primary" data-act="save-name">확인</button></div></div>` : ''}
      ${key === today ? installHint() : ''}

      <div class="date-nav">
        <button class="icon-btn" data-act="date" data-d="-1" aria-label="이전 날">‹</button>
        <div class="date-title"><b>${key === today ? '오늘 · ' : ''}${labelDate(key)}</b><span>${bachalLabel(key)}</span></div>
        <button class="icon-btn" data-act="date" data-d="1" aria-label="다음 날" ${key >= today ? 'disabled' : ''}>›</button>
      </div>

      <div class="card score-card">
        ${ringSvg(sc.pct)}
        <div class="grow">
          <div style="font-weight:800;margin-bottom:6px">${sc.pct >= 100 ? '완벽한 하루! 💜' : sc.pct >= 70 ? '잘하고 있어요!' : key === today ? '오늘도 하나씩 채워봐요' : '이날의 기록'}</div>
          <div class="score-list">${scoreBadges(sc.parts)}</div>
        </div>
      </div>

      <section class="card">
        <h2><span><span class="h-emoji">⏰</span>기상 · 취침</span></h2>
        <div class="time-grid">
          <label class="field"><span>기상</span><input type="time" data-k="wake" value="${esc(day.wake || '')}">
            <div class="target-hint">목표 ${fmtTime(s.wakeTarget)} 이전</div></label>
          <label class="field"><span>취침 (오늘 밤)</span><input type="time" data-k="sleep" value="${esc(day.sleep || '')}">
            <div class="target-hint">목표 ${fmtTime(s.sleepTarget)} 이전</div></label>
        </div>
        ${sleepHours(key) != null ? `<p class="small muted" style="margin:10px 0 0">지난밤 수면 ${fmtHours(sleepHours(key))}시간</p>` : ''}
      </section>

      <section class="card">
        <h2><span><span class="h-emoji">💧</span>물</span><small>목표 ${(s.waterTarget / 1000).toFixed(1)}L</small></h2>
        <div class="water"><div class="water-amount">${fmtLiters(water)}<small> L</small></div>
          <div class="grow"><div class="progress"><i style="width:${Math.min(water / s.waterTarget, 1) * 100}%"></i></div></div></div>
        <div class="cups">${Array.from({ length: Math.max(cups, filled) }, (_, i) => `<button class="cup ${i < filled ? 'full' : ''}" data-act="water-set" data-n="${i + 1}" aria-label="${i + 1}잔"></button>`).join('')}</div>
        <div class="water-btns">
          <button class="btn" data-act="water" data-d="-${s.cup}">−</button>
          <button class="btn primary" data-act="water" data-d="${s.cup}">+ ${s.cup}ml</button>
          <button class="btn" data-act="water" data-d="500">+ 500ml</button>
        </div>
      </section>

      <section class="card">
        <h2><span><span class="h-emoji">🥚</span>식단</span></h2>
        <div class="meals">
          ${MEALS.map(([k, label]) => `<label class="meal-row"><span>${label}</span><input type="text" data-meal="${k}" value="${esc(meals[k] || '')}" placeholder="${k === 'breakfast' ? '계란 2, 방울토마토' : ''}"></label>`).join('')}
        </div>
        <div class="checks">
          ${DIET_CHECKS.map((c) => `<button class="check ${diet[c.id] ? 'on' : ''}" data-act="diet" data-id="${c.id}"><span class="box"></span>${c.id === 'fast' ? `공복 ${s.fastTarget}시간` : c.label}</button>`).join('')}
        </div>
        <div class="fast">
          <div class="small" style="font-weight:700;margin-bottom:8px">⏳ 간헐적 단식 계산</div>
          <div class="time-grid">
            <label class="field"><span>전날 마지막 식사</span><input type="time" data-prev-last value="${esc(getDay(prevKey).lastMeal || '')}"></label>
            <label class="field"><span>오늘 첫 식사</span><input type="time" data-k="firstMeal" value="${esc(day.firstMeal || '')}"></label>
          </div>
          <label class="field" style="margin-top:8px"><span>오늘 마지막 식사 (내일 계산용)</span><input type="time" data-k="lastMeal" value="${esc(day.lastMeal || '')}"></label>
          <div class="fast-result" id="fast-result">${fh != null ? `공복 ${fmtHours(fh)}시간 ${fh >= s.fastTarget ? '✓ 달성' : `(목표 ${s.fastTarget}시간)`}` : '<span class="muted small">두 시간을 넣으면 공복 시간이 자동 계산돼요</span>'}</div>
        </div>
      </section>

      <section class="card">
        <h2><span><span class="h-emoji">🏃</span>운동</span><button class="btn ghost small" data-act="settings">종목 편집</button></h2>
        <div class="ex-list">${exHtml || '<p class="muted">설정에서 운동 종목을 켜주세요.</p>'}</div>
      </section>

      <section class="card">
        <h2><span><span class="h-emoji">📝</span>한 줄 메모</span></h2>
        <textarea data-k="memo" placeholder="오늘의 컨디션, 다짐, 칭찬 한마디">${esc(day.memo || '')}</textarea>
      </section>

      <div class="share-card">
        <div class="btn-row">
          <button class="btn primary" data-act="copy">📋 카톡 인증글 복사</button>
          ${navigator.share ? '<button class="btn" data-act="share" style="flex:0 0 auto">공유</button>' : ''}
        </div>
      </div>
      <div class="saved-note" id="saved-note"></div>
    `;
  }

  function renderEx(ex, rec) {
    rec = rec || {};
    const k = KINDS[ex.kind] || KINDS.reps;
    const met = exRatio(ex, rec) >= 1;
    if (ex.kind === 'check') {
      return `<div class="ex ${met ? 'met' : ''}" data-ex-card="${ex.id}">
        <button class="check ${rec.done ? 'on' : ''}" data-act="ex-check" data-id="${ex.id}"><span class="box"></span><span class="ex-name">${esc(ex.name)}</span></button></div>`;
    }
    const target = ex.kind === 'sets' ? `목표 ${ex.target}회 × ${ex.sets}세트` : `목표 ${ex.target}${k.unit}`;
    let body;
    if (ex.kind === 'sets') {
      body = `<div class="sets">
        ${stepper(ex.id, 'reps', rec.reps, 5, '회')}
        ${stepper(ex.id, 'sets', rec.sets, 1, '세트')}
      </div>`;
    } else {
      body = stepper(ex.id, 'v', rec.v, k.step, k.unit, ex.kind === 'km');
    }
    return `<div class="ex ${met ? 'met' : ''}" data-ex-card="${ex.id}">
      <div class="ex-head"><span class="ex-name">${esc(ex.name)}</span><span class="ex-target">${target}${met ? ' ✓' : ''}</span></div>
      ${body}</div>`;
  }
  function stepper(id, field, val, step, unit, decimal) {
    return `<div class="stepper">
      <button data-act="ex-step" data-id="${id}" data-f="${field}" data-d="-${step}" aria-label="빼기">−</button>
      <input type="number" inputmode="${decimal ? 'decimal' : 'numeric'}" step="${decimal ? '0.1' : '1'}" min="0" data-ex="${id}" data-f="${field}" value="${val == null || val === 0 ? '' : val}" placeholder="0">
      <span class="unit">${unit}</span>
      <button data-act="ex-step" data-id="${id}" data-f="${field}" data-d="${step}" aria-label="더하기">+</button>
    </div>`;
  }

  // 입력 중에는 전체를 다시 그리지 않고 점수만 갱신
  function refreshScore() {
    if (ui.tab !== 'today') return;
    const sc = score(ui.date);
    const card = view.querySelector('.score-card');
    if (card) {
      card.querySelector('.ring').outerHTML = ringSvg(sc.pct);
      card.querySelector('.score-list').innerHTML = scoreBadges(sc.parts);
    }
    const day = getDay(ui.date);
    activeEx().forEach((ex) => {
      const el = view.querySelector(`[data-ex-card="${ex.id}"]`);
      if (el) el.classList.toggle('met', exRatio(ex, (day.ex || {})[ex.id]) >= 1);
    });
    const fr = view.querySelector('#fast-result');
    if (fr) {
      const fh = fastingHours(ui.date);
      const t = S.settings.fastTarget;
      fr.innerHTML = fh != null ? `공복 ${fmtHours(fh)}시간 ${fh >= t ? '✓ 달성' : `(목표 ${t}시간)`}` : '<span class="muted small">두 시간을 넣으면 공복 시간이 자동 계산돼요</span>';
    }
    const note = view.querySelector('#saved-note');
    if (note) note.textContent = '자동 저장됨 ✓';
  }

  function syncFastCheck() {
    const fh = fastingHours(ui.date);
    if (fh == null) return false;
    const d = ensureDay(ui.date);
    d.diet = d.diet || {};
    const ok = fh >= S.settings.fastTarget;
    if (!!d.diet.fast !== ok) { d.diet.fast = ok; return true; }
    return false;
  }

  // ---------- 카톡 인증글 ----------
  function kakaoText(key) {
    const d = parseYmd(key);
    const day = getDay(key);
    const s = S.settings;
    const yy = String(d.getFullYear()).slice(2);
    const lines = [`📣 ${yy}${pad(d.getMonth() + 1)}${pad(d.getDate())} ${DOW[d.getDay()]}요일 ${s.name || ''} 바챌 운동+식사`.replace(/\s+/g, ' ')];
    if (day.wake) lines.push(`기상 ${fmtTime(day.wake)}`);
    const meals = day.meals || {};
    const diet = day.diet || {};
    const mealLines = MEALS.filter(([k]) => meals[k]).map(([k, label]) => `- ${label} ${meals[k]}`);
    if (day.water) mealLines.push(`- 물 ${fmtLiters(day.water)}L`);
    const fh = fastingHours(key);
    if (fh != null) mealLines.push(`- 공복 ${fmtHours(fh)}시간`);
    const checks = DIET_CHECKS.filter((c) => diet[c.id] && c.id !== 'fast').map((c) => c.label);
    if (diet.fast && fh == null) checks.push(`공복 ${s.fastTarget}시간`);
    if (checks.length) mealLines.push(`✔ ${checks.join(' · ')}`);
    if (mealLines.length) lines.push('', '<식사>', ...mealLines);

    const ex = day.ex || {};
    const exLines = [];
    activeEx().forEach((e) => {
      const r = ex[e.id];
      if (!r) return;
      const k = KINDS[e.kind] || KINDS.reps;
      if (e.kind === 'check') { if (r.done) exLines.push(`${e.name} 완료`); return; }
      if (e.kind === 'sets') { if (r.reps) exLines.push(`${e.name} ${r.reps}회${r.sets ? ` x ${r.sets}세트` : ''}`); return; }
      if (r.v) exLines.push(`${e.name} ${r.v}${k.unit}`);
    });
    if (exLines.length) lines.push('', '<운동>', ...exLines.map((l, i) => `${i + 1}) ${l}`));
    if (day.sleep) lines.push('', `취침 ${fmtTime(day.sleep)}`);
    if (day.memo) lines.push('', day.memo);
    lines.push('', `오늘 달성률 ${score(key).pct}% 💜`);
    return lines.join('\n');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  // ---------- 내 기록 ----------
  function streak() {
    let key = todayKey();
    if (!hasData(getDay(key))) key = addDays(key, -1);
    let n = 0;
    while (hasData(getDay(key))) { n++; key = addDays(key, -1); }
    return n;
  }
  function heatClass(pct) {
    if (pct >= 90) return 'h4';
    if (pct >= 70) return 'h3';
    if (pct >= 40) return 'h2';
    if (pct > 0) return 'h1';
    return '';
  }

  function renderRecords() {
    const today = todayKey();
    const month = ui.calMonth;
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const daysIn = new Date(y, m, 0).getDate();
    let monthCount = 0;
    let cells = DOW.map((d) => `<div class="dow">${d}</div>`).join('');
    for (let i = 0; i < first.getDay(); i++) cells += '<div class="day blank"></div>';
    for (let d = 1; d <= daysIn; d++) {
      const key = `${month}-${pad(d)}`;
      const has = hasData(getDay(key));
      if (has) monthCount++;
      const pct = has ? score(key).pct : 0;
      const inBachal = key >= C.startDate && key <= C.endDate;
      cells += `<button class="day ${heatClass(pct)} ${key === today ? 'today' : ''} ${key > today ? 'future' : ''} ${inBachal ? 'bachal' : ''}" data-act="goto" data-key="${key}" ${key > today ? 'disabled' : ''} aria-label="${d}일 ${has ? pct + '%' : '기록 없음'}">${d}</button>`;
    }

    const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -i)).filter((k) => hasData(getDay(k)));
    const avg7 = last7.length ? Math.round(last7.reduce((a, k) => a + score(k).pct, 0) / 7) : 0;
    const total = Object.keys(S.days).filter((k) => hasData(S.days[k])).length;

    return `
      <div class="stats">
        <div class="stat"><b>${streak()}일</b><span>연속 인증</span></div>
        <div class="stat"><b>${avg7}%</b><span>최근 7일 평균</span></div>
        <div class="stat"><b>${total}일</b><span>전체 인증</span></div>
      </div>

      <section class="card">
        <div class="cal-head">
          <button class="icon-btn" data-act="month" data-d="-1" aria-label="이전 달">‹</button>
          <b>${y}년 ${m}월 <span class="muted small">· ${monthCount}일 인증</span></b>
          <button class="icon-btn" data-act="month" data-d="1" aria-label="다음 달" ${month >= today.slice(0, 7) ? 'disabled' : ''}>›</button>
        </div>
        <div class="cal">${cells}</div>
        <div class="legend">적음 <i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i><i style="background:var(--heat-4)"></i> 많음</div>
        <p class="small muted" style="margin:6px 0 0">날짜를 누르면 그날 기록을 보고 고칠 수 있어요. 점(•)은 바챌 6주 기간이에요.</p>
      </section>

      <section class="card">
        <h2><span><span class="h-emoji">📈</span>최근 14일</span>
          <select data-metric style="width:auto;min-height:36px;padding:4px 8px">
            ${[['pct', '달성률'], ['water', '물'], ['sleep', '수면'], ['fast', '공복'], ['hang', '매달리기']].map(([v, l]) => `<option value="${v}" ${ui.metric === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select></h2>
        ${renderBars()}
      </section>
    `;
  }

  function renderBars() {
    const today = todayKey();
    const keys = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
    const s = S.settings;
    const metric = ui.metric;
    const val = (k) => {
      const d = getDay(k);
      switch (metric) {
        case 'water': return d.water ? d.water / 1000 : null;
        case 'sleep': return sleepHours(k);
        case 'fast': return fastingHours(k);
        case 'hang': return d.ex && d.ex.hang && d.ex.hang.v ? d.ex.hang.v : null;
        default: return hasData(d) ? score(k).pct : null;
      }
    };
    const fmt = { pct: (v) => `${v}`, water: (v) => v.toFixed(1), sleep: fmtHours, fast: fmtHours, hang: (v) => `${v}` };
    const goal = { pct: 100, water: s.waterTarget / 1000, sleep: 8, fast: s.fastTarget, hang: (S.settings.exercises.find((e) => e.id === 'hang') || {}).target || 60 }[metric];
    const unit = { pct: '%', water: 'L', sleep: '시간', fast: '시간', hang: '초' }[metric];
    const vals = keys.map(val);
    const max = Math.max(goal, ...vals.filter((v) => v != null));
    return `<div class="bars">${keys.map((k, i) => {
      const v = vals[i];
      const h = v == null ? 0 : Math.max((v / max) * 100, 3);
      const d = parseYmd(k);
      return `<div class="bar">${v != null ? `<em>${fmt[metric](v)}</em>` : ''}<i class="${v == null ? 'empty' : ''}" style="height:${v == null ? 3 : h}%"></i><span>${d.getDate()}</span></div>`;
    }).join('')}</div>
    <p class="target-line-label" style="margin:8px 0 0">기준 ${goal}${unit} · 기록 없는 날은 회색</p>`;
  }

  // ---------- 자료실 ----------
  const isVideo = (src) => /\.(mp4|mov|m4v|webm)$/i.test(src);

  function renderLibrary() {
    const seg = [['notice', '주차 공지'], ['video', '운동 영상'], ['diet', '식단 원칙'], ['scenery', '풍경']];
    let body = '';
    if (ui.libTab === 'notice') {
      body = C.weeks.map((w) => {
        const imgs = M.notices[w.week] || M.notices[String(w.week)] || [];
        return `<section class="card week-card">
          <div class="week-no">${w.week}주차 · ${w.date}~</div>
          <h3>${esc(w.title)}</h3>
          <ul>${w.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          ${w.tip ? `<div class="tip">💬 ${esc(w.tip)}</div>` : ''}
          ${imgs.length && w.cardTitle ? `<div class="small" style="font-weight:700;margin-top:12px">${esc(w.cardTitle)}</div>` : ''}
          ${imgs.length
            ? `<div class="thumbs">${imgs.map((src, i) => `<button data-act="lb-notice" data-week="${w.week}" data-i="${i}"><img src="${esc(src)}" alt="${w.week}주차 카드 ${i + 1}" loading="lazy"></button>`).join('')}</div>`
            : '<div class="empty-media">카드뉴스 이미지를 넣으면 여기에 보여요</div>'}
        </section>`;
      }).join('');
    } else if (ui.libTab === 'video') {
      const coach = coachVideos();
      body = (coach.length ? `<div class="vgroup"><h3>💜 순코치 시범 영상</h3><div class="vgrid">${coach.map((v, i) => `
        <button class="vcard" data-act="lb-coach" data-i="${i}"><div class="thumb"><video src="${esc(v.src)}#t=0.5" preload="metadata" muted playsinline></video></div>
        <div class="meta"><b>${esc(v.title)}</b><span>순코치</span></div></button>`).join('')}</div></div>` : '')
        + C.videoGroups.map((g, gi) => `<div class="vgroup"><h3>${esc(g.name)}</h3><div class="vgrid">${g.videos.map((v, vi) => `
          <button class="vcard" data-act="yt" data-g="${gi}" data-v="${vi}">
            <div class="thumb">${v.shorts ? '<span class="tag">Shorts</span>' : ''}<img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy"></div>
            <div class="meta"><b>${esc(v.title)}</b><span>${esc(v.by)}</span></div>
          </button>`).join('')}</div></div>`).join('');
    } else if (ui.libTab === 'diet') {
      const recipe = M.recipe || [];
      body = `<section class="card"><h2><span><span class="h-emoji">🥗</span>순코치 식단 원칙</span></h2>
        <div class="diet-list">${C.diet.map((d) => `<div class="diet-item"><b>${esc(d.label)}</b><span>${esc(d.text)}</span></div>`).join('')}</div></section>
        ${recipe.length ? `<section class="card"><h2><span><span class="h-emoji">🍅</span>코치 추천 레시피</span></h2>
          <p class="small muted" style="margin:0">저녁 식사 틈이 안 날 때 강력 추천했던 토마토 주스</p>
          <div class="thumbs">${recipe.map((src, i) => `<button data-act="lb-recipe" data-i="${i}"><img src="${esc(src)}" alt="레시피 ${i + 1}" loading="lazy"></button>`).join('')}</div></section>` : ''}`;
    } else {
      const items = M.scenery || [];
      body = items.length
        ? `<div class="gallery">${items.map((src, i) => `<button data-act="lb-scenery" data-i="${i}" class="${isVideo(src) ? 'is-video' : ''}">${isVideo(src) ? `<video src="${esc(src)}#t=0.5" preload="metadata" muted playsinline></video>` : `<img src="${esc(src)}" alt="" loading="lazy">`}</button>`).join('')}</div>`
        : '<div class="card empty-media">풍경 사진·영상을 넣으면 여기에 보여요</div>';
    }
    return `<div class="seg">${seg.map(([k, l]) => `<button class="${ui.libTab === k ? 'on' : ''}" data-act="lib" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
  }
  function coachVideos() {
    return (M.coach || []).map((v) => (typeof v === 'string' ? { src: v, title: fileTitle(v) } : v));
  }
  function fileTitle(src) {
    return decodeURIComponent(src.split('/').pop()).replace(/\.[^.]+$/, '').replace(/^\d+[-_.\s]*/, '').replace(/[-_]/g, ' ') || '영상';
  }

  // ---------- 라이트박스 ----------
  let lb = null;
  function openLightbox(items, index) {
    lb = { items, index };
    drawLightbox();
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb = null;
    const el = document.querySelector('.lightbox');
    if (el) el.remove();
    document.body.style.overflow = '';
  }
  function drawLightbox() {
    const old = document.querySelector('.lightbox');
    if (old) old.remove();
    if (!lb) return;
    const it = lb.items[lb.index];
    let stage = '';
    if (it.type === 'youtube') {
      const origin = encodeURIComponent(location.origin);
      stage = `<iframe class="${it.shorts ? 'shorts' : ''}" src="https://www.youtube.com/embed/${it.id}?autoplay=1&playsinline=1&rel=0&origin=${origin}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="${esc(it.caption)}"></iframe>`;
    } else if (it.type === 'video') {
      stage = `<video src="${esc(it.src)}" controls autoplay playsinline></video>`;
    } else {
      stage = `<img src="${esc(it.src)}" alt="">`;
    }
    const many = lb.items.length > 1;
    const el = document.createElement('div');
    el.className = 'lightbox';
    el.innerHTML = `
      <div class="lb-top"><span class="small">${many ? `${lb.index + 1} / ${lb.items.length}` : ''}</span>
        <button class="icon-btn" data-lb="close" aria-label="닫기" style="font-size:26px">✕</button></div>
      <div class="lb-stage">${stage}
        ${many ? '<button class="lb-nav lb-prev" data-lb="prev" aria-label="이전">‹</button><button class="lb-nav lb-next" data-lb="next" aria-label="다음">›</button>' : ''}</div>
      <div class="lb-bottom">${it.caption ? esc(it.caption) : ''}
        ${it.type === 'youtube' ? `<div style="margin-top:6px"><a href="${it.shorts ? `https://youtube.com/shorts/${it.id}` : `https://youtu.be/${it.id}`}" target="_blank" rel="noopener">유튜브 앱에서 열기 ↗</a></div>` : ''}</div>`;
    document.body.appendChild(el);
    let x0 = null;
    const stageEl = el.querySelector('.lb-stage');
    stageEl.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stageEl.addEventListener('touchend', (e) => {
      if (x0 == null || !many) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) moveLightbox(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }
  function moveLightbox(d) {
    if (!lb) return;
    lb.index = (lb.index + d + lb.items.length) % lb.items.length;
    drawLightbox();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lb]');
    if (!b) return;
    const a = b.dataset.lb;
    if (a === 'close') closeLightbox();
    else moveLightbox(a === 'next' ? 1 : -1);
  });
  document.addEventListener('keydown', (e) => {
    if (!lb) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') moveLightbox(1);
    if (e.key === 'ArrowLeft') moveLightbox(-1);
  });

  // ---------- 설정 ----------
  function openSettings() {
    const s = S.settings;
    modalRoot.innerHTML = `<div class="modal-backdrop" data-close>
      <div class="sheet" role="dialog" aria-label="설정">
        <div class="sheet-head"><h2>설정</h2><button class="icon-btn" data-close aria-label="닫기" style="font-size:22px">✕</button></div>

        <section class="card">
          <h2>내 정보 · 목표</h2>
          <label class="field" style="margin-bottom:10px"><span>이름 (카톡 인증글에 표시)</span><input type="text" data-s="name" value="${esc(s.name)}"></label>
          <div class="time-grid">
            <label class="field"><span>기상 목표</span><input type="time" data-s="wakeTarget" value="${esc(s.wakeTarget)}"></label>
            <label class="field"><span>취침 목표</span><input type="time" data-s="sleepTarget" value="${esc(s.sleepTarget)}"></label>
            <label class="field"><span>물 목표 (ml)</span><input type="number" inputmode="numeric" data-s="waterTarget" value="${s.waterTarget}"></label>
            <label class="field"><span>공복 목표 (시간)</span><input type="number" inputmode="numeric" data-s="fastTarget" value="${s.fastTarget}"></label>
            <label class="field"><span>컵 1잔 (ml)</span><input type="number" inputmode="numeric" data-s="cup" value="${s.cup}"></label>
          </div>
        </section>

        <section class="card">
          <h2>운동 종목 · 목표량</h2>
          <div class="settings-ex">
            ${s.exercises.map((ex, i) => `<div class="row">
              <label class="switch"><input type="checkbox" data-exon="${i}" ${ex.on ? 'checked' : ''}><i></i></label>
              <span class="grow" style="font-weight:700">${esc(ex.name)}<br><span class="small muted">${KINDS[ex.kind].label}</span></span>
              ${ex.kind === 'check' ? '' : `<input type="number" inputmode="decimal" data-ext="${i}" value="${ex.target}" aria-label="목표">`}
              ${ex.kind === 'sets' ? `<span class="muted">×</span><input type="number" inputmode="numeric" data-exs="${i}" value="${ex.sets}" aria-label="세트">` : ''}
              ${ex.custom ? `<button class="btn danger small" data-exdel="${i}" aria-label="삭제">삭제</button>` : ''}
            </div>`).join('')}
          </div>
          <details style="margin-top:12px"><summary style="font-weight:700;color:var(--primary);cursor:pointer">+ 새 종목 추가</summary>
            <div style="display:grid;gap:8px;margin-top:10px">
              <input type="text" id="new-ex-name" placeholder="예) 플랭크, 런지, 줄넘기">
              <div class="row">
                <select id="new-ex-kind" class="grow">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select>
                <input type="number" id="new-ex-target" placeholder="목표" style="width:90px">
              </div>
              <button class="btn primary" data-act="add-ex">추가하기</button>
            </div>
          </details>
        </section>

        <section class="card">
          <h2>백업</h2>
          <p class="small muted" style="margin:0 0 10px">기록은 이 기기 브라우저 안에만 있어요. 휴대폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일을 내보내 두세요.</p>
          <div class="btn-row">
            <button class="btn" data-act="export">⬇ 백업 내보내기</button>
            <label class="btn" style="text-align:center">⬆ 가져오기<input type="file" accept="application/json,.json" id="import-file" hidden></label>
          </div>
          <button class="btn danger block" data-act="reset" style="margin-top:8px">모든 기록 지우기</button>
        </section>

        <p class="small muted" style="text-align:center">바챌 1기 · 순코치와 함께한 6주를 기억하며 💜</p>
      </div></div>`;
  }
  function closeSettings() { modalRoot.innerHTML = ''; render(); }

  modalRoot.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]') || e.target.closest('button[data-close]')) { closeSettings(); return; }
    const del = e.target.closest('[data-exdel]');
    if (del) {
      const i = Number(del.dataset.exdel);
      if (confirm(`'${S.settings.exercises[i].name}' 종목을 삭제할까요?`)) {
        S.settings.exercises.splice(i, 1); save(); openSettings();
      }
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    if (a === 'add-ex') {
      const name = document.getElementById('new-ex-name').value.trim();
      const kind = document.getElementById('new-ex-kind').value;
      const target = parseFloat(document.getElementById('new-ex-target').value) || 10;
      if (!name) { toast('종목 이름을 적어주세요'); return; }
      S.settings.exercises.push({ id: 'c' + Date.now().toString(36), name, kind, target, sets: kind === 'sets' ? 3 : undefined, on: true, custom: true });
      save(); openSettings(); toast(`'${name}' 추가됨`);
    } else if (a === 'export') {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `바챌백업_${todayKey()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('백업 파일을 저장했어요');
    } else if (a === 'reset') {
      if (confirm('모든 인증 기록을 지울까요? 되돌릴 수 없어요.') && confirm('정말 지울까요? 먼저 백업을 내보내는 걸 추천해요.')) {
        S.days = {}; save(); closeSettings(); toast('기록을 모두 지웠어요');
      }
    }
  });
  modalRoot.addEventListener('change', (e) => {
    const t = e.target;
    const s = S.settings;
    if (t.dataset.s) {
      const k = t.dataset.s;
      if (t.type === 'number') {
        const v = parseFloat(t.value);
        if (v > 0) s[k] = v;
      } else if (t.type === 'time') {
        if (t.value) s[k] = t.value;
      } else s[k] = t.value.trim();
      save();
    } else if (t.dataset.exon != null) {
      s.exercises[Number(t.dataset.exon)].on = t.checked; save();
    } else if (t.dataset.ext != null) {
      const v = parseFloat(t.value); if (v > 0) { s.exercises[Number(t.dataset.ext)].target = v; save(); }
    } else if (t.dataset.exs != null) {
      const v = parseInt(t.value, 10); if (v > 0) { s.exercises[Number(t.dataset.exs)].sets = v; save(); }
    } else if (t.id === 'import-file' && t.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !data.days || !data.settings) throw new Error('형식 오류');
          const n = Object.keys(data.days).length;
          if (!confirm(`백업에 ${n}일치 기록이 있어요. 지금 기록을 이 백업으로 바꿀까요?`)) return;
          localStorage.setItem(KEY, JSON.stringify(data));
          S = load();
          closeSettings();
          toast('백업을 불러왔어요');
        } catch (err) {
          toast('바챌 백업 파일이 아니에요');
        }
      };
      reader.readAsText(t.files[0]);
    }
  });

  // ---------- 이벤트 ----------
  document.querySelector('.tabbar').addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (b) setTab(b.dataset.tab);
  });
  document.getElementById('btn-settings').addEventListener('click', openSettings);

  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    const key = ui.date;
    const s = S.settings;
    switch (a) {
      case 'save-name': {
        const v = document.getElementById('first-name').value.trim();
        if (!v) { toast('이름을 적어주세요'); return; }
        s.name = v; save(); render(); toast(`${v} 선생님, 환영해요 💜`);
        return;
      }
      case 'hide-install': S.ui.hideInstall = true; save(); render(); return;
      case 'install':
        if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
        return;
      case 'settings': openSettings(); return;
      case 'date': {
        const next = addDays(key, Number(b.dataset.d));
        if (next > todayKey()) return;
        ui.date = next; render(); return;
      }
      case 'water': {
        const d = ensureDay(key);
        d.water = Math.max(0, (d.water || 0) + Number(b.dataset.d));
        break;
      }
      case 'water-set': {
        const d = ensureDay(key);
        const n = Number(b.dataset.n);
        const cupsNow = Math.floor((d.water || 0) / s.cup);
        d.water = cupsNow === n ? (n - 1) * s.cup : n * s.cup;
        break;
      }
      case 'diet': {
        const d = ensureDay(key);
        d.diet = d.diet || {};
        d.diet[b.dataset.id] = !d.diet[b.dataset.id];
        break;
      }
      case 'ex-check': {
        const d = ensureDay(key);
        d.ex = d.ex || {};
        const r = d.ex[b.dataset.id] = d.ex[b.dataset.id] || {};
        r.done = !r.done;
        break;
      }
      case 'ex-step': {
        const d = ensureDay(key);
        d.ex = d.ex || {};
        const r = d.ex[b.dataset.id] = d.ex[b.dataset.id] || {};
        const f = b.dataset.f;
        const ex = s.exercises.find((x) => x.id === b.dataset.id) || {};
        let cur = r[f] || 0;
        // 처음 + 를 누르면 목표값으로 바로 채우기
        if (!cur && Number(b.dataset.d) > 0) cur = f === 'sets' ? (ex.sets || 1) : (ex.target || 0);
        else cur = Math.max(0, Math.round((cur + Number(b.dataset.d)) * 10) / 10);
        r[f] = cur;
        break;
      }
      case 'copy':
      case 'share': {
        if (!s.name) { toast('먼저 이름을 적어주세요'); return; }
        const text = kakaoText(key);
        if (a === 'share' && navigator.share) {
          try { await navigator.share({ text }); } catch (err) { /* 공유 취소 */ }
        } else {
          const ok = await copyText(text);
          if (ok) toast('복사했어요! 카톡방에 붙여넣기 하세요 💜');
          else showTextSheet(text);
        }
        return;
      }
      case 'goto': ui.date = b.dataset.key; setTab('today'); return;
      case 'month': {
        const [y, m] = ui.calMonth.split('-').map(Number);
        const d = new Date(y, m - 1 + Number(b.dataset.d), 1);
        ui.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        render(); return;
      }
      case 'lib': ui.libTab = b.dataset.k; render(); return;
      case 'yt': {
        const items = [];
        let start = 0;
        C.videoGroups.forEach((g, gi) => g.videos.forEach((v, vi) => {
          if (gi === Number(b.dataset.g) && vi === Number(b.dataset.v)) start = items.length;
          items.push({ type: 'youtube', id: v.id, shorts: v.shorts, caption: v.title });
        }));
        openLightbox(items, start); return;
      }
      case 'lb-notice': {
        const w = b.dataset.week;
        const imgs = M.notices[w] || [];
        openLightbox(imgs.map((src, i) => ({ type: 'image', src, caption: `${w}주차 · ${i + 1}` })), Number(b.dataset.i));
        return;
      }
      case 'lb-scenery':
        openLightbox(M.scenery.map((src) => ({ type: isVideo(src) ? 'video' : 'image', src })), Number(b.dataset.i));
        return;
      case 'lb-coach':
        openLightbox(coachVideos().map((v) => ({ type: 'video', src: v.src, caption: v.title })), Number(b.dataset.i));
        return;
      case 'lb-recipe':
        openLightbox(M.recipe.map((src) => ({ type: 'image', src })), Number(b.dataset.i));
        return;
      default: return;
    }
    save();
    render();
  });

  view.addEventListener('input', (e) => {
    const t = e.target;
    const key = ui.date;
    if (t.dataset.k) {
      const d = ensureDay(key);
      d[t.dataset.k] = t.value;
      if (t.dataset.k === 'firstMeal') syncFastCheck() && rerenderChecks();
    } else if (t.dataset.meal) {
      const d = ensureDay(key);
      d.meals = d.meals || {};
      d.meals[t.dataset.meal] = t.value;
    } else if (t.hasAttribute('data-prev-last')) {
      ensureDay(addDays(key, -1)).lastMeal = t.value;
      syncFastCheck() && rerenderChecks();
    } else if (t.dataset.ex) {
      const d = ensureDay(key);
      d.ex = d.ex || {};
      const r = d.ex[t.dataset.ex] = d.ex[t.dataset.ex] || {};
      const v = parseFloat(t.value);
      r[t.dataset.f] = Number.isFinite(v) && v >= 0 ? v : 0;
    } else return;
    save();
    refreshScore();
  });
  view.addEventListener('change', (e) => {
    if (e.target.matches('[data-metric]')) { ui.metric = e.target.value; render(); }
  });
  function rerenderChecks() {
    const diet = getDay(ui.date).diet || {};
    view.querySelectorAll('[data-act="diet"]').forEach((b) => b.classList.toggle('on', !!diet[b.dataset.id]));
  }

  function showTextSheet(text) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-close><div class="sheet">
      <div class="sheet-head"><h2>인증글</h2><button class="icon-btn" data-close aria-label="닫기">✕</button></div>
      <p class="small muted" style="margin-top:0">자동 복사가 안 돼서 글을 보여드려요. 길게 눌러 전체 선택 후 복사하세요.</p>
      <div class="preview-text">${esc(text)}</div></div></div>`;
  }

  // 날짜가 바뀌면(자정이 지나면) 오늘로 이동
  let lastToday = todayKey();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const t = todayKey();
    if (t !== lastToday) {
      if (ui.date === lastToday) ui.date = t;
      lastToday = t;
      render();
    }
  });

  // ---------- 설치 · 오프라인 ----------
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    if (ui.tab === 'today') render();
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // ---------- 입장 코드 ----------
  const ENTRY_KEY = 'bachal1.entry';
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  function entryOk() {
    if (!C.entryHash) return true;
    try { return localStorage.getItem(ENTRY_KEY) === C.entryHash; } catch (e) { return false; }
  }
  function showGate() {
    document.body.classList.add('locked');
    const gate = document.createElement('div');
    gate.className = 'gate';
    gate.innerHTML = `<form class="gate-box" autocomplete="off">
      <div class="gate-mark">💜</div>
      <h1>바챌 1기</h1>
      <p>덱스 바디챌린지 1기 선생님들을 위한 앱이에요.<br>입장 코드를 입력해 주세요.</p>
      <input type="password" inputmode="numeric" id="gate-code" placeholder="입장 코드" aria-label="입장 코드" autofocus>
      <button class="btn primary block" type="submit">입장하기</button>
      <div class="gate-msg" role="alert"></div>
    </form>`;
    document.body.appendChild(gate);
    gate.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = gate.querySelector('#gate-code');
      const code = input.value.trim();
      if (!code) return;
      if (!window.crypto || !crypto.subtle) { gate.querySelector('.gate-msg').textContent = '이 브라우저에서는 열 수 없어요. https 주소로 열어 주세요.'; return; }
      if ((await sha256('bachal1:' + code)) === C.entryHash) {
        try { localStorage.setItem(ENTRY_KEY, C.entryHash); } catch (err) { /* 다음에 다시 입력 */ }
        gate.remove();
        document.body.classList.remove('locked');
        render();
      } else {
        gate.querySelector('.gate-msg').textContent = '코드가 맞지 않아요. 단톡방 공지를 확인해 주세요.';
        input.value = '';
        input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
      }
    });
  }

  // 링크 끝에 #k=코드 가 붙어 오면 자동 입장 (단톡방 공유 링크용)
  async function autoEnter() {
    const m = location.hash.match(/k=([^&]+)/);
    if (!m) return false;
    history.replaceState(null, '', location.pathname + location.search);
    if (!window.crypto || !crypto.subtle) return false;
    if ((await sha256('bachal1:' + decodeURIComponent(m[1]))) !== C.entryHash) return false;
    try { localStorage.setItem(ENTRY_KEY, C.entryHash); } catch (e) { /* 저장 불가: 이번만 입장 */ }
    return true;
  }

  (async () => {
    if (entryOk() || (await autoEnter())) render();
    else showGate();
  })();
})();
