/**
 * PERMUTASYON WEB WORKER
 * Bu script, ana thread'i kilitlememek için arka planda çalışır.
 */

// --- ÇEKİRDEK FONKSİYONLAR ---

function parseKey(key) {
    return key.split('').map(digit => parseInt(digit) - 1);
}

function createInverseKey(keyArray) {
    const len = keyArray.length;
    const inverse = new Array(len);
    for (let i = 0; i < len; i++) {
        inverse[keyArray[i]] = i;
    }
    return inverse;
}

function imageDataToBinary(imageData) {
    const data = imageData.data;
    const binaryArray = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
        binaryArray[i] = data[i].toString(2).padStart(8, '0');
    }
    return binaryArray.join('');
}

function permute(binaryString, key, mode = 'encrypt') {
    const keyArray = parseKey(key);
    const blockSize = keyArray.length;
    const permKey = (mode === 'encrypt') ? keyArray : createInverseKey(keyArray);
    
    let remainder = binaryString.length % blockSize;
    if (remainder !== 0) {
        binaryString += '0'.repeat(blockSize - remainder);
    }

    const chunkCount = binaryString.length / blockSize;
    const resultArray = new Array(chunkCount);

    for (let i = 0; i < chunkCount; i++) {
        const chunkIndex = i * blockSize;
        const chunk = binaryString.substring(chunkIndex, chunkIndex + blockSize);
        const newChunk = new Array(blockSize);
        for (let j = 0; j < blockSize; j++) {
            newChunk[j] = chunk[permKey[j]];
        }
        resultArray[i] = newChunk.join('');
    }
    return resultArray.join('');
}

/**
 * YENİ FONKSİYON: binaryToDataArray
 * Binary string'i ImageData değil, ham Uint8ClampedArray verisine dönüştürür.
 */
function binaryToDataArray(binaryString, width, height) {
    const totalBytes = width * height * 4;
    const data = new Uint8ClampedArray(totalBytes);
    let dataIndex = 0;

    for (let i = 0; i < binaryString.length; i += 8) {
        if (dataIndex >= totalBytes) break; 
        const byte = binaryString.substring(i, i + 8);
        data[dataIndex] = parseInt(byte, 2);
        dataIndex++;
    }
    return data; // Ham veriyi döndür
}


// --- WORKER MESAJ DİNLEYİCİSİ ---

self.onmessage = function(e) {
    const { imageData, key, mode } = e.data; // imageData burada { width, height, data } objesi

    try {
        self.postMessage({ status: 'processing' });

        // 1. Resmi Binary'ye Çevir
        const binaryString = imageDataToBinary(imageData);
        self.postMessage({ status: 'processing', message: 'Resim binary veriye çevrildi...' });

        // 2. Binary'yi Permüte Et
        const processedBinary = permute(binaryString, key, mode);
        self.postMessage({ status: 'processing', message: 'Permütasyon (şifreleme) tamamlandı...' });

        // 3. Binary'yi Ham Veri Dizisine Çevir (DİKKAT: binaryToDataArray kullan)
        const newDataArray = binaryToDataArray(processedBinary, imageData.width, imageData.height);
        self.postMessage({ status: 'processing', message: 'Yeni resim verisi oluşturuluyor...' });

        // 4. SONUCU (ham veri, en, boy) ana thread'e gönder
        self.postMessage({ 
            status: 'complete', 
            newDataArray: newDataArray, // Değişti
            width: imageData.width,
            height: imageData.height
        });

    } catch (error) {
        // Hata olursa, hatayı ana thread'e postala
        self.postMessage({ status: 'error', message: error.message });
    }
};