(function () {
  const COUNT = 7;
  const STORAGE_KEY = 'labels';
  const DEBOUNCE_MS = 600;
  const timers = {};

  // Sayfa yüklendiğinde etiketleri al ve contenteditable yap
  function loadLabels() {
    let labels = {};
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        labels = JSON.parse(raw) || {};
      } catch {
        labels = {};
      }
    }

    // Her staff-* isim elementini contenteditable yap ve değeri localStorage'dan al
    for (let i = 1; i <= COUNT; i++) {
      const el = document.getElementById(`staff-${i}-name`);
      if (!el) continue;

      // contenteditable & görsel ipucu
      el.setAttribute('contenteditable', 'true');
      el.style.cursor = 'text';
      el.style.outline = 'none';

      const key = `label_${i}`;
      if (labels[key]) {
        el.textContent = labels[key];
      } else {
        // localStorage'da yoksa mevcut metni kullan
        labels[key] = el.textContent.trim();
      }

      // Enter basımında yeni satır oluşmasını engelle, blur ile kaydet
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          el.blur();
        }
      });
    }

    // localStorage'ı güncelle
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
    } catch (err) {
      console.warn('localStorage set error', err);
    }
  }

  // Etiketi kaydet
  function saveLabel(index, value) {
    let labels = {};
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        labels = JSON.parse(raw) || {};
      } catch {
        labels = {};
      }
    }

    labels[`label_${index}`] = value;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
    } catch (err) {
      console.warn('localStorage set error', err);
    }
  }

  // input event → debounce ile kaydet
  function onInput(e) {
    const el = e.target;
    if (!el.id) return;

    const m = el.id.match(/^staff-(\d+)-name$/);
    if (!m) return;

    const idx = +m[1];
    if (timers[idx]) clearTimeout(timers[idx]);

    timers[idx] = setTimeout(() => {
      saveLabel(idx, el.textContent.trim());
      delete timers[idx];
    }, DEBOUNCE_MS);
  }

  // blur event → anında kaydet
  function onBlur(e) {
    const el = e.target;
    if (!el.id) return;

    const m = el.id.match(/^staff-(\d+)-name$/);
    if (!m) return;

    const idx = +m[1];
    if (timers[idx]) {
      clearTimeout(timers[idx]);
      delete timers[idx];
    }

    saveLabel(idx, el.textContent.trim());
  }

  // Başka sekmede storage değişirse UI'ı güncelle
  function onStorage(e) {
    if (e.key !== STORAGE_KEY) return;

    let labels = {};
    if (e.newValue) {
      try {
        labels = JSON.parse(e.newValue) || {};
      } catch {
        labels = {};
      }
    }

    for (let i = 1; i <= COUNT; i++) {
      const el = document.getElementById(`staff-${i}-name`);
      if (!el) continue;

      const key = `label_${i}`;
      if (labels[key] && el.textContent.trim() !== labels[key]) {
        el.textContent = labels[key];
      }
    }
  }

  // Event listener'lar
  window.addEventListener('DOMContentLoaded', loadLabels);
  document.addEventListener('input', onInput);
  document.addEventListener('blur', onBlur, true);
  window.addEventListener('storage', onStorage);
})();
