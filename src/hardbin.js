import { b2ab } from "./util.js";
import bs58 from "bs58";
import { encrypt, decrypt, generate_key } from "./encryption.js";
import { Buffer } from "buffer";

/**
 * encrypt file with optional name
 * @param {*} file
 * @param {*} [name]
 * @returns object with ciphertext and base58 encoded iv+key
 */
async function do_encryption(file, name) {
  let extension = file.type.split("/");
  name = name ? name : file.name ? file.name : `Pasted ${extension[0]}`;

  let key = await generate_key();
  let header = {
    name,
    type: file.type
  };
  let encoded = new Blob([JSON.stringify(header)]);

  let blob = new Blob([new Uint16Array([encoded.size]), encoded, file]);

  let { iv, ciphertext, ...result } = await encrypt(await b2ab(blob), key);

  let key_export = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  let merged = new Uint8Array(iv.length + key_export.length);
  merged.set(iv);
  merged.set(key_export, iv.length);

  return {
    data: ciphertext,
    key: bs58.encode(Buffer.from(merged))
  };
}

/**
 * decrypt data with key
 * @param {*} data - ciphertext to decrypt
 * @param {*} key - base58 encoded iv+key, returned from {@see do_encryption}
 * @returns object with encrypted name, type, and raw data
 */
async function do_decryption(data, key) {
  let merged = bs58.decode(key);
  let iv = merged.slice(0, 12);
  let raw = merged.slice(12);

  key = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  let result = await decrypt(iv, key, data);
  let view = new DataView(result);
  let sz = view.getUint16(0, true);
  let header = new TextDecoder().decode(result.slice(2, sz + 2));
  let { name, type } = JSON.parse(header);
  data = result.slice(sz + 2);

  return {
    name,
    type,
    data
  };
}

/**
 * handle a DataTransfer object from a paste or drop event, turning data into a File/Blob
 * @param {DataTransfer} object
 */
function handle_event(object) {
  let text = object.getData("text");
  if (text) {
    // pack the text for encrypting
    return new Blob([text], { type: "text/plain" });
  }
  if (object.files.length > 0) {
    // let's just take the first
    return object.files[0];
  }

  // empty drop
  return undefined;
}

export { do_decryption, do_encryption };
export { handle_event };

export { can_write, read, write, is_local_gateway } from "./ipfs.js";
export { b2text } from "./util.js";
