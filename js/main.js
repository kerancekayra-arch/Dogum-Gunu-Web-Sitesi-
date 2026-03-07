document.addEventListener('DOMContentLoaded', () => {
  // DOM elemanları
  const intro = document.getElementById('introOverlay');
  const startBtn = document.getElementById('startBtn');

  const partyAudio = document.getElementById('partyAudio');
  const rockAudio = document.getElementById('rockAudio'); // şimdilik kullanılmıyor
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

  // Pony animasyon kontrolü (Siyah silme için CSS Blend Mode yöntemi)
  const ponyVideo = document.getElementById('ponyVideo');
  let isPonyRunning = false;

  // Başlangıç: müzik çalmıyor, buton yazısı "Müziği Başlat"
  musicToggle.textContent = 'Müziği Başlat';
  let musicState = 'stopped'; // 'stopped' | 'playing'
  let fadeLock = false;

  // Güvenli: audio ayarları
  try {
    partyAudio.loop = true;
    partyAudio.preload = 'auto';
  } catch(e) {
    console.warn('Audio element ayarlanamadı:', e);
  }

  // START butonu: sadece overlay kapatır; müziği başlatmaz
  startBtn.addEventListener('click', () => {
    // Seslerin kilidini aç (Safari/Chrome için)
    if (clickAudio) clickAudio.play().then(() => { clickAudio.pause(); clickAudio.currentTime = 0; }).catch(() => {});
    if (ajAudio) ajAudio.play().then(() => { ajAudio.pause(); ajAudio.currentTime = 0; }).catch(() => {});
    if (hedgehogAudio) hedgehogAudio.play().then(() => { hedgehogAudio.pause(); hedgehogAudio.currentTime = 0; }).catch(() => {});

    intro.style.opacity = '0';
    setTimeout(()=> intro.style.display = 'none', 600);
    const rose = document.getElementById('roseHand');
    setTimeout(()=> rose.classList.add('show'), 800);
    setTimeout(()=> rose.classList.remove('show'), 7000);
  });

  // Helper: promise-safe play
  async function safePlay(audioEl) {
    try {
      await audioEl.play();
      return true;
    } catch (err) {
      console.error('play() promise rejected:', err);
      return false;
    }
  }

  // Fade in and play (promise-safe)
  async function fadeInPlay(el, targetVol = 0.6, duration = 600) {
    if (fadeLock) return false;
    fadeLock = true;
    try {
      el.volume = 0;
      // attempt to play - must be called as part of user gesture (this handler is)
      const ok = await safePlay(el);
      if (!ok) {
        fadeLock = false;
        return false;
      }

      const steps = 20;
      const stepTime = Math.max(8, Math.floor(duration / steps));
      let i = 0;
      return await new Promise(resolve => {
        const t = setInterval(()=> {
          i++;
          el.volume = Math.min(targetVol, (i/steps) * targetVol);
          if (i >= steps) {
            clearInterval(t);
            fadeLock = false;
            resolve(true);
          }
        }, stepTime);
      });
    } catch (err) {
      console.error('fadeInPlay error:', err);
      fadeLock = false;
      return false;
    }
  }

  // Fade out and pause
  async function fadeOutPause(el, duration = 600) {
    if (fadeLock) return false;
    fadeLock = true;
    try {
      const startVol = (typeof el.volume === 'number') ? el.volume : 0.6;
      const steps = 20;
      const stepTime = Math.max(8, Math.floor(duration / steps));
      let i = 0;
      return await new Promise(resolve => {
        const t = setInterval(()=> {
          i++;
          const p = 1 - (i/steps);
          el.volume = Math.max(0, p * startVol);
          if (i >= steps) {
            clearInterval(t);
            try { el.pause(); el.currentTime = 0; } catch(e){}
            fadeLock = false;
            resolve(true);
          }
        }, stepTime);
      });
    } catch (err) {
      console.error('fadeOutPause error:', err);
      fadeLock = false;
      return false;
    }
  }

  // --- SAYFA GEÇİŞ SİSTEMİ ---
  let currentPage = 1;
  const totalPages = 7; // 6'dan 7'ye çıkarıldı
  const pages = document.querySelectorAll('.page');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');

  function updatePageNavigation(direction) {
    const currentEl = document.getElementById(`page${currentPage}`);
    
    // Kamera sayfasından ayrılıyorsak kamerayı kapat
    if (currentPage === 7) {
      stopCamera();
    }

    // Yön belirleme
    if (direction === 'next') {
      currentEl.classList.add('slide-out-left');
      currentPage = (currentPage % totalPages) + 1;
    } else {
      currentEl.classList.add('slide-out-right');
      currentPage = (currentPage - 2 + totalPages) % totalPages + 1;
    }

    const nextEl = document.getElementById(`page${currentPage}`);
    
    // Geçiş animasyonu hazırlığı
    nextEl.classList.remove('slide-out-left', 'slide-out-right');
    nextEl.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
    nextEl.style.display = 'flex';

    // Animasyonu tetikle
    setTimeout(() => {
      currentEl.classList.remove('active', 'slide-out-left', 'slide-out-right');
      currentEl.style.display = 'none';
      
      nextEl.classList.add('active');
      nextEl.classList.remove('slide-in-right', 'slide-in-left');
    }, 50);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => updatePageNavigation('prev'));
  if (nextBtn) nextBtn.addEventListener('click', () => updatePageNavigation('next'));

  // Sayfa 7: Kamera & Muhtisim İkili Mantığı
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
    { name: 'Kirpi', image: 'assets/images/Kirpii.png' }
  ];

  function updateResultCharacter() {
    const char = characters[currentCharIndex];
    resultCharImg.src = char.image;
    resultCharName.textContent = char.name;
    
    // Geçiş efekti
    resultCharImg.style.animation = 'none';
    resultCharImg.offsetHeight; // Reflow
    resultCharImg.style.animation = 'scaleUp 0.3s ease';
  }

  if (prevCharBtn) {
    prevCharBtn.addEventListener('click', () => {
      currentCharIndex = (currentCharIndex - 1 + characters.length) % characters.length;
      updateResultCharacter();
    });
  }

  if (nextCharBtn) {
    nextCharBtn.addEventListener('click', () => {
      currentCharIndex = (currentCharIndex + 1) % characters.length;
      updateResultCharacter();
    });
  }

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      webcam.srcObject = stream;
      startCameraBtn.classList.add('hidden');
      captureBtn.classList.remove('hidden');
    } catch (err) {
      console.error("Kamera başlatılamadı:", err);
      alert("Kameraya erişilemedi. Lütfen izin verdiğinizden emin olun.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    webcam.srcObject = null;
    startCameraBtn.classList.remove('hidden');
    captureBtn.classList.add('hidden');
  }

  function capturePhoto() {
    const ctx = photoCanvas.getContext('2d');
    photoCanvas.width = webcam.videoWidth;
    photoCanvas.height = webcam.videoHeight;
    
    // Videoyu canvasa çiz
    ctx.drawImage(webcam, 0, 0, photoCanvas.width, photoCanvas.height);
    
    // Fotoğrafı img elementine aktar
    capturedPhoto.src = photoCanvas.toDataURL('image/png');
    
    // Görünümü değiştir
    cameraArea.classList.add('hidden');
    cameraResult.classList.remove('hidden');
    
    // Kamerayı durdur
    stopCamera();
  }

  if (startCameraBtn) startCameraBtn.addEventListener('click', startCamera);
  if (captureBtn) captureBtn.addEventListener('click', capturePhoto);
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      cameraResult.classList.add('hidden');
      cameraArea.classList.remove('hidden');
      startCamera();
    });
  }

  // Sayfa 3: Kelime Listesi Oluşturma
  const words = ["Neşeli", "Zeki", "Dost Canlısı", "Yaratıcı", "Eğlenceli", "Güçlü", "Eşsiz", "Harika" , "Tabuk Döner" , "Kahve" , "Çikolata" , "Kremalı Tatlı" , "Profiterol" , "Ressam"];
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
      if (secretPanel) {
        secretPanel.classList.remove('hidden');
        startConfettiBurst(5000); // Konfeti patlat
      }
    }
  }

  if (ajInteractive) {
    ajInteractive.addEventListener('click', () => {
      console.log("Apple Jack tıklandı, ses çalınıyor:", ajAudio ? ajAudio.src : "Audio bulunamadı");
      if (ajAudio) {
        ajAudio.currentTime = 0;
        ajAudio.play().catch(e => console.error("AJ Ses çalma hatası:", e));
      }
      if (!secretUnlocked) {
        ajClickCount++;
        checkSecret();
      }
    });
  }

  if (hedgehogInteractive) {
    hedgehogInteractive.addEventListener('click', () => {
      console.log("Kirpi tıklandı, ses çalınıyor:", hedgehogAudio ? hedgehogAudio.src : "Audio bulunamadı");
      if (hedgehogAudio) {
        hedgehogAudio.currentTime = 0;
        hedgehogAudio.play().catch(e => console.error("Kirpi Ses çalma hatası:", e));
      }
      if (!secretUnlocked) {
        hedgehogClickCount++;
        checkSecret();
      }
    });
  }

  if (closeSecretBtn) {
    closeSecretBtn.addEventListener('click', () => {
      if (secretPanel) secretPanel.classList.add('hidden');
    });
  }

  // Sayfa 5: Pat Pat Jack Mantığı
  const patPatJackWrapper = document.getElementById('patPatJackWrapper');
  const patPatJackImg = document.getElementById('patPatJackImg');
  const staticImg = 'assets/images/applejacktombik2.png';
  const patPatGif = 'assets/images/patpatjack.gif';

  if (patPatJackWrapper && patPatJackImg) {
    const startPatting = (e) => {
      e.preventDefault();
      patPatJackImg.src = patPatGif;
      patPatJackWrapper.style.transform = 'scale(0.95)';
    };

    const stopPatting = () => {
      patPatJackImg.src = staticImg;
      patPatJackWrapper.style.transform = 'scale(1)';
    };

    // Fare olayları
    patPatJackWrapper.addEventListener('mousedown', startPatting);
    patPatJackWrapper.addEventListener('mouseup', stopPatting);
    patPatJackWrapper.addEventListener('mouseleave', stopPatting);

    // Dokunmatik olaylar (Mobil için)
    patPatJackWrapper.addEventListener('touchstart', startPatting);
    patPatJackWrapper.addEventListener('touchend', stopPatting);
    patPatJackWrapper.addEventListener('touchcancel', stopPatting);
  }

  // --- LIGHTBOX (GALERİ BÜYÜTME) MANTIĞI ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  const galleryImages = document.querySelectorAll('.photo-item img');
  
  let currentImgIndex = 0;

  function openLightbox(index) {
    currentImgIndex = index;
    const imgSrc = galleryImages[currentImgIndex].src;
    lightboxImg.src = imgSrc;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Sayfa kaydırmayı durdur
  }

  function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Sayfa kaydırmayı aç
  }

  function showNextImg() {
    currentImgIndex = (currentImgIndex + 1) % galleryImages.length;
    lightboxImg.src = galleryImages[currentImgIndex].src;
  }

  function showPrevImg() {
    currentImgIndex = (currentImgIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentImgIndex].src;
  }

  galleryImages.forEach((img, index) => {
    img.addEventListener('click', () => openLightbox(index));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNextImg(); });
  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrevImg(); });
  
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Klavye desteği
  document.addEventListener('keydown', (e) => {
    if (lightbox && !lightbox.classList.contains('hidden')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNextImg();
      if (e.key === 'ArrowLeft') showPrevImg();
    }
  });

  // musicToggle: basit play/pause toggle (tek buton)
  musicToggle.addEventListener('click', async () => {
    // eğer başka fade çalışıyorsa bekle (veya iptal etme)
    if (fadeLock) return;

    if (musicState === 'stopped') {
      // başlat
      const started = await fadeInPlay(partyAudio, 0.6, 800);
      if (started) {
        musicState = 'playing';
        musicToggle.textContent = 'Müziği Durdur';
        armAutoSync();
      } else {
        // hata—kullanıcı etkileşimiyle tekrar denesin
        musicState = 'stopped';
        musicToggle.textContent = 'Müziği Başlat';
        console.warn('Müzik başlatılırken sorun çıktı. Tarayıcı çalma kısıtlaması veya dosya problemi olabilir.');
      }
    } else if (musicState === 'playing') {
      // durdur
      const stopped = await fadeOutPause(partyAudio, 800);
      if (stopped) {
        musicState = 'stopped';
        musicToggle.textContent = 'Müziği Başlat';
        stopLyrics();
        disarmAutoSync();
      } else {
        console.warn('Müzik durdurulamadı (fadeLock veya hata).');
      }
    }
  });

  // --- CONFETTI motor (aynı) ---
  const confettiCanvas = document.getElementById('confettiCanvas');
  const ctx = confettiCanvas.getContext('2d');
  let W = confettiCanvas.width = innerWidth;
  let H = confettiCanvas.height = innerHeight;
  window.addEventListener('resize', ()=> { W = confettiCanvas.width = innerWidth; H = confettiCanvas.height = innerHeight; });

  const confettiPieces = [];
  let confettiAnimating = false;

  function spawnConfettiBatch(n = 120) {
    for (let i = 0; i < n; i++) {
      confettiPieces.push({
        x: Math.random() * W,
        y: Math.random() * -H,
        w: Math.random() * 10 + 6,
        h: Math.random() * 12 + 6,
        color: (Math.random() < 0.4) ? '#2fb07a' : (Math.random() < 0.6 ? '#ff4f7b' : `hsl(${Math.random()*360},80%,60%)`),
        speedY: Math.random()*2 + 2,
        speedX: Math.random()*1.6 - 0.8,
        angle: Math.random()*Math.PI*2
      });
    }
  }

  function confettiLoop() {
    if (!confettiAnimating) return;
    ctx.clearRect(0,0,W,H);
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const p = confettiPieces[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.angle += 0.02;
      const tilt = Math.sin(p.angle)*6;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(tilt * Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
      if (p.y > H + 30) confettiPieces.splice(i,1);
    }
    if (confettiPieces.length > 0) requestAnimationFrame(confettiLoop);
    else confettiAnimating = false;
  }

  function startConfettiBurst(duration = 6000) {
    spawnConfettiBatch(160);
    if (!confettiAnimating) {
      confettiAnimating = true;
      confettiLoop();
    }
    const interval = setInterval(()=> spawnConfettiBatch(40), 900);
    setTimeout(()=> clearInterval(interval), duration - 200);
  }

  // Pony'yi koşturan fonksiyon (Siyah silme için CSS Blend Mode yöntemi)
  function runPony() {
    if (isPonyRunning || !ponyVideo) return;

    isPonyRunning = true;
    ponyVideo.classList.add('active', 'pony-animate');
    
    // Videoyu başa sar ve oynat
    ponyVideo.currentTime = 0;
    ponyVideo.play().catch(err => console.warn("Pony videosu oynatılamadı:", err));

    // 6 saniye sonra temizle
    setTimeout(() => {
      ponyVideo.classList.remove('active', 'pony-animate');
      ponyVideo.pause();
      isPonyRunning = false;
    }, 6000);
  }

  confettiBtn.addEventListener('click', () => {
    startConfettiBurst(6000);
    runPony(); // Konfetiyle beraber pony de koşsun
  });

  // ---------- BÜYÜK SAYI OVERLAY (Tick kaldırıldı) ----------
  let countdownRunning = false;
  function clearBigCounts() { while (bigCountOverlay.firstChild) bigCountOverlay.removeChild(bigCountOverlay.firstChild); }

  function showBigCount(value) {
    clearBigCounts();
    const el = document.createElement('div');
    el.className = 'big-num';
    el.textContent = value;
    bigCountOverlay.appendChild(el);
    setTimeout(()=> { try { bigCountOverlay.removeChild(el);} catch(e){} }, 1100);
  }

  countdownBtn.addEventListener('click', ()=> {
    if (countdownRunning) return;
    countdownRunning = true;

    countdownPanel.classList.remove('hidden');
    let count = 10;
    countdownDisplay.textContent = count;
    showBigCount(count);

    const interval = setInterval(()=> {
      count--;
      countdownDisplay.textContent = count > 0 ? count : '🎉';

      if (count > 0) {
        showBigCount(count);
      } else {
        showBigCount('🎉');
      }

      if (count <= 0) {
        clearInterval(interval);
        messageCard.style.background = 'linear-gradient(90deg, #2fb07a, #ff4f7b)';
        messageCard.style.transform = 'scale(1.03)';
        messageText.textContent = 'BU GÜN 9 NİSAN NESE DOLUYOR İNSAN Yeni yaşın sana güzellikler, neşe ve sürprizler getirsin! 💖';

        // efektler
        startConfettiBurst(6000);
        goldRing();
        startHeartRain();
        rainbowFlash();
        releaseDove();
        runPony(); // Geri sayım bitince de pony koşsun!
        
        setTimeout(()=> { countdownRunning = false; }, 1200);
      }
    }, 1000);
  });

  // MEGA HEART
  megaHeartBtn.addEventListener('click', ()=> {
    showMegaHeart();
    goldRing();
    startHeartRain();
    rainbowFlash();
    releaseDove();
    startConfettiBurst(5000);
  });

  // ---------- EFEKTLER ----------
  function showMegaHeart() {
    const container = document.getElementById('megaHeartContainer');
    if (!container) return;
    const img = document.createElement('img');
    img.src = 'assets/images/kalp.png';
    img.className = 'mega-heart';
    container.appendChild(img);
    setTimeout(()=> img.remove(), 3000);
  }

  function goldRing() {
    const ring = document.getElementById('goldRing');
    ring.classList.add('active');
    setTimeout(()=> ring.classList.remove('active'), 1600);
  }

  function startHeartRain() {
    const container = document.getElementById('heartRain');
    for (let i=0;i<28;i++) {
      const h = document.createElement('div');
      h.className = 'rainHeart';
      h.style.left = Math.random()*100 + '%';
      h.style.animationDuration = (2 + Math.random()*3) + 's';
      container.appendChild(h);
      setTimeout(()=> h.remove(), 5200);
    }
  }

  function rainbowFlash() {
    const f = document.getElementById('rainbowFlash');
    f.classList.add('active');
    setTimeout(()=> f.classList.remove('active'), 1000);
  }

  function releaseDove() {
    const container = document.getElementById('doveContainer');
    if (!container) return;
    const img = document.createElement('img');
    img.src = 'assets/images/kalp.png'; // dove.png yok, kalp kullanalım
    img.className = 'dove';
    container.appendChild(img);
    setTimeout(()=> img.remove(), 7000);
  }

  let lyricsRunning = false;
  let lyricZero = 0;
  let lyricsSidesBuilt = false;
  let beatBpm = 116;
  let lyricTimers = [];
  let autoSyncArmed = false;
  let vocalStartSec = 18.0; // Erken giriyordu, 13.2'den 13.8'e çekildi
  let timeUpdateHandler = null;
  let lyricsStretch = 1.10; // v1'deki orijinal değer
  let autoSyncDelaySec = 0.8; // Daha hassas tetikleme için 1.2'den 0.8'e düşürüldü

  function buildCuesFor(text){
    const t=[]; let c=0; const step=0.06; const longStep=0.12; const veryLong=0.18;
    const vowels = new Set(['a','e','i','o','u','y']);
    for(let i=0;i<text.length;i++){
      t.push(c);
      const ch = text[i].toLowerCase();
      const prev = i>0 ? text[i-1].toLowerCase() : '';
      if (vowels.has(ch)){
        if (ch===prev) c += veryLong; else c += longStep;
      } else {
        c += step;
      }
    }
    return t;
  }

  function ensureLyricsSides() {
    if (lyricsSidesBuilt) return;
    const lyricsOverlay = document.getElementById('lyricsOverlay');
    if (!lyricsOverlay) return;
    lyricsOverlay.innerHTML = '';
    const left = document.createElement('div'); left.className = 'lyricsSide left'; left.id = 'lyricsLeft';
    const right = document.createElement('div'); right.className = 'lyricsSide right'; right.id = 'lyricsRight';
    lyricsOverlay.appendChild(left); lyricsOverlay.appendChild(right);
    lyricsSidesBuilt = true;
  }

  function renderLine(side, text, cues, stretch = 1.0) {
    const target = document.getElementById(side === 'left' ? 'lyricsLeft' : 'lyricsRight');
    if (!target) return;
    const line = document.createElement('div');
    line.className = 'lyric-line ' + (side === 'left' ? 'slide-in-left' : 'slide-in-right');
    let ci = 0;
    const words = text.split(' ');
    for (let w=0; w<words.length; w++) {
      const wEl = document.createElement('span');
      wEl.className = 'lyric-word';
      const word = words[w];
      for (let k=0; k<word.length; k++) {
        const span = document.createElement('span');
        span.className = 'lyric-char';
        span.textContent = word[k];
        const cue = cues && cues[ci] !== undefined ? cues[ci] : 0;
        span.dataset.t = String(cue);
        wEl.appendChild(span);
        ci++;
      }
      line.appendChild(wEl);
      if (w < words.length-1) line.appendChild(document.createTextNode(' '));
    }
    target.innerHTML = ''; // Eski satırı temizle
    target.appendChild(line);
    setTimeout(()=> line.classList.add('on'), 50);

    const chars = line.querySelectorAll('.lyric-char');
    chars.forEach(c => {
      const t = parseFloat(c.dataset.t) * 1000 * stretch;
      const timer = setTimeout(()=> c.classList.add('on'), t);
      lyricTimers.push(timer);
    });

    setTimeout(()=> {
      line.style.opacity = '0';
      setTimeout(()=> line.remove(), 800);
    }, 4500);
  }

  function stopLyrics() {
    lyricTimers.forEach(clearTimeout);
    lyricTimers = [];
    lyricsRunning = false;
    const l = document.getElementById('lyricsLeft');
    const r = document.getElementById('lyricsRight');
    if(l) l.innerHTML = '';
    if(r) r.innerHTML = '';
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
        const timer = setTimeout(()=> {
          if(!lyricsRunning) return;
          renderLine(item.side, item.text, buildCuesFor(item.text), lyricsStretch);
        }, wait);
        lyricTimers.push(timer);
      }
      cumulative += item.d;
    });
    requestAnimationFrame(beatLoop);
  }

  function beatLoop() {
    if (!lyricsRunning) return;
    const beat = 60/beatBpm;
    const t = partyAudio.currentTime;
    const phase = (t % beat) / beat;
    const y = Math.sin(phase * 2*Math.PI) * 8;
    const lyricsOverlay = document.getElementById('lyricsOverlay');
    if (lyricsOverlay) lyricsOverlay.style.setProperty('--beatY', y+'px');
    requestAnimationFrame(beatLoop);
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
    if (timeUpdateHandler) {
      partyAudio.removeEventListener('timeupdate', timeUpdateHandler);
    }
  }

  lyricsSyncBtn.addEventListener('click', ()=> {
    if (!lyricsRunning) {
      startLyrics(partyAudio.currentTime);
      lyricsSyncBtn.textContent = 'Lyrics Durdur';
    } else {
      stopLyrics();
      lyricsSyncBtn.textContent = 'Lyrics Senkron';
    }
  });

});
