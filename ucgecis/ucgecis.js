/**
 * BYM 468 - Kriptografi Dersi
 * Üç-Geçiş Protokolü (Three-Pass Protocol) Simülasyonu

 */

document.addEventListener('DOMContentLoaded', () => {

    

    
    function gcd(a, b) {
        a = BigInt(a);
        b = BigInt(b);
        while (b !== 0n) {
            a %= b;
            [a, b] = [b, a];
        }
        return a;
    }

    
    function modPow(base, exp, mod) {
        let res = 1n;
        base = BigInt(base) % BigInt(mod);
        exp = BigInt(exp);
        let m = BigInt(mod);
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % m;
            base = (base * base) % m;
            exp = exp / 2n;
        }
        return res;
    }

    
    function modInverse(a, m) {
        let m0 = BigInt(m);
        let y = 0n, x = 1n;
        let a_bi = BigInt(a);
        let m_bi = BigInt(m);

        if (m_bi === 1n) return 0n;

        while (a_bi > 1n) {
            if (m_bi === 0n) break;
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

   
    function isPrime(n) {
        let num = BigInt(n);
        if (num < 2n) return false;
        if (num === 2n || num === 3n) return true;
        if (num % 2n === 0n || num % 3n === 0n) return false;

        let d = num - 1n;
        let s = 0n;
        while (d % 2n === 0n) {
            d /= 2n;
            s++;
        }

        
        const witnesses = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n];
        
        for (let a of witnesses) {
            if (num <= a) break;
            let x = modPow(a, d, num);
            if (x === 1n || x === num - 1n) continue;
            
            let composite = true;
            for (let r = 1n; r < s; r++) {
                x = (x * x) % num;
                if (x === num - 1n) {
                    composite = false;
                    break;
                }
            }
            if (composite) return false;
        }
        return true;
    }

    
    let simData = {}; 
    let currentStep = 0; 

    const messageBox = document.getElementById('messageBox');
    const msgValue = document.getElementById('msgValue');
    const lockContainer = document.getElementById('lockContainer');
    const stepInfoBox = document.getElementById('stepInfoBox');
    const btnNextStep = document.getElementById('btnNextStep');
    const animContainer = document.getElementById('animationContainer');

    
    function calculateProtocolData() {
        const isSimTab = document.getElementById('tabSimulation').classList.contains('active');
        const prefix = isSimTab ? "sim_" : "anim_";
        
        const valArea = document.getElementById(prefix + 'ValidationArea');
        valArea.innerHTML = '';

        const pVal = document.getElementById(prefix + 'P').value;
        const aVal = document.getElementById(prefix + 'A').value;
        const bVal = document.getElementById(prefix + 'B').value;
        const kVal = document.getElementById(prefix + 'K').value;

        if (!pVal || !aVal || !bVal || !kVal) {
            showValidationError(valArea, "Lütfen tüm alanları doldurunuz.");
            return null;
        }

        try {
            const P = BigInt(pVal);
            const A = BigInt(aVal);
            const B = BigInt(bVal);
            const K = BigInt(kVal);
            const phi = P - 1n;

            let errors = [];

            if (!isPrime(P)) {
                errors.push(`Hata: P mod değeri (${P}) bir asal sayı değildir.`);
            }

            if (K >= P) {
                errors.push(`Hata: K mesaj değeri (${K}), P mod değerinden (${P}) küçük olmalıdır.`);
            }

            const gcdA = gcd(A, phi);
            if (gcdA !== 1n) {
                errors.push(`Hata: A anahtarı (${A}), P-1 (${phi}) ile aralarında asal değildir. (EBOB: ${gcdA})`);
            }

            const gcdB = gcd(B, phi);
            if (gcdB !== 1n) {
                errors.push(`Hata: B anahtarı (${B}), P-1 (${phi}) ile aralarında asal değildir. (EBOB: ${gcdB})`);
            }

            if (errors.length > 0) {
                showValidationError(valArea, errors.join("<br>"));
                return null;
            }

            const A_inv = modInverse(A, phi);
            const B_inv = modInverse(B, phi);
            
            const C1 = modPow(K, A, P);      
            const C2 = modPow(C1, B, P);     
            const C3 = modPow(C2, A_inv, P); 
            const Final = modPow(C3, B_inv, P);

            showValidationSuccess(valArea, "Değerler protokol kurallarına uygun. Hesaplama tamamlandı.");

            return { P, A, B, K, A_inv, B_inv, C1, C2, C3, Final };

        } catch (e) {
            showValidationError(valArea, "Sayısal işlem hatası: " + e.message);
            return null;
        }
    }

    
    document.getElementById('btnRunSimulation').addEventListener('click', () => {
        const data = calculateProtocolData();
        const resultsDiv = document.getElementById('simResults');

        if (!data) {
            resultsDiv.classList.add('hidden');
            return;
        }

        document.getElementById('txtInvA').textContent = data.A_inv.toString();
        document.getElementById('txtInvB').textContent = data.B_inv.toString();
        document.getElementById('txtC1').textContent = data.C1.toString();
        document.getElementById('txtC2').textContent = data.C2.toString();
        document.getElementById('txtC3').textContent = data.C3.toString();
        
        const finalSpan = document.getElementById('txtFinal');
        finalSpan.textContent = data.Final.toString();

        if (data.Final === data.K) {
            finalSpan.innerHTML += ' <strong style="color:green">✅ (Başarılı)</strong>';
        } else {
            finalSpan.innerHTML += ' <strong style="color:red">❌ (Hatalı)</strong>';
        }

        resultsDiv.classList.remove('hidden');
    });

    // === SEKME 2: ANİMASYON ===
    document.getElementById('btnRunAnimation').addEventListener('click', () => {
        const data = calculateProtocolData();
        if (!data) {
            animContainer.classList.add('hidden');
            return;
        }

        simData = data;
        animContainer.classList.remove('hidden');
        resetAnimation();
    });

    function resetAnimation() {
        currentStep = 0;
        btnNextStep.disabled = false;
        
        messageBox.style.left = '120px'; 
        messageBox.style.backgroundColor = '';
        messageBox.style.borderColor = '';
        msgValue.textContent = `K: ${simData.K}`;
        lockContainer.innerHTML = '';
        
        updateStepInfo(0, `Gönderici mesajı (${simData.K}) hazırladı. Başlamak için "İleri" butonuna basın.`);
    }

    btnNextStep.addEventListener('click', () => {
        currentStep++;
        executeAnimStep(currentStep);
    });

    document.getElementById('btnReset').addEventListener('click', resetAnimation);

    function executeAnimStep(step) {
        const posSender = '120px';
        const posReceiver = 'calc(100% - 240px)'; 

        switch(step) {
            case 1: 
                addLockIcon('A', '#dc3545'); 
                msgValue.textContent = `C1: ${simData.C1}`;
                updateStepInfo(1, `Gönderici mesajı A anahtarıyla kilitledi. Değer: ${simData.C1}. Alıcıya gönderiliyor...`);
                messageBox.style.left = posReceiver;
                break;

            case 2: 
                addLockIcon('B', '#007bff'); 
                msgValue.textContent = `C2: ${simData.C2}`;
                updateStepInfo(2, `Alıcı mesajı B anahtarıyla da kilitledi. Değer: ${simData.C2}. Göndericiye geri dönüyor...`);
                messageBox.style.left = posSender;
                break;

            case 3: 
                removeLockIcon('A');
                msgValue.textContent = `C3: ${simData.C3}`;
                updateStepInfo(3, `Gönderici kendi kilidini (A⁻¹) açtı. Değer: ${simData.C3}. Mesaj Alıcıya gidiyor...`);
                messageBox.style.left = posReceiver;
                break;

            case 4: 
                removeLockIcon('B');
                msgValue.textContent = `Sonuç: ${simData.Final}`;
                if (simData.Final === simData.K) {
                    updateStepInfo(4, `Alıcı kendi kilidini (B⁻¹) açtı ve orijinal mesaja ulaştı! <strong style="color:green">BAŞARILI ✅</strong>`);
                    messageBox.style.backgroundColor = '#d4edda';
                    messageBox.style.borderColor = '#28a745';
                } else {
                    updateStepInfo(4, `Simülasyon tamamlandı ancak sonuç hatalı! <strong style="color:red">BAŞARISIZ ❌</strong>`);
                }
                btnNextStep.disabled = true;
                break;
        }
    }

    function addLockIcon(id, color) {
        const lock = document.createElement('i');
        lock.className = `fas fa-lock lock`;
        lock.style.color = color;
        lock.id = `lock-${id}`;
        lockContainer.appendChild(lock);
    }

    function removeLockIcon(id) {
        const lock = document.getElementById(`lock-${id}`);
        if (lock) {
            lock.classList.replace('fa-lock', 'fa-lock-open');
            lock.classList.add('unlocked');
            setTimeout(() => lock.remove(), 800); 
        }
    }

    function updateStepInfo(step, text) {
        stepInfoBox.innerHTML = step === 0 ? text : `<strong>Adım ${step}:</strong> ${text}`;
    }

    function showValidationError(element, msg) {
        element.innerHTML = `<div class="status-badge status-error">${msg}</div>`;
    }

    function showValidationSuccess(element, msg) {
        element.innerHTML = `<div class="status-badge status-success">${msg}</div>`;
    }

    document.querySelectorAll('.tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.content-section.tab').forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        const savedMode = localStorage.getItem('mode') || 'light';
        if (savedMode === 'dark') document.body.classList.add('dark');
        modeToggle.textContent = savedMode === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

        modeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('mode', isDark ? 'dark' : 'light');
            modeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        });
    }

});