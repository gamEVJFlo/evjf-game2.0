const AudioEngine = (() => {
  let context;
  const ensureContext = () => {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === "suspended") context.resume();
    return context;
  };

  const thump = (time, frequency = 80, gainValue = 0.5) => {
    const ctx = ensureContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(34, time + 0.28);
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.34);
  };

  return {
    machine() {
      const ctx = ensureContext();
      if (!ctx) return;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(46, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(62, ctx.currentTime + 1.3);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.65);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 1.7);
    },
    drums() {
      const ctx = ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.24, 0.48, 0.72].forEach((offset, index) => thump(now + offset, index % 2 ? 64 : 84, 0.42));
    },
    inputPulse() {
      const ctx = ensureContext();
      if (!ctx) return;
      thump(ctx.currentTime, 118, 0.12);
    },
  };
})();

const runTypewriter = () => {
  const element = document.querySelector("[data-typewriter]");
  if (!element) return;
  const fullText = element.textContent.trimStart();
  element.textContent = "";
  let index = 0;
  const chunk = () => {
    element.textContent += fullText.slice(index, index + 3);
    index += 3;
    if (index < fullText.length) window.setTimeout(chunk, 12);
  };
  chunk();
};

const attachNavigationDrums = () => {
  document.querySelectorAll("[data-drum-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      AudioEngine.drums();
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 760);
    });
  });
};

const addTeammateRow = (container, value = "") => {
  const index = container.children.length + 1;
  const row = document.createElement("div");
  row.className = "teammate-row";
  row.innerHTML = `
    <label>
      Coéquipière ${index}
      <input type="text" name="coequipieres[]" value="${value}" placeholder="Nom / Prénom / Identifiant" />
    </label>
    <button type="button" class="small-button remove-teammate">Supprimer une coéquipière</button>
  `;
  row.querySelector(".remove-teammate").addEventListener("click", () => {
    AudioEngine.inputPulse();
    row.remove();
  });
  container.appendChild(row);
};

const formToObject = (form) => {
  const data = new FormData(form);
  const payload = {};
  for (const [key, value] of data.entries()) {
    if (key === "bot-field" || key === "form-name") continue;
    if (key.endsWith("[]")) {
      const cleanKey = key.replace("[]", "");
      payload[cleanKey] = payload[cleanKey] || [];
      if (value) payload[cleanKey].push(value);
    } else {
      payload[key] = value;
    }
  }
  payload.date_collecte = new Date().toISOString();
  return payload;
};

const setupProfileForm = () => {
  const form = document.querySelector("#profile-form");
  if (!form) return;
  const teammates = document.querySelector("#teammates-list");
  const addButton = document.querySelector("#add-teammate");
  const success = document.querySelector("#success-message");
  const download = document.querySelector("#download-data");

  addTeammateRow(teammates);
  addButton.addEventListener("click", () => {
    AudioEngine.inputPulse();
    addTeammateRow(teammates);
  });

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => AudioEngine.inputPulse());
  });

  document.querySelectorAll('input[type="range"]').forEach((range) => {
    const value = range.closest("label").querySelector(".slider-value");
    range.addEventListener("input", () => {
      value.textContent = `${range.value}/10`;
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    AudioEngine.drums();
    const payload = formToObject(form);
    localStorage.setItem("evjfProfilUtilisateur", JSON.stringify(payload, null, 2));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    download.href = URL.createObjectURL(blob);

    if (form.dataset.netlify === "true") {
      try {
        await fetch("/", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    "form-name": "profil-evjf",
    ...Object.fromEntries(new FormData(form))
  }).toString(),
});
      } catch (error) {
        console.info("Envoi Netlify indisponible en local, copie conservée dans le navigateur.", error);
      }
    }

    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};

const setupGamePage = () => {
  const progressBar = document.querySelector("#progress-bar");
  if (!progressBar) return;

  const loadingText = document.querySelector("#loading-text");
  const progressPercent = document.querySelector("#progress-percent");
  const errorMessage = document.querySelector("#error-message");
  const entertainmentButton = document.querySelector("#entertainment-button");
  const videoStage = document.querySelector("#video-stage");
  const messages = [
    "Connexion au serveur EVJF...",
    "Analyse du profil joueur...",
    "Génération des missions...",
    "Chargement des coéquipières...",
    "Finalisation...",
  ];
  const videos = [
    "https://www.youtube.com/embed/00oJQDwNDyY",
    "https://www.youtube.com/embed/BfW72FjVC6k",
    "https://www.youtube.com/embed/yJfh59iEscg",
    "https://www.youtube.com/embed/Y0pdUyFC7As",
    "https://www.youtube.com/embed/NpqfUI7DDB4",
    "https://www.youtube.com/embed/y0sF5xhGreA",
    "https://www.youtube.com/embed/xFnoap4kcNY",
    "https://www.youtube.com/embed/aZ4NlkFxbhM",
    "https://www.youtube.com/embed/__ON3C3GRis",
    "https://www.youtube.com/embed/uAa4lMf3jSg",
  ];
  let percent = 0;
  let videoIndex = 0;

  const interval = window.setInterval(() => {
    percent = Math.min(100, percent + Math.ceil(Math.random() * 4));
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    loadingText.textContent = messages[Math.min(messages.length - 1, Math.floor(percent / 22))];

    if (percent >= 100) {
      window.clearInterval(interval);
      loadingText.textContent = messages.at(-1);
      window.setTimeout(() => {
        errorMessage.hidden = false;
        AudioEngine.drums();
        window.setTimeout(() => {
          entertainmentButton.hidden = false;
        }, 3000);
      }, 400);
    }
  }, 140);

  entertainmentButton.addEventListener("click", () => {
    AudioEngine.drums();
    const src = videos[videoIndex % videos.length];
    videoIndex += 1;
    videoStage.innerHTML = `
      <iframe
        src="${src}?autoplay=1&rel=0"
        title="Divertissement EVJF ${videoIndex}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `;
  });
};

window.addEventListener("DOMContentLoaded", () => {
  attachNavigationDrums();
  runTypewriter();
  setupProfileForm();
  setupGamePage();

  const startAmbience = () => AudioEngine.machine();
  window.setTimeout(startAmbience, 250);
  document.addEventListener("pointerdown", startAmbience, { once: true });
});
                                       
