document.addEventListener('DOMContentLoaded', () => {

    // Koyu/Açık Tema ve Alfabe Seçimi (Mevcut projeden)
    const modeToggle = document.getElementById('modeToggle');
    if(modeToggle){
        const savedMode = localStorage.getItem('mode') || 'light';
        if(savedMode === 'dark') document.body.classList.add('dark');
        modeToggle.textContent = savedMode === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        modeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('mode', isDark ? 'dark' : 'light');
            modeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        });
    }

    // Tab Değiştirme (Mevcut projeden)
    function switchToTab(tabId) {
        document.querySelectorAll('.tabs button').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabId);
        });
        document.querySelectorAll('.content-section.tab').forEach(s => {
            s.classList.toggle('active', s.id === tabId);
        });
    }

    document.querySelectorAll('.tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            switchToTab(target);
        });
    });

    // --- ÖDEV 4 BASİT ÇÖZÜM ---

    /**
     * Kullanıcının seçtiği resmi bir canvas'a yükler.
     */
    function handleImageUpload(event, canvasId) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.getElementById(canvasId);
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Permütasyon anahtarını doğrular. (Örn: "312" geçerli, "315" geçersiz)
     */
    function validateKey(key, errorElement) {
        errorElement.classList.remove('visible');
        key = key.trim(); // Boşlukları temizle
        const len = key.length;

        if (len < 2 || len > 9) {
            errorElement.textContent = 'Anahtar uzunluğu 2 ile 9 arasında olmalıdır.';
            errorElement.classList.add('visible');
            return false;
        }
        if (!/^\d+$/.test(key)) {
            errorElement.textContent = 'Anahtar sadece rakamlardan oluşmalıdır.';
            errorElement.classList.add('visible');
            return false;
        }
        const digits = key.split('').map(Number);
        if (new Set(digits).size !== len) {
            errorElement.textContent = 'Anahtar tekrarlayan rakamlar içeremez.';
            errorElement.classList.add('visible');
            return false;
        }
        for (const digit of digits) {
            if (digit === 0 || digit > len) {
                errorElement.textContent = `Geçersiz rakam: ${digit}. Anahtar sadece 1'den ${len}'e kadar rakamları içermelidir.`;
                errorElement.classList.add('visible');
                return false;
            }
        }
        return true;
    }

    /**
     * 1-indeksli anahtarı ("312") 0-indeksli bir diziye ([2, 0, 1]) çevirir.
     */
    function parseKey(key) {
        return key.split('').map(digit => parseInt(digit) - 1);
    }

    /**
     * Şifreleme anahtarından de-şifreleme anahtarı oluşturur.
     * Örn: [2, 0, 1] (312) -> [1, 2, 0] (231)
     */
    function createInverseKey(keyArray) {
        const len = keyArray.length;
        const inverse = new Array(len);
        for (let i = 0; i < len; i++) {
            inverse[keyArray[i]] = i;
        }
        return inverse;
    }

    /**
     * Canvas'taki ImageData verisini binary string'e dönüştürür.
     */
    function imageDataToBinary(imageData) {
        const data = imageData.data; // Uint8ClampedArray [R, G, B, A, ...]
        let binaryString = "";
        for (let i = 0; i < data.length; i++) {
            binaryString += data[i].toString(2).padStart(8, '0');
        }
        return binaryString;
    }

    /**
     * Binary string'i tekrar ImageData'ya dönüştürür.
     */
    function binaryToImageData(binaryString, width, height) {
        const totalBytes = width * height * 4;
        const data = new Uint8ClampedArray(totalBytes);
        let dataIndex = 0;

        for (let i = 0; i < binaryString.length; i += 8) {
            if (dataIndex >= totalBytes) break; // Orijinal boyutu koru
            const byte = binaryString.substring(i, i + 8);
            data[dataIndex] = parseInt(byte, 2);
            dataIndex++;
        }
        return new ImageData(data, width, height);
    }

    /**
     * Binary string'i verilen anahtara göre permüte eder (şifreler/deşifreler).
     */
    function permute(binaryString, key, mode = 'encrypt') {
        const keyArray = parseKey(key);
        const blockSize = keyArray.length;
        const permKey = (mode === 'encrypt') ? keyArray : createInverseKey(keyArray);
        
        const remainder = binaryString.length % blockSize;
        if (remainder !== 0) {
            binaryString += '0'.repeat(blockSize - remainder);
        }

        let result = "";
        for (let i = 0; i < binaryString.length; i += blockSize) {
            const chunk = binaryString.substring(i, i + blockSize);
            const newChunk = new Array(blockSize);
            for (let j = 0; j < blockSize; j++) {
                newChunk[j] = chunk[permKey[j]];
            }
            result += newChunk.join('');
        }
        return result;
    }
    
    /**
     * Canvas içeriğini .png olarak indirmek için butonu ayarlar.
     */
    function setupDownloadButton(canvas, button) {
        button.onclick = () => {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'sifrelenmis-resim.png';
            link.click();
        };
    }

    /**
     * Ana şifreleme/deşifreleme fonksiyonu (BASİT VERSİYON)
     */
    function processImage(mode) {
        const inputCanvasId = (mode === 'encrypt') ? 'canvasInputEncrypt' : 'canvasInputDecrypt';
        const outputCanvasId = (mode === 'encrypt') ? 'canvasOutputEncrypt' : 'canvasOutputDecrypt';
        const keyId = (mode === 'encrypt') ? 'keyEncrypt' : 'keyDecrypt';
        const errorId = (mode === 'encrypt') ? 'keyEncryptError' : 'keyDecryptError';
        const downloadBtn = (mode === 'encrypt') ? document.getElementById('btnDownloadEncrypt') : null;

        const key = document.getElementById(keyId).value;
        const errorElement = document.getElementById(errorId);
        
        if (downloadBtn) downloadBtn.style.display = 'none';
        
        if (!validateKey(key, errorElement)) return;

        const inputCanvas = document.getElementById(inputCanvasId);
        const outputCanvas = document.getElementById(outputCanvasId);
        if (!inputCanvas.width || !inputCanvas.height) {
            alert('Lütfen önce bir resim yükleyin.');
            return;
        }

        alert('İşlem başlıyor. Resim boyutu büyükse tarayıcınız bir süreliğine donabilir, lütfen bekleyin.');

        const ctx = inputCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);

        try {
            // Tüm işlemler ana thread'de (burada) yapılır.
            // Bu satırlar, büyük resimlerde donmaya neden olur.
            
            // 1. Resmi Binary'ye Çevir
            const binaryString = imageDataToBinary(imageData);

            // 2. Binary'yi Permüte Et
            const processedBinary = permute(binaryString, key, mode);

            // 3. Binary'yi Resme Çevir
            const newImageData = binaryToImageData(processedBinary, inputCanvas.width, inputCanvas.height);

            // 4. Sonucu Canvas'a Çiz
            outputCanvas.width = inputCanvas.width;
            outputCanvas.height = inputCanvas.height;
            const outputCtx = outputCanvas.getContext('2d');
            outputCtx.putImageData(newImageData, 0, 0);

            // 5. İndirme butonunu ayarla
            if (downloadBtn) {
                setupDownloadButton(outputCanvas, downloadBtn);
                downloadBtn.style.display = 'block';
            }

        } catch (e) {
            console.error(e);
            alert('İşlem sırasında bir hata oluştu: ' + e.message);
        }
    }

    // --- EVENT LISTENERS ---

    // Resim yükleme dinleyicileri
    document.getElementById('imageInputEncrypt').addEventListener('change', (e) => handleImageUpload(e, 'canvasInputEncrypt'));
    document.getElementById('imageInputDecrypt').addEventListener('change', (e) => handleImageUpload(e, 'canvasInputDecrypt'));

    // Buton dinleyicileri
    document.getElementById('btnEncrypt').addEventListener('click', () => processImage('encrypt'));
    document.getElementById('btnDecrypt').addEventListener('click', () => processImage('decrypt'));
});