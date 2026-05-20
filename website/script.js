/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
const STORAGE_KEY  = 'softwrite_docs';
const SETTINGS_KEY = 'softwrite_settings';

let docs          = [];
let activeDocId   = null;
let viewMode      = 'write'; // write | split | preview
let sidebarVisible = true;
let focusMode     = false;
let saveTimeout   = null;
let settings      = { theme: 'light' };

/* ─────────────────────────────────────────────
   DOM REFS
───────────────────────────────────────────── */
const docListEl   = document.getElementById('doc-list');
const titleEl     = document.getElementById('doc-title');
const editorEl    = document.getElementById('editor');
const previewCol  = document.getElementById('preview-col');
const contentArea = document.getElementById('content-area');
const editorWrap  = document.getElementById('editor-wrap');
const previewWrap = document.getElementById('preview-wrap');
const sidebar     = document.getElementById('sidebar');
const btnShow     = document.getElementById('btn-show-sidebar');

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
function init() {
  loadSettings();
  loadDocs();
  if (docs.length === 0) createDoc('Welcome to SoftWrite', defaultContent());
  else openDoc(docs[0].id);
  renderDocList();
  bindEvents();
  autoResize();
}

function defaultContent() {
  return `# Welcome to SoftWrite

A distraction-free writing space. Your words are saved automatically to your browser.

## Markdown supported

Use **bold**, *italic*, or \`inline code\` naturally.

> Blockquotes bring emphasis to important ideas.

---

Start writing. Everything else fades away.`;
}

/* ─────────────────────────────────────────────
   DOCS — CRUD
───────────────────────────────────────────── */
function loadDocs() {
  try { docs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { docs = []; }
}

function saveDocs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function createDoc(title = 'Untitled', content = '') {
  const doc = {
    id:      Date.now().toString(),
    title,
    content,
    created: Date.now(),
    updated: Date.now()
  };
  docs.unshift(doc);
  saveDocs();
  renderDocList();
  openDoc(doc.id);
  return doc;
}

function openDoc(id) {
  activeDocId   = id;
  const doc     = getDoc(id);
  if (!doc) return;
  titleEl.value  = doc.title;
  editorEl.value = doc.content;
  autoResize();
  updateStats();
  renderPreview();
  renderDocList();
  setSaveStatus('Saved');
}

function getDoc(id) {
  return docs.find(d => d.id === id);
}

function updateActiveDoc() {
  const doc = getDoc(activeDocId);
  if (!doc) return;
  doc.title   = titleEl.value || 'Untitled';
  doc.content = editorEl.value;
  doc.updated = Date.now();
  saveDocs();
  setSaveStatus('Saved');
  renderDocList();
}

function deleteDoc(id) {
  docs = docs.filter(d => d.id !== id);
  saveDocs();
  if (docs.length === 0) createDoc();
  else openDoc(docs[0].id);
  renderDocList();
}

/* ─────────────────────────────────────────────
   RENDER — DOC LIST
───────────────────────────────────────────── */
function renderDocList() {
  docListEl.innerHTML = docs.map(doc => `
    <div class="doc-item ${doc.id === activeDocId ? 'active' : ''}" data-id="${doc.id}">
      <div class="doc-item-title">${escHtml(doc.title || 'Untitled')}</div>
      <div class="doc-item-meta">${formatDate(doc.updated)} · ${wordCount(doc.content)} words</div>
    </div>
  `).join('');

  docListEl.querySelectorAll('.doc-item').forEach(el => {
    el.addEventListener('click', () => openDoc(el.dataset.id));
  });
}

/* ─────────────────────────────────────────────
   RENDER — PREVIEW
───────────────────────────────────────────── */
function renderPreview() {
  const title = titleEl.value || 'Untitled';
  const html  = parseMarkdown(editorEl.value);
  previewCol.innerHTML = `<h1>${escHtml(title)}</h1>` + html;
}

/* ─────────────────────────────────────────────
   MARKDOWN PARSER (regex-based, no libraries)
───────────────────────────────────────────── */
function parseMarkdown(md) {
  let html = md;

  // Fenced code blocks first
  html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${escHtml(code.trim())}</code></pre>`);

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`);

  // Headings (h3 → h1, order matters)
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#{1}\s+(.+)$/gm,  '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g,         '<em>$1</em>');
  html = html.replace(/__(.+?)__/g,         '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g,           '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Unordered lists
  html = html.replace(/((?:^[-*+]\s.+\n?)+)/gm, match => {
    const items = match.trim().split('\n')
      .map(l => `<li>${l.replace(/^[-*+]\s/, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\.\s.+\n?)+)/gm, match => {
    const items = match.trim().split('\n')
      .map(l => `<li>${l.replace(/^\d+\.\s/, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs
  html = html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|pre|blockquote|hr)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
function wordCount(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function updateStats() {
  const text    = editorEl.value;
  const words   = wordCount(text);
  const chars   = text.length;
  const lines   = text === '' ? 1 : text.split('\n').length;
  const readMin = Math.max(1, Math.ceil(words / 200));

  document.getElementById('stat-words').textContent = words.toLocaleString();
  document.getElementById('stat-chars').textContent = chars.toLocaleString();
  document.getElementById('stat-lines').textContent = lines.toLocaleString();
  document.getElementById('stat-read').textContent  = readMin + ' min';
}

/* ─────────────────────────────────────────────
   VIEW MODES
───────────────────────────────────────────── */
function setViewMode(mode) {
  viewMode = mode;
  contentArea.classList.remove('split');
  previewWrap.classList.remove('visible');
  editorWrap.style.display = 'flex';

  document.getElementById('btn-view-write').classList.toggle('active',   mode === 'write');
  document.getElementById('btn-view-split').classList.toggle('active',   mode === 'split');
  document.getElementById('btn-view-preview').classList.toggle('active', mode === 'preview');

  if (mode === 'split') {
    contentArea.classList.add('split');
    previewWrap.classList.add('visible');
    renderPreview();
  } else if (mode === 'preview') {
    editorWrap.style.display = 'none';
    previewWrap.classList.add('visible');
    renderPreview();
  }
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
function setSidebar(show) {
  sidebarVisible = show;
  sidebar.classList.toggle('hidden', !show);
  btnShow.style.display = show ? 'none' : 'flex';
}

/* ─────────────────────────────────────────────
   FOCUS MODE
───────────────────────────────────────────── */
function toggleFocusMode() {
  focusMode = !focusMode;
  document.body.classList.toggle('focus-mode', focusMode);
  document.getElementById('btn-focus').classList.toggle('active', focusMode);
  setSidebar(!focusMode);
}

/* ─────────────────────────────────────────────
   THEME
───────────────────────────────────────────── */
function loadSettings() {
  try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { theme: 'light' }; }
  catch { settings = { theme: 'light' }; }
  applyTheme();
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  const icon = document.getElementById('icon-theme');
  if (settings.theme === 'dark') {
    icon.innerHTML = `<circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  } else {
    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  }
}

function toggleTheme() {
  settings.theme = settings.theme === 'light' ? 'dark' : 'light';
  applyTheme();
  saveSettings();
}

/* ─────────────────────────────────────────────
   MARKDOWN FORMATTING HELPERS
───────────────────────────────────────────── */
function wrapSelection(before, after = before) {
  const s           = editorEl.selectionStart;
  const e           = editorEl.selectionEnd;
  const selected    = editorEl.value.slice(s, e);
  const replacement = before + selected + after;
  editorEl.setRangeText(replacement, s, e, 'select');
  editorEl.focus();
  onEditorInput();
}

function prependLine(prefix) {
  const s         = editorEl.selectionStart;
  const textBefore = editorEl.value.slice(0, s);
  const lineStart = textBefore.lastIndexOf('\n') + 1;
  const lineEnd   = editorEl.value.indexOf('\n', s);
  const end       = lineEnd === -1 ? editorEl.value.length : lineEnd;
  const line      = editorEl.value.slice(lineStart, end);
  editorEl.setRangeText(prefix + line, lineStart, end, 'end');
  editorEl.focus();
  onEditorInput();
}

/* ─────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────── */
function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function slugify(s) {
  return (s || 'untitled')
    .toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 50);
}

function exportMd() {
  const title   = titleEl.value || 'Untitled';
  const content = `# ${title}\n\n${editorEl.value}`;
  download(slugify(title) + '.md', content, 'text/markdown');
}

function exportTxt() {
  const title   = titleEl.value || 'Untitled';
  const stripped = editorEl.value
    .replace(/[#*_`>~\[\]]/g, '').replace(/\n{3,}/g, '\n\n');
  download(slugify(title) + '.txt', title + '\n\n' + stripped, 'text/plain');
}

function exportHtml() {
  const title    = titleEl.value || 'Untitled';
  const bodyHtml = parseMarkdown(editorEl.value);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escHtml(title)}</title>
<style>
  body { font-family: Georgia, serif; font-size: 18px; line-height: 1.85;
         max-width: 680px; margin: 60px auto; padding: 0 24px;
         color: #0f1923; background: #ffffff; }
  h1 { font-size: 32px; margin-bottom: 24px; }
  h2 { font-size: 24px; margin: 28px 0 12px; }
  h3 { font-size: 20px; margin: 22px 0 10px; }
  p  { margin-bottom: 16px; }
  blockquote { border-left: 3px solid #2563eb; padding-left: 18px;
               color: #4a5568; font-style: italic; }
  code { font-family: 'Courier New', monospace; background: #dbeafe;
         padding: 2px 5px; border-radius: 3px; color: #2563eb; }
  pre  { background: #f0f4f9; border: 1px solid #e2e8f0;
         padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; color: #4a5568; }
  hr  { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
  a   { color: #2563eb; }
</style>
</head>
<body>
<h1>${escHtml(title)}</h1>
${bodyHtml}
</body>
</html>`;
  download(slugify(title) + '.html', html, 'text/html');
}

function copyToClipboard() {
  const title = titleEl.value || 'Untitled';
  const text  = `# ${title}\n\n${editorEl.value}`;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
}

/* ─────────────────────────────────────────────
   MODALS
───────────────────────────────────────────── */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
let toastTimeout;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ─────────────────────────────────────────────
   SAVE STATUS
───────────────────────────────────────────── */
function setSaveStatus(msg) {
  document.getElementById('stat-save').textContent = msg;
}

/* ─────────────────────────────────────────────
   AUTO-RESIZE TEXTAREAS
───────────────────────────────────────────── */
function autoResize() {
  [titleEl, editorEl].forEach(ta => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  });
}

/* ─────────────────────────────────────────────
   EDITOR INPUT HANDLER
───────────────────────────────────────────── */
function onEditorInput() {
  autoResize();
  updateStats();
  if (viewMode !== 'write') renderPreview();
  setSaveStatus('Saving…');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(updateActiveDoc, 600);
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(ts) {
  const d    = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/* ─────────────────────────────────────────────
   BIND EVENTS
───────────────────────────────────────────── */
function bindEvents() {
  /* Editor input */
  editorEl.addEventListener('input', onEditorInput);
  titleEl.addEventListener('input', () => {
    autoResize();
    setSaveStatus('Saving…');
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(updateActiveDoc, 600);
  });

  /* Tab → spaces */
  editorEl.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editorEl.selectionStart;
      editorEl.setRangeText('  ', s, s, 'end');
      onEditorInput();
    }
  });

  /* Global keyboard shortcuts */
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'b') { e.preventDefault(); wrapSelection('**'); }
    if (ctrl && e.key === 'i') { e.preventDefault(); wrapSelection('*'); }
    if (ctrl && e.key === 's') { e.preventDefault(); updateActiveDoc(); showToast('Saved'); }
    if (ctrl && e.key === 'e') { e.preventDefault(); openModal('modal-export'); }
    if (ctrl && e.key === '\\') { e.preventDefault(); setSidebar(!sidebarVisible); }
    if (e.key === 'F11') { e.preventDefault(); toggleFocusMode(); }
    if (e.key === 'Escape') {
      closeModal('modal-delete');
      closeModal('modal-export');
      if (focusMode) toggleFocusMode();
    }
  });

  /* Sidebar toggle */
  document.getElementById('btn-hide-sidebar').addEventListener('click', () => setSidebar(false));
  btnShow.addEventListener('click', () => setSidebar(true));

  /* New doc */
  document.getElementById('btn-new-doc').addEventListener('click', () => {
    createDoc('Untitled', '');
    titleEl.focus();
    titleEl.select();
  });

  /* Format buttons */
  document.getElementById('fmt-bold').addEventListener('click',   () => wrapSelection('**'));
  document.getElementById('fmt-italic').addEventListener('click', () => wrapSelection('*'));
  document.getElementById('fmt-h1').addEventListener('click',     () => prependLine('# '));
  document.getElementById('fmt-h2').addEventListener('click',     () => prependLine('## '));
  document.getElementById('fmt-quote').addEventListener('click',  () => prependLine('> '));
  document.getElementById('fmt-code').addEventListener('click',   () => wrapSelection('`'));
  document.getElementById('fmt-hr').addEventListener('click', () => {
    const s = editorEl.selectionStart;
    editorEl.setRangeText('\n\n---\n\n', s, s, 'end');
    onEditorInput();
  });

  /* View mode */
  document.getElementById('btn-view-write').addEventListener('click',   () => setViewMode('write'));
  document.getElementById('btn-view-split').addEventListener('click',   () => setViewMode('split'));
  document.getElementById('btn-view-preview').addEventListener('click', () => setViewMode('preview'));
  document.getElementById('btn-focus').addEventListener('click', toggleFocusMode);

  /* Theme */
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);

  /* Delete modal */
  document.getElementById('btn-delete').addEventListener('click', () => openModal('modal-delete'));
  document.getElementById('modal-delete-cancel').addEventListener('click',  () => closeModal('modal-delete'));
  document.getElementById('modal-delete-confirm').addEventListener('click', () => {
    closeModal('modal-delete');
    deleteDoc(activeDocId);
    showToast('Document deleted');
  });

  /* Export modal */
  document.getElementById('btn-export').addEventListener('click',        () => openModal('modal-export'));
  document.getElementById('modal-export-cancel').addEventListener('click', () => closeModal('modal-export'));
  document.getElementById('exp-md').addEventListener('click',   () => { exportMd();          closeModal('modal-export'); showToast('Exported as .md'); });
  document.getElementById('exp-txt').addEventListener('click',  () => { exportTxt();         closeModal('modal-export'); showToast('Exported as .txt'); });
  document.getElementById('exp-html').addEventListener('click', () => { exportHtml();        closeModal('modal-export'); showToast('Exported as .html'); });
  document.getElementById('exp-copy').addEventListener('click', () => { copyToClipboard();   closeModal('modal-export'); });

  /* Close modals on backdrop click */
  ['modal-delete', 'modal-export'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) closeModal(id);
    });
  });

  /* Window resize */
  window.addEventListener('resize', autoResize);

  /* Set initial view mode */
  setViewMode('write');
  document.getElementById('btn-view-write').classList.add('active');
}

/* ─── Boot ─── */
init();