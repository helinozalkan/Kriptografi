
document.addEventListener('DOMContentLoaded', () => {

  let lastAnalysisResult = null;

  const alfabetler = {
    tr: ['a','b','c','ç','d','e','f','g','ğ','h','ı','i',
         'j','k','l','m','n','o','ö','p','r','s','ş','t',
         'u','ü','v','y','z'],
    en: ['a','b','c','d','e','f','g','h','i','j','k','l',
         'm','n','o','p','q','r','s','t','u','v','w','x',
         'y','z']
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
    if (!ch) {
      return ch;
    }
    
    const lower = ch.toLocaleLowerCase('tr-TR');
    const idx = alfabe.indexOf(lower);
    if (idx === -1) {
      return ch;
    }
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
    try {
      navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
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

  if(encryptSelect){
    const saved = localStorage.getItem('alphabetEncrypt');
    if(saved) encryptSelect.value = saved;
    encryptSelect.addEventListener('change', e => localStorage.setItem('alphabetEncrypt', e.target.value));
  }

  if(decryptSelect){
    const saved = localStorage.getItem('alphabetDecrypt');
    if(saved) decryptSelect.value = saved;
    decryptSelect.addEventListener('change', e => localStorage.setItem('alphabetDecrypt', e.target.value));
  }


  const modeToggle = document.getElementById('modeToggle');
  if(modeToggle){
    const savedMode = localStorage.getItem('mode') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if(savedMode === 'dark') document.body.classList.add('dark');
    modeToggle.textContent = savedMode === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

    modeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('mode', isDark ? 'dark' : 'light');
      modeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
  }

 
  const btnEncrypt = document.getElementById('btnEncrypt');
  if (btnEncrypt) btnEncrypt.addEventListener('click', () => {
    const plain = document.getElementById('plainInput').value;
    const key = parseInt(document.getElementById('keyEncrypt').value) || 0;
    const mode = encryptSelect ? encryptSelect.value : 'tr';
    const alfabe = alfabetler[mode];
    if(!plain){ alert('Lütfen düz metin giriniz.'); return; }
    const cipher = processText(plain, key, alfabe, 'encrypt');
    const cipherOutput = document.getElementById('cipherOutput');
    if (cipherOutput) cipherOutput.value = cipher;
    if(decryptSelect) decryptSelect.value = mode;
    addToHistory('encrypt', plain, cipher, key, mode);
  });

 
  const btnDecrypt = document.getElementById('btnDecrypt');
  if (btnDecrypt) btnDecrypt.addEventListener('click', () => {
    const cipher = document.getElementById('cipherInput').value;
    const key = parseInt(document.getElementById('keyDecrypt').value) || 0;
    const mode = decryptSelect ? decryptSelect.value : 'tr';
    const alfabe = alfabetler[mode];
    if(!cipher){ alert('Lütfen şifreli metin giriniz.'); return; }
    const plain = processText(cipher, key, alfabe, 'decrypt');
    const plainOutput = document.getElementById('plainOutput');
    if (plainOutput) plainOutput.value = plain;
    if(encryptSelect) encryptSelect.value = mode;
    addToHistory('decrypt', cipher, plain, key, mode);
  });


  const btnCrack = document.getElementById('btnCrack');
  if (btnCrack) btnCrack.addEventListener('click', () => {

    const cipher = document.getElementById('crackInput').value;
    if(!cipher){ alert('Lütfen kırılacak şifreli metni giriniz.'); return; }
    const mode = decryptSelect?.value || encryptSelect?.value || 'tr';
    const alfabe = alfabetler[mode];

    const {freqs, total} = letterFrequencies(cipher, alfabe);
    const sorted = sortedFreqList(freqs);

    const freqListDiv = document.getElementById('freqList');
    if (freqListDiv) {
      freqListDiv.innerHTML = `<strong>Harf Frekansları (toplam harf: ${total})</strong>: ` + sorted.slice(0, 5).map(x => ` '${x.ch}': ${x.count}`).join(',');
    }

    const candidatesDiv = document.getElementById('crackCandidates');
    if (candidatesDiv) candidatesDiv.innerHTML = ''; 

    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'crack-results-container';
    suggestionsContainer.innerHTML = '<h3>Frekans Tabanlı Öneriler</h3>';

    const top = sorted.slice(0, 8);
    const cipherTopChars = top.map(x=>x.ch).filter(Boolean);
    const refOrder = freqReference[mode]||freqReference['tr'];
    const suggestedList=[];

    for(let i=0;i<Math.min(cipherTopChars.length,4);i++){
        for(let j=0;j<Math.min(refOrder.length,6);j++){
            const c=cipherTopChars[i], p=refOrder[j];
            const idxC=alfabe.indexOf(c), idxP=alfabe.indexOf(p);
            if(idxC===-1 || idxP===-1) continue;
            const keyGuess = ((idxC-idxP)%alfabe.length + alfabe.length)%alfabe.length;
            const dec = processText(cipher,keyGuess,alfabe,'decrypt');
            suggestedList.push({key:keyGuess,map:`'${c}'→'${p}'`,dec});
        }
    }

    const uniq=[], seen=new Set();
    for(const s of suggestedList){ if(!seen.has(s.key)){ uniq.push(s); seen.add(s.key); } }

    if(uniq.length > 0) {
        uniq.slice(0, 10).forEach(s => {
            const card = document.createElement('div');
            card.className = 'crack-result-card is-suggestion'; 
            card.innerHTML = `
                <div class="card-header">
                    <span class="result-key-badge">k = ${s.key}</span>
                    <span class="suggestion-map">Eşleme: ${s.map}</span>
                </div>
                <div class="result-text">${escapeHtml(s.dec)}</div>
                <div class="result-actions">
                    <button class="useCandidateBtn" data-k="${s.key}" data-mode="${mode}">Kullan</button>
                    <button class="copyCandidateBtn" data-text="${encodeURIComponent(s.dec)}">Kopyala</button>
                </div>
            `;
            suggestionsContainer.appendChild(card);
        });
    } else {
        suggestionsContainer.innerHTML += '<p>(Öneri bulunamadı)</p>';
    }
    if (candidatesDiv) candidatesDiv.appendChild(suggestionsContainer);

    
    const bruteForceToggle = document.createElement('button');
    bruteForceToggle.className = 'collapsible-toggle';
    bruteForceToggle.textContent = `Tüm ${alfabe.length} Olasılığı Göster (Brute-force)`;
    if (candidatesDiv) candidatesDiv.appendChild(bruteForceToggle);

    const bruteForceContainer = document.createElement('div');
    bruteForceContainer.className = 'collapsible-content';

    const bruteForceList = [];
    for(let k=0; k<alfabe.length; k++){
        const cand = processText(cipher, k, alfabe, 'decrypt');
        bruteForceList.push({key:k, dec:cand});
        const card = document.createElement('div');
        card.className = 'crack-result-card'; 
        card.innerHTML = `
            <div class="card-header">
                <span class="result-key-badge">k = ${k}</span>
            </div>
            <div class="result-text">${escapeHtml(cand)}</div>
            <div class="result-actions">
                <button class="useCandidateBtn" data-k="${k}" data-mode="${mode}">Kullan</button>
                <button class="copyCandidateBtn" data-text="${encodeURIComponent(cand)}">Kopyala</button>
            </div>
        `;
        bruteForceContainer.appendChild(card);
    }
    if (candidatesDiv) candidatesDiv.appendChild(bruteForceContainer);

   
    bruteForceToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });

   
    document.querySelectorAll('.useCandidateBtn').forEach(b=>b.addEventListener('click',()=>applyCandidateToDecryptTab(cipher,parseInt(b.dataset.k),b.dataset.mode)));
    document.querySelectorAll('.copyCandidateBtn').forEach(b=>b.addEventListener('click',()=>{ const text=decodeURIComponent(b.dataset.text); copyToClipboard(text); b.textContent='Kopyalandı'; setTimeout(()=>b.textContent='Kopyala',1200); }));

    

    let bestSuggestion = { key: '?', dec: '(Anlamlı bir öneri bulunamadı)', score: -1 };

    if (uniq.length > 0) {
        uniq.forEach(suggestion => {
            const score = (suggestion.dec.match(/[aeinr]/g) || []).length;
            if (score > bestSuggestion.score) {
                bestSuggestion = { ...suggestion, score: score };
            }
        });
    }

    
    lastAnalysisResult = {
        date: new Date(),
        method: "Sezar Şifresi için Frekans Analizi (Türkçe/İngilizce destekli)",
        ciphertext: cipher,
        totalChars: cipher.length,
        letterChars: total,
        freqs: sorted, 
        suggestions: uniq, 
        bruteForce: bruteForceList, 
        bestKey: bestSuggestion.key,
        solution: bestSuggestion.dec
    };

   
    const oldReportBtn = document.getElementById('generateReportBtn');
    if (oldReportBtn) oldReportBtn.remove();

    const reportButton = document.createElement('button');
    reportButton.id = 'generateReportBtn';
    reportButton.textContent = 'Detaylı Analiz Raporu Oluştur';
    reportButton.onclick = generateReport;
    if (candidatesDiv) candidatesDiv.appendChild(reportButton);
  });

  function applyCandidateToDecryptTab(cipherText,key,mode){
    if(decryptSelect) decryptSelect.value = mode;
    const cipherInput = document.getElementById('cipherInput');
    const keyInput = document.getElementById('keyDecrypt');
    const plainOutput = document.getElementById('plainOutput');
    if(cipherInput) cipherInput.value = cipherText;
    if(keyInput) keyInput.value = key;
    switchToTab('decrypt');
    const alfabe = alfabetler[mode];
    if(plainOutput) plainOutput.value = processText(cipherText,key,alfabe,'decrypt');
  }

  function generateReport() {
    if (!lastAnalysisResult) {
        alert('Önce bir analiz yapmalısınız.');
        return;
    }

    const reportDateEl = document.getElementById('reportDate');
    const reportMethodEl = document.getElementById('reportMethod');
    const reportCiphertextEl = document.getElementById('reportCiphertext');
    const reportTotalCharsEl = document.getElementById('reportTotalChars');
    const reportLetterCharsEl = document.getElementById('reportLetterChars');
    const reportKeyEl = document.getElementById('reportKey');
    const reportSolutionEl = document.getElementById('reportSolution');
    const freqTableDiv = document.getElementById('reportFreqTable');
    const reportSuggestionsDiv = document.getElementById('reportSuggestions');
    const reportBruteDiv = document.getElementById('reportBruteForce');

    if (reportDateEl) reportDateEl.textContent = lastAnalysisResult.date.toLocaleString('tr-TR');
    if (reportMethodEl) reportMethodEl.textContent = lastAnalysisResult.method;
    if (reportCiphertextEl) reportCiphertextEl.value = lastAnalysisResult.ciphertext;
    if (reportTotalCharsEl) reportTotalCharsEl.textContent = lastAnalysisResult.totalChars;
    if (reportLetterCharsEl) reportLetterCharsEl.textContent = lastAnalysisResult.letterChars;
    if (reportKeyEl) reportKeyEl.textContent = lastAnalysisResult.bestKey;
    if (reportSolutionEl) reportSolutionEl.value = lastAnalysisResult.solution;

    
    if (freqTableDiv) {
        freqTableDiv.innerHTML = '';
        const denom = lastAnalysisResult.letterChars || 1;
        lastAnalysisResult.freqs.forEach(item => {
            if (item.count > 0) {
                const percentage = ((item.count / denom) * 100).toFixed(2);
                freqTableDiv.innerHTML += `<div class="freq-item">'${escapeHtml(item.ch)}': ${item.count} (%${percentage})</div>`;
            }
        });
        if (freqTableDiv.innerHTML === '') freqTableDiv.innerHTML = '<div>(Harf bulunamadı)</div>';
    }

    
    if (reportSuggestionsDiv) {
        reportSuggestionsDiv.innerHTML = '';
        const suggestions = lastAnalysisResult.suggestions || [];
        if (suggestions.length === 0) {
            reportSuggestionsDiv.innerHTML = '<div>(Öneri bulunamadı)</div>';
        } else {
            suggestions.forEach(s => {
                const node = document.createElement('div');
                node.className = 'report-suggestion';
                node.innerHTML = `<strong>k=${s.key}</strong> — Eşleme: ${escapeHtml(s.map)} — <div class="suggest-dec">${escapeHtml(s.dec)}</div>`;
                reportSuggestionsDiv.appendChild(node);
            });
        }
    }

 
    if (reportBruteDiv) {
        reportBruteDiv.innerHTML = '';
        const brute = lastAnalysisResult.bruteForce || [];
        brute.forEach(b => {
            const node = document.createElement('div');
            node.className = 'report-brute';
            node.innerHTML = `<strong>k=${b.key}</strong> — <div class="brute-dec">${escapeHtml(b.dec)}</div>`;
            reportBruteDiv.appendChild(node);
        });
    }

   
    const reportModal = document.getElementById('reportModal');
    if (reportModal) reportModal.classList.remove('hidden');
  }


  const reportModalGlobal = document.getElementById('reportModal');
  if (reportModalGlobal) {
    reportModalGlobal.addEventListener('click', (e) => {
     
      if (e.target === reportModalGlobal) {
        reportModalGlobal.classList.add('hidden');
      }
    });
  }

  const closeReportBtn = document.getElementById('closeReportBtn');
  if (closeReportBtn) closeReportBtn.addEventListener('click', () => {
    const m = document.getElementById('reportModal');
    if (m) m.classList.add('hidden');
  });

  const printReportBtn = document.getElementById('printReportBtn');
  if (printReportBtn) printReportBtn.addEventListener('click', () => {
    window.print();
  });

  function switchToTab(tabId){
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tabId));
    document.querySelectorAll('.tab').forEach(s=>s.id===tabId ? s.classList.add('active') : s.classList.remove('active'));
  }

  
  document.querySelectorAll('.tabs button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const target=btn.dataset.tab;
      switchToTab(target);
    });
  });

});
