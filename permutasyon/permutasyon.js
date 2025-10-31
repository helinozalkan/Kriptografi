document.addEventListener('DOMContentLoaded', () => {
 
  const encryptInput = document.getElementById('encryptImageInput');
  const encryptKeyInput = document.getElementById('encryptKey');
  const btnEncrypt = document.getElementById('btnEncrypt');
  const encryptCanvasOutput = document.getElementById('encryptCanvasOutput');
 
  const decryptInput = document.getElementById('decryptImageInput');
  const decryptKeyInput = document.getElementById('decryptKey');
  const btnDecrypt = document.getElementById('btnDecrypt');
  const decryptCanvasOutput = document.getElementById('decryptCanvasOutput');
  
  const btnDownloadEncrypt = document.getElementById('btnDownloadEncrypt');
 
  const encryptCanvasInput = document.getElementById('encryptCanvasInput');
  const decryptCanvasInput = document.getElementById('decryptCanvasInput');

  // === YENİ: Estetik Dosya Yükleme Arayüzü İçin JS ===
  function setupFileInput(inputId, displayId) {
      const input = document.getElementById(inputId);
      const display = document.getElementById(displayId);
      if (input && display) {
          input.addEventListener('change', (e) => {
              const fileName = e.target.files[0] ? e.target.files[0].name : 'Dosya seçilmedi';
              display.textContent = fileName;
          });
      }
  }
  setupFileInput('encryptImageInput', 'encryptFileName');
  setupFileInput('decryptImageInput', 'decryptFileName');
  // === YENİ KOD SONU ===
 
  function loadImageToCanvas(file, canvas) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('Lütfen bir resim dosyası seçin.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(ctx);
        };
        img.onerror = () => reject('Resim yüklenemedi.');
        img.src = event.target.result;
      };
      reader.onerror = () => reject('Dosya okunamadı.');
      reader.readAsDataURL(file);
    });
  }
 
  function parsePermutationKey(key) {
    if (!/^[1-9]{1,9}$/.test(key)) {
      alert('Hata: Anahtar sadece 1-9 arası rakamlardan oluşmalı ve en fazla 9 haneli olmalıdır.');
      return null;
    }
    const keyDigits = Array.from(key).map(d => parseInt(d));
    const keyLength = key.length;
    if (new Set(keyDigits).size !== keyLength) {
      alert('Hata: Anahtar rakamları benzersiz olmalıdır (örn: 312).');
      return null;
    }
    for (let i = 1; i <= keyLength; i++) {
      if (!keyDigits.includes(i)) {
        alert(`Hata: Anahtar ${keyLength} haneli ise 1'den ${keyLength}'e kadar olan tüm rakamları içermelidir (örn: 312).`);
        return null;
      }
    }
    const zeroIndexedKey = keyDigits.map(d => d - 1);
    return zeroIndexedKey;
  }
 
  function getInverseKey(key) {
    const inverse = new Array(key.length);
    for (let i = 0; i < key.length; i++) {
      inverse[key[i]] = i;
    }
    return inverse;
  }
 
  function processImage(inputCanvas, outputCanvas, keyString, mode) {
    const key = parsePermutationKey(keyString);
    if (!key) return; 
 
    const ctxInput = inputCanvas.getContext('2d');
    const imageData = ctxInput.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
    const data = imageData.data; 
    const outputData = new Uint8ClampedArray(data.length);
    const keyLength = key.length;
    const permutationKey = (mode === 'encrypt') ? key : getInverseKey(key);
    const pixelSize = 4;
    const blockSize = keyLength * pixelSize; 
 
    for (let i = 0; i < data.length; i += blockSize) {
      const block = data.slice(i, i + blockSize);
      const outputBlock = new Uint8ClampedArray(block.length);
 
      if (block.length < blockSize) {
        outputData.set(block, i);
        continue;
      }
 
      for (let j = 0; j < keyLength; j++) {
        const sourcePixelIndex = j * pixelSize;
        const targetPixelIndex = permutationKey[j] * pixelSize;
        
        outputBlock[targetPixelIndex]     = block[sourcePixelIndex];
        outputBlock[targetPixelIndex + 1] = block[sourcePixelIndex + 1];
        outputBlock[targetPixelIndex + 2] = block[sourcePixelIndex + 2];
        outputBlock[targetPixelIndex + 3] = block[sourcePixelIndex + 3];
      }
 
      outputData.set(outputBlock, i);
    }
 
    outputCanvas.width = inputCanvas.width;
    outputCanvas.height = inputCanvas.height;
    const ctxOutput = outputCanvas.getContext('2d');
    const outputImageData = new ImageData(outputData, inputCanvas.width, inputCanvas.height);
    ctxOutput.putImageData(outputImageData, 0, 0);
 
    alert('İşlem tamamlandı!');
  }
 
  btnEncrypt.addEventListener('click', () => {
    if(btnDownloadEncrypt) btnDownloadEncrypt.style.display = 'none';

    const file = encryptInput.files[0];
    const keyString = encryptKeyInput.value;
    if (!file) {
      alert('Lütfen şifrelenecek bir resim dosyası seçin.');
      return;
    }
    if (!keyString) {
      alert('Lütfen bir permütasyon anahtarı girin.');
      return;
    }
 
    loadImageToCanvas(file, encryptCanvasInput)
      .then(() => {
        processImage(encryptCanvasInput, encryptCanvasOutput, keyString, 'encrypt');
        
        if(btnDownloadEncrypt) {
            const dataUrl = encryptCanvasOutput.toDataURL('image/png');
            btnDownloadEncrypt.href = dataUrl;
            btnDownloadEncrypt.download = 'sifrelenmis-resim.png';
            btnDownloadEncrypt.style.display = 'block';
        }

      })
      .catch(alert);
  });
 
  btnDecrypt.addEventListener('click', () => {
    const file = decryptInput.files[0];
    const keyString = decryptKeyInput.value;
    if (!file) {
      alert('Lütfen deşifre edilecek bir resim dosyası seçin.');
      return;
    }
    if (!keyString) {
      alert('Lütfen bir permütasyon anahtarı girin.');
      return;
    }
 
    loadImageToCanvas(file, decryptCanvasInput)
      .then(() => {
        processImage(decryptCanvasInput, decryptCanvasOutput, keyString, 'decrypt');
      })
      .catch(alert);
  });
 
  const modeToggleCheckbox = document.getElementById('modeToggleCheckbox');
  if (modeToggleCheckbox) {
    const savedMode = localStorage.getItem('mode') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (savedMode === 'dark') {
        document.body.classList.add('dark');
        modeToggleCheckbox.checked = true;
    }
    modeToggleCheckbox.addEventListener('change', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('mode', isDark ? 'dark' : 'light');
    });
  }
 
  function switchToTab(tabId) {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.content-section.tab').forEach(s => s.classList.remove('active'));
    
    document.querySelector(`.tabs button[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }
 
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      switchToTab(target);
    });
  });
 
});