/**
 * generate an AES-GCM key
 */
async function generate_key() {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * encrypt data with AES-GCM
 * @param {*} data
 * @param {*} key
 */
async function encrypt(data, key) {
  let iv = crypto.getRandomValues(new Uint8Array(12));
  let alg = { name: "AES-GCM", iv: iv };

  let ciphertext = await crypto.subtle.encrypt(alg, key, data);

  return {
    iv,
    ciphertext
  };
}

/**
 * decrypt data with AES-GCM
 * @param {*} iv
 * @param {*} key
 * @param {*} data
 */
async function decrypt(iv, key, data) {
  let alg = { name: "AES-GCM", iv: iv };
  return await crypto.subtle.decrypt(alg, key, data);
}

export { encrypt, decrypt, generate_key };
