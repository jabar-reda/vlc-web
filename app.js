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

const uiState = {
  isSeeking: false,
};

class PlayerService {
  constructor(elements, uiState) {
    this.items = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffled = false;
    this.isLooped = false;
    this.uiState = uiState;

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
    const item = this.items[index];
    this.currentIndex = index;

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
    this.video.removeAttribute('src');
    this.video.load();
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

  toggleLoop() {
    this.isLooped = !this.isLooped;
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
    let skipped = 0;

    for (const file of Array.from(files)) {
      const type = classify(file.name);
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
    if (this.isLooped) {
      this.video.currentTime = 0;
      this.video.play().catch(() => {});
    } else {
      this.next();
    }
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

const appEl = document.getElementById('app');
const dragDropService = new DragDropService(elements.dropzone, playerService, appEl);
const keyboardService = new KeyboardService(playerService);

elements.openBtn.addEventListener('click', () => elements.fileInput.click());

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

elements.video.addEventListener('timeupdate', () => {
  syncDurationUI();
  if (uiState.isSeeking || elements.seekbar.disabled) return;
  elements.seekbar.value = String(elements.video.currentTime);
  elements.currentTime.textContent = formatTime(elements.video.currentTime);
  syncSeekProgress();
});

elements.video.addEventListener('loadedmetadata', syncDurationUI);
elements.video.addEventListener('durationchange', syncDurationUI);
elements.video.addEventListener('play', syncTransportUI);
elements.video.addEventListener('pause', syncTransportUI);
elements.video.addEventListener('volumechange', syncTransportUI);

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
  playerService.toggleLoop();
  elements.loopBtn.classList.toggle('active', playerService.isLooped);
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
  elements.loopBtn.classList.toggle('active', playerService.isLooped);
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
    row.addEventListener('click', () => playerService.loadItem(index));
    li.appendChild(row);
    elements.playlistEl.appendChild(li);
  });
  elements.count.textContent = String(playerService.items.length);
}

window.addEventListener('beforeunload', () => {
  playerService.items.forEach((item) => {
    if (item.url && !item.remote) {
      URL.revokeObjectURL(item.url);
    }
  });
});
