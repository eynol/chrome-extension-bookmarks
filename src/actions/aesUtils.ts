
/*
Get the encoded message, encrypt it and display a representation
of the ciphertext in the "Ciphertext" element.
*/
export async function encryptMessage(message: string) {
    const key = await getKey();
    let enc = new TextEncoder();
    let encoded = enc.encode(message);
    // The iv must never be reused with a given key.
    let iv = window.crypto.getRandomValues(new Uint8Array(16));
    let ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-CBC",
            iv: iv.buffer
        },
        key,
        encoded
    );
    let exportedKey = await window.crypto.subtle.exportKey("raw", key);

    console.log({
        exportedKey,
        // keyStr: key.toString(),
        iv, ciphertext,
        // ivE: arrayBufferToBase64(iv),
        // cyperE: arrayBufferToBase64(ciphertext)
    })

    let dataEncrypt = [
        // iv.buffer.byteLength + 100,
        // exportedKey.byteLength + 101,
        ...Array.from(iv),
        ...Array.from(new Uint8Array(exportedKey)),
        ...Array.from(new Uint8Array(ciphertext)),
    ]

    console.log(
        { dataEncrypt }
    )


    return arrayBufferToBase64(new Uint8Array(dataEncrypt).buffer);
}
/*
Fetch the ciphertext and decrypt it.
Write the decrypted message into the "Decrypted" box.
*/
export async function decryptMessage(message: string) {
    const messageArrayBuffer = base64ToArrayBuffer(message);

    const iv = messageArrayBuffer.slice(0, 16);
    const keyBase64 = messageArrayBuffer.slice(16, 16 + 32);

    const ciphertext = messageArrayBuffer.slice(16 + 32);
    const key: CryptoKey = await window.crypto.subtle.importKey('raw',
        keyBase64,
        'AES-CBC',
        true,
        ['encrypt', 'decrypt']
    );
    let decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-CBC",
            iv
        },
        key,
        ciphertext
    );

    let dec = new TextDecoder();
    return dec.decode(decrypted);
}

/*
Generate an encryption key, then set up event listeners
on the "Encrypt" and "Decrypt" buttons.
*/
const getKey = async () => await window.crypto.subtle.generateKey(
    {
        name: "AES-CBC",
        length: 256
    },
    true,
    ["encrypt", "decrypt"]
);


function arrayBufferToBase64(buffer: ArrayBuffer) {
    return window.btoa(String.fromCharCode.apply(null, new Uint8Array(buffer) as unknown as number[]));;
}



function base64ToArrayBuffer(base64: string) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}