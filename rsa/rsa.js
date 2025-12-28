document.addEventListener('DOMContentLoaded', () => {

    // === Matematiksel Fonksiyonlar (BigInt) ===
    function gcd(a, b) {
        a = BigInt(a); b = BigInt(b);
        while (b !== 0n) { a %= b; [a, b] = [b, a]; }
        return a;
    }

    function modPow(base, exp, mod) {
        let res = 1n;
        base = BigInt(base) % BigInt(mod);
        exp = BigInt(exp);
        mod = BigInt(mod);
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod;
            base = (base * base) % mod;
            exp = exp / 2n;
        }
        return res;
    }

    // Genişletilmiş Öklid (Modüler Ters için)
    function modInverse(a, m) {
        let m0 = BigInt(m);
        let y = 0n, x = 1n;
        let a_bi = BigInt(a);
        let m_bi = BigInt(m);
        if (m_bi === 1n) return 0n;
        while (a_bi > 1n) {
            let q = a_bi / m_bi;
            let t = m_bi;
            m_bi = a_bi % m_bi;
            a_bi = t;
            t = y;
            y = x - q * y;
            x = t;
        }
        if (x < 0n) x += m0;
        return x;
    }

    // Miller-Rabin Asallık Testi
    function isPrime(n) {
        let num = BigInt(n);
        if (num < 2n) return false;
        if (num === 2n || num === 3n) return true;
        if (num % 2n === 0n || num % 3n === 0n) return false;
        let d = num - 1n;
        let s = 0n;
        while (d % 2n === 0n) { d /= 2n; s++; }
        const witnesses = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n];
        for (let a of witnesses) {
            if (num <= a) break;
            let x = modPow(a, d, num);
            if (x === 1n || x === num - 1n) continue;
            let composite = true;
            for (let r = 1n; r < s; r++) {
                x = (x * x) % num;
                if (x === num - 1n) { composite = false; break; }
            }
            if (composite) return false;
        }
        return true;
    }

    // === Global Değişkenler ===
    let rsaData = {};
    let currentStep = 0;

    // === UI Elementleri ===
    const staticResults = document.getElementById('simResults');
    const animContainer = document.getElementById('animationContainer');
    
    // Animasyon Elementleri
    const animMsgBox = document.getElementById('animMsgBox');
    const animMsgContent = document.getElementById('animMsgContent');
    const flyingKey = document.getElementById('flyingKey');
    const bobKeyArea = document.getElementById('bobKeyArea');
    const aliceKeyArea = document.getElementById('aliceKeyArea');
    const stepInfoBox = document.getElementById('stepInfoBox');
    const btnNextStep = document.getElementById('btnNextStep');

    // === HESAPLAMA VE VALİDASYON (ORTAK FONKSİYON) ===
    function calculateRSA(modePrefix) {
        // modePrefix: 'sim_' veya 'anim_'
        const valArea = document.getElementById(modePrefix + 'ValidationArea');
        valArea.innerHTML = '';

        const pVal = document.getElementById(modePrefix + 'P').value;
        const qVal = document.getElementById(modePrefix + 'Q').value;
        const eVal = document.getElementById(modePrefix + 'E').value;
        const mVal = document.getElementById(modePrefix + 'M').value;

        if (!pVal || !qVal || !eVal || !mVal) {
            showError(valArea, "Lütfen tüm alanları doldurunuz.");
            return null;
        }

        try {
            const p = BigInt(pVal);
            const q = BigInt(qVal);
            const e = BigInt(eVal);
            const m = BigInt(mVal);

            let errors = [];

            // 1. Asallık Kontrolü
            if (!isPrime(p)) errors.push(`Hata: P (${p}) asal değil.`);
            if (!isPrime(q)) errors.push(`Hata: Q (${q}) asal değil.`);
            if (p === q) errors.push(`Hata: P ve Q birbirinden farklı olmalıdır.`);

            if (errors.length > 0) {
                showError(valArea, errors.join("<br>"));
                return null;
            }

            // Hesaplamalar
            const n = p * q;
            const phi = (p - 1n) * (q - 1n);

            // 2. Mesaj Büyüklüğü Kontrolü
            if (m >= n) {
                showError(valArea, `Hata: Mesaj M (${m}), Modül N (${n})'den küçük olmalıdır.`);
                return null;
            }

            // 3. E ile Phi Aralarında Asal mı?
            if (gcd(e, phi) !== 1n) {
                showError(valArea, `Hata: E (${e}) ile φ(n) (${phi}) aralarında asal değildir. Başka bir E seçin.`);
                return null;
            }

            // 4. Gizli Anahtar (d) Hesabı
            const d = modInverse(e, phi);

            // 5. Şifreleme ve Deşifreleme
            const c = modPow(m, e, n);
            const m_decrypted = modPow(c, d, n);

            showSuccess(valArea, "Parametreler uygun. RSA anahtarları üretildi.");
            return { p, q, n, phi, e, d, m, c, m_decrypted };

        } catch (err) {
            showError(valArea, "İşlem hatası: " + err.message);
            return null;
        }
    }

    // === SEKME 1: STATİK SİMÜLASYON ===
    document.getElementById('btnRunStatic').addEventListener('click', () => {
        const data = calculateRSA('sim_'); // 'sim_' ön ekli inputları kullan
        if (!data) {
            staticResults.classList.add('hidden');
            return;
        }

        document.getElementById('txtN').textContent = data.n;
        document.getElementById('txtPhi').textContent = data.phi;
        document.getElementById('txtPublicKey').textContent = `(e=${data.e}, n=${data.n})`;
        document.getElementById('txtPrivateKey').textContent = `(d=${data.d})`;
        document.getElementById('txtCipher').textContent = data.c;
        
        const finalEl = document.getElementById('txtDecrypted');
        finalEl.textContent = data.m_decrypted;

        if (data.m_decrypted === data.m) {
            finalEl.innerHTML += ' <strong style="color:green">✅ (Doğru)</strong>';
        } else {
            finalEl.innerHTML += ' <strong style="color:red">❌ (Hatalı)</strong>';
        }

        staticResults.classList.remove('hidden');
    });

    // === SEKME 2: ANİMASYON ===
    document.getElementById('btnRunAnimation').addEventListener('click', () => {
        const data = calculateRSA('anim_'); // 'anim_' ön ekli inputları kullan
        if (!data) {
            animContainer.classList.add('hidden');
            return;
        }
        rsaData = data;
        startAnimationMode();
    });

    function startAnimationMode() {
        animContainer.classList.remove('hidden');
        currentStep = 0;
        btnNextStep.disabled = false;
        
        // Sahneyi Sıfırla
        bobKeyArea.innerHTML = '';
        aliceKeyArea.innerHTML = '';
        animMsgBox.style.opacity = '0';
        animMsgBox.style.left = '140px'; // Sol (Alice)
        animMsgBox.style.backgroundColor = '#ffc107'; // Sarı
        animMsgBox.style.borderColor = '#e0a800';
        animMsgContent.textContent = `M: ${rsaData.m}`;
        flyingKey.style.opacity = '0';
        flyingKey.style.left = 'calc(100% - 160px)'; // Sağ (Bob)
        flyingKey.style.top = '40%';
        
        updateStepInfo(0, "Başlangıç: Alıcı (Bob) RSA anahtarlarını üretti. Açık ve Gizli anahtara sahip.");
        
        // Bob'a anahtarları ver
        bobKeyArea.innerHTML = `
            <span class="key-badge public-key">Public: (e=${rsaData.e}, n=${rsaData.n})</span>
            <span class="key-badge private-key">Private: (d=${rsaData.d})</span>
        `;
    }

    document.getElementById('btnNextStep').addEventListener('click', () => {
        currentStep++;
        executeAnimStep(currentStep);
    });

    document.getElementById('btnReset').addEventListener('click', startAnimationMode);

    function executeAnimStep(step) {
        switch(step) {
            case 1: // Bob Public Key'i Alice'e gönderir
                flyingKey.style.opacity = '1';
                flyingKey.style.left = '160px'; // Alice'e git
                updateStepInfo(1, "Bob, Açık Anahtarını (Public Key) Göndericiye (Alice) yolluyor. Herkes görebilir.");
                break;
            
            case 2: // Alice Anahtarı Alır ve Mesajı Şifreler
                flyingKey.style.opacity = '0';
                aliceKeyArea.innerHTML = `<span class="key-badge public-key">Public: (e=${rsaData.e}, n=${rsaData.n})</span>`;
                
                animMsgBox.style.opacity = '1';
                updateStepInfo(2, `Alice, Bob'un açık anahtarı ile mesajı şifreliyor: C = ${rsaData.m}^${rsaData.e} mod ${rsaData.n} = ${rsaData.c}`);
                animMsgContent.textContent = `C: ${rsaData.c}`;
                animMsgBox.style.backgroundColor = '#dc3545'; // Kırmızı (Şifreli)
                animMsgBox.style.borderColor = '#bd2130';
                animMsgBox.querySelector('i').className = "fas fa-lock";
                break;

            case 3: // Alice Şifreli Mesajı Gönderir
                animMsgBox.style.left = 'calc(100% - 240px)'; // Bob'a git
                updateStepInfo(3, "Alice şifreli mesajı (Ciphertext) Bob'a gönderiyor. Güvensiz kanaldan geçiyor.");
                break;

            case 4: // Bob Deşifre Eder
                updateStepInfo(4, `Bob, kendi Gizli Anahtarı (d=${rsaData.d}) ile mesajı çözüyor: M = ${rsaData.c}^${rsaData.d} mod ${rsaData.n}`);
                animMsgContent.textContent = `M: ${rsaData.m_decrypted}`;
                animMsgBox.style.backgroundColor = '#28a745'; // Yeşil (Çözüldü)
                animMsgBox.style.borderColor = '#1e7e34';
                animMsgBox.querySelector('i').className = "fas fa-file-alt";
                
                if (rsaData.m === rsaData.m_decrypted) {
                    stepInfoBox.innerHTML += " <br><strong style='color:green'>BAŞARILI ✅</strong>";
                }
                btnNextStep.disabled = true;
                break;
        }
    }

    function updateStepInfo(step, text) {
        stepInfoBox.innerHTML = `<strong>Adım ${step}:</strong> ${text}`;
    }

    function showError(element, msg) {
        element.innerHTML = `<div class="status-badge status-error">${msg}</div>`;
    }
    function showSuccess(element, msg) {
        element.innerHTML = `<div class="status-badge status-success">${msg}</div>`;
    }

    // Ortak UI Fonksiyonları (Tab ve Dark Mode)
    document.querySelectorAll('.tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.content-section.tab').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        const savedMode = localStorage.getItem('mode') || 'light';
        if (savedMode === 'dark') document.body.classList.add('dark');
        modeToggle.textContent = savedMode === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        modeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('mode', document.body.classList.contains('dark') ? 'dark' : 'light');
            modeToggle.textContent = document.body.classList.contains('dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
        });
    }
});