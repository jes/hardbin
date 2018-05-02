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
    fr.onload = () => resolve(fr.result);
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

  let cyphertext = await crypto.subtle.encrypt(alg, key, data);

  return {
    iv,
    cyphertext,
    name,
    type
  };
}

async function decrypt(iv, key, data) {
  let alg = { name: "AES-GCM", iv: iv };
  return  await crypto.subtle.decrypt(alg, key, data);
}

async function do_encryption(file, name) {
  let extension = file.type.split("/");
  name = name
    ? name
    : file.name
      ? file.name
      : `Pasted ${extension[0]}.${
          extension[1] == "plain" ? "txt" : extension[1]
        }`;

  let key = await generate_key();
  // let key_export = crypto.subtle
  // .exportKey("raw", key)
  // .then(raw => {
  // b2url(new Blob([raw]));
  // })
  // .then(url => url.split(",").slice(-1)[0]);

  let header = {
    name,
    type: file.type
  };
  let blob = new Blob([new Uint16Array([header.size]), header, file]);

  let { iv, cyphertext, ...result } = await encrypt(await b2ab(blob), key);

  let key_export = await crypto.subtle.exportKey("raw", key);
  // key_export = await b2url(new Blob([iv, key]));
  // key_export = key_export.split(",").slice(-1)[0];
  let merged = new Uint8Array(iv.length + key_export.length);
  merged.set(iv);
  merged.set(key_export, iv.length);

  return {
    data: cyphertext,
    key: to_b58(merged)
  };
}

async function do_decryption(data, key) {
  let merged = from_b58(key);
  let iv = Uint8Array(merged, 0, 12);
  let raw = Uint8Array(merged, 12);

  key = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  let result = await decrypt(iv, key, data);
  let view = new DataView(result.data);
  let sz = view.getUint16(0, true);
  let header = await b2text(new Blob([result.data.slice(1, sz + 1)]));
  let { name, type } = JSON.parse(header);

  data = result.data.slice(sz + 1);

  return {
    name,
    type,
    data
  };
}

let is_local_gateway = () => window.location.hostname == "localhost";

async function can_write() {
  return (await write("testing 123")) != "";
}

function write(content) {
  return new Promise(async resolve => {
    try {
      console.log('1');
      let [, , xhr] = await $.ajax({
        url: "content",
        type: "DELETE"
      }).then((...args) => args);
      console.log('2');
      
      [, , xhr] = await $.ajax({
        url: "/ipfs/" + xhr.getResponseHeader("Ipfs-Hash") + "/content",
        type: "PUT",
        data: content
      }).then((...args) => args);
      console.log('3');
      
      resolve(xhr.getResponseHeader("Ipfs-Hash"));
    } catch (error) {
      console.log('4');
      
      resolve("");
    }
  });
}
