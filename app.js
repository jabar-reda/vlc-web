'use strict';

const EXT_PATTERNS = {
  video: /\.(mp4|m4v|mkv|webm|ogv|ogg|mov|avi|flv|wmv|mpeg|mpg|m2ts|ts|3gp|3g2|f4v|mts|m2v|mpv)$/i,
  audio: /\.(mp3|wav|m4a|aac|flac|ogg|oga|opus|webm|wma|aiff|aif|mid|midi|amr|3gp)$/i,
  image: /\.(png|jpe?g|gif|bmp|webp|svg|ico|avif|tiff?|jxl)$/i,
  playlist: /\.(m3u|m3u8|pls)$/i,
  sub: /\.(srt|vtt|ass|ssa|sub)$/i,
};

const TYPE_LABELS = {
  video: 'Video',
  audio: 'Audio',
  image: 'Image',
  text: 'Text',
  sub: 'Subtitle',
  playlist: 'Playlist',
};

const LOOP_MODES = ['off', 'one', 'all'];

const LOOP_LABELS = {
  off: 'Loop off',
  one: 'Loop one',
  all: 'Loop all',
};

// Mirrors the 46rem breakpoint in style.css.
const RAIL_MEDIA_QUERY = '(max-width: 46rem)';

function extOf(name) {
  const match = name.match(/\.([a-z0-9]{1,8})$/i);
  return match ? match[1].toLowerCase() : '';
}

function safeDecode(str) {
  try { return decodeURIComponent(str); } catch { return str; }
}

function classify(name) {
  if (EXT_PATTERNS.video.test(name)) return 'video';
  if (EXT_PATTERNS.audio.test(name)) return 'audio';
  if (EXT_PATTERNS.image.test(name)) return 'image';
  if (EXT_PATTERNS.playlist.test(name)) return 'playlist';
  if (EXT_PATTERNS.sub.test(name)) return 'sub';
  return 'text';
}

function shortName(name, maxLength = 40) {
  return name.length > maxLength ? name.slice(0, maxLength - 2) + '\u2026' : name;
}

