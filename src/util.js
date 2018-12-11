/**
 * extract text out of a Blob
 * @param {*} blob
 */
function b2text(blob) {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsText(blob);
  });
}

/**
 * extract a DataURL out of a Blob
 * @param {*} blob
 */
function b2url(blob) {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}

/**
 * extract an arraybuffer out of a Blob
 * @param {*} blob
 */
function b2ab(blob) {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = evt => resolve(new Uint8Array(evt.target.result));
    fr.readAsArrayBuffer(blob);
  });
}

export { b2text, b2url, b2ab };
