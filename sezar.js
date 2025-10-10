
// js/sezar.js

document.addEventListener('DOMContentLoaded', () => {

        let lastAnalysisResult = null;


 

  // === Alfabeler ===

  const alfabetler = {

    tr: ['a','b','c','ç','d','e','f','g','ğ','h','ı','i',

         'j','k','l','m','n','o','ö','p','r','s','ş','t',

         'u','ü','v','y','z'],

    en: ['a','b','c','d','e','f','g','h','i','j','k','l',

         'm','n','o','p','q','r','s','t','u','v','w','x',

         'y','z']

  };

 

  // === Frekans referansı ===

  const freqReference = {

    tr: ['a','e','i','n','r','t','l','k','m','o','u','s','y','d','b','g','ç','ü','ö','ş','v','h','p','z','c','f','j','ğ','ı'],

    en: ['e','t','a','o','i','n','s','r','h','l','d','c','u','m','f','y','w','g','p','b','v','k','x','q','j','z']

  };

 

  // === Yardımcı Fonksiyonlar ===

  function normalizeKey(k, len) {

    k = parseInt(k) || 0;

    return ((k % len) + len) % len;

  }

 

  // Türkçe karakter ('İ', 'ı' vb.) ve hata kontrolleri için

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

    if (!str) return '';

    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

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

 

  // === History Fonksiyonu ===

  function addToHistory(type, input, output, key, alfabe) {

    const listId = type === 'encrypt' ? 'encryptHistoryList' : 'decryptHistoryList';

    const list = document.getElementById(listId);

    if (!list) return;

    const li = document.createElement('li');

    li.innerHTML = `<strong>k=${key}, alfabe=${alfabe}</strong> — Input: ${escapeHtml(input)} | Output: ${escapeHtml(output)}`;

    list.prepend(li);

    if (list.children.length > 10) list.removeChild(list.lastChild);

  }

 

  // === localStorage Alfabe ===

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

 

  // === Dark/Light Mode ===

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

 

  // === Şifreleme ===

  document.getElementById('btnEncrypt').addEventListener('click', () => {

    const plain = document.getElementById('plainInput').value;

    const key = parseInt(document.getElementById('keyEncrypt').value) || 0;

    const mode = encryptSelect.value;

    const alfabe = alfabetler[mode];

    if(!plain){ alert('Lütfen düz metin giriniz.'); return; }

    const cipher = processText(plain, key, alfabe, 'encrypt');

    document.getElementById('cipherOutput').value = cipher;

    if(decryptSelect) decryptSelect.value = mode;

    addToHistory('encrypt', plain, cipher, key, mode);

  });

 

  // === De-Şifreleme ===

  document.getElementById('btnDecrypt').addEventListener('click', () => {

    const cipher = document.getElementById('cipherInput').value;

    const key = parseInt(document.getElementById('keyDecrypt').value) || 0;

    const mode = decryptSelect.value;

    const alfabe = alfabetler[mode];

    if(!cipher){ alert('Lütfen şifreli metin giriniz.'); return; }

    const plain = processText(cipher, key, alfabe, 'decrypt');

    document.getElementById('plainOutput').value = plain;

    if(encryptSelect) encryptSelect.value = mode;

    addToHistory('decrypt', cipher, plain, key, mode);

  });

 

  // === Şifre Kırma ===

 // === Şifre Kırma ===
document.getElementById('btnCrack').addEventListener('click', () => {

    const cipher = document.getElementById('crackInput').value;
    if(!cipher){ alert('Lütfen kırılacak şifreli metni giriniz.'); return; }
    const mode = decryptSelect?.value || encryptSelect?.value || 'tr';
    const alfabe = alfabetler[mode];

    const {freqs, total} = letterFrequencies(cipher, alfabe);
    const sorted = sortedFreqList(freqs);
    
    const freqListDiv = document.getElementById('freqList');
    freqListDiv.innerHTML = `<strong>Harf Frekansları (toplam harf: ${total})</strong>: ` + sorted.slice(0, 5).map(x => ` '${x.ch}': ${x.count}`).join(',');

    const candidatesDiv = document.getElementById('crackCandidates');
    candidatesDiv.innerHTML = ''; // Önceki sonuçları tamamen temizle

    // --- FREKANS TABANLI ÖNERİLER (Önce gösterilecek) ---
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
            card.className = 'crack-result-card is-suggestion'; // Vurgulu kart
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
    candidatesDiv.appendChild(suggestionsContainer);

    // --- BRUTE-FORCE BÖLÜMÜ (Daraltılabilir) ---
    const bruteForceToggle = document.createElement('button');
    bruteForceToggle.className = 'collapsible-toggle';
    bruteForceToggle.textContent = 'Tüm 29 Olasılığı Göster (Brute-force)';
    candidatesDiv.appendChild(bruteForceToggle);

    const bruteForceContainer = document.createElement('div');
    bruteForceContainer.className = 'collapsible-content';
    
    for(let k=0; k<alfabe.length; k++){
        const cand = processText(cipher, k, alfabe, 'decrypt');
        const card = document.createElement('div');
        card.className = 'crack-result-card'; // Standart kart
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
    candidatesDiv.appendChild(bruteForceContainer);

    // Daraltma/genişletme işlevselliği
    bruteForceToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });

    

    // Butonların olay dinleyicilerini yeniden ata
    document.querySelectorAll('.useCandidateBtn').forEach(b=>b.addEventListener('click',()=>applyCandidateToDecryptTab(cipher,parseInt(b.dataset.k),b.dataset.mode)));
    document.querySelectorAll('.copyCandidateBtn').forEach(b=>b.addEventListener('click',()=>{ const text=decodeURIComponent(b.dataset.text); copyToClipboard(text); b.textContent='Kopyalandı'; setTimeout(()=>b.textContent='Kopyala',1200); }));
    
    // --- RAPOR OLUŞTURMA BUTONU ---
// --- RAPOR OLUŞTURMA BUTONU (Geliştirilmiş Puanlama ile) ---
let bestSuggestion = { key: '?', dec: '(Anlamlı bir öneri bulunamadı)', score: -1 };

if (uniq.length > 0) {
    // Puanlama sistemi: Her bir önerinin ne kadar "Türkçe'ye benzediğini" hesapla.
    // Türkçe'nin en sık harflerini (a, e, i, n, r) sayarak basit bir puan veriyoruz.
    uniq.forEach(suggestion => {
        const score = (suggestion.dec.match(/[aeinr]/g) || []).length;
        if (score > bestSuggestion.score) {
            bestSuggestion = { ...suggestion, score: score };
        }
    });
}

lastAnalysisResult = { date: new Date(), method: "Sezar Şifresi için Frekans Analizi (Türkçe Dil Modeli)", ciphertext: cipher, totalChars: cipher.length, letterChars: total, freqs: sorted, bestKey: bestSuggestion.key, solution: bestSuggestion.dec };

const oldReportBtn = document.getElementById('generateReportBtn');
if (oldReportBtn) oldReportBtn.remove();

const reportButton = document.createElement('button');
reportButton.id = 'generateReportBtn';
reportButton.textContent = 'Detaylı Analiz Raporu Oluştur';
reportButton.onclick = generateReport;
candidatesDiv.appendChild(reportButton);
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

    // Modal'daki alanları doldur
    document.getElementById('reportDate').textContent = lastAnalysisResult.date.toLocaleString('tr-TR');
    document.getElementById('reportMethod').textContent = lastAnalysisResult.method;
    document.getElementById('reportCiphertext').value = lastAnalysisResult.ciphertext;
    document.getElementById('reportTotalChars').textContent = lastAnalysisResult.totalChars;
    document.getElementById('reportLetterChars').textContent = lastAnalysisResult.letterChars;
    document.getElementById('reportKey').textContent = lastAnalysisResult.bestKey;
    document.getElementById('reportSolution').value = lastAnalysisResult.solution;
    
    // Frekans tablosunu oluştur
    const freqTableDiv = document.getElementById('reportFreqTable');
    freqTableDiv.innerHTML = ''; // Önceki tabloyu temizle
    lastAnalysisResult.freqs.forEach(item => {
        if (item.count > 0) {
            const percentage = ((item.count / lastAnalysisResult.letterChars) * 100).toFixed(2);
            freqTableDiv.innerHTML += `<div class="freq-item">'${item.ch}': ${item.count} (%${percentage})</div>`;
        }
    });

    // Modalı görünür yap
    document.getElementById('reportModal').classList.remove('hidden');
}

// Modal penceresinin olay dinleyicileri
const reportModal = document.getElementById('reportModal');
reportModal.addEventListener('click', (e) => {
    // Sadece overlay'e (gri arka plana) tıklanınca kapat
    if (e.target === reportModal) {
        reportModal.classList.add('hidden');
    }
});
document.getElementById('closeReportBtn').addEventListener('click', () => {
    reportModal.classList.add('hidden');
});
document.getElementById('printReportBtn').addEventListener('click', () => {
    window.print();
});



 

  function switchToTab(tabId){

    document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tabId));

    document.querySelectorAll('.tab').forEach(s=>s.id===tabId ? s.classList.add('active') : s.classList.remove('active'));
    

  }
  

 

  // === Sekme Yönetimi ===

  document.querySelectorAll('.tabs button').forEach(btn=>{

    btn.addEventListener('click',()=>{

      const target=btn.dataset.tab;

      switchToTab(target);

    });

  });

  });

 



 

