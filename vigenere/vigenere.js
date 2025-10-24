document.addEventListener('DOMContentLoaded', () => {

    // === Dark/Light Mode ===
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

    // === Sekme Yönetimi ===
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

    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }


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

            
            if (textCharIndex === -1) {
                
                continue; 
            }

   
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


    function findRepeatedSequences(text, minLength = 3) {
        const sequences = {};
        for (let len = minLength; len <= Math.floor(text.length / 2); len++) {
            for (let i = 0; i <= text.length - len; i++) {
                const sequence = text.substring(i, i + len);
                if (sequences[sequence]) {
                    sequences[sequence].push(i);
                } else {
                    sequences[sequence] = [i];
                }
            }
        }
    
        const repeated = {};
        for (const seq in sequences) {
            if (sequences[seq].length > 1) {
                repeated[seq] = sequences[seq];
            }
        }
        return repeated;
    }

   
    function getDistances(positions) {
        const distances = [];
        for (let i = 0; i < positions.length - 1; i++) {
            distances.push(positions[i + 1] - positions[i]);
        }
        return distances;
    }

    
    function getFactors(num) {
        const factors = new Set();
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) {
                factors.add(i);
                factors.add(num / i);
            }
        }
        factors.add(num); 
        return Array.from(factors).sort((a, b) => a - b);
    }

   
    function kasiskiExamination(text, maxKeyLength) {
        text = text.toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü]/g, ''); 
        const repeatedSequences = findRepeatedSequences(text);
        const allDistances = [];
        let resultsText = "Tekrarlayan Diziler ve Mesafeler:\n";
        resultsText += "---------------------------------\n";

        for (const seq in repeatedSequences) {
            const positions = repeatedSequences[seq];
            const distances = getDistances(positions);
            resultsText += `"${seq}" bulundu: pozisyonlar ${positions.join(', ')} -> mesafeler ${distances.join(', ')}\n`;
            allDistances.push(...distances);
        }
        resultsText += "\n";

        if (allDistances.length === 0) {
             resultsText += "Yeterli tekrarlayan dizi bulunamadı.\n";
            return { analysis: resultsText, probableLength: 'Bulunamadı' };
        }

        const factorCounts = {};
        resultsText += "Mesafe Bölenleri ve Sayıları:\n";
        resultsText += "---------------------------\n";
        allDistances.forEach(distance => {
            const factors = getFactors(distance);
            resultsText += `Mesafe ${distance} -> Bölenler: ${factors.join(', ')}\n`;
            factors.forEach(factor => {
                if (factor <= maxKeyLength) {
                    factorCounts[factor] = (factorCounts[factor] || 0) + 1;
                }
            });
        });

        let probableLength = 'Bulunamadı';
        let maxCount = 0;
        resultsText += "\nEn Çok Tekrar Eden Bölenler (Muhtemel Anahtar Uzunlukları):\n";
        resultsText += "--------------------------------------------------------\n";
       
        const sortedFactors = Object.entries(factorCounts).sort(([, countA], [, countB]) => countB - countA);

        sortedFactors.forEach(([factor, count]) => {
            resultsText += `Uzunluk ${factor}: ${count} kez\n`;
            if (count > maxCount) {
                maxCount = count;
                probableLength = factor;
            }
        });

        return { analysis: resultsText, probableLength: probableLength };
    }


  
    const encryptSelect = document.getElementById('alphabetEncrypt');
    const decryptSelect = document.getElementById('alphabetDecrypt');
    const keylengthSelect = document.getElementById('alphabetKeylength');

    const keywordEncrypt = document.getElementById('keywordEncrypt');
    const keywordDecrypt = document.getElementById('keywordDecrypt');
    const errorEncrypt = document.getElementById('keywordEncryptError');
    const errorDecrypt = document.getElementById('keywordDecryptError');

  
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
        
        if (!cipher) { alert('Lütfen şifreli metin giriniz.'); return; }
        if (!maxKeyLen || maxKeyLen < 2) { alert('Lütfen geçerli bir maksimum anahtar uzunluğu giriniz (en az 2).'); return; }

        const results = kasiskiExamination(cipher, maxKeyLen);
        
        document.getElementById('keylengthResults').textContent = results.analysis;
        document.getElementById('probableKeyLength').textContent = results.probableLength;
    });

});