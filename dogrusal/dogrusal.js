document.addEventListener('DOMContentLoaded', () => {

   
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



    const alfabetler = {
        tr: ['a','b','c','ç','d','e','f','g','ğ','h','ı','i','j','k','l','m','n','o','ö','p','r','s','ş','t','u','ü','v','y','z'],
        en: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    };

    function obeb(a, b) {
        while (b) { [a, b] = [b, a % b]; }
        return a;
    }

    function modInverse(a, M) {
        for (let x = 1; x < M; x++) {
            if (((a % M) * (x % M)) % M == 1) return x;
        }
        return 1;
    }

  
    function processText(text, a, b, alfabe, mode = 'encrypt') {
        const M = alfabe.length;
        const a_inv = modInverse(a, M);
        return Array.from(text).map(char => {
            const lower = char.toLocaleLowerCase('tr-TR');
            const idx = alfabe.indexOf(lower);
            if (idx === -1) return char; 
            let newIndex;
            if (mode === 'encrypt') {
                newIndex = (a * idx + b) % M;
            } else {
                newIndex = (a_inv * ((idx - b + M) % M)) % M;
            }
            return alfabe[newIndex];
        }).join('');
    }
    

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {}, () => {
             const ta = document.createElement('textarea');
             ta.value = text; document.body.appendChild(ta);
             ta.select(); document.execCommand('copy');
             document.body.removeChild(ta);
        });
    }


    function validateKeyA(keyA_element, alphabet_element, error_element) {
        const keyA = parseInt(keyA_element.value) || 0;
        const mode = alphabet_element.value;
        const M = alfabetler[mode].length;

        if (keyA <= 0 || obeb(keyA, M) !== 1) {
            error_element.textContent = `'a' anahtarı (${keyA}), alfabe boyutu (${M}) ile aralarında asal ve pozitif olmalıdır.`;
            error_element.classList.add('visible');
            keyA_element.classList.add('invalid');
            return false;
        } else {
            error_element.classList.remove('visible');
            keyA_element.classList.remove('invalid');
            return true;
        }
    }


    const encryptSelect = document.getElementById('alphabetEncrypt');
    const decryptSelect = document.getElementById('alphabetDecrypt');
    const crackSelect = document.getElementById('alphabetCrack');
    const keyA_encrypt = document.getElementById('keyA_encrypt');
    const keyA_decrypt = document.getElementById('keyA_decrypt');
    const error_encrypt = document.getElementById('keyA_encrypt_error');
    const error_decrypt = document.getElementById('keyA_decrypt_error');


    [keyA_encrypt, encryptSelect].forEach(el => el.addEventListener('input', () => validateKeyA(keyA_encrypt, encryptSelect, error_encrypt)));
    [keyA_decrypt, decryptSelect].forEach(el => el.addEventListener('input', () => validateKeyA(keyA_decrypt, decryptSelect, error_decrypt)));


    const setupSelect = (selectElement, storageKey) => {
        if (selectElement) {
            const saved = localStorage.getItem(storageKey);
            if (saved) selectElement.value = saved;
            selectElement.addEventListener('change', e => localStorage.setItem(storageKey, e.target.value));
        }
    };
    setupSelect(encryptSelect, 'alphabetEncryptLinear');
    setupSelect(decryptSelect, 'alphabetDecryptLinear');
    setupSelect(crackSelect, 'alphabetCrackLinear');


    document.getElementById('btnEncrypt').addEventListener('click', () => {
        if (!validateKeyA(keyA_encrypt, encryptSelect, error_encrypt)) return;

        const plain = document.getElementById('plainInput').value;
        const keyA = parseInt(keyA_encrypt.value) || 0;
        const keyB = parseInt(document.getElementById('keyB_encrypt').value) || 0;
        const mode = encryptSelect.value;
        
        if (!plain) { alert('Lütfen düz metin giriniz.'); return; }
        
        const cipher = processText(plain, keyA, keyB, alfabetler[mode], 'encrypt');
        document.getElementById('cipherOutput').value = cipher;
    });

    
    document.getElementById('btnDecrypt').addEventListener('click', () => {
        if (!validateKeyA(keyA_decrypt, decryptSelect, error_decrypt)) return;

        const cipher = document.getElementById('cipherInput').value;
        const keyA = parseInt(keyA_decrypt.value) || 0;
        const keyB = parseInt(document.getElementById('keyB_decrypt').value) || 0;
        const mode = decryptSelect.value;

        if (!cipher) { alert('Lütfen şifreli metin giriniz.'); return; }

        const plain = processText(cipher, keyA, keyB, alfabetler[mode], 'decrypt');
        document.getElementById('plainOutput').value = plain;
    });

    document.getElementById('btnCrack').addEventListener('click', () => {
        const cipher = document.getElementById('crackInput').value;
        if (!cipher) { alert('Lütfen kırılacak şifreli metni giriniz.'); return; }

        const mode = crackSelect.value;
        const alfabe = alfabetler[mode];
        const M = alfabe.length;

        const candidatesDiv = document.getElementById('crackCandidates');
        candidatesDiv.innerHTML = '<h4>Çözüm Adayları Hesaplanıyor...</h4>';
        
        const valid_a_values = [];
        for (let i = 1; i < M; i++) {
            if (obeb(i, M) === 1) { valid_a_values.push(i); }
        }
        
        let candidatesHTML = '';
        for (const a of valid_a_values) {
            for (let b = 0; b < M; b++) {
                const cand = processText(cipher, a, b, alfabe, 'decrypt');
                candidatesHTML += `<div class="crack-result-card"><div class="card-header"><span class="result-key-badge">(a=${a}, b=${b})</span></div><div class="result-text">${escapeHtml(cand)}</div><div class="result-actions"><button class="useCandidateBtn" data-a="${a}" data-b="${b}" data-mode="${mode}">Kullan</button><button class="copyCandidateBtn" data-text="${encodeURIComponent(cand)}">Kopyala</button></div></div>`;
            }
        }
        candidatesDiv.innerHTML = candidatesHTML;
    
        document.querySelectorAll('.useCandidateBtn').forEach(b => {
            b.addEventListener('click', () => {
                applyCandidateToDecryptTab(cipher, parseInt(b.dataset.a), parseInt(b.dataset.b), b.dataset.mode);
            });
        });
    
        document.querySelectorAll('.copyCandidateBtn').forEach(b => {
            b.addEventListener('click', (e) => {
                const text = decodeURIComponent(b.dataset.text);
                copyToClipboard(text);
                e.target.textContent = 'Kopyalandı';
                setTimeout(() => e.target.textContent = 'Kopyala', 1200);
            });
        });
    });


    function applyCandidateToDecryptTab(cipherText, keyA, keyB, mode) {
        const keyAInput = document.getElementById('keyA_decrypt');
        const keyBInput = document.getElementById('keyB_decrypt');
        
        if (decryptSelect) decryptSelect.value = mode;
        document.getElementById('cipherInput').value = cipherText;
        if (keyAInput) keyAInput.value = keyA;
        if (keyBInput) keyBInput.value = keyB;
        
        validateKeyA(keyAInput, decryptSelect, document.getElementById('keyA_decrypt_error'));
        
        switchToTab('decrypt');
    
        const plain = processText(cipherText, keyA, keyB, alfabetler[mode], 'decrypt');
        document.getElementById('plainOutput').value = plain;
    }
});