function typeLabel(type) {
  return TYPE_LABELS[type] || type;
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function isSupportedSource(url) {
  return /^https?:\/\//i.test(url);
}

function srtToVtt(text) {
  const body = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${body}`;
}

function entryName(url) {
  try {
    const path = new URL(url).pathname;
    return safeDecode(path.split('/').pop() || '') || url;
  } catch {
    return url;
  }
}

function buildEntry(url, title = '') {
  const fileName = entryName(url);
  return {
    name: title || fileName,
    type: classify(fileName),
    remote: true,
    url,
  };
}

function readM3U(text) {
  const entries = [];
  let skipped = 0;
  let pendingTitle = '';

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const comma = line.indexOf(',');
      pendingTitle = comma >= 0 ? line.slice(comma + 1).trim() : '';
      continue;
    }
    if (line.startsWith('#')) continue;

    if (!isSupportedSource(line)) {
      skipped += 1;
      pendingTitle = '';
      continue;
    }

    entries.push(buildEntry(line, pendingTitle));
    pendingTitle = '';
  }

  return { entries, skipped };
}

function readPLS(text) {
  const entries = [];
  let skipped = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!/^file\d*\s*=/i.test(line)) continue;

    const url = line.replace(/^file\d*\s*=\s*/i, '').trim();
    if (!url) continue;

    if (!isSupportedSource(url)) {
      skipped += 1;
      continue;
    }

    entries.push(buildEntry(url));
  }

  return { entries, skipped };
}

const STORAGE_VOLUME_KEY = 'vlcweb.volume';
const STORAGE_POSITIONS_KEY = 'vlcweb.positions';
const MAX_SAVED_POSITIONS = 50;
const RESUME_MIN_SECONDS = 3;
const RESUME_END_MARGIN = 5;

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage is unavailable on some file:// origins and in private mode */
  }
}

function itemKey(item) {
  if (item.remote) return item.url;
  if (item.file) return `${item.file.name}|${item.file.size}|${item.file.lastModified}`;
  return item.url;
}

function readSavedPositions() {
  try {
    const parsed = JSON.parse(readStorage(STORAGE_POSITIONS_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePosition(item, seconds) {
  const positions = readSavedPositions();
  const key = itemKey(item);
  delete positions[key];
  positions[key] = seconds;

  const keys = Object.keys(positions);
  for (const staleKey of keys.slice(0, Math.max(0, keys.length - MAX_SAVED_POSITIONS))) {
    delete positions[staleKey];
  }
  writeStorage(STORAGE_POSITIONS_KEY, JSON.stringify(positions));
}

function removeSavedPosition(item) {
  const positions = readSavedPositions();
  const key = itemKey(item);
  if (!(key in positions)) return;
  delete positions[key];
  writeStorage(STORAGE_POSITIONS_KEY, JSON.stringify(positions));
}

function readSavedVolume() {
  const raw = readStorage(STORAGE_VOLUME_KEY);
  if (raw === null) return null;
  const value = parseFloat(raw);
  if (!isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

function saveVolume(percent) {
  writeStorage(STORAGE_VOLUME_KEY, String(Math.round(percent)));
}

const uiState = {
  isSeeking: false,
};

class PlayerService {
  constructor(elements, uiState) {
    this.items = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffled = false;
    this.loopMode = 'off';
    this.uiState = uiState;
    this.subtitleUrl = null;
    this.subtitleTrack = null;

    this.video = elements.video;
    this.imageView = elements.imageView;
    this.textView = elements.textView;
    this.audioView = elements.audioView;
    this.audioTitle = elements.audioTitle;
    this.dropzone = elements.dropzone;
    this.placeholder = elements.placeholder;
    this.nowPlaying = elements.nowPlaying;
    this.seekbar = elements.seekbar;
    this.currentTimeEl = elements.currentTime;
    this.totalTimeEl = elements.totalTime;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.video.addEventListener('play', () => this.isPlaying = true);
    this.video.addEventListener('pause', () => this.isPlaying = false);
    this.video.addEventListener('ended', () => this.handleEnded());
    this.video.addEventListener('error', () => this.handleError());
    this.imageView.addEventListener('error', () => this.handleImageError());
  }

  loadItem(index) {
    this.uiState.isSeeking = false;
    if (index < 0 || index >= this.items.length) return;
    this.saveCurrentPosition();

    const item = this.items[index];
    this.currentIndex = index;

    this.clearSubtitle();
    hideStatus();
    this.hideAllMedia();

    if (item.type === 'video' || item.type === 'audio') {
      if (item.type === 'audio') {
        this.audioTitle.textContent = item.name;
        this.audioView.style.display = 'flex';
      } else {
        this.video.style.display = 'block';
      }
      this.video.src = item.url;
      this.video.load();
      this.video.play().catch(() => {});
    } else if (item.type === 'image') {
      this.imageView.style.display = 'block';
      this.imageView.src = item.url;
      this.video.removeAttribute('src');
      this.video.load();
      this.resetSeekUI();
    } else {
      this.textView.style.display = 'block';
      this.video.removeAttribute('src');
      this.video.load();
      this.resetSeekUI();
      this.loadTextFile(item);
    }

    this.nowPlaying.textContent = '';
    const typeSpan = document.createElement('span');
    typeSpan.className = 't';
    typeSpan.textContent = typeLabel(item.type);
    this.nowPlaying.appendChild(typeSpan);
    this.nowPlaying.appendChild(document.createTextNode(` \u2013 ${item.name}`));
    renderPlaylist();
  }

  showAudioIfNoPicture() {
    if (this.video.videoWidth > 0) return;
    const item = this.items[this.currentIndex];
    if (!item || item.type !== 'video') return;
    this.video.style.display = 'none';
    this.audioTitle.textContent = item.name;
    this.audioView.style.display = 'flex';
  }

  hideAllMedia() {
    this.video.pause();
    this.video.style.display = 'none';
    this.imageView.style.display = 'none';
    this.textView.style.display = 'none';
    this.audioView.style.display = 'none';
    this.placeholder.style.display = 'none';
  }

  resetSeekUI() {
    this.seekbar.value = '0';
    this.seekbar.style.setProperty('--progress', '0%');
    this.currentTimeEl.textContent = '00:00';
    this.totalTimeEl.textContent = '--:--';
  }

  playPause() {
    const item = this.items[this.currentIndex];
    if (!item || (item.type !== 'video' && item.type !== 'audio')) return;
    if (this.video.paused) {
      this.video.play().catch(() => {});
    } else {
      this.video.pause();
    }
  }

  stop() {
    this.video.pause();
    this.video.currentTime = 0;
    this.isPlaying = false;
  }

  unload() {
    this.stop();
    this.clearSubtitle();
    this.video.removeAttribute('src');
    this.video.load();
  }

  async attachSubtitle(file) {
    this.clearSubtitle();

    const name = file.name.toLowerCase();
    const isVtt = name.endsWith('.vtt');
    if (!isVtt && !name.endsWith('.srt')) {
      showStatus({
        title: 'Subtitle format not supported',
        detail: 'Only .vtt and .srt subtitle files can be attached.',
      });
      return;
    }

    try {
      const blob = isVtt ? file : new Blob([srtToVtt(await file.text())], { type: 'text/vtt' });
      this.subtitleUrl = URL.createObjectURL(blob);

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = file.name;
      track.srclang = 'und';
      track.default = true;
      track.src = this.subtitleUrl;
      this.video.appendChild(track);
      this.subtitleTrack = track;
      track.track.mode = 'showing';
    } catch (e) {
      showStatus({
        title: 'Could not read the subtitle file',
        detail: `${file.name} could not be loaded.`,
      });
    }
  }

  clearSubtitle() {
    if (this.subtitleTrack) {
      this.subtitleTrack.remove();
      this.subtitleTrack = null;
    }
    if (this.subtitleUrl) {
      URL.revokeObjectURL(this.subtitleUrl);
      this.subtitleUrl = null;
    }
  }

  saveCurrentPosition() {
    const item = this.items[this.currentIndex];
    if (!item || (item.type !== 'video' && item.type !== 'audio')) return;
    const time = this.video.currentTime;
    if (!isFinite(time) || time < 1) return;
    const duration = this.video.duration;
    if (isFinite(duration) && duration - time < RESUME_END_MARGIN) return;
    savePosition(item, Math.floor(time));
  }

  restorePosition() {
    const item = this.items[this.currentIndex];
    if (!item || (item.type !== 'video' && item.type !== 'audio')) return;
    const saved = readSavedPositions()[itemKey(item)];
    if (!isFinite(saved) || saved < RESUME_MIN_SECONDS) return;
    const duration = this.video.duration;
    if (!isFinite(duration) || saved > duration - RESUME_END_MARGIN) return;
    this.video.currentTime = saved;
  }

  randomIndex() {
    if (this.items.length === 1) return this.currentIndex;
    let idx;
    do { idx = Math.floor(Math.random() * this.items.length); }
    while (idx === this.currentIndex);
    return idx;
  }

  next() {
    if (!this.items.length) return;
    let idx;
    if (this.isShuffled) {
      idx = this.randomIndex();
    } else {
      idx = (this.currentIndex + 1) % this.items.length;
    }
    this.loadItem(idx);
  }

  prev() {
    if (!this.items.length) return;
    let idx;
    if (this.isShuffled) {
      idx = this.randomIndex();
    } else {
      idx = (this.currentIndex - 1 + this.items.length) % this.items.length;
    }
    this.loadItem(idx);
  }

  rewind() {
    this.video.currentTime = Math.max(0, this.video.currentTime - 10);
  }

  forward() {
    this.video.currentTime = Math.min(this.video.duration || Infinity, this.video.currentTime + 10);
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
  }

  cycleLoop() {
    const nextMode = LOOP_MODES[(LOOP_MODES.indexOf(this.loopMode) + 1) % LOOP_MODES.length];
    this.loopMode = nextMode;
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
  }

  setVolume(volume) {
    this.video.volume = Math.max(0, Math.min(1, volume));
    this.video.muted = false;
  }

  getVolume() {
    return this.video.muted ? 0 : this.video.volume;
  }

  getIsMuted() {
    return this.video.muted || this.video.volume === 0;
  }

  async addFiles(files) {
    const entries = [];
    const subtitleFiles = [];
    let skipped = 0;

    for (const file of Array.from(files)) {
      const type = classify(file.name);
      if (type === 'sub') {
        subtitleFiles.push(file);
        continue;
      }
      if (type === 'playlist') {
        try {
          const text = await file.text();
          const parsed = file.name.toLowerCase().endsWith('.pls') ? readPLS(text) : readM3U(text);
          entries.push(...parsed.entries);
          skipped += parsed.skipped;
        } catch (e) {
          showStatus({
            title: 'Could not read the playlist',
            detail: `${file.name} could not be parsed.`,
          });
        }
        continue;
      }
      entries.push({
        name: file.name,
        type,
        url: URL.createObjectURL(file),
        file
      });
    }

    const start = this.items.length;
    this.items = [...this.items, ...entries];
    if (this.currentIndex === -1 && entries.length) {
      this.loadItem(start);
    } else if (entries.length) {
      renderPlaylist();
    }

    if (skipped > 0) {
      showStatus({
        tone: 'notice',
        title: 'Some entries were skipped',
        detail: `${skipped} entries were skipped because only http and https links can be played.`,
      });
    }

    if (subtitleFiles.length) {
      const current = this.items[this.currentIndex];
      if (current && current.type === 'video') {
        await this.attachSubtitle(subtitleFiles[0]);
      } else {
        showStatus({
          title: 'Open a video first',
          detail: 'A subtitle file attaches to the video that is playing.',
        });
      }
    }
  }

  addUrl(url) {
    const trimmed = (url || '').trim();
    if (!isSupportedSource(trimmed)) {
      showStatus({
        title: 'Link not supported',
        detail: 'Only http and https links can be opened.',
      });
      return false;
    }
    const fileName = entryName(trimmed);
    const item = { name: fileName, type: classify(fileName), remote: true, url: trimmed };
    this.items.push(item);
    this.loadItem(this.items.length - 1);
    return true;
  }

  clearPlaylist() {
    this.items.forEach(item => {
      if (item.url && !item.remote) URL.revokeObjectURL(item.url);
    });
    this.items = [];
    this.currentIndex = -1;
    this.nowPlaying.textContent = 'No file loaded';
    this.unload();
    this.hideAllMedia();
    hideStatus();
    this.placeholder.style.display = 'flex';
    renderPlaylist();
  }

  async loadTextFile(item) {
    try {
      const res = await fetch(item.url);
      this.textView.textContent = await res.text();
    } catch (e) {
      this.textView.textContent = `Could not read file: ${item.name}`;
    }
  }

  handleEnded() {
    const item = this.items[this.currentIndex];
    if (item) removeSavedPosition(item);

    if (this.loopMode === 'one') {
      this.video.currentTime = 0;
      this.video.play().catch(() => {});
      return;
    }

    const isLast = this.currentIndex === this.items.length - 1;
    if (this.loopMode === 'off' && !this.isShuffled && isLast) {
      this.video.pause();
      this.video.currentTime = 0;
      return;
    }

    this.next();
  }

  handleError() {
    const item = this.items[this.currentIndex];
    if (!item || (item.type !== 'video' && item.type !== 'audio')) return;
    const hasNext = this.items.length > 1;
    showStatus({
      title: 'This file cannot be played',
      detail: `${item.name} uses a format this browser cannot decode.`,
      actionLabel: hasNext ? 'Play next item' : '',
      onAction: hasNext ? () => this.next() : null,
    });
  }

  handleImageError() {
    if (!this.imageView.getAttribute('src')) return;
    showStatus({
      title: 'This image cannot be shown',
      detail: 'The file may be corrupted or use a format the browser cannot display.',
    });
  }
}

class DragDropService {
  constructor(dropzone, playerService, app) {
    this.dropzone = dropzone;
    this.playerService = playerService;
    this.app = app;
    this.dragDepth = 0;

    document.addEventListener('dragenter', (e) => {
      if (!this.acceptsDrag(e)) return;
      e.preventDefault();
      this.dragDepth += 1;
      this.app.classList.add('is-dragging');
    });

    document.addEventListener('dragover', (e) => {
      if (!this.acceptsDrag(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });

    document.addEventListener('dragleave', () => {
      if (this.dragDepth === 0) return;
      this.dragDepth -= 1;
      if (this.dragDepth === 0) this.app.classList.remove('is-dragging');
    });

    document.addEventListener('drop', (e) => {
      if (!this.acceptsDrag(e)) return;
      e.preventDefault();
      this.resetDragState();
      this.handleDrop(e.dataTransfer);
    });

    ['dragend', 'blur'].forEach((eventName) => {
      window.addEventListener(eventName, () => this.resetDragState());
    });

    dropzone.addEventListener('dragenter', (e) => {
      if (!this.acceptsDrag(e)) return;
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragover', (e) => {
      if (!this.acceptsDrag(e)) return;
      e.preventDefault();
    });

    dropzone.addEventListener('dragleave', (e) => {
      if (dropzone.contains(e.relatedTarget)) return;
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', () => dropzone.classList.remove('dragover'));
  }

  acceptsDrag(event) {
    const data = event.dataTransfer;
    if (!data) return false;
    const types = Array.from(data.types);
    if (types.includes('Files')) return true;
    if (!types.includes('text/uri-list')) return false;
    return !this.isTextEntry(event.target);
  }

  isTextEntry(target) {
    return target instanceof Element && target.closest('input, textarea, [contenteditable="true"]') !== null;
  }

  resetDragState() {
    this.dragDepth = 0;
    this.app.classList.remove('is-dragging');
    this.dropzone.classList.remove('dragover');
  }

  handleDrop(dataTransfer) {
    if (!dataTransfer) return;

    const files = [];
    for (const item of Array.from(dataTransfer.items || [])) {
      if (item.kind !== 'file' || !item.getAsFile) continue;
      const file = item.getAsFile();
      if (file && !(file.size === 0 && file.type === '')) files.push(file);
    }
    if (!files.length && dataTransfer.files) {
      for (const file of Array.from(dataTransfer.files)) files.push(file);
    }
    if (files.length) {
      this.playerService.addFiles(files);
      return;
    }

    const raw = dataTransfer.getData('text/uri-list') || dataTransfer.getData('text/plain') || '';
    const first = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#'));
    if (first) {
      this.playerService.addUrl(first);
    }
  }
}


class KeyboardService {
  constructor(playerService) {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.target instanceof Element && e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          playerService.playPause();
          break;
        case 'ArrowLeft':
          playerService.rewind();
          break;
        case 'ArrowRight':
          playerService.forward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          playerService.setVolume(Math.min(1, playerService.getVolume() + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          playerService.setVolume(Math.max(0, playerService.getVolume() - 0.1));
          break;
        case 'n':
        case 'N':
          playerService.next();
          break;
        case 'p':
        case 'P':
          playerService.prev();
          break;
        case 'm':
        case 'M':
          playerService.toggleMute();
          break;
        case 'f':
        case 'F':
          this.toggleFullscreen();
          break;
        case 's':
        case 'S':
          playerService.stop();
          break;
      }
    });
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }
}

const elements = {
  video: document.getElementById('video'),
  imageView: document.getElementById('imageView'),
  textView: document.getElementById('textView'),
  audioView: document.getElementById('audioView'),
  audioTitle: document.getElementById('audioTitle'),
  dropzone: document.getElementById('dropzone'),
  placeholder: document.querySelector('.placeholder'),
  playlistEl: document.getElementById('playlist'),
  seekbar: document.getElementById('seekbar'),
  volumeBar: document.getElementById('volumeBar'),
  nowPlaying: document.getElementById('nowPlaying'),
  currentTime: document.getElementById('currentTime'),
  totalTime: document.getElementById('totalTime'),
  status: document.getElementById('status'),
  statusTitle: document.getElementById('statusTitle'),
  statusDetail: document.getElementById('statusDetail'),
  statusAction: document.getElementById('statusAction'),
  count: document.getElementById('count'),
  playBtn: document.getElementById('playBtn'),
  volumeBtn: document.getElementById('volumeBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  loopBtn: document.getElementById('loopBtn'),
  fileInput: document.getElementById('fileInput'),
  openBtn: document.getElementById('openBtn'),
  railToggle: document.getElementById('railToggle'),
  addLinkBtn: document.getElementById('addLinkBtn'),
  linkForm: document.getElementById('linkForm'),
  linkInput: document.getElementById('linkInput'),
  linkError: document.getElementById('linkError'),
  clearAll: document.getElementById('clearAll'),
  prevBtn: document.getElementById('prevBtn'),
  rewindBtn: document.getElementById('rewindBtn'),
  nextBtn: document.getElementById('nextBtn'),
  forwardBtn: document.getElementById('forwardBtn'),
  stopBtn: document.getElementById('stopBtn'),
};

const playerService = new PlayerService({
  video: elements.video,
  imageView: elements.imageView,
  textView: elements.textView,
  audioView: elements.audioView,
  audioTitle: elements.audioTitle,
  dropzone: elements.dropzone,
  placeholder: elements.placeholder,
  nowPlaying: elements.nowPlaying,
  seekbar: elements.seekbar,
  currentTime: elements.currentTime,
  totalTime: elements.totalTime,
}, uiState);

const savedVolume = readSavedVolume();
if (savedVolume !== null) {
  playerService.setVolume(savedVolume / 100);
}

const appEl = document.getElementById('app');
const dragDropService = new DragDropService(elements.dropzone, playerService, appEl);
const keyboardService = new KeyboardService(playerService);

function setRailCollapsed(isCollapsed) {
  appEl.classList.toggle('rail-collapsed', isCollapsed);
  elements.railToggle.setAttribute('aria-expanded', String(!isCollapsed));
}

elements.railToggle.addEventListener('click', () => {
  setRailCollapsed(!appEl.classList.contains('rail-collapsed'));
});

elements.openBtn.addEventListener('click', () => elements.fileInput.click());

function setLinkFormOpen(isOpen) {
  elements.linkForm.hidden = !isOpen;
  elements.addLinkBtn.setAttribute('aria-expanded', String(isOpen));
  elements.linkError.hidden = true;
  elements.linkInput.removeAttribute('aria-invalid');
  if (isOpen) {
    elements.linkInput.focus();
  } else {
    elements.addLinkBtn.focus();
  }
}

elements.addLinkBtn.addEventListener('click', () => {
  setLinkFormOpen(elements.linkForm.hidden);
});

elements.linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = elements.linkInput.value.trim();
  if (!value) {
    elements.linkInput.focus();
    return;
  }
  if (playerService.addUrl(value)) {
    elements.linkInput.value = '';
    setLinkFormOpen(false);
    return;
  }
  elements.linkInput.setAttribute('aria-invalid', 'true');
  elements.linkError.hidden = false;
  elements.linkError.textContent = 'Only http and https links can be opened.';
  elements.linkInput.focus();
});

elements.linkForm.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  e.preventDefault();
  elements.linkInput.value = '';
  setLinkFormOpen(false);
});

elements.fileInput.addEventListener('change', async (e) => {
  const target = e.target;
  if (target.files && target.files.length) {
    await playerService.addFiles(target.files);
    target.value = '';
  }
});

elements.clearAll.addEventListener('click', () => playerService.clearPlaylist());
elements.prevBtn.addEventListener('click', () => playerService.prev());
elements.rewindBtn.addEventListener('click', () => playerService.rewind());
elements.playBtn.addEventListener('click', () => playerService.playPause());
elements.stopBtn.addEventListener('click', () => playerService.stop());
elements.forwardBtn.addEventListener('click', () => playerService.forward());
elements.nextBtn.addEventListener('click', () => playerService.next());

elements.seekbar.addEventListener('pointerdown', (e) => {
  uiState.isSeeking = true;
  elements.seekbar.setPointerCapture(e.pointerId);
});
elements.seekbar.addEventListener('lostpointercapture', () => { uiState.isSeeking = false; });
elements.seekbar.addEventListener('pointercancel', () => { uiState.isSeeking = false; });
elements.seekbar.addEventListener('change', () => { uiState.isSeeking = false; });
window.addEventListener('pointerup', () => { uiState.isSeeking = false; });

elements.seekbar.addEventListener('input', () => {
  if (elements.video.duration && !isNaN(elements.video.duration)) {
    elements.video.currentTime = parseFloat(elements.seekbar.value);
  }
  syncSeekProgress();
});

let positionTick = 0;

elements.video.addEventListener('timeupdate', () => {
  syncDurationUI();
  positionTick += 1;
  if (positionTick % 20 === 0) playerService.saveCurrentPosition();
  if (uiState.isSeeking || elements.seekbar.disabled) return;
  elements.seekbar.value = String(elements.video.currentTime);
  elements.currentTime.textContent = formatTime(elements.video.currentTime);
  syncSeekProgress();
});

elements.video.addEventListener('loadedmetadata', () => {
  syncDurationUI();
  playerService.restorePosition();
  playerService.showAudioIfNoPicture();
});
elements.video.addEventListener('durationchange', syncDurationUI);
elements.video.addEventListener('play', syncTransportUI);
elements.video.addEventListener('pause', () => {
  syncTransportUI();
  playerService.saveCurrentPosition();
});
elements.video.addEventListener('volumechange', () => {
  syncTransportUI();
  saveVolume(elements.video.volume * 100);
});

elements.volumeBar.addEventListener('input', () => {
  const volume = parseFloat(elements.volumeBar.value) / 100;
  elements.volumeBar.style.setProperty('--vol', `${elements.volumeBar.value}%`);
  playerService.setVolume(volume);
  updateMuteState();
});

elements.volumeBtn.addEventListener('click', () => {
  playerService.toggleMute();
  updateMuteState();
});

elements.fullscreenBtn.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  elements.fullscreenBtn.classList.toggle('is-fullscreen', !!document.fullscreenElement);
});

elements.shuffleBtn.addEventListener('click', () => {
  playerService.toggleShuffle();
  elements.shuffleBtn.classList.toggle('active', playerService.isShuffled);
});

elements.loopBtn.addEventListener('click', () => {
  playerService.cycleLoop();
  syncTransportUI();
});

function updateMuteState() {
  const muted = playerService.getIsMuted();
  elements.volumeBtn.classList.toggle('is-muted', muted);
  elements.volumeBar.classList.toggle('is-muted', muted);
}

function showStatus({ title, detail = '', actionLabel = '', onAction = null, tone = 'error' }) {
  elements.status.hidden = false;
  elements.status.dataset.tone = tone;
  elements.statusTitle.textContent = title;
  elements.statusDetail.textContent = detail;
  elements.statusDetail.hidden = !detail;
  elements.statusAction.hidden = !actionLabel;
  elements.statusAction.textContent = actionLabel;
  elements.statusAction.onclick = actionLabel && onAction ? onAction : null;
}

function hideStatus() {
  elements.status.hidden = true;
  elements.statusAction.onclick = null;
}

function syncDurationUI() {
  const duration = elements.video.duration;
  const isKnown = isFinite(duration) && duration > 0;
  elements.seekbar.disabled = !isKnown;
  if (!isKnown) {
    if (elements.totalTime.textContent !== '--:--') {
      elements.totalTime.textContent = '--:--';
    }
    elements.seekbar.style.setProperty('--progress', '0%');
    return;
  }
  const max = String(duration);
  if (elements.seekbar.max !== max) {
    elements.seekbar.max = max;
    elements.totalTime.textContent = formatTime(duration);
  }
  syncSeekProgress();
}

function syncSeekProgress() {
  const max = parseFloat(elements.seekbar.max);
  const value = parseFloat(elements.seekbar.value);
  const percent = max > 0 && isFinite(value) ? (value / max) * 100 : 0;
  elements.seekbar.style.setProperty('--progress', `${percent}%`);
}

function syncTransportUI() {
  const isPlaying = !elements.video.paused;
  elements.playBtn.classList.toggle('is-playing', isPlaying);
  elements.playBtn.setAttribute('aria-pressed', String(isPlaying));
  elements.audioView.classList.toggle('is-playing', isPlaying);

  const volumePercent = Math.round(playerService.getVolume() * 100);
  elements.volumeBar.value = String(volumePercent);
  elements.volumeBar.style.setProperty('--vol', `${volumePercent}%`);
  updateMuteState();

  elements.fullscreenBtn.classList.toggle('is-fullscreen', !!document.fullscreenElement);
  elements.shuffleBtn.classList.toggle('active', playerService.isShuffled);
  elements.shuffleBtn.setAttribute('aria-pressed', String(playerService.isShuffled));

  const isLooped = playerService.loopMode !== 'off';
  elements.loopBtn.classList.toggle('active', isLooped);
  elements.loopBtn.setAttribute('aria-pressed', String(isLooped));
  elements.loopBtn.dataset.mode = playerService.loopMode;
  elements.loopBtn.setAttribute('aria-label', LOOP_LABELS[playerService.loopMode]);
  elements.loopBtn.title = LOOP_LABELS[playerService.loopMode];
}

function renderPlaylist() {
  elements.playlistEl.textContent = '';
  playerService.items.forEach((item, index) => {
    const li = document.createElement('li');
    if (index === playerService.currentIndex) {
      li.className = 'active';
      li.setAttribute('aria-current', 'true');
    }

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'row';
    row.dataset.index = String(index);
    row.title = `${item.name} \u2013 ${item.type}`;

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(index + 1).padStart(2, '0');

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = shortName(item.name);

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = typeLabel(item.type);

    row.appendChild(num);
    row.appendChild(label);
    row.appendChild(tag);
    row.addEventListener('click', () => {
      playerService.loadItem(index);
      if (window.matchMedia(RAIL_MEDIA_QUERY).matches) setRailCollapsed(true);
    });
    li.appendChild(row);
    elements.playlistEl.appendChild(li);
  });
  elements.count.textContent = String(playerService.items.length);
}

window.addEventListener('beforeunload', () => {
  playerService.saveCurrentPosition();
  saveVolume(elements.video.volume * 100);
  playerService.clearSubtitle();
  playerService.items.forEach((item) => {
    if (item.url && !item.remote) {
      URL.revokeObjectURL(item.url);
    }
  });
});

syncTransportUI();
