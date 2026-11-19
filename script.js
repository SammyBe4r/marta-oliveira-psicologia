const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menu" : "Fechar menu");
    siteNav.classList.toggle("is-open", !isExpanded);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
      siteNav.classList.remove("is-open");
    }
  });
}

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

const musicToggle = document.querySelector("#music-toggle");
const musicStatus = document.querySelector("#music-status");

if (musicToggle && musicStatus) {
  let audioContext;
  let masterGain;
  let melodyTimer;
  let noteIndex = 0;
  let isPlaying = false;
  const melody = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 392];

  const updateMusicControl = (playing) => {
    isPlaying = playing;
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.querySelector(".music-label").textContent = playing
      ? "Pausar música"
      : "Ouvir música tranquila";
  };

  const playNote = () => {
    if (!audioContext || !masterGain || !isPlaying) {
      return;
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = melody[noteIndex % melody.length];
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.035, now + 0.7);
    envelope.gain.setValueAtTime(0.035, now + 1.4);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
    oscillator.connect(envelope);
    envelope.connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + 3.25);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      envelope.disconnect();
    }, { once: true });

    noteIndex += 1;
  };

  const startMusic = async () => {
    if (isPlaying) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      musicStatus.textContent = "Seu navegador não oferece suporte à reprodução de áudio.";
      return;
    }

    musicToggle.disabled = true;
    try {
      audioContext ??= new AudioContext();
      await audioContext.resume();

      if (!masterGain) {
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.2;
        masterGain.connect(audioContext.destination);

        [130.81, 196].forEach((frequency, index) => {
          const drone = audioContext.createOscillator();
          const volume = audioContext.createGain();
          drone.type = "sine";
          drone.frequency.value = frequency;
          volume.gain.value = index === 0 ? 0.018 : 0.012;
          drone.connect(volume);
          volume.connect(masterGain);
          drone.start();
        });
      }

      updateMusicControl(true);
      musicStatus.textContent = "Música tranquila ativada.";
      playNote();
      melodyTimer = window.setInterval(playNote, 3000);
    } catch (error) {
      updateMusicControl(false);
      musicStatus.textContent = "Não foi possível iniciar a música. Tente novamente.";
      console.error("Falha ao iniciar a música ambiente:", error);
    } finally {
      musicToggle.disabled = false;
    }
  };

  const pauseMusic = async () => {
    window.clearInterval(melodyTimer);
    melodyTimer = undefined;

    try {
      if (audioContext) {
        await audioContext.suspend();
      }
      updateMusicControl(false);
      musicStatus.textContent = "Música pausada.";
    } catch (error) {
      melodyTimer = window.setInterval(playNote, 3000);
      musicStatus.textContent = "Não foi possível pausar a música. Tente novamente.";
      console.error("Falha ao pausar a música ambiente:", error);
    }
  };

  musicToggle.addEventListener("click", () => {
    if (isPlaying) {
      void pauseMusic();
    } else {
      void startMusic();
    }
  });
}
