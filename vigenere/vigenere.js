document.addEventListener('DOMContentLoaded', () => {

    let lastAnalysisResult = null;

    const alfabetler = {
        tr: ['a','b','c','ç','d','e','f','g','ğ','h','ı','i','j','k','l','m','n','o','ö','p','r','s','ş','t','u','ü','v','y','z'],
        en: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    };

    const freqReference = {
        tr: ['a','e','i','n','r','t','l','k','m','o','u','s','y','d','b','g','ç','ü','ö','ş','v','h','p','z','c','f','j','ğ','ı'],
        en: ['e','t','a','o','i','n','s','r','h','l','d','c','u','m','f','y','w','g','p','b','v','k','x','q','j','z']
    };

    function normalizeKey(k, len) {
        k = parseInt(k) || 0;
        return ((k % len) + len) % len;
    }

    function shiftChar(ch, key, alfabe, mode = 'encrypt') {
        if (!ch) return ch;
        const lower = ch.toLocaleLowerCase('tr-TR');
        const idx = alfabe.indexOf(lower);
        if (idx === -1) return ''; // Sadece harfleri işle, diğerlerini atla
        const isUpperCase = ch !== lower;
        const len = alfabe.length;
        const newIndex = mode === 'encrypt'
            ? (idx + key) % len
            : (idx - key + len) % len;
        const out = alfabe[newIndex];
        return isUpperCase ? out.toLocaleUpperCase('tr-TR') : out;
    }

    function processText(text, key, alfabe, mode='encrypt') {
        const k = normalizeKey(key, alfabe.length);
        return Array.from(text).map(ch => shiftChar(ch, k, alfabe, mode)).join('');
    }

    function letterFrequencies(text, alfabe) {
        const freqs = {};
        for (let ch of alfabe) freqs[ch] = 0;
        let total = 0;
        for (let ch of text) {
            const lower = ch.toLocaleLowerCase('tr-TR');
            if (alfabe.includes(lower)) {
                freqs[lower]++;
                total++;
            }
        }
        return {freqs, total};
    }

    function sortedFreqList(freqs) {
        return Object.entries(freqs)
                     .map(([ch,c]) => ({ch,count:c}))
                     .sort((a,b) => b.count - a.count);
    }

    function escapeHtml(str) {
        if (str === undefined || str === null) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {}, () => {
             const ta = document.createElement('textarea');
             ta.value = text; document.body.appendChild(ta);
             ta.select(); document.execCommand('copy');
             document.body.removeChild(ta);
        });
    }

    function addToHistory(type, input, output, key, alfabe) {
        const listId = type === 'encrypt' ? 'encryptHistoryList' : 'decryptHistoryList';
        const list = document.getElementById(listId);
        if (!list) return;
        const li = document.createElement('li');
        li.innerHTML = `<strong>k=${key}, alfabe=${alfabe}</strong> — Input: ${escapeHtml(input)} | Output: ${escapeHtml(output)}`;
        list.prepend(li);
        if (list.children.length > 10) list.removeChild(list.lastChild);
    }

    const encryptSelect = document.getElementById('alphabetEncrypt');
    const decryptSelect = document.getElementById('alphabetDecrypt');
    const keylengthSelect = document.getElementById('alphabetKeylength');

    const setupSelect = (selectElement, storageKey) => {
        if (selectElement) {
            const saved = localStorage.getItem(storageKey);
            if (saved) selectElement.value = saved;
            selectElement.addEventListener('change', e => localStorage.setItem(storageKey, e.target.value));
        }
    };
    setupSelect(encryptSelect, 'alphabetVigenere');
    setupSelect(decryptSelect, 'alphabetVigenere');
    setupSelect(keylengthSelect, 'alphabetVigenere');

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

    function validateKeyword(keyword_element, error_element, alfabe) {
        const keyword = keyword_element.value.toLocaleLowerCase('tr-TR');
        let isValid = true;
        if (!keyword) {
            isValid = false;
        } else {
            for (let char of keyword) {
                if (alfabe.indexOf(char) === -1) {
                    isValid = false;
                    break;
                }
            }
        }
        if (!isValid) {
            error_element.textContent = 'Anahtar kelime boş olamaz ve sadece seçili alfabedeki harflerden oluşmalıdır.';
            error_element.classList.add('visible');
            keyword_element.classList.add('invalid');
            return false;
        } else {
            error_element.classList.remove('visible');
            keyword_element.classList.remove('invalid');
            return true;
        }
    }

    function processVigenere(text, keyword, alfabe, mode = 'encrypt') {
        const M = alfabe.length;
        let result = '';
        let keywordIndex = 0;
        for (let i = 0; i < text.length; i++) {
            const textCharLower = text[i].toLocaleLowerCase('tr-TR');
            const textCharIndex = alfabe.indexOf(textCharLower);
            if (textCharIndex === -1) continue;
            const keywordCharLower = keyword[keywordIndex % keyword.length].toLocaleLowerCase('tr-TR');
            const keywordCharIndex = alfabe.indexOf(keywordCharLower);
            let newIndex;
            if (mode === 'encrypt') {
                newIndex = (textCharIndex + keywordCharIndex) % M;
            } else {
                newIndex = (textCharIndex - keywordCharIndex + M) % M;
            }
            result += alfabe[newIndex];
            keywordIndex++;
        }
        return result;
    }

    function findKeyLengthByCoincidence(text, maxKeyLength, alfabe) {
        text = text.toLocaleLowerCase('tr-TR');
        const cleanedText = Array.from(text).filter(char => alfabe.includes(char)).join('');
        if (cleanedText.length < 2) {
            return { scores: ["Metin çok kısa."], probableLength: 'Hesaplanamadı' };
        }
        const coincidenceScores = [];
        let maxScore = -1;
        let probableLength = 1;
        for (let shift = 1; shift <= maxKeyLength; shift++) {
            let coincidences = 0;
            for (let i = 0; i < cleanedText.length - shift; i++) {
                if (cleanedText[i] === cleanedText[i + shift]) {
                    coincidences++;
                }
            }
            coincidenceScores.push({ length: shift, score: coincidences });
            if (coincidences > maxScore) {
                maxScore = coincidences;
                probableLength = shift;
            }
        }
        const scoresText = coincidenceScores
            .sort((a, b) => b.score - a.score)
            .map((item, index) => `${index + 1}. Anahtar Uzunluğu: ${item.length} → Çakışma Sayısı: ${item.score}`)
            .join('\n');
        return { scores: scoresText, probableLength: probableLength };
    }

    const keywordEncrypt = document.getElementById('keywordEncrypt');
    const keywordDecrypt = document.getElementById('keywordDecrypt');
    const errorEncrypt = document.getElementById('keywordEncryptError');
    const errorDecrypt = document.getElementById('keywordDecryptError');

    [keywordEncrypt, encryptSelect].forEach(el => el.addEventListener('input', () => validateKeyword(keywordEncrypt, errorEncrypt, alfabetler[encryptSelect.value])));
    [keywordDecrypt, decryptSelect].forEach(el => el.addEventListener('input', () => validateKeyword(keywordDecrypt, errorDecrypt, alfabetler[decryptSelect.value])));

    document.getElementById('btnEncrypt').addEventListener('click', () => {
        const mode = encryptSelect.value;
        const alfabe = alfabetler[mode];
        if (!validateKeyword(keywordEncrypt, errorEncrypt, alfabe)) return;
        const plain = document.getElementById('plainInputEncrypt').value;
        const keyword = keywordEncrypt.value;
        if (!plain) { alert('Lütfen düz metin giriniz.'); return; }
        const cipher = processVigenere(plain, keyword, alfabe, 'encrypt');
        document.getElementById('cipherOutputEncrypt').value = cipher;
    });

    document.getElementById('btnDecrypt').addEventListener('click', () => {
        const mode = decryptSelect.value;
        const alfabe = alfabetler[mode];
        if (!validateKeyword(keywordDecrypt, errorDecrypt, alfabe)) return;
        const cipher = document.getElementById('cipherInputDecrypt').value;
        const keyword = keywordDecrypt.value;
        if (!cipher) { alert('Lütfen şifreli metin giriniz.'); return; }
        const plain = processVigenere(cipher, keyword, alfabe, 'decrypt');
        document.getElementById('plainOutputDecrypt').value = plain;
    });

    document.getElementById('btnFindKeyLength').addEventListener('click', () => {
        const cipher = document.getElementById('keylengthInput').value;
        const maxKeyLen = parseInt(document.getElementById('maxKeyLength').value);
        const mode = keylengthSelect.value;
        const alfabe = alfabetler[mode];
        if (!cipher) { alert('Lütfen şifreli metin giriniz.'); return; }
        if (!maxKeyLen || maxKeyLen < 2) { alert('Lütfen geçerli bir maksimum anahtar uzunluğu giriniz (en az 2).'); return; }
        const results = findKeyLengthByCoincidence(cipher, maxKeyLen, alfabe);
        document.getElementById('keylengthResults').textContent = "Çakışma Sayısı Skorları:\n------------------------\n" + results.scores;
        document.getElementById('probableKeyLength').textContent = results.probableLength;
    });

});