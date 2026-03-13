let encryptionKey = null;

async function getEncryptionKey() {
    if (encryptionKey) return encryptionKey;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TodoKeyDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('keys')) {
                db.createObjectStore('keys');
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['keys'], 'readwrite');
            const store = transaction.objectStore('keys');
            const getRequest = store.get('todo-aes-gcm-key');

            getRequest.onsuccess = async () => {
                if (getRequest.result) {
                    encryptionKey = getRequest.result;
                    resolve(encryptionKey);
                } else {
                    try {
                        encryptionKey = await crypto.subtle.generateKey(
                            { name: 'AES-GCM', length: 256 },
                            false,
                            ['encrypt', 'decrypt']
                        );
                        store.put(encryptionKey, 'todo-aes-gcm-key');
                        resolve(encryptionKey);
                    } catch (e) {
                        reject(e);
                    }
                }
            };
            getRequest.onerror = (e) => reject(e);
        };
        request.onerror = (e) => reject(e);
    });
}

async function encryptData(data) {
    const key = await getEncryptionKey();
    const enc = new TextEncoder();
    const encoded = enc.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherText = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoded
    );

    const ivArr = Array.from(iv);
    const cipherArr = Array.from(new Uint8Array(cipherText));
    const combined = { iv: ivArr, data: cipherArr };
    return btoa(JSON.stringify(combined));
}

async function decryptData(encryptedBase64) {
    const key = await getEncryptionKey();
    try {
        const combinedStr = atob(encryptedBase64);
        const combined = JSON.parse(combinedStr);
        const iv = new Uint8Array(combined.iv);
        const cipherText = new Uint8Array(combined.data);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            cipherText
        );
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return null; // Signals failure, fallback
    }
}
