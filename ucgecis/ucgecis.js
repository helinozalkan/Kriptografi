document.addEventListener('DOMContentLoaded', () => {

    // === Matematiksel Fonksiyonlar (BigInt) ===
    function gcd(a, b) {
        if (b === 0n) return a;
        return gcd(b, a % b);
    }

    function modPow(base, exp, mod) {
        let res = 1n;
        base = base % mod;
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod;
            exp = exp / 2n;
            base = (base * base) % mod;
        }
        return res;
    }

    function modInverse(a, m) {
        let m0 = m;
        let y = 0n, x = 1n;
        if (m === 1n) return 0n;
        while (a > 1n) {
            let q = a / m;
            let t = m;
            m = a % m;
            a = t;
            t = y;
            y = x - q * y;
            x = t;
        }
        if (x < 0n) x += m0;
        return x;
    }

    function isPrime(n) {
        if (n <= 1n) return false;
        if (n <= 3n) return true;
        if (n % 2n === 0n || n % 3n === 0n) return false;
        for (let i = 5n; i * i <= n; i += 6n) {
            if (n % i === 0n || n % (i + 2n) === 0n) return false;
        }
        return true;
    }

    // === Genel Validasyon ve Hesaplama ===
    function processProtocol(pVal, aVal, bVal, kVal, validationElement) {
        validationElement.innerHTML = '';

        if (!pVal || !aVal || !bVal || !kVal) {
            validationElement.innerHTML = `<div class="status-badge status-error">Lütfen tüm alanları doldurunuz.</div>`;
            return null;
        }

        try {
            const P = BigInt(pVal);
            const A = BigInt(aVal);
            const B = BigInt(bVal);
            const K = BigInt(kVal);

            let errors = [];
            if (!isPrime(P)) errors.push(`Hata: P (${P}) asal değil.`);
            if (K >= P) errors.push(`Hata: K (${K}) < P (${P}) olmalı.`);
            const phi = P - 1n;
            if (gcd(A, phi) !== 1n) errors.push(`Hata: A (${A}) ile P-1 aralarında asal değil.`);
            if (gcd(B, phi) !== 1n) errors.push(`Hata: B (${B}) ile P-1 aralarında asal değil.`);

            if (errors.length > 0) {
                validationElement.innerHTML = `<div class="status-badge status-error">${errors.join('<br>')}</div>`;
                return null;
            }

            // Hesaplamalar
            const A_inv = modInverse(A, phi);
            const B_inv = modInverse(B, phi);
            const C1 = modPow(K, A, P);
            const C2 = modPow(C1, B, P);
            const C3 = modPow(C2, A_inv, P);
            const Final = modPow(C3, B_inv, P);

            validationElement.innerHTML = `<div class="status-badge status-success">Hesaplama Başarılı!</div>`;
            return { P, A, B, K, A_inv, B_inv, C1, C2, C3, Final };

        } catch (e) {
            validationElement.innerHTML = `<div class="status-badge status-error">Hata: ${e.message}</div>`;
            return null;
        }
    }

    // === SEKME 1: SİMÜLASYON ===
    document.getElementById('btnRunSimulation').addEventListener('click', () => {
        const p = document.getElementById('sim_P').value;
        const a = document.getElementById('sim_A').value;
        const b = document.getElementById('sim_B').value;
        const k = document.getElementById('sim_K').value;
        const valArea = document.getElementById('sim_ValidationArea');
        const resultsArea = document.getElementById('simResults');

        const data = processProtocol(p, a, b, k, valArea);
        
        if (data) {
            document.getElementById('res_InvA').textContent = data.A_inv;
            document.getElementById('res_InvB').textContent = data.B_inv;
            document.getElementById('res_C1').textContent = data.C1;
            document.getElementById('res_C2').textContent = data.C2;
            document.getElementById('res_C3').textContent = data.C3;
            
            const finalEl = document.getElementById('res_Final');
            finalEl.textContent = data.Final;
            
            if (data.Final === data.K) {
                finalEl.innerHTML += ' <strong style="color:green">✅</strong>';
            } else {
                finalEl.innerHTML += ' <strong style="color:red">❌</strong>';
            }
            resultsArea.classList.remove('hidden');
        } else {
            resultsArea.classList.add('hidden');
        }
    });

    // === SEKME 2: ANİMASYON ===
    let animData = {};
    let currentStep = 0;
    
    // UI Referansları
    const messageBox = document.getElementById('messageBox');
    const msgValue = document.getElementById('msgValue');
    const lockContainer = document.getElementById('lockContainer');
    const stepInfoBox = document.getElementById('stepInfoBox');
    const btnNextStep = document.getElementById('btnNextStep');
    const animContainer = document.getElementById('animationContainer');

    document.getElementById('btnRunAnimation').addEventListener('click', () => {
        const p = document.getElementById('anim_P').value;
        const a = document.getElementById('anim_A').value;
        const b = document.getElementById('anim_B').value;
        const k = document.getElementById('anim_K').value;
        const valArea = document.getElementById('anim_ValidationArea');

        const data = processProtocol(p, a, b, k, valArea);
        
        if (data) {
            animData = data;
            startAnimation();
        } else {
            animContainer.classList.add('hidden');
        }
    });

    function startAnimation() {
        animContainer.classList.remove('hidden');
        currentStep = 0;
        btnNextStep.disabled = false;
        
        // Sıfırla
        messageBox.style.left = '120px'; // Sol
        messageBox.style.backgroundColor = '';
        messageBox.style.borderColor = '';
        msgValue.textContent = `K: ${animData.K}`;
        lockContainer.innerHTML = '';
        
        updateStepInfo(0);
    }

    btnNextStep.addEventListener('click', () => {
        currentStep++;
        executeAnimStep(currentStep);
    });

    document.getElementById('btnReset').addEventListener('click', startAnimation);

    function executeAnimStep(step) {
        const posSender = '120px';
        const posReceiver = 'calc(100% - 240px)'; 

        switch(step) {
            case 1: // Gönderici Kilitler (A) -> Alıcıya
                addLock('A', 'red');
                msgValue.textContent = `C1: ${animData.C1}`;
                updateStepInfo(1, `Gönderici mesajı A ile kilitledi. Alıcıya gönderiliyor...`);
                messageBox.style.left = posReceiver;
                break;
            case 2: // Alıcı Kilitler (B) -> Göndericiye
                addLock('B', 'blue');
                msgValue.textContent = `C2: ${animData.C2}`;
                updateStepInfo(2, `Alıcı mesajı B ile kilitledi (Çift Kilit). Göndericiye geri dönüyor...`);
                messageBox.style.left = posSender;
                break;
            case 3: // Gönderici Açar (A) -> Alıcıya
                removeLock('A');
                msgValue.textContent = `C3: ${animData.C3}`;
                updateStepInfo(3, `Gönderici A kilidini açtı. Mesaj (tek kilitli) Alıcıya gidiyor...`);
                messageBox.style.left = posReceiver;
                break;
            case 4: // Alıcı Açar (B) -> Sonuç
                removeLock('B');
                msgValue.textContent = `Sonuç: ${animData.Final}`;
                if (animData.Final === animData.K) {
                    updateStepInfo(4, `Alıcı B kilidini açtı ve mesaja ulaştı! <strong style="color:green">BAŞARILI ✅</strong>`);
                    messageBox.style.backgroundColor = '#d4edda';
                    messageBox.style.borderColor = '#28a745';
                } else {
                    updateStepInfo(4, `Sonuç hatalı. <strong style="color:red">BAŞARISIZ ❌</strong>`);
                }
                btnNextStep.disabled = true;
                break;
        }
    }

    function addLock(name, color) {
        const i = document.createElement('i');
        i.className = `fas fa-lock lock`;
        i.style.color = color;
        i.id = `lock-${name}`;
        lockContainer.appendChild(i);
    }

    function removeLock(name) {
        const l = document.getElementById(`lock-${name}`);
        if (l) {
            l.classList.replace('fa-lock', 'fa-lock-open');
            l.classList.add('unlocked');
            setTimeout(() => l.remove(), 1000);
        }
    }

    function updateStepInfo(step, text="") {
        stepInfoBox.innerHTML = step === 0 
            ? `<strong>Başlangıç:</strong> Mesaj (${animData.K}) gönderilmeye hazır.` 
            : `<strong>Adım ${step}:</strong> ${text}`;
    }

    // === Ortak Fonksiyonlar (Tab, DarkMode) ===
    document.querySelectorAll('.tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.querySelectorAll('.content-section.tab').forEach(s => s.classList.remove('active'));
            document.getElementById(target).classList.add('active');
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