document.addEventListener('DOMContentLoaded', () => {

    // === MATEMATİKSEL FONKSİYONLAR (BigInt) ===

    // EBOB
    function gcd(a, b) {
        a = BigInt(a); b = BigInt(b);
        while (b !== 0n) { a %= b; [a, b] = [b, a]; }
        return a;
    }

    // Modüler Üs Alma
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

    // Modüler Ters Alma (Genişletilmiş Öklid)
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

    // İlkel Kök (Primitive Root) Kontrolü
    // Not: Bu işlem P-1'in asal çarpanlarına ayrılmasını gerektirir.
    // 5-8 basamaklı sayılar için trial division yeterlidir.
    function isPrimitiveRoot(g, p) {
        let pVal = BigInt(p);
        let gVal = BigInt(g);
        let phi = pVal - 1n;
        let n = phi;
        let factors = new Set();
        
        // P-1'in asal çarpanlarını bul
        let i = 2n;
        while (i * i <= n) {
            if (n % i === 0n) {
                factors.add(i);
                while (n % i === 0n) n /= i;
            }
            i++;
        }
        if (n > 1n) factors.add(n);

        // Her çarpan q için g^(phi/q) != 1 mod p kontrolü
        for (let q of factors) {
            if (modPow(gVal, phi / q, pVal) === 1n) return false;
        }
        return true;
    }

    // === GLOBAL DEĞİŞKENLER ===
    let elGamalData = {};
    let currentStep = 0;

    // === UI ELEMENTLERİ ===
    const staticResults = document.getElementById('simResults');
    const animContainer = document.getElementById('animationContainer');
    const bobArea = document.getElementById('bobArea');
    const aliceArea = document.getElementById('aliceArea');
    const flyingObj = document.getElementById('flyingObj');
    const stepInfoBox = document.getElementById('stepInfoBox');
    const btnNextStep = document.getElementById('btnNextStep');

    // === HESAPLAMA VE VALİDASYON FONKSİYONU ===
    function calculateElGamal(prefix) {
        const valArea = document.getElementById(prefix + 'ValidationArea');
        valArea.innerHTML = '';

        const pVal = document.getElementById(prefix + 'P').value;
        const alphaVal = document.getElementById(prefix + 'Alpha').value;
        const bVal = document.getElementById(prefix + 'B').value;
        const kVal = document.getElementById(prefix + 'K').value;
        const mVal = document.getElementById(prefix + 'M').value;

        if (!pVal || !alphaVal || !bVal || !kVal || !mVal) {
            showError(valArea, "Lütfen tüm alanları doldurunuz.");
            return null;
        }

        try {
            const P = BigInt(pVal);
            const Alpha = BigInt(alphaVal);
            const b = BigInt(bVal);
            const k = BigInt(kVal);
            const M = BigInt(mVal);

            let errors = [];

            // 1. P Asal mı?
            if (!isPrime(P)) errors.push(`Hata: P (${P}) asal sayı değildir.`);

            // 2. Alpha Üreteç mi? (P asal ise kontrol et)
            if (isPrime(P)) {
                if (!isPrimitiveRoot(Alpha, P)) errors.push(`Hata: α (${Alpha}), mod P (${P})'nin ilkel kökü (üreteci) değildir.`);
            }

            // 3. b ve k aralık kontrolü (1 < x < P-1)
            if (b <= 1n || b >= (P - 1n)) errors.push(`Hata: b gizli anahtarı (${b}), 1 ile P-1 arasında olmalıdır.`);
            if (k <= 1n || k >= (P - 1n)) errors.push(`Hata: k rastgele sayısı (${k}), 1 ile P-1 arasında olmalıdır.`);

            // 4. M < P mi?
            if (M >= P) errors.push(`Hata: Mesaj M (${M}), P (${P})'den küçük olmalıdır.`);

            if (errors.length > 0) {
                showError(valArea, errors.join("<br>"));
                return null;
            }

            // Hesaplamalar
            // 1. Bob Açık Anahtar Hesabı: beta = alpha^b mod P
            const Beta = modPow(Alpha, b, P);

            // 2. Alice Şifreleme:
            // C1 = alpha^k mod P
            const C1 = modPow(Alpha, k, P);
            // C2 = M * beta^k mod P
            const C2 = (M * modPow(Beta, k, P)) % P;

            // 3. Bob Deşifreleme:
            // Ortak sır S = C1^b mod P
            const S = modPow(C1, b, P);
            // S^-1 (Modüler ters)
            const S_inv = modInverse(S, P);
            // M' = C2 * S^-1 mod P
            const M_decrypted = (C2 * S_inv) % P;

            showSuccess(valArea, "Değerler uygun. Hesaplama tamamlandı.");
            
            return { P, Alpha, b, k, M, Beta, C1, C2, S, S_inv, M_decrypted };

        } catch (err) {
            showError(valArea, "İşlem hatası: " + err.message);
            return null;
        }
    }

    // === SEKME 1: STATİK SİMÜLASYON ===
    document.getElementById('btnRunStatic').addEventListener('click', () => {
        const data = calculateElGamal('sim_');
        if (!data) {
            staticResults.classList.add('hidden');
            return;
        }

        document.getElementById('txtBeta').textContent = data.Beta;
        document.getElementById('txtPublicKey').textContent = `(${data.P}, ${data.Alpha}, ${data.Beta})`;
        document.getElementById('txtC1').textContent = data.C1;
        document.getElementById('txtC2').textContent = data.C2;
        document.getElementById('txtCipherPair').textContent = `(${data.C1}, ${data.C2})`;
        document.getElementById('txtSharedSecret').textContent = data.S;
        document.getElementById('txtSInverse').textContent = data.S_inv;
        
        const finalEl = document.getElementById('txtDecrypted');
        finalEl.textContent = data.M_decrypted;

        if (data.M_decrypted === data.M) {
            finalEl.innerHTML += ' <strong style="color:green">✅ (Doğru)</strong>';
        } else {
            finalEl.innerHTML += ' <strong style="color:red">❌ (Hatalı)</strong>';
        }

        staticResults.classList.remove('hidden');
    });

    // === SEKME 2: ANİMASYON ===
    document.getElementById('btnRunAnimation').addEventListener('click', () => {
        const data = calculateElGamal('anim_');
        if (!data) {
            animContainer.classList.add('hidden');
            return;
        }
        elGamalData = data;
        startAnimationMode();
    });

    function startAnimationMode() {
        animContainer.classList.remove('hidden');
        currentStep = 0;
        btnNextStep.disabled = false;
        
        // Sahneyi Sıfırla
        aliceArea.innerHTML = '';
        bobArea.innerHTML = '';
        flyingObj.style.opacity = '0';
        flyingObj.style.left = '50%';
        flyingObj.textContent = '';
        
        // Başlangıç Durumu
        bobArea.innerHTML = `
            <span class="key-badge private-key">Gizli (b): ${elGamalData.b}</span>
            <span class="key-badge public-key">Açık (β): ${elGamalData.Beta}</span>
        `;
        aliceArea.innerHTML = `
            <span class="key-badge private-key">Rastgele (k): ${elGamalData.k}</span>
            <span class="key-badge calc-value">Mesaj (m): ${elGamalData.M}</span>
        `;

        updateStepInfo(0, "Başlangıç: Alıcı (Bob) anahtarlarını, Gönderici (Alice) mesajını hazırladı.");
    }

    document.getElementById('btnNextStep').addEventListener('click', () => {
        currentStep++;
        executeAnimStep(currentStep);
    });

    document.getElementById('btnReset').addEventListener('click', startAnimationMode);

    function executeAnimStep(step) {
        switch(step) {
            case 1: // Bob Açık Anahtarı Gönderir
                flyingObj.textContent = `(P, α, β)`;
                flyingObj.style.left = 'calc(100% - 160px)'; // Bob'dan başla
                flyingObj.style.top = '40%';
                flyingObj.style.opacity = '1';
                
                setTimeout(() => {
                    flyingObj.style.left = '160px'; // Alice'e git
                }, 100);

                updateStepInfo(1, "Bob, Açık Anahtarı (P, α, β)'yı Alice'e gönderiyor.");
                break;

            case 2: // Alice Şifreleme Yapar
                flyingObj.style.opacity = '0'; // Anahtar kaybolur
                aliceArea.innerHTML += `
                    <span class="key-badge public-key">Gelen (β): ${elGamalData.Beta}</span>
                `;
                setTimeout(() => {
                    aliceArea.innerHTML = `
                        <span class="key-badge calc-value" style="background-color:#f8d7da">Şifreli (C1, C2)</span>
                    `;
                }, 1000);
                updateStepInfo(2, `Alice, Bob'un anahtarını kullanarak mesajı şifreliyor: C1=${elGamalData.C1}, C2=${elGamalData.C2}`);
                break;

            case 3: // Alice Şifreyi Gönderir
                flyingObj.textContent = `(${elGamalData.C1}, ${elGamalData.C2})`;
                flyingObj.style.left = '160px'; // Alice'den başla
                flyingObj.style.opacity = '1';
                flyingObj.style.backgroundColor = '#dc3545';
                flyingObj.style.color = 'white';

                setTimeout(() => {
                    flyingObj.style.left = 'calc(100% - 160px)'; // Bob'a git
                }, 100);

                updateStepInfo(3, "Alice şifreli metin ikilisini (C1, C2) Bob'a gönderiyor.");
                break;

            case 4: // Bob Deşifre Eder
                flyingObj.style.opacity = '0';
                bobArea.innerHTML += `
                    <span class="key-badge calc-value" style="background-color:#d4edda">Çözülen: ${elGamalData.M_decrypted}</span>
                `;
                
                if (elGamalData.M === elGamalData.M_decrypted) {
                    updateStepInfo(4, `Bob, gizli anahtarı (b) ile mesajı çözdü! <strong style="color:green">BAŞARILI ✅</strong>`);
                }
                btnNextStep.disabled = true;
                break;
        }
    }

    // === UI YARDIMCI FONKSİYONLARI ===
    function updateStepInfo(step, text) {
        stepInfoBox.innerHTML = `<strong>Adım ${step}:</strong> ${text}`;
    }

    function showError(element, msg) {
        element.innerHTML = `<div class="status-badge status-error">${msg}</div>`;
    }
    function showSuccess(element, msg) {
        element.innerHTML = `<div class="status-badge status-success">${msg}</div>`;
    }

    // Tab ve Dark Mode
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