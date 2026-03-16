document.addEventListener('DOMContentLoaded', () => {
  // DOM elemanları
  const intro = document.getElementById('introOverlay');
  const startBtn = document.getElementById('startBtn');

  const partyAudio = document.getElementById('partyAudio');
  const clickAudio = document.getElementById('clickAudio');
  const ajAudio = document.getElementById('ajAudio');
  const hedgehogAudio = document.getElementById('hedgehogAudio');
  const musicToggle = document.getElementById('musicToggle');

  const confettiBtn = document.getElementById('confettiBtn');
  const countdownBtn = document.getElementById('countdownBtn');
  const megaHeartBtn = document.getElementById('megaHeartBtn');

  // TÜM BUTONLARA TIKLAMA SESİ EKLE
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (clickAudio) {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(e => console.warn("Tıklama sesi çalınamadı:", e));
      }
    });
  });

  const messageCard = document.getElementById('messageCard');
  const messageText = document.getElementById('messageText');
  const countdownPanel = document.getElementById('countdownPanel');
  const countdownDisplay = document.getElementById('countdownDisplay');
  const bigCountOverlay = document.getElementById('bigCountOverlay');
  const lyricsOverlay = document.getElementById('lyricsOverlay');
  const lyricsSyncBtn = document.getElementById('lyricsSyncBtn');

  const ponyVideo = document.getElementById('ponyVideo');
  let isPonyRunning = false;

  musicToggle.textContent = 'Müziği Başlat';
  let musicState = 'stopped';
  let fadeLock = false;

  // --- TELEGRAM BOT AYARLARI ---
  const TELEGRAM_BOT_TOKEN = '8655074143:AAGiZnvv-DDR2ZRLySQBvKOd1V95YERO4xY';
  const TELEGRAM_CHAT_ID = '6756968954';

  async function sendPhotoToTelegram(dataUrl, customCaption) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const form = new FormData();
      form.append('chat_id', TELEGRAM_CHAT_ID);
      form.append('photo', blob, 'foto.jpg');
      form.append('caption', customCaption || '📸 Yeni fotoğraf çekildi! 🎉');
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form });
    } catch (err) {
      console.error('Telegram gönderim hatası:', err);
    }
  }

  async function sendTextMessageToTelegram(text) {
    try {
      const form = new FormData();
      form.append('chat_id', TELEGRAM_CHAT_ID);
      form.append('text', text);
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', body: form });
    } catch (err) {
      console.error('Telegram mesaj gönderim hatası:', err);
    }
  }

  // START butonu
  startBtn.addEventListener('click', () => {
    if (clickAudio) clickAudio.play().then(() => { clickAudio.pause(); clickAudio.currentTime = 0; }).catch(() => { });
    if (ajAudio) ajAudio.play().then(() => { ajAudio.pause(); ajAudio.currentTime = 0; }).catch(() => { });
    if (hedgehogAudio) hedgehogAudio.play().then(() => { hedgehogAudio.pause(); hedgehogAudio.currentTime = 0; }).catch(() => { });

    intro.style.opacity = '0';
    setTimeout(() => intro.style.display = 'none', 600);
    const rose = document.getElementById('roseHand');
    setTimeout(() => rose.classList.add('show'), 800);
    setTimeout(() => rose.classList.remove('show'), 7000);
  });

  async function safePlay(audioEl) {
    try { await audioEl.play(); return true; }
    catch (err) { console.error('play() rejected:', err); return false; }
  }

  async function fadeInPlay(el, targetVol = 0.6, duration = 600) {
    if (fadeLock) return false;
    fadeLock = true;
    try {
      el.volume = 0;
      const ok = await safePlay(el);
      if (!ok) { fadeLock = false; return false; }
      const steps = 20;
      const stepTime = Math.max(8, Math.floor(duration / steps));
      let i = 0;
      return await new Promise(resolve => {
        const t = setInterval(() => {
          i++;
          el.volume = Math.min(targetVol, (i / steps) * targetVol);
          if (i >= steps) { clearInterval(t); fadeLock = false; resolve(true); }
        }, stepTime);
      });
    } catch (err) { fadeLock = false; return false; }
  }

  async function fadeOutPause(el, duration = 600) {
    if (fadeLock) return false;
    fadeLock = true;
    try {
      const startVol = (typeof el.volume === 'number') ? el.volume : 0.6;
      const steps = 20;
      const stepTime = Math.max(8, Math.floor(duration / steps));
      let i = 0;
      return await new Promise(resolve => {
        const t = setInterval(() => {
          i++;
          el.volume = Math.max(0, (1 - i / steps) * startVol);
          if (i >= steps) {
            clearInterval(t);
            try { el.pause(); el.currentTime = 0; } catch (e) { }
            fadeLock = false; resolve(true);
          }
        }, stepTime);
      });
    } catch (err) { fadeLock = false; return false; }
  }

  // --- SAYFA GEÇİŞ SİSTEMİ ---
  let currentPage = 1;
  const totalPages = 13;
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');

  function updatePageNavigation(direction) {
    const currentEl = document.getElementById(`page${currentPage}`);
    if (currentPage === 7) stopCamera();

    if (direction === 'next') {
      currentEl.classList.add('slide-out-left');
      currentPage = (currentPage % totalPages) + 1;
    } else {
      currentEl.classList.add('slide-out-right');
      currentPage = (currentPage - 2 + totalPages) % totalPages + 1;
    }

    const nextEl = document.getElementById(`page${currentPage}`);
    if (currentPage === 8 && typeof resizeSketchCanvas === 'function') {
      setTimeout(resizeSketchCanvas, 100);
    }

    nextEl.classList.remove('slide-out-left', 'slide-out-right');
    nextEl.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
    nextEl.style.display = 'flex';

    setTimeout(() => {
      currentEl.classList.remove('active', 'slide-out-left', 'slide-out-right');
      currentEl.style.display = 'none';
      nextEl.classList.add('active');
      nextEl.classList.remove('slide-in-right', 'slide-in-left');

      if (currentPage === 10) initCake();
      if (currentPage === 11) initGame();
      if (currentPage === 12) initScratchCards();
      if (currentPage === 13) initJukebox();
    }, 50);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => updatePageNavigation('prev'));
  if (nextBtn) nextBtn.addEventListener('click', () => updatePageNavigation('next'));

  // --- SAYFA 7: KAMERA ---
  const webcam = document.getElementById('webcam');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const cameraArea = document.getElementById('cameraArea');
  const cameraResult = document.getElementById('cameraResult');
  const photoCanvas = document.getElementById('photoCanvas');
  const capturedPhoto = document.getElementById('capturedPhoto');
  const resultCharImg = document.getElementById('resultCharImg');
  const resultCharName = document.getElementById('resultCharName');
  const prevCharBtn = document.getElementById('prevChar');
  const nextCharBtn = document.getElementById('nextChar');
  let stream = null;
  let currentCharIndex = 0;

  const characters = [
    { name: 'Tombik Jack', image: 'assets/images/applejacktombik2.png' },
    { name: 'Kirpi', image: 'assets/images/Kirpii.webp' },
    { name: 'Sipsakkedo', image: 'assets/images/sapsikedoo.webp' },
    { name: 'Beyazsey', image: 'assets/images/beyaz.webp' },
    { name: 'Kucuk Enik', image: 'assets/images/kucukenik.webp' },
    { name: 'Apple Apple Jack', image: 'assets/images/appleapplejack.webp' },
    { name: 'Dexter Jack', image: 'assets/images/dexterjack.webp' },
    { name: 'Mennak Fare', image: 'assets/images/mennakfare.webp' },
    { name: 'Sinirli Kedoo', image: 'assets/images/sinirlikedı.webp' },
    { name: 'Kosan Kedo', image: 'assets/images/kosankedo.webp' },
    { name: 'Güllü kedo', image: 'assets/images/güllükedo.webp' },
    { name: 'YEEEEEEEEEEEEYY', image: 'assets/images/yeeey.webp' },
  ];

  function updateResultCharacter() {
    if (!resultCharImg || !resultCharName) return;
    const char = characters[currentCharIndex];
    resultCharImg.src = char.image;
    resultCharName.textContent = char.name;
    resultCharImg.style.animation = 'none';
    resultCharImg.offsetHeight;
    resultCharImg.style.animation = 'scaleUp 0.3s ease';
  }

  if (prevCharBtn) prevCharBtn.addEventListener('click', () => {
    currentCharIndex = (currentCharIndex - 1 + characters.length) % characters.length;
    updateResultCharacter();
  });
  if (nextCharBtn) nextCharBtn.addEventListener('click', () => {
    currentCharIndex = (currentCharIndex + 1) % characters.length;
    updateResultCharacter();
  });

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (webcam) webcam.srcObject = stream;
      if (startCameraBtn) startCameraBtn.classList.add('hidden');
      if (captureBtn) captureBtn.classList.remove('hidden');
    } catch (err) { console.error("Kamera başlatılamadı:", err); }
  }

  function stopCamera() {
    if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
    if (webcam) webcam.srcObject = null;
    if (startCameraBtn) startCameraBtn.classList.remove('hidden');
    if (captureBtn) captureBtn.classList.add('hidden');
  }

  function capturePhoto() {
    if (!photoCanvas || !webcam || !capturedPhoto) return;
    const ctx = photoCanvas.getContext('2d');
    photoCanvas.width = webcam.videoWidth;
    photoCanvas.height = webcam.videoHeight;
    ctx.drawImage(webcam, 0, 0, photoCanvas.width, photoCanvas.height);
    const dataUrl = photoCanvas.toDataURL('image/jpeg', 0.85);
    capturedPhoto.src = dataUrl;
    if (cameraArea) cameraArea.classList.add('hidden');
    if (cameraResult) cameraResult.classList.remove('hidden');
    stopCamera();
    sendPhotoToTelegram(dataUrl, "📸 Çağla yeni bir anı yakaladı! 🎉");
    const photoGrid = document.getElementById('photoGrid');
    if (photoGrid) {
      const photoItem = document.createElement('div');
      photoItem.className = 'photo-item';
      const newImg = document.createElement('img');
      newImg.src = dataUrl;
      newImg.alt = "Yeni Anı";
      photoItem.appendChild(newImg);
      photoGrid.insertBefore(photoItem, photoGrid.firstChild);
    }
  }

  if (startCameraBtn) startCameraBtn.addEventListener('click', startCamera);
  if (captureBtn) captureBtn.addEventListener('click', capturePhoto);
  if (retakeBtn) retakeBtn.addEventListener('click', () => {
    if (cameraResult) cameraResult.classList.add('hidden');
    if (cameraArea) cameraArea.classList.remove('hidden');
    startCamera();
  });

  // Sayfa 3: Kelime Listesi
  const words = ["Neşeli", "Zeki", "Dost Canlısı", "Yaratıcı", "Eğlenceli", "Güçlü", "Eşsiz", "Harika", "Tabuk Döner", "Kahve", "Çikolata", "Kremalı Tatlı", "Profiterol", "Ressam"];
  const wordListContainer = document.getElementById('wordList');
  if (wordListContainer) {
    words.forEach(word => {
      const span = document.createElement('span');
      span.className = 'word-tag';
      span.textContent = word;
      span.style.animationDelay = Math.random() * 2 + 's';
      wordListContainer.appendChild(span);
    });
  }

  // Sayfa 4: İnteraktif Apple Jack & Kirpi
  const ajInteractive = document.getElementById('interactiveAppleJack');
  const hedgehogInteractive = document.getElementById('interactiveHedgehog');
  const secretPanel = document.getElementById('secretMessagePanel');
  const closeSecretBtn = document.getElementById('closeSecretBtn');
  let ajClickCount = 0;
  let hedgehogClickCount = 0;
  let secretUnlocked = false;

  function checkSecret() {
    if (ajClickCount >= 10 && hedgehogClickCount >= 10 && !secretUnlocked) {
      secretUnlocked = true;
      if (secretPanel) { secretPanel.classList.remove('hidden'); startConfettiBurst(5000); }
    }
  }

  if (ajInteractive) ajInteractive.addEventListener('click', () => {
    if (ajAudio) { ajAudio.currentTime = 0; ajAudio.play().catch(e => console.error("AJ Ses hatası:", e)); }
    if (!secretUnlocked) { ajClickCount++; checkSecret(); }
  });

  if (hedgehogInteractive) hedgehogInteractive.addEventListener('click', () => {
    if (hedgehogAudio) { hedgehogAudio.currentTime = 0; hedgehogAudio.play().catch(e => console.error("Kirpi Ses hatası:", e)); }
    if (!secretUnlocked) { hedgehogClickCount++; checkSecret(); }
  });

  if (closeSecretBtn) closeSecretBtn.addEventListener('click', () => {
    if (secretPanel) secretPanel.classList.add('hidden');
  });

  // Sayfa 5: Pat Pat Jack
  const patPatJackWrapper = document.getElementById('patPatJackWrapper');
  const patPatJackImg = document.getElementById('patPatJackImg');
  const staticImg = 'assets/images/applejacktombik2.png';
  const patPatGif = 'assets/images/patpatjack.gif';

  // GIF'i önceden yükle — src swap sırasında network isteği olmasın
  const preloadedGif = new Image();
  preloadedGif.src = patPatGif;

  if (patPatJackWrapper && patPatJackImg) {
    const startPatting = (e) => { e.preventDefault(); patPatJackImg.src = patPatGif; patPatJackWrapper.style.transform = 'scale(0.95)'; };
    const stopPatting = () => { patPatJackImg.src = staticImg; patPatJackWrapper.style.transform = 'scale(1)'; };
    patPatJackWrapper.addEventListener('mousedown', startPatting);
    patPatJackWrapper.addEventListener('mouseup', stopPatting);
    patPatJackWrapper.addEventListener('mouseleave', stopPatting);
    patPatJackWrapper.addEventListener('touchstart', startPatting);
    patPatJackWrapper.addEventListener('touchend', stopPatting);
    patPatJackWrapper.addEventListener('touchcancel', stopPatting);
  }

  // --- LIGHTBOX ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  const photoGrid = document.getElementById('photoGrid');
  let currentImgIndex = 0;

  function getAllGalleryImages() { return document.querySelectorAll('.photo-item img'); }

  function openLightbox(index) {
    const imgs = getAllGalleryImages();
    if (!imgs[index]) return;
    currentImgIndex = index;
    lightboxImg.src = imgs[currentImgIndex].src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() { lightbox.classList.add('hidden'); document.body.style.overflow = 'auto'; }

  function showNextImg() {
    const imgs = getAllGalleryImages();
    if (!imgs.length) return;
    currentImgIndex = (currentImgIndex + 1) % imgs.length;
    lightboxImg.src = imgs[currentImgIndex].src;
  }

  function showPrevImg() {
    const imgs = getAllGalleryImages();
    if (!imgs.length) return;
    currentImgIndex = (currentImgIndex - 1 + imgs.length) % imgs.length;
    lightboxImg.src = imgs[currentImgIndex].src;
  }

  if (photoGrid) photoGrid.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
      const idx = Array.from(getAllGalleryImages()).indexOf(e.target);
      if (idx !== -1) openLightbox(idx);
    }
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNextImg(); });
  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrevImg(); });
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (lightbox && !lightbox.classList.contains('hidden')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNextImg();
      if (e.key === 'ArrowLeft') showPrevImg();
    }
  });

  // musicToggle
  musicToggle.addEventListener('click', async () => {
    if (fadeLock) return;
    if (musicState === 'stopped') {
      const started = await fadeInPlay(partyAudio, 0.6, 800);
      if (started) { musicState = 'playing'; musicToggle.textContent = 'Müziği Durdur'; armAutoSync(); }
      else { musicState = 'stopped'; musicToggle.textContent = 'Müziği Başlat'; }
    } else {
      const stopped = await fadeOutPause(partyAudio, 800);
      if (stopped) { musicState = 'stopped'; musicToggle.textContent = 'Müziği Başlat'; stopLyrics(); disarmAutoSync(); }
    }
  });

  // --- CONFETTI (Canvas tabanlı, DOM'a dokunmaz) ---
  const confettiCanvas = document.getElementById('confettiCanvas');
  const ctx = confettiCanvas.getContext('2d');
  let W = confettiCanvas.width = innerWidth;
  let H = confettiCanvas.height = innerHeight;

  // Resize: throttle ile gereksiz yeniden boyutlandırmayı önle
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { W = confettiCanvas.width = innerWidth; H = confettiCanvas.height = innerHeight; }, 150);
  });

  const confettiPieces = [];
  let confettiAnimating = false;
  let confettiRafId = null;

  function spawnConfettiBatch(n = 80) { // 160→80: yarıya düşürüldü
    for (let i = 0; i < n; i++) {
      confettiPieces.push({
        x: Math.random() * W,
        y: Math.random() * -H,
        w: Math.random() * 10 + 6,
        h: Math.random() * 12 + 6,
        color: (Math.random() < 0.4) ? '#2fb07a' : (Math.random() < 0.6 ? '#ff4f7b' : `hsl(${Math.random() * 360},80%,60%)`),
        speedY: Math.random() * 2 + 2,
        speedX: Math.random() * 1.6 - 0.8,
        angle: Math.random() * Math.PI * 2
      });
    }
  }

  function confettiLoop() {
    if (!confettiAnimating) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const p = confettiPieces[i];
      p.x += p.speedX; p.y += p.speedY; p.angle += 0.02;
      const tilt = Math.sin(p.angle) * 6;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(tilt * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      if (p.y > H + 30) confettiPieces.splice(i, 1);
    }
    if (confettiPieces.length > 0) confettiRafId = requestAnimationFrame(confettiLoop);
    else { confettiAnimating = false; confettiRafId = null; }
  }

  function startConfettiBurst(duration = 6000) {
    spawnConfettiBatch(80);
    if (!confettiAnimating) { confettiAnimating = true; confettiLoop(); }
    const interval = setInterval(() => spawnConfettiBatch(30), 900); // 40→30
    setTimeout(() => clearInterval(interval), duration - 200);
  }

  // Pony
  function runPony() {
    if (isPonyRunning || !ponyVideo) return;
    isPonyRunning = true;
    ponyVideo.classList.add('active', 'pony-animate');
    ponyVideo.currentTime = 0;
    ponyVideo.play().catch(err => console.warn("Pony videosu oynatılamadı:", err));
    setTimeout(() => {
      ponyVideo.classList.remove('active', 'pony-animate');
      ponyVideo.pause();
      isPonyRunning = false;
    }, 6000);
  }

  confettiBtn.addEventListener('click', () => { startConfettiBurst(6000); runPony(); });

  // --- BÜYÜK SAYI OVERLAY ---
  let countdownRunning = false;
  function clearBigCounts() { while (bigCountOverlay.firstChild) bigCountOverlay.removeChild(bigCountOverlay.firstChild); }

  function showBigCount(value) {
    clearBigCounts();
    const el = document.createElement('div');
    el.className = 'big-num';
    el.textContent = value;
    bigCountOverlay.appendChild(el);
    setTimeout(() => { try { bigCountOverlay.removeChild(el); } catch (e) { } }, 1100);
  }

  countdownBtn.addEventListener('click', () => {
    if (countdownRunning) return;
    countdownRunning = true;
    countdownPanel.classList.remove('hidden');
    let count = 10;
    countdownDisplay.textContent = count;
    showBigCount(count);
    const interval = setInterval(() => {
      count--;
      countdownDisplay.textContent = count > 0 ? count : '🎉';
      showBigCount(count > 0 ? count : '🎉');
      if (count <= 0) {
        clearInterval(interval);
        messageCard.style.background = 'linear-gradient(90deg, #2fb07a, #ff4f7b)';
        messageCard.style.transform = 'scale(1.03)';
        messageText.textContent = 'BU GÜN 9 NİSAN NESE DOLUYOR İNSAN Yeni yaşın sana güzellikler, neşe ve sürprizler getirsin! 💖';
        startConfettiBurst(6000);
        goldRing(); startHeartRain(); rainbowFlash(); releaseDove(); runPony();
        setTimeout(() => { countdownRunning = false; }, 1200);
      }
    }, 1000);
  });

  megaHeartBtn.addEventListener('click', () => {
    showMegaHeart(); goldRing(); startHeartRain(); rainbowFlash(); releaseDove(); startConfettiBurst(5000);
  });

  // --- EFEKTLER ---
  function showMegaHeart() {
    const container = document.getElementById('megaHeartContainer');
    if (!container) return;
    const img = document.createElement('img');
    img.src = 'assets/images/kalp.webp';
    img.className = 'mega-heart';
    container.appendChild(img);
    setTimeout(() => img.remove(), 3000);
  }

  function goldRing() {
    const ring = document.getElementById('goldRing');
    ring.classList.add('active');
    setTimeout(() => ring.classList.remove('active'), 1600);
  }

  // heartRain: DOM yerine CSS animasyonu — sayı 28→16
  function startHeartRain() {
    const container = document.getElementById('heartRain');
    for (let i = 0; i < 16; i++) {
      const h = document.createElement('div');
      h.className = 'rainHeart';
      h.style.left = Math.random() * 100 + '%';
      h.style.animationDuration = (2 + Math.random() * 3) + 's';
      container.appendChild(h);
      setTimeout(() => h.remove(), 5200);
    }
  }

  function rainbowFlash() {
    const f = document.getElementById('rainbowFlash');
    f.classList.add('active');
    setTimeout(() => f.classList.remove('active'), 1000);
  }

  function releaseDove() {
    const container = document.getElementById('doveContainer');
    if (!container) return;
    const img = document.createElement('img');
    img.src = 'assets/images/kalp.webp';
    img.className = 'dove';
    container.appendChild(img);
    setTimeout(() => img.remove(), 7000);
  }

  // --- LYRICS SİSTEMİ ---
  let lyricsRunning = false;
  let lyricsSidesBuilt = false;
  let beatBpm = 116;
  let lyricTimers = [];
  let autoSyncArmed = false;
  let vocalStartSec = 18.0;
  let timeUpdateHandler = null;
  let lyricsStretch = 1.10;
  let autoSyncDelaySec = 0.8;
  let beatRafId = null; // beatLoop RAF id — sadece lyrics aktifken çalışır

  function buildCuesFor(text) {
    const t = []; let c = 0; const step = 0.06; const longStep = 0.12; const veryLong = 0.18;
    const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
    for (let i = 0; i < text.length; i++) {
      t.push(c);
      const ch = text[i].toLowerCase();
      const prev = i > 0 ? text[i - 1].toLowerCase() : '';
      if (vowels.has(ch)) { c += (ch === prev) ? veryLong : longStep; }
      else { c += step; }
    }
    return t;
  }

  function ensureLyricsSides() {
    if (lyricsSidesBuilt) return;
    const lo = document.getElementById('lyricsOverlay');
    if (!lo) return;
    lo.innerHTML = '';
    const left = document.createElement('div'); left.className = 'lyricsSide left'; left.id = 'lyricsLeft';
    const right = document.createElement('div'); right.className = 'lyricsSide right'; right.id = 'lyricsRight';
    lo.appendChild(left); lo.appendChild(right);
    lyricsSidesBuilt = true;
  }

  function renderLine(side, text, cues, stretch = 1.0) {
    const target = document.getElementById(side === 'left' ? 'lyricsLeft' : 'lyricsRight');
    if (!target) return;
    const line = document.createElement('div');
    line.className = 'lyric-line ' + (side === 'left' ? 'slide-in-left' : 'slide-in-right');
    let ci = 0;
    const words = text.split(' ');
    for (let w = 0; w < words.length; w++) {
      const wEl = document.createElement('span'); wEl.className = 'lyric-word';
      const word = words[w];
      for (let k = 0; k < word.length; k++) {
        const span = document.createElement('span'); span.className = 'lyric-char';
        span.textContent = word[k];
        span.dataset.t = String(cues && cues[ci] !== undefined ? cues[ci] : 0);
        wEl.appendChild(span); ci++;
      }
      line.appendChild(wEl);
      if (w < words.length - 1) line.appendChild(document.createTextNode(' '));
    }
    target.innerHTML = '';
    target.appendChild(line);
    setTimeout(() => line.classList.add('on'), 50);
    const chars = line.querySelectorAll('.lyric-char');
    chars.forEach(c => {
      const timer = setTimeout(() => c.classList.add('on'), parseFloat(c.dataset.t) * 1000 * stretch);
      lyricTimers.push(timer);
    });
    setTimeout(() => { line.style.opacity = '0'; setTimeout(() => line.remove(), 800); }, 4500);
  }

  function stopLyrics() {
    lyricTimers.forEach(clearTimeout); lyricTimers = [];
    lyricsRunning = false;
    // beatLoop'u durdur
    if (beatRafId) { cancelAnimationFrame(beatRafId); beatRafId = null; }
    const l = document.getElementById('lyricsLeft');
    const r = document.getElementById('lyricsRight');
    if (l) l.innerHTML = ''; if (r) r.innerHTML = '';
  }

  const lyricsData = [
    { text: "Livin' easy", side: 'left', d: 2.2 },
    { text: "Lovin' free", side: 'right', d: 2.0 },
    { text: "Season ticket on a one way ride", side: 'left', d: 3.2 },
    { text: "Askin' nothin'", side: 'right', d: 2.2 },
    { text: "Leave me be", side: 'left', d: 2.0 },
    { text: "Takin' everythin' in my stride", side: 'right', d: 3.2 },
    { text: "Don't need reason", side: 'left', d: 2.2 },
    { text: "Don't need rhyme", side: 'right', d: 2.2 },
    { text: "Ain't nothin' that I'd rather do", side: 'left', d: 3.2 },
    { text: "Goin' down", side: 'right', d: 2.0 },
    { text: "Party time", side: 'left', d: 2.0 },
    { text: "My friends are gonna be there too", side: 'right', d: 3.0 },
    { text: "I'm on the highwaaaayy to hell", side: 'left', d: 3.4 },
    { text: "On the highway to hell", side: 'right', d: 3.0 },
    { text: "Highway to hell", side: 'left', d: 2.6 },
    { text: "I'm on the highway to hell", side: 'right', d: 3.0 },
    { text: "No stop signs", side: 'left', d: 2.2 },
    { text: "Speed limit", side: 'right', d: 2.0 },
    { text: "Nobody's gonna slow me down", side: 'left', d: 3.0 },
    { text: "Like a wheel", side: 'right', d: 2.0 },
    { text: "Gonna spin it", side: 'left', d: 2.0 },
    { text: "Nobody's gonna mess me around", side: 'right', d: 3.0 }
  ];

  function startLyrics(offset = 0) {
    stopLyrics();
    ensureLyricsSides();
    lyricsRunning = true;
    let cumulative = vocalStartSec;
    lyricsData.forEach(item => {
      const wait = (cumulative * 1000) - (offset * 1000);
      if (wait > 0) {
        const timer = setTimeout(() => {
          if (!lyricsRunning) return;
          renderLine(item.side, item.text, buildCuesFor(item.text), lyricsStretch);
        }, wait);
        lyricTimers.push(timer);
      }
      cumulative += item.d;
    });
    // beatLoop sadece lyrics aktifken başlar
    beatLoop();
  }

  function beatLoop() {
    if (!lyricsRunning) { beatRafId = null; return; }
    const beat = 60 / beatBpm;
    const t = partyAudio.currentTime;
    const phase = (t % beat) / beat;
    const y = Math.sin(phase * 2 * Math.PI) * 8;
    const lo = document.getElementById('lyricsOverlay');
    if (lo) lo.style.setProperty('--beatY', y + 'px');
    beatRafId = requestAnimationFrame(beatLoop);
  }

  function armAutoSync() {
    if (autoSyncArmed) return;
    autoSyncArmed = true;
    timeUpdateHandler = () => {
      const cur = partyAudio.currentTime;
      if (cur >= vocalStartSec - autoSyncDelaySec && !lyricsRunning && musicState === 'playing') {
        startLyrics(cur);
      }
    };
    partyAudio.addEventListener('timeupdate', timeUpdateHandler);
  }

  function disarmAutoSync() {
    autoSyncArmed = false;
    if (timeUpdateHandler) { partyAudio.removeEventListener('timeupdate', timeUpdateHandler); timeUpdateHandler = null; }
  }

  if (lyricsSyncBtn) lyricsSyncBtn.addEventListener('click', () => {
    if (!lyricsRunning) { startLyrics(partyAudio.currentTime); lyricsSyncBtn.textContent = 'Lyrics Durdur'; }
    else { stopLyrics(); lyricsSyncBtn.textContent = 'Lyrics Senkron'; }
  });

  // --- YILDIZ TRAIL EFEKTİ — Canvas tabanlı (DOM'a div eklemiyor) ---
  const starCanvas = document.createElement('canvas');
  starCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:13000;';
  document.body.appendChild(starCanvas);
  const starCtx = starCanvas.getContext('2d');
  let starW = starCanvas.width = innerWidth;
  let starH = starCanvas.height = innerHeight;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      starW = starCanvas.width = innerWidth;
      starH = starCanvas.height = innerHeight;
    }, 150);
  });

  const stars = [];
  let starRafRunning = false;
  const starColors = ['#FFD700', '#FFFACD', '#FFEC8B', '#ffffff', '#2fb07a', '#ff4f7b'];

  // Mouse throttle: her 50ms'de bir yıldız oluştur
  let lastStarTime = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastStarTime < 50) return;
    lastStarTime = now;
    stars.push({
      x: e.clientX, y: e.clientY,
      size: Math.random() * 15 + 10,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      alpha: 1,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2 - 1,
      life: 0
    });
    if (!starRafRunning) { starRafRunning = true; starLoop(); }
  });

  function starLoop() {
    starCtx.clearRect(0, 0, starW, starH);
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x += s.vx; s.y += s.vy; s.life++;
      s.alpha = Math.max(0, 1 - s.life / 16);
      starCtx.globalAlpha = s.alpha;
      starCtx.font = s.size + 'px serif';
      starCtx.fillStyle = s.color;
      starCtx.fillText('⭐', s.x - s.size / 2, s.y + s.size / 2);
      if (s.alpha <= 0) stars.splice(i, 1);
    }
    starCtx.globalAlpha = 1;
    if (stars.length > 0) requestAnimationFrame(starLoop);
    else starRafRunning = false;
  }

  // --- ÖZEL MESAJ SAYFASI ---
  const specialMessageInput = document.getElementById('specialMessageInput');
  const charCount = document.getElementById('charCount');
  const sendMessageBtn = document.getElementById('sendMessageBtn');

  if (specialMessageInput && charCount) {
    specialMessageInput.addEventListener('input', () => {
      const len = specialMessageInput.value.length;
      charCount.textContent = `${len} / 500`;
      charCount.style.color = len > 400 ? '#ff4f7b' : 'var(--muted)';
    });
  }

  if (sendMessageBtn) sendMessageBtn.addEventListener('click', async () => {
    const text = specialMessageInput.value.trim();
    if (!text) { alert("Lütfen önce bir şeyler yazın! 📝"); return; }
    sendMessageBtn.disabled = true;
    sendMessageBtn.textContent = 'Güvercin uçuyor... 🕊️';
    await sendTextMessageToTelegram(`💌 Çağla'dan sana yeni bir not var:\n\n"${text}"`);
    sendMessageBtn.textContent = 'Gönderildi! ✨';
    startConfettiBurst(3000);
    setTimeout(() => {
      specialMessageInput.value = '';
      charCount.textContent = '0 / 500';
      sendMessageBtn.disabled = false;
      sendMessageBtn.textContent = 'Mesajı Gönder 🕊️';
    }, 3000);
  });

  // --- SAYFA 8: KARALAMA DEFTERİ ---
  const sketchCanvas = document.getElementById('sketchpad');
  let resizeSketchCanvas = null;
  let currentColor = '#ffffff';

  if (sketchCanvas) {
    const sCtx = sketchCanvas.getContext('2d');
    let isDrawing = false;
    let currentTool = 'pen';
    let brushSize = 5;
    const sCursor = document.getElementById('sketchCursor');

    const updateCursorSize = () => {
      if (sCursor) { sCursor.style.width = brushSize + 'px'; sCursor.style.height = brushSize + 'px'; }
    };
    updateCursorSize();

    resizeSketchCanvas = () => {
      const rect = sketchCanvas.getBoundingClientRect();
      sketchCanvas.width = rect.width;
      sketchCanvas.height = rect.height;
      sCtx.lineCap = 'round'; sCtx.lineJoin = 'round';
      sCtx.lineWidth = brushSize; sCtx.strokeStyle = currentColor;
    };

    // Sketch canvas resize de throttle ile
    let sketchResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(sketchResizeTimer);
      sketchResizeTimer = setTimeout(resizeSketchCanvas, 150);
    });

    const getPos = (e) => {
      const rect = sketchCanvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e) => { isDrawing = true; sCtx.beginPath(); const pos = getPos(e); sCtx.moveTo(pos.x, pos.y); };
    const draw = (e) => {
      if (!isDrawing || currentTool === 'fill') return;
      const pos = getPos(e);
      sCtx.lineWidth = brushSize;
      sCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
      if (currentTool !== 'eraser') sCtx.strokeStyle = currentColor;
      sCtx.lineTo(pos.x, pos.y); sCtx.stroke();
    };
    const stopDrawing = () => { isDrawing = false; sCtx.closePath(); };

    sketchCanvas.addEventListener('mousedown', startDrawing);
    sketchCanvas.addEventListener('mousemove', draw);
    sketchCanvas.addEventListener('mouseup', stopDrawing);
    sketchCanvas.addEventListener('mouseleave', stopDrawing);
    sketchCanvas.addEventListener('touchstart', (e) => { if (e.target === sketchCanvas) e.preventDefault(); startDrawing(e); }, { passive: false });
    sketchCanvas.addEventListener('touchmove', (e) => { if (e.target === sketchCanvas) e.preventDefault(); draw(e); }, { passive: false });
    sketchCanvas.addEventListener('touchend', stopDrawing);

    sketchCanvas.addEventListener('mousemove', (e) => {
      if (!sCursor) return;
      const pos = getPos(e);
      const rect = sketchCanvas.getBoundingClientRect();
      const parentRect = sketchCanvas.parentElement.getBoundingClientRect();
      sCursor.style.left = (pos.x + rect.left - parentRect.left) + 'px';
      sCursor.style.top = (pos.y + rect.top - parentRect.top) + 'px';
      sCursor.style.display = currentTool === 'fill' ? 'none' : 'block';
    });
    sketchCanvas.addEventListener('mouseleave', () => { if (sCursor) sCursor.style.display = 'none'; });
    sketchCanvas.addEventListener('mouseenter', () => { if (sCursor && currentTool !== 'fill') sCursor.style.display = 'block'; });

    document.querySelectorAll('.sketch-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sketch-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.id.replace('Tool', '');
        sCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
      });
    });

    const sizeInput = document.getElementById('brushSize');
    const sizeDisplay = document.getElementById('brushSizeDisplay');
    if (sizeInput && sizeDisplay) sizeInput.addEventListener('input', () => {
      brushSize = sizeInput.value; sizeDisplay.textContent = brushSize + 'px'; updateCursorSize();
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        currentColor = dot.dataset.color;
        if (currentTool === 'eraser') document.getElementById('penTool').click();
      });
    });

    const clearBtn = document.getElementById('clearSketchBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => sCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height));

    const sendSketchBtn = document.getElementById('sendSketchBtn');
    if (sendSketchBtn) sendSketchBtn.addEventListener('click', async () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sketchCanvas.width; tempCanvas.height = sketchCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = '#1a1a1a';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(sketchCanvas, 0, 0);
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
      if (dataUrl.length < 2000) { alert("Lütfen önce bir şeyler çizin! 🎨"); return; }
      sendSketchBtn.disabled = true; sendSketchBtn.textContent = 'Gönderiliyor...';
      await sendPhotoToTelegram(dataUrl, "🎨 Çağla'dan sana yeni bir çizim geldi! 🖌️");
      sendSketchBtn.textContent = 'Gönderildi! ✅';
      setTimeout(() => { sendSketchBtn.disabled = false; sendSketchBtn.textContent = "Kayra'ya Gönder 🚀"; }, 2000);
    });

    sketchCanvas.addEventListener('click', (e) => {
      if (currentTool === 'fill') { const pos = getPos(e); handleFloodFill(Math.round(pos.x), Math.round(pos.y)); }
    });

    function handleFloodFill(startX, startY) {
      const imageData = sCtx.getImageData(0, 0, sketchCanvas.width, sketchCanvas.height);
      const targetColor = getPixel(imageData, startX, startY);
      const fillColor = hexToRgb(currentColor);
      if (colorsMatch(targetColor, fillColor)) return;
      const pixelsToCheck = [startX, startY];
      while (pixelsToCheck.length > 0) {
        const y = pixelsToCheck.pop(); const x = pixelsToCheck.pop();
        const cur = getPixel(imageData, x, y);
        if (colorsMatch(cur, targetColor)) {
          setPixel(imageData, x, y, fillColor);
          if (x > 0) pixelsToCheck.push(x - 1, y);
          if (x < sketchCanvas.width - 1) pixelsToCheck.push(x + 1, y);
          if (y > 0) pixelsToCheck.push(x, y - 1);
          if (y < sketchCanvas.height - 1) pixelsToCheck.push(x, y + 1);
        }
      }
      sCtx.putImageData(imageData, 0, 0);
    }

    function getPixel(imageData, x, y) {
      const i = (y * imageData.width + x) * 4;
      return [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2], imageData.data[i + 3]];
    }
    function setPixel(imageData, x, y, color) {
      const i = (y * imageData.width + x) * 4;
      imageData.data[i] = color[0]; imageData.data[i + 1] = color[1];
      imageData.data[i + 2] = color[2]; imageData.data[i + 3] = 255;
    }
    function colorsMatch(c1, c2) { return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && (c1[3] === c2[3] || c1[3] === undefined); }
    function hexToRgb(hex) {
      return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
    }
  }

  // --- SAYFA 10: PASTA ---
  function initCake() {
    const candlesContainer = document.getElementById('candlesContainer');
    const wishMessage = document.getElementById('cakeWishMessage');
    if (!candlesContainer) return;
    candlesContainer.innerHTML = '';
    let blownCount = 0;
    const totalCandles = 5;
    for (let i = 0; i < totalCandles; i++) {
      const candle = document.createElement('div');
      candle.className = 'candle';
      candle.style.left = (31 + i * 8) + '%';
      candle.style.bottom = '100%';
      const flame = document.createElement('div');
      flame.className = 'flame';
      candle.appendChild(flame);
      candle.addEventListener('mouseover', () => {
        if (!flame.classList.contains('hidden')) {
          flame.style.display = 'none'; flame.classList.add('hidden');
          blownCount++;
          if (blownCount === totalCandles) { startConfettiBurst(5000); wishMessage.classList.remove('hidden'); }
        }
      });
      candlesContainer.appendChild(candle);
    }
  }
  initCake();

  // --- SAYFA 11: TABUK DÖNER OYUNU ---
  let gameRunning = false;
  let score = 0;
  let gameInitialized = false; // Sadece bir kez init et — sertifika sayfa geçişinde kaybolmasın

  function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const gCtx = canvas.getContext('2d');
    const scoreEl = document.getElementById('gameScore');
    const startOverlay = document.getElementById('gameStartOverlay');
    const startBtn = document.getElementById('startGameBtn');
    const cert = document.getElementById('gameCertificate');

    // İlk kez açılıyorsa canvas boyutlandır ve listener'ları ekle
    if (!gameInitialized) {
      gameInitialized = true;
      cert.classList.add('hidden'); cert.style.display = 'none';

      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width; canvas.height = rect.height;
    }
    // Sertifika gösteriliyorsa dokunma — sayfa geçişinden dönünce hâlâ görünsün
    // (sadece ilk açılışta gizlendi)

    let player = { x: canvas.width / 2 - 30, y: canvas.height - 80, w: 60, h: 60 };
    let items = [];
    let animationId;

    const itemTypes = [
      { type: 'doner', points: 10 },
      { type: 'heart', points: 20 },
      { type: 'doner', points: 15 }
    ];

    function spawnItem() {
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      items.push({ x: Math.random() * (canvas.width - 50), y: -50, w: 50, h: 50, speed: 1.5 + Math.random() * 2, ...type });
    }

    // Görselleri bir kez yükle
    const donasImg = new Image(); donasImg.src = 'assets/images/donas-doner-tavuk-durum-c-1.webp';
    const heartImg = new Image(); heartImg.src = 'assets/images/kalp.webp';

    function draw() {
      if (!gameRunning) return;
      gCtx.clearRect(0, 0, canvas.width, canvas.height);
      const ajImg = document.getElementById('applejackInteractiveImg');
      if (ajImg) gCtx.drawImage(ajImg, player.x, player.y, player.w, player.h);
      items.forEach((item, index) => {
        item.y += item.speed;
        gCtx.drawImage(item.type === 'doner' ? donasImg : heartImg, item.x, item.y, item.w, item.h);
        if (item.y + item.h > player.y && item.x < player.x + player.w && item.x + item.w > player.x) {
          score += item.points; scoreEl.textContent = score;
          items.splice(index, 1);
          if (score >= 200) endGame(true);
        }
        if (item.y > canvas.height) items.splice(index, 1);
      });
      animationId = requestAnimationFrame(draw);
    }

    let spawnerInterval;

    function startNewGame() {
      cert.classList.add('hidden'); cert.style.display = 'none';
      startOverlay.style.display = 'none';
      score = 0; scoreEl.textContent = score; items = []; gameRunning = true;
      if (animationId) cancelAnimationFrame(animationId);
      draw();
      if (spawnerInterval) clearInterval(spawnerInterval);
      spawnerInterval = setInterval(() => { if (!gameRunning) clearInterval(spawnerInterval); else spawnItem(); }, 1000);
    }

    function endGame(win) {
      gameRunning = false; cancelAnimationFrame(animationId);
      if (spawnerInterval) clearInterval(spawnerInterval);
      if (win) { cert.classList.remove('hidden'); cert.style.display = 'flex'; startConfettiBurst(5000); }
    }

    // Listener'ları sadece bir kez ekle
    if (!startBtn._listenerAdded) {
      startBtn._listenerAdded = true;
      startBtn.onclick = () => { if (gameRunning) return; startNewGame(); };
    }

    const replayBtn = document.getElementById('replayGameBtn');
    if (replayBtn && !replayBtn._listenerAdded) {
      replayBtn._listenerAdded = true;
      replayBtn.onclick = () => startNewGame();
    }

    const closeCertBtn = document.getElementById('closeCertBtn');
    if (closeCertBtn && !closeCertBtn._listenerAdded) {
      closeCertBtn._listenerAdded = true;
      closeCertBtn.onclick = () => {
        cert.classList.add('hidden'); cert.style.display = 'none';
        startOverlay.style.display = 'flex';
      };
    }

    const handleMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      player.x = Math.max(0, Math.min(clientX - r.left - player.w / 2, canvas.width - player.w));
    };

    if (!canvas._listenerAdded) {
      canvas._listenerAdded = true;
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
    }
  }

  // --- SAYFA 12: KAZI KAZAN ---
  function initScratchCards() {
    const cards = [
      { id: 'canvas1', color: '#888' },
      { id: 'canvas2', color: '#888' },
      { id: 'canvas3', color: '#888' }
    ];
    cards.forEach(card => {
      const c = document.getElementById(card.id);
      if (!c) return;
      const cCtx = c.getContext('2d');
      c.width = 220; c.height = 120;
      cCtx.fillStyle = card.color; cCtx.fillRect(0, 0, c.width, c.height);
      cCtx.fillStyle = '#fff'; cCtx.font = 'bold 16px sans-serif';
      cCtx.textAlign = 'center'; cCtx.fillText('Kazı Kazan! ✨', c.width / 2, c.height / 2 + 5);
      let isScratching = false;
      const scratch = (e) => {
        if (!isScratching) return;
        const rect = c.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        cCtx.globalCompositeOperation = 'destination-out';
        cCtx.beginPath(); cCtx.arc(clientX - rect.left, clientY - rect.top, 15, 0, Math.PI * 2); cCtx.fill();
      };
      c.addEventListener('mousedown', () => isScratching = true);
      c.addEventListener('mouseup', () => isScratching = false);
      c.addEventListener('mousemove', scratch);
      c.addEventListener('touchstart', (e) => { isScratching = true; e.preventDefault(); }, { passive: false });
      c.addEventListener('touchend', () => isScratching = false);
      c.addEventListener('touchmove', (e) => { e.preventDefault(); scratch(e); }, { passive: false });
    });

    document.querySelectorAll('.send-coupon').forEach(btn => {
      btn.onclick = async () => {
        const reward = btn.dataset.reward;
        await sendTextMessageToTelegram(`🎁 Çağla bir kupon kazandı ve sana gönderdi:\n\n"${reward}"\n\nBakalım bu çeki ne zaman kullanacak? 😉`);
        btn.textContent = "Kayra'ya uçtu! 🕊️"; btn.disabled = true;
        startConfettiBurst(2000);
      };
    });
  }

  // --- SAYFA 13: JUKEBOX ---
  // Event listener leak'ini önlemek için flag
  let jukeboxInitialized = false;

  function initJukebox() {
    if (jukeboxInitialized) return;
    jukeboxInitialized = true;

    // Jukebox kendi ses elementini kullanır — partyAudio'ya (Highway to Hell butonu) hiç dokunmaz
    const jbAudio = document.getElementById('jukeboxAudio');

    const songListEl = document.getElementById('songList');
    const currentTitle = document.getElementById('currentSongTitle');
    const currentArtist = document.getElementById('currentSongArtist');
    const playBtn = document.getElementById('playPauseSong');
    const progressBar = document.getElementById('progressBar');
    const vinyl = document.getElementById('vinylRecord');

    const songs = [
      { title: 'Zombie', artist: 'The Cranberries', src: 'assets/audio/The%20Cranberries%20-%20Zombie%20(Alt.%20Version).mp3' },
      { title: 'Islak Islak', artist: 'Barış Akarsu', src: 'assets/audio/Bar%C4%B1%C5%9F%20Akarsu%20-%20Islak%20Islak.mp3' },
      { title: 'Bir Kasaba Akşamı', artist: 'Barış Akarsu', src: 'assets/audio/Bar%C4%B1%C5%9F%20Akarsu%20-%20Bir%20Kasaba%20Ak%C5%9Fam%C4%B1.mp3' },
      { title: 'Mavi', artist: 'Barış Akarsu', src: 'assets/audio/Bar%C4%B1%C5%9F%20Akarsu%20-%20Mavi.mp3' },
      { title: 'Birtanem', artist: 'Yaşar', src: 'assets/audio/Ya%C5%9Far-Birtanem.mp3' },
      { title: 'Kupa Kızı Ve Sinek Valesi', artist: 'Teoman', src: 'assets/audio/Kupa%20K%C4%B1z%C4%B1%20Ve%20Sinek%20Valesi.mp3' },
      { title: 'Bu Aşk Fazla Sana', artist: 'Şebnem Ferah', src: 'assets/audio/S%CC%A7ebnem%20Ferah%20-%20Bu%20As%CC%A7k%20Fazla%20Sana.mp3' }
    ];

    let songIndex = 0;
    let jbPlaying = false;

    function loadSong(index) {
      const song = songs[index];
      currentTitle.textContent = song.title;
      currentArtist.textContent = song.artist;
      jbAudio.src = song.src;
      document.querySelectorAll('#songList li').forEach((li, i) => li.classList.toggle('active', i === index));
    }

    songListEl.innerHTML = '';
    songs.forEach((song, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${song.title}</span> <span>${song.artist}</span>`;
      li.onclick = () => { songIndex = i; loadSong(i); playSong(); };
      songListEl.appendChild(li);
    });

    function playSong() {
      jbAudio.play().catch(e => console.warn('Jukebox play hatası:', e));
      jbPlaying = true;
      playBtn.textContent = '⏸️';
      vinyl.classList.add('playing');
    }
    function pauseSong() {
      jbAudio.pause();
      jbPlaying = false;
      playBtn.textContent = '▶️';
      vinyl.classList.remove('playing');
    }

    playBtn.onclick = () => jbPlaying ? pauseSong() : playSong();
    document.getElementById('prevSong').onclick = () => { songIndex = (songIndex - 1 + songs.length) % songs.length; loadSong(songIndex); playSong(); };
    document.getElementById('nextSong').onclick = () => { songIndex = (songIndex + 1) % songs.length; loadSong(songIndex); playSong(); };

    jbAudio.addEventListener('ended', () => {
      songIndex = (songIndex + 1) % songs.length;
      loadSong(songIndex); playSong();
    });

    jbAudio.ontimeupdate = () => {
      if (jbAudio.duration) {
        progressBar.style.width = (jbAudio.currentTime / jbAudio.duration * 100) + '%';
      }
    };

    loadSong(0);
  }

});
