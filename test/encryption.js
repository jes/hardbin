import { generate_key, encrypt, decrypt } from "../src/encryption";
import { do_encryption, do_decryption } from "../src/hardbin";
import { b2url } from "../src/util";
import { expect } from "chai";

import image from "../test/image.png";

describe("Encryption", () => {
  it("encrypt/decrypt some text", async () => {
    let ct = "this is some plaintext";
    let key = await generate_key();
    let enc = await encrypt(new TextEncoder().encode(ct), key);
    let dec = await decrypt(enc.iv, key, enc.ciphertext);
    let pt = new TextDecoder().decode(dec);
    expect(pt).to.equal(ct);
  });

  it("try do_encrypt/decrypt on text blob", async () => {
    let blob = new Blob(["some text"], { type: "text/plain" });
    let enc = await do_encryption(blob, "fake");
    let dec = await do_decryption(enc.data, enc.key);
    expect(dec.name).to.equal("fake");
    expect(dec.type).to.equal("text/plain");
    expect(new TextDecoder().decode(dec.data)).to.equal("some text");
  });

  it("try do_encrypt/decrypt on fake paste", async () => {
    let blob = new Blob(["some text"], { type: "text/plain" });
    let enc = await do_encryption(blob);
    let dec = await do_decryption(enc.data, enc.key);
    expect(dec.name).to.equal("Pasted text");
    expect(dec.type).to.equal("text/plain");
    expect(new TextDecoder().decode(dec.data)).to.equal("some text");
  });

  it("try do_encrypt/decrypt on pasted image", async () => {
    let file = await fetch(image).then(r => r.blob());
    let enc = await do_encryption(file);
    let dec = await do_decryption(enc.data, enc.key);
    expect(dec.name).to.equal("Pasted image");
    expect(dec.type).to.equal("image/png");
    expect(await b2url(new Blob([dec.data], { type: "image/png" }))).to.equal(
      image
    );
  });

  it("try do_encrypt/decrypt on dropped file", async () => {
    let file = await fetch(image).then(r => r.blob());
    let enc = await do_encryption(file);
    let dec = await do_decryption(enc.data, enc.key);
    expect(dec.name).to.equal("Pasted image");
    expect(dec.type).to.equal("image/png");
    expect(await b2url(new Blob([dec.data], { type: "image/png" }))).to.equal(
      image
    );
  });
});
