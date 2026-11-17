// ═══════════════════════════════════════════════════════════════════════════
//  MONTE SEU EXERCÍCIO — versão 2.0
//  A lista de exercícios fica em js/exercicios.js. Este arquivo só faz o site funcionar.
// ═══════════════════════════════════════════════════════════════════════════

const MUSCLES = {
  peito: 'Peito', costas: 'Costas', pernas: 'Pernas', ombros: 'Ombros',
  biceps: 'Bíceps', triceps: 'Tríceps', abdomen: 'Abdômen', gluteos: 'Glúteos'
};
const EQUIPS = {
  barra: 'Barra', halteres: 'Halteres', maquina: 'Máquina', cabo: 'Cabo', corpo: 'Peso corporal'
};
const ALL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // até 7 treinos, um por dia da semana
const START_COUNT = 3; // quantos treinos aparecem na primeira vez
const STORAGE_KEY = 'ese-treinos-v2';
const DEFAULT_ITEM = { series: '3', reps: '10-12', descanso: '60s' };

const $ = (sel) => document.querySelector(sel);
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Cada exercício ganha um código fixo (tirado do nome) e o código do vídeo.
EXERCISES.forEach((e) => {
  e.id = slug(e.name);
  e.videoId = youtubeId(e.youtube);
});
const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

function youtubeId(url) {
  const m = String(url || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// ─── TREINOS SALVOS NO APARELHO ─────────────────────────────────────────────
const blankWorkout = () => ({ nome: '', itens: [] });

function emptyState() {
  const treinos = {};
  ALL_LETTERS.slice(0, START_COUNT).forEach((l) => { treinos[l] = blankWorkout(); });
  return { atual: 'A', treinos };
}

// Lê os treinos salvos e garante que as letras fiquem em sequência (A, B, C...).
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.treinos) {
      const list = ALL_LETTERS.filter((l) => saved.treinos[l]).map((l) => ({
        nome: saved.treinos[l].nome || '',
        itens: (saved.treinos[l].itens || []).filter((it) => BY_ID[it.id]),
        old: l,
      }));
      if (list.length) {
        const base = { atual: 'A', treinos: {} };
        list.forEach((w, i) => {
          const l = ALL_LETTERS[i];
          base.treinos[l] = { nome: w.nome, itens: w.itens };
          if (w.old === saved.atual) base.atual = l;
        });
        return base;
      }
    }
  } catch (err) { /* aparelho sem armazenamento: segue com treino vazio */ }
  return emptyState();
}

let state = loadState();
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* ignora */ }
}
const current = () => state.treinos[state.atual];
const letters = () => ALL_LETTERS.filter((l) => state.treinos[l]);
const nextLetter = () => ALL_LETTERS[letters().length] || null;
const titleOf = (letter) => state.treinos[letter].nome.trim() || `Treino ${letter}`;

// ─── FILTROS ────────────────────────────────────────────────────────────────
const filters = { muscle: 'todos', equip: 'todos' };

function buildChips(containerId, type, labels) {
  const counts = {};
  EXERCISES.forEach((e) => { counts[e[type]] = (counts[e[type]] || 0) + 1; });
  const keys = Object.keys(labels).filter((k) => counts[k]);
  const html = [`<button class="chip active" data-type="${type}" data-value="todos">Todos</button>`]
    .concat(keys.map((k) => `<button class="chip" data-type="${type}" data-value="${k}">${labels[k]}<small>${counts[k]}</small></button>`))
    .join('');
  $(containerId).innerHTML = html;
  return keys.length;
}

function setFilter(type, value) {
  filters[type] = value;
  document.querySelectorAll(`.chip[data-type="${type}"]`).forEach((b) => {
    b.classList.toggle('active', b.dataset.value === value);
  });
  render();
}

// ─── LISTA DE CARTÕES ──────────────────────────────────────────────────────
function render(animate = true) {
  const query = norm($('#searchInput').value.trim());
  const grid = $('#grid');
  grid.classList.toggle('no-anim', animate === false);

  const filtered = EXERCISES.filter((e) =>
    (filters.muscle === 'todos' || e.muscle === filters.muscle) &&
    (filters.equip === 'todos' || e.equip === filters.equip) &&
    (!query || norm(e.name + ' ' + (MUSCLES[e.muscle] || '') + ' ' + (e.subgroup || '')).includes(query))
  );

  $('#countBadge').textContent = `${filtered.length} exercício${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div><h3>Nenhum exercício encontrado</h3><p>Tente outros filtros ou outra palavra na busca.</p></div>`;
    return;
  }

  let groupKey = null;
  if (!query && filters.muscle === 'todos') groupKey = (e) => MUSCLES[e.muscle] || e.muscle;
  else if (!query) groupKey = (e) => e.subgroup || MUSCLES[e.muscle];

  if (!groupKey) {
    grid.innerHTML = filtered.map(cardHTML).join('');
    return;
  }
  const groups = new Map();
  filtered.forEach((e) => {
    const k = groupKey(e);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  });
  let html = '';
  let i = 0;
  groups.forEach((list, label) => {
    html += `<div class="section-divider"><span class="section-divider-label">${esc(label)}</span><div class="section-divider-line"></div></div>`;
    list.forEach((e) => { html += cardHTML(e, i++); });
  });
  grid.innerHTML = html;
}

function cardHTML(e, i) {
  const inWorkout = current().itens.some((it) => it.id === e.id);
  const thumb = e.videoId
    ? `<img src="https://i.ytimg.com/vi/${e.videoId}/mqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">`
    : '';
  return `
  <article class="card${inWorkout ? ' in-workout' : ''}" style="animation-delay:${Math.min(i * 30, 300)}ms">
    <button class="thumb" data-action="play" data-id="${e.id}" aria-label="Assistir ao vídeo: ${esc(e.name)}">
      <span class="thumb-fallback">${e.icon || '🏋️'}</span>
      ${thumb}
      <span class="thumb-play"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
    </button>
    <div class="card-body">
      <h3 class="card-name">${esc(e.name)}</h3>
      <div class="card-tags">
        <span class="tag muscle">${MUSCLES[e.muscle] || e.muscle}</span>
        <span class="tag equip">${EQUIPS[e.equip] || e.equip}</span>
      </div>
      <p class="card-tip">${esc(e.tip)}</p>
      <div class="card-actions">
        <button class="btn btn-add${inWorkout ? ' added' : ''}" data-action="toggle" data-id="${e.id}">
          ${inWorkout ? `✓ No treino ${state.atual}` : `+ Adicionar ao treino ${state.atual}`}
        </button>
      </div>
    </div>
  </article>`;
}

// ─── MONTADOR DE TREINO ────────────────────────────────────────────────────
function toggleExercise(id) {
  const itens = current().itens;
  const idx = itens.findIndex((it) => it.id === id);
  if (idx >= 0) {
    itens.splice(idx, 1);
    toast(`Removido do treino ${state.atual}`);
  } else {
    itens.push({ id, ...DEFAULT_ITEM });
    toast(`Adicionado ao treino ${state.atual}`);
    const fab = $('#fab');
    fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump');
  }
  save();
  refresh();
}

function refresh() {
  render(false);
  renderDrawer();
  const total = current().itens.length;
  $('#fabCount').textContent = total;
  $('#fabLabel').textContent = titleOf(state.atual);
}

let imported = null; // treino recebido por link

function renderDrawer() {
  const next = nextLetter();
  $('#tabs').innerHTML = letters().map((l) =>
    `<button class="tab${l === state.atual && !imported ? ' active' : ''}" data-letter="${l}" title="${esc(titleOf(l))}">${l}<small>${state.treinos[l].itens.length}</small></button>`
  ).join('') + (next && !imported
    ? `<button class="tab tab-add" data-action="add-workout" title="Criar treino ${next}" aria-label="Criar treino ${next}">+</button>`
    : '');
  $('#btnClear').textContent = letters().length > 1 ? `Excluir treino ${state.atual}` : 'Limpar este treino';

  const nameInput = $('#workoutName');
  if (document.activeElement !== nameInput || nameInput.dataset.letter !== state.atual) {
    nameInput.value = current().nome;
    nameInput.dataset.letter = state.atual;
  }
  nameInput.placeholder = `Nome do treino (ex.: Peito e tríceps)`;

  const list = $('#drawerList');
  const foot = $('#drawerFoot');

  if (imported) {
    nameInput.classList.add('hidden');
    foot.classList.add('hidden');
    list.innerHTML = `
      <div class="import-banner">
        <div>Você recebeu o treino <b>${esc(imported.nome || 'sem nome')}</b> com ${imported.itens.length} exercício${imported.itens.length !== 1 ? 's' : ''}.</div>
        <div>Salvar como:</div>
        <div class="import-actions">
          ${next ? `<button class="btn btn-primary" data-action="import" data-letter="${next}">+ Novo treino ${next}</button>` : ''}
          ${letters().map((l) => `<button class="btn" data-action="import" data-letter="${l}">No lugar do ${esc(titleOf(l))}${state.treinos[l].itens.length ? '' : ' (vazio)'}</button>`).join('')}
        </div>
        <button class="btn btn-ghost" data-action="import-cancel">Agora não</button>
      </div>
      ${imported.itens.map((it, i) => itemHTML(it, i, true)).join('')}`;
    return;
  }

  nameInput.classList.remove('hidden');
  foot.classList.remove('hidden');
  const itens = current().itens;
  if (!itens.length) {
    list.innerHTML = `<div class="drawer-empty">O <b>${esc(titleOf(state.atual))}</b> ainda está vazio.<br>Feche este painel e toque em <b>+ Adicionar</b> nos exercícios que quiser.<br><br>Cada letra é um treino (um dia). Toque em <b>+</b> para criar mais, até 7.</div>`;
    return;
  }
  list.innerHTML = itens.map((it, i) => itemHTML(it, i, false)).join('');
}

function itemHTML(it, i, readOnly) {
  const e = BY_ID[it.id];
  const n = readOnly ? 0 : current().itens.length;
  const tools = readOnly
    ? `<button data-action="play" data-id="${e.id}" title="Ver vídeo" aria-label="Ver vídeo">▶</button>`
    : `<button data-action="play" data-id="${e.id}" title="Ver vídeo" aria-label="Ver vídeo">▶</button>
       <button data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} title="Subir" aria-label="Subir">↑</button>
       <button data-action="down" data-index="${i}" ${i === n - 1 ? 'disabled' : ''} title="Descer" aria-label="Descer">↓</button>
       <button data-action="remove" data-index="${i}" title="Tirar do treino" aria-label="Tirar do treino">✕</button>`;
  const field = (key, label, mode) => readOnly
    ? `<label>${label}<input value="${esc(it[key])}" disabled></label>`
    : `<label>${label}<input inputmode="${mode}" data-field="${key}" data-index="${i}" value="${esc(it[key])}"></label>`;
  return `
  <div class="item">
    <div class="item-top">
      <span class="item-num">${i + 1}</span>
      <div class="item-name">${esc(e.name)}<small>${MUSCLES[e.muscle]} · ${EQUIPS[e.equip]}</small></div>
      <div class="item-tools">${tools}</div>
    </div>
    <div class="item-fields">
      ${field('series', 'Séries', 'numeric')}
      ${field('reps', 'Repetições', 'text')}
      ${field('descanso', 'Descanso', 'text')}
    </div>
  </div>`;
}

function moveItem(i, dir) {
  const itens = current().itens;
  const j = i + dir;
  if (j < 0 || j >= itens.length) return;
  [itens[i], itens[j]] = [itens[j], itens[i]];
  save();
  refresh();
}

function openDrawer() {
  $('#drawer').classList.add('open');
  $('#backdrop').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#backdrop').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ─── COMPARTILHAR ──────────────────────────────────────────────────────────
function siteUrl() {
  return location.protocol.startsWith('http') ? location.origin + location.pathname : 'https://rotruska.github.io/monte-seu-exercicio/';
}

function encodeWorkout(w) {
  const data = { n: w.nome, i: w.itens.map((it) => [it.id, it.series, it.reps, it.descanso]) };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeWorkout(code) {
  try {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    const itens = (data.i || [])
      .filter((r) => Array.isArray(r) && BY_ID[r[0]])
      .map((r) => ({ id: r[0], series: String(r[1] ?? ''), reps: String(r[2] ?? ''), descanso: String(r[3] ?? '') }));
    if (!itens.length) return null;
    return { nome: String(data.n || '').slice(0, 80), itens };
  } catch (err) { return null; }
}

function shareLink() {
  return `${siteUrl()}#treino=${encodeWorkout(current())}`;
}

function shareText() {
  const w = current();
  const lines = [`*${titleOf(state.atual)}*`, ''];
  w.itens.forEach((it, i) => {
    const e = BY_ID[it.id];
    lines.push(`${i + 1}. ${e.name} — ${it.series}x ${it.reps}${it.descanso ? ` · descanso ${it.descanso}` : ''}`);
    if (e.youtube) lines.push(`   ▶ ${e.youtube}`);
  });
  lines.push('', `Abrir no site: ${shareLink()}`);
  return lines.join('\n');
}

function shareWhatsApp() {
  if (!current().itens.length) return toast('Adicione exercícios primeiro');
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, '_blank', 'noopener');
}

async function copyLink() {
  if (!current().itens.length) return toast('Adicione exercícios primeiro');
  const link = shareLink();
  try {
    await navigator.clipboard.writeText(link);
    toast('Link copiado! Cole onde quiser.');
  } catch (err) {
    window.prompt('Copie o link do treino:', link);
  }
}

function printWorkout() {
  const w = current();
  if (!w.itens.length) return toast('Adicione exercícios primeiro');
  $('#printSheet').innerHTML = `
    <h1>${esc(titleOf(state.atual))}</h1>
    <p>Monte seu Exercício · ${new Date().toLocaleDateString('pt-BR')}</p>
    <table>
      <thead><tr><th>#</th><th>Exercício</th><th>Séries</th><th>Repetições</th><th>Descanso</th><th>Dica</th></tr></thead>
      <tbody>${w.itens.map((it, i) => {
        const e = BY_ID[it.id];
        return `<tr><td>${i + 1}</td><td><b>${esc(e.name)}</b><br><small>${MUSCLES[e.muscle]} · ${EQUIPS[e.equip]}</small></td><td>${esc(it.series)}</td><td>${esc(it.reps)}</td><td>${esc(it.descanso)}</td><td><small>${esc(e.tip)}</small></td></tr>`;
      }).join('')}</tbody>
    </table>`;
  window.print();
}

function addWorkout() {
  const l = nextLetter();
  if (!l) return toast('Máximo de 7 treinos');
  state.treinos[l] = blankWorkout();
  state.atual = l;
  save();
  refresh();
  $('#workoutName').focus();
  toast(`Treino ${l} criado. Dê um nome e adicione exercícios.`);
}

// Com um treino só, apenas esvazia. Com vários, exclui e puxa as letras seguintes (D vira C...).
function clearWorkout() {
  const ls = letters();
  if (ls.length <= 1) {
    if (!current().itens.length) return;
    if (!confirm(`Apagar todos os exercícios do ${titleOf(state.atual)}?`)) return;
    current().itens = [];
    current().nome = '';
  } else {
    const what = current().itens.length ? ` e seus ${current().itens.length} exercício(s)` : '';
    if (!confirm(`Excluir o ${titleOf(state.atual)}${what}?`)) return;
    const pos = ls.indexOf(state.atual);
    const kept = ls.filter((l) => l !== state.atual).map((l) => state.treinos[l]);
    state.treinos = {};
    kept.forEach((w, i) => { state.treinos[ALL_LETTERS[i]] = w; });
    state.atual = ALL_LETTERS[Math.max(0, pos - 1)];
  }
  save();
  refresh();
}

function checkIncomingLink() {
  const m = location.hash.match(/treino=([\w-]+)/);
  if (!m) return;
  imported = decodeWorkout(m[1]);
  history.replaceState(null, '', location.pathname + location.search);
  if (imported) {
    renderDrawer();
    openDrawer();
  } else {
    toast('Não consegui abrir esse link de treino');
  }
}

function acceptImport(letter) {
  if (!state.treinos[letter]) state.treinos[letter] = blankWorkout();
  const target = state.treinos[letter];
  if (target.itens.length && !confirm(`O ${titleOf(letter)} já tem exercícios. Trocar pelo treino recebido?`)) return;
  target.nome = imported.nome;
  target.itens = imported.itens;
  state.atual = letter;
  imported = null;
  save();
  refresh();
  toast(`Salvo como Treino ${letter}`);
}

// ─── VÍDEO DENTRO DO SITE ──────────────────────────────────────────────────
let lastFocus = null;
function openVideo(id) {
  const e = BY_ID[id];
  if (!e) return;
  if (!e.videoId) { window.open(e.youtube, '_blank', 'noopener'); return; }
  lastFocus = document.activeElement;
  $('#modalTitle').textContent = e.name;
  $('#modalTip').textContent = e.tip;
  $('#modalYoutube').href = e.youtube;
  $('#videoWrap').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${e.videoId}?autoplay=1&rel=0&playsinline=1" title="${esc(e.name)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  updateModalAdd(e.id);
  $('#modal').classList.remove('hidden');
  $('#modalClose').focus();
}
function updateModalAdd(id) {
  const addBtn = $('#modalAdd');
  addBtn.dataset.id = id;
  const inWorkout = current().itens.some((it) => it.id === id);
  addBtn.textContent = inWorkout ? `✓ No treino ${state.atual}` : `+ Adicionar ao treino ${state.atual}`;
  addBtn.classList.toggle('added', inWorkout);
  addBtn.classList.toggle('hidden', !!imported);
}
function closeVideo() {
  $('#videoWrap').innerHTML = '';
  $('#modal').classList.add('hidden');
  if (lastFocus) lastFocus.focus();
}

// ─── AVISO RÁPIDO ──────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ─── LIGAÇÕES ──────────────────────────────────────────────────────────────
function init() {
  $('#statExercises').textContent = EXERCISES.length;
  $('#statMuscles').textContent = buildChips('#muscleChips', 'muscle', MUSCLES);
  $('#statEquips').textContent = buildChips('#equipChips', 'equip', EQUIPS);

  $('#searchInput').addEventListener('input', () => render());

  document.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (chip) return setFilter(chip.dataset.type, chip.dataset.value);

    const tab = ev.target.closest('.tab:not(.tab-add)');
    if (tab) {
      imported = null;
      state.atual = tab.dataset.letter;
      save();
      return refresh();
    }

    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const { action, id } = el.dataset;
    const index = Number(el.dataset.index);
    if (action === 'play') openVideo(id);
    else if (action === 'toggle') toggleExercise(id);
    else if (action === 'modal-toggle') { toggleExercise(id); updateModalAdd(id); }
    else if (action === 'up') moveItem(index, -1);
    else if (action === 'down') moveItem(index, 1);
    else if (action === 'remove') { current().itens.splice(index, 1); save(); refresh(); }
    else if (action === 'add-workout') addWorkout();
    else if (action === 'import') acceptImport(el.dataset.letter);
    else if (action === 'import-cancel') { imported = null; refresh(); }
  });

  $('#drawerList').addEventListener('input', (ev) => {
    const input = ev.target.closest('input[data-field]');
    if (!input) return;
    current().itens[Number(input.dataset.index)][input.dataset.field] = input.value;
    save();
  });
  $('#workoutName').addEventListener('input', (ev) => {
    current().nome = ev.target.value.slice(0, 60);
    save();
    $('#fabLabel').textContent = titleOf(state.atual);
  });
  $('#workoutName').addEventListener('change', () => render(false));

  $('#fab').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#backdrop').addEventListener('click', closeDrawer);
  $('#btnWhats').addEventListener('click', shareWhatsApp);
  $('#btnLink').addEventListener('click', copyLink);
  $('#btnPrint').addEventListener('click', printWorkout);
  $('#btnClear').addEventListener('click', clearWorkout);
  $('#modalClose').addEventListener('click', closeVideo);
  $('#modal').addEventListener('click', (ev) => { if (ev.target.id === 'modal') closeVideo(); });

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    if (!$('#modal').classList.contains('hidden')) closeVideo();
    else if ($('#drawer').classList.contains('open')) closeDrawer();
  });

  refresh();
  render(); // primeira exibição com animação
  checkIncomingLink();
  window.addEventListener('hashchange', checkIncomingLink);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
