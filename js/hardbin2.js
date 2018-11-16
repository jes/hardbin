import IpfsApi from './ipfs-api.js';
// import {Buffer} from './ipfs-api.js';
import {from_b58, to_b58} from './base58.2.js';
const Buffer = require('buffer/').Buffer
// import('./ipfs-api.js').then(e => {
  // console.log(e)
  // console.log(e.IpfsApi)
// })

function b2text(blob) {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsText(blob);
  });
}

function b2url(blob) {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}

function b2ab(blob) {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = (evt) => resolve(new Uint8Array(evt.target.result));
    fr.readAsArrayBuffer(blob);
  });
}

async function generate_key() {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data, key, name, type) {
  let iv = crypto.getRandomValues(new Uint8Array(12));
  let alg = { name: "AES-GCM", iv: iv };

  let ciphertext = await crypto.subtle.encrypt(alg, key, data);

  return {
    iv,
    ciphertext,
    name,
    type
  };
}

async function decrypt(iv, key, data) {
  let alg = { name: "AES-GCM", iv: iv };
  return await crypto.subtle.decrypt(alg, key, data);
}

async function do_encryption(file, name) {
  let extension = file.type.split("/");
  name = name
    ? name
    : file.name
      ? file.name
      : `Pasted ${extension[0]}`;

  let key = await generate_key();
  let header = {
    name,
    type: file.type
  };
  let encoded = new Blob([JSON.stringify(header)])
  
  let blob = new Blob([new Uint16Array([encoded.size]), encoded, file]);

  let { iv, ciphertext, ...result } = await encrypt(await b2ab(blob), key);

  let key_export = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  let merged = new Uint8Array(iv.length + key_export.length);
  merged.set(iv);
  merged.set(key_export, iv.length);

  return {
    data: ciphertext,
    key: to_b58(merged)
  };
}

async function do_decryption(data, key) {
  let merged = from_b58(key);
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

let is_local_gateway = () => window.location.hostname == "localhost";

async function can_write() {
  return (await write(new TextEncoder().encode("testing 123"))) != "";
}

function write(content) {
  // console.log('imported:'+IpfsApi)
  // const ipfs = new window.IpfsApi()
  console.log('buf'+IpfsApi.Buffer)
  
  const ipfs = IpfsApi()

  return new Promise(async resolve => {
    try {
      console.log('1:'+content);
      console.log(ipfs)
      let result = await ipfs.files.add(Buffer.from(content))
      console.log(result)
      let hash = result[0].hash
      console.log('2:'+hash);
      
      resolve(hash);
    } catch (error) {
      console.log('4'+error);
      
      resolve("");
    }
  });
}

function handle_event(object) {
  let text = object.getData('text')
  if( text ){
    // pack the text for encrypting
    return new Blob([text], {type: 'text/plain'})
  }
  if(object.files.length > 0){
    // let's just take the first
    return object.files[0]
  }

  // empty drop
  return undefined
}

export {b2text, b2url, b2ab}
export {encrypt, decrypt, generate_key, do_decryption, do_encryption}
export {handle_event, write, can_write}