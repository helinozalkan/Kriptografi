document.addEventListener('DOMContentLoaded', () => {

    // === Yardımcı Matematik Fonksiyonları ===

    // En Büyük Ortak Bölen (EBOB) hesaplama
    function gcd(a, b) {
        if (!b) return a;
        return gcd(b, a % b);
    }

    // Bir sayının asal olup olmadığını kontrol etme
    function isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }

    // Modüler Üs Alma (Modular Exponentiation): (base^exp) % mod
    // Büyük sayılar için BigInt kullanımı zorunludur.
    function power(base, exp, mod) {
        let res = 1n;
        base = base % mod;
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod;
            exp = exp / 2n;
            base = (base * base) % mod;
        }
        return res;
    }

    // Modüler Ters Alma (Modular Multiplicative Inverse)
    // Genişletilmiş Öklid Algoritması kullanarak a*x + m*y = gcd(a,m) = 1
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

    // === UI İşlemleri ve Protokol Simülasyonu ===

    const btnSimulate = document.getElementById('btnSimulate');
    const errorBox = document.getElementById('errorBox');
    const resultsArea = document.getElementById('resultsArea');

    // Dark Mode Toggle (Mevcut yapıya uygun)
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

    btnSimulate.addEventListener('click', () => {
        // Hata kutusunu ve sonuçları temizle
        errorBox.style.display = 'none';
        errorBox.innerHTML = '';
        resultsArea.classList.add('hidden');

        // Girdileri al (BigInt olarak işlem yapacağız çünkü sayılar büyük olabilir)
        const pVal = document.getElementById('inputP').value;
        const aVal = document.getElementById('inputA').value;
        const bVal = document.getElementById('inputB').value;
        const kVal = document.getElementById('inputK').value;

        if (!pVal || !aVal || !bVal || !kVal) {
            showError("Lütfen tüm alanları doldurunuz.");
            return;
        }

        try {
            const P = BigInt(pVal);
            const A = BigInt(aVal);
            const B = BigInt(bVal);
            const K = BigInt(kVal);

            // === 1. Validasyon (Denetleme) Adımları ===
            let errors = [];

            // P asal mı?
            if (!isPrime(Number(P))) {
                errors.push(`P değeri (${P}) asal sayı değildir.`);
            }

            // K, P'den küçük mü?
            if (K >= P) {
                errors.push(`K mesaj değeri (${K}), P mod değerinden (${P}) küçük olmalıdır.`);
            }

            // A ve P-1 aralarında asal mı?
            if (gcd(A, P - 1n) !== 1n) {
                errors.push(`A anahtarı (${A}), P-1 (${P - 1n}) ile aralarında asal değildir. Ortak bölen mevcut.`);
            }

            // B ve P-1 aralarında asal mı?
            if (gcd(B, P - 1n) !== 1n) {
                errors.push(`B anahtarı (${B}), P-1 (${P - 1n}) ile aralarında asal değildir. Ortak bölen mevcut.`);
            }

            if (errors.length > 0) {
                showError("<strong>Protokol Hatası:</strong><br>" + errors.join("<br>"));
                return;
            }

            // === 2. Hesaplama Adımları ===

            // Adım 1: Terslerin Hesaplanması
            // Kural: A * A_inv = 1 mod (P-1)
            const A_inv = modInverse(A, P - 1n);
            const B_inv = modInverse(B, P - 1n);

            // Adım 2: Gönderici Mesajı Kilitler (C1 = K^A mod P)
            const C1 = power(K, A, P);

            // Adım 3: Alıcı Mesajı Kilitler (C2 = C1^B mod P)
            const C2 = power(C1, B, P);

            // Adım 4: Gönderici Kendi Kilidini Açar (C3 = C2^(A^-1) mod P)
            const C3 = power(C2, A_inv, P);

            // Adım 5: Alıcı Kendi Kilidini Açar (Sonuç = C3^(B^-1) mod P)
            const Final = power(C3, B_inv, P);

            // === 3. Sonuçları Gösterme ===
            document.getElementById('resInvA').textContent = A_inv.toString();
            document.getElementById('resInvB').textContent = B_inv.toString();
            document.getElementById('resC1').textContent = C1.toString();
            document.getElementById('resC2').textContent = C2.toString();
            document.getElementById('resC3').textContent = C3.toString();
            document.getElementById('resFinal').textContent = Final.toString();

            // Sonucun doğruluğunu kontrol et (Simülasyon için)
            if (Final === K) {
                document.getElementById('resFinal').style.color = "green";
                document.getElementById('resFinal').innerHTML += " ✅ (Başarılı)";
            } else {
                document.getElementById('resFinal').style.color = "red";
                document.getElementById('resFinal').innerHTML += " ❌ (Hatalı)";
            }

            resultsArea.classList.remove('hidden');

        } catch (e) {
            console.error(e);
            showError("Hesaplama sırasında bir hata oluştu. Lütfen girdilerin sayısal değer olduğundan emin olun.");
        }
    });

    function showError(msg) {
        errorBox.innerHTML = msg;
        errorBox.style.display = 'block';
    }
});