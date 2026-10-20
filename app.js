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

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function readLinesToItems(lines, baseUrl) {
  const entries = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    let url = line;
    if (url.startsWith('file://')) url = url.replace(/^file:\/\//, '');

    const name = safeDecode(url.split('/').pop() || '');
    const type = classify(name);

    if (/^https?:|^rtsp:|^rtmp:|^mms:|^ftp:/.test(url)) {
      entries.push({ name, type, remote: true, url });
    } else {
      try {
        const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        entries.push({ name, type, remote: false, url: new URL(url, base).href });
      } catch {
        entries.push({ name, type, remote: false, url });
      }
    }
  }
  return entries;
}

function readM3U(text, baseUrl, baseName) {
  return readLinesToItems(text.split(/\r?\n/), baseUrl);
}

function readPLS(text, baseUrl) {
  const entries = [];
  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!/^file\d*=/i.test(line)) continue;

    const value = line.replace(/^file\d*\s*=\s*/i, '').trim();
    if (!value) continue;

    let url = value;
    if (url.startsWith('file://')) url = url.replace(/^file:\/\//, '');

    const name = safeDecode(url.split('/').pop() || '');
    const type = classify(name);

    if (/^https?:|^rtsp:|^rtmp:|^mms:|^ftp:/.test(url)) {
      entries.push({ name, type, remote: true, url });
    } else {
      try {
        const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        entries.push({ name, type, remote: false, url: new URL(url, base).href });
      } catch {
        entries.push({ name, type, remote: false, url });
      }
    }
  }
  return entries;
}

class PlayerService {
  constructor(elements) {
    this.items = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffled = false;
    this.isLooped = false;

    this.video = elements.video;
    this.imageView = elements.imageView;
    this.textView = elements.textView;
    this.dropzone = elements.dropzone;
    this.placeholder = elements.placeholder;
    this.nowPlaying = elements.nowPlaying;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.video.addEventListener('play', () => this.isPlaying = true);
    this.video.addEventListener('pause', () => this.isPlaying = false);
    this.video.addEventListener('ended', () => this.handleEnded());
    this.video.addEventListener('error', () => this.handleError());
  }

  loadItem(index) {
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    this.currentIndex = index;

    this.hideAllMedia();

    if (item.type === 'video' || item.type === 'audio') {
      this.video.style.display = 'block';
      this.video.src = item.url;
      this.video.load();
      this.video.play().catch(() => {});
    } else if (item.type === 'image') {
      this.imageView.style.display = 'block';
      this.imageView.src = item.url;
    } else {
      this.textView.style.display = 'block';
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
    this.placeholder.style.display = 'none';
  }

  playPause() {
    if (this.currentIndex === -1) return;
    if (this.video.paused) {
      this.video.play().catch(() => {});
    } else {
      this.video.pause();
    }
  }

  stop() {
    this.video.pause();
    this.video.currentTime = 0;
    this.video.removeAttribute('src');
    this.video.load();
    this.isPlaying = false;
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
    for (const file of Array.from(files)) {
      const type = classify(file.name);
      if (type === 'playlist') {
        try {
          const text = await file.text();
          const base = URL.createObjectURL(file).replace(/[^/]*$/, '');
          const parsed = file.name.toLowerCase().endsWith('.pls') ? readPLS(text, base) : readM3U(text, base, file.name);
          entries.push(...parsed);
          continue;
        } catch (e) { console.error('Error parsing playlist:', e); }
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
    if (this.currentIndex === -1 && entries.length) this.loadItem(start);
    renderPlaylist();
  }

  addUrl(url, name) {
    const trimmed = (url || '').trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      this.nowPlaying.innerHTML = '<span class="t">Unsupported</span> &ndash; only http/https links can be opened';
      return false;
    }
    const label = name || safeDecode(trimmed.split('/').pop()) || trimmed;
    const item = { name: label, type: classify(label), remote: true, url: trimmed };
    this.items.push(item);
    this.loadItem(this.items.length - 1);
    renderPlaylist();
    return true;
  }

  clearPlaylist() {
    this.items.forEach(item => {
      if (item.url && !item.remote) URL.revokeObjectURL(item.url);
    });
    this.items = [];
    this.currentIndex = -1;
    this.nowPlaying.textContent = 'No file loaded';
    this.stop();
    this.hideAllMedia();
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
    if (item && (item.type === 'video' || item.type === 'audio') && !item.remote) {
      this.nowPlaying.innerHTML = '<span class="t">Failed</span> &ndash; format not playable, try another file';
    }
  }
}

class DragDropService {
  constructor(dropzone, placeholder, playerService) {
    const preventDefault = (e) => e.preventDefault();

    ['dragover', 'dragenter'].forEach(ev => {
      dropzone.addEventListener(ev, e => {
        preventDefault(e);
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(ev => {
      dropzone.addEventListener(ev, e => {
        preventDefault(e);
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', e => {
      preventDefault(e);
      dropzone.classList.remove('dragover');
      const dt = e.dataTransfer;
      if (!dt) return;

      const files = [];
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.kind === 'file' && item.getAsFile) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length) {
        playerService.addFiles(files);
        return;
      }

      const urls = dt.getData('text/uri-list') || '';
      const first = urls.split(/\r?\n/).map(line => line.trim()).find(line => line && !line.startsWith('#'));
      if (first) {
        const name = safeDecode(first.split('/').pop() || '');
        playerService.addUrl(first, name);
      }
    });

    document.addEventListener('dragover', e => {
      if (e.target === document.body) preventDefault(e);
    });

    document.addEventListener('drop', e => {
      if (e.target === document.body) {
        preventDefault(e);
        const dt = e.dataTransfer;
        if (dt && dt.files.length) playerService.addFiles(dt.files);
      }
    });
  }
}

class KeyboardService {
  constructor(playerService) {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;

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
  dropzone: document.getElementById('dropzone'),
  placeholder: document.querySelector('.placeholder'),
  playlistEl: document.getElementById('playlist'),
  seekbar: document.getElementById('seekbar'),
  volumeBar: document.getElementById('volumeBar'),
  nowPlaying: document.getElementById('nowPlaying'),
  currentTime: document.getElementById('currentTime'),
  totalTime: document.getElementById('totalTime'),
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
  dropzone: elements.dropzone,
  placeholder: elements.placeholder,
  nowPlaying: elements.nowPlaying,
});

const dragDropService = new DragDropService(elements.dropzone, elements.placeholder, playerService);
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

let isSeeking = false;

elements.seekbar.addEventListener('pointerdown', () => { isSeeking = true; });
elements.seekbar.addEventListener('pointerup', () => { isSeeking = false; });
elements.seekbar.addEventListener('change', () => { isSeeking = false; });

elements.seekbar.addEventListener('input', () => {
  if (elements.video.duration && !isNaN(elements.video.duration)) {
    elements.video.currentTime = parseFloat(elements.seekbar.value);
  }
});

elements.video.addEventListener('timeupdate', () => {
  const duration = elements.video.duration;
  if (!isFinite(duration) || duration <= 0) return;
  elements.seekbar.max = String(duration);
  elements.totalTime.textContent = formatTime(duration);
  if (isSeeking) return;
  elements.seekbar.value = String(elements.video.currentTime);
  elements.currentTime.textContent = formatTime(elements.video.currentTime);
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

function syncDurationUI() {
  const duration = elements.video.duration;
  if (!isFinite(duration) || duration <= 0) return;
  elements.seekbar.max = String(duration);
  elements.totalTime.textContent = formatTime(duration);
}

function syncTransportUI() {
  elements.playBtn.classList.toggle('is-playing', !elements.video.paused);

  const volumePercent = Math.round(playerService.getVolume() * 100);
  elements.volumeBar.value = String(volumePercent);
  elements.volumeBar.style.setProperty('--vol', `${volumePercent}%`);
  updateMuteState();

  elements.fullscreenBtn.classList.toggle('is-fullscreen', !!document.fullscreenElement);
  elements.shuffleBtn.classList.toggle('active', playerService.isShuffled);
  elements.loopBtn.classList.toggle('active', playerService.isLooped);
}

function renderPlaylist() {
  elements.playlistEl.textContent = '';
  playerService.items.forEach((item, index) => {
    const li = document.createElement('li');
    li.dataset.index = String(index);
    li.className = index === playerService.currentIndex ? 'active' : '';

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(index + 1).padStart(2, '0');

    const label = document.createElement('span');
    label.textContent = shortName(item.name);

    li.appendChild(num);
    li.appendChild(label);
    li.title = `${item.name} \u2013 ${item.type}`;
    li.addEventListener('click', () => playerService.loadItem(index));
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
