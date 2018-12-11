import {
  handle_event,
  can_write,
  b2text,
  read,
  write,
  do_decryption,
  do_encryption,
  is_local_gateway
} from "./hardbin.js";
import $ from "jquery";
import showdown from "showdown";
import hljs from "highlight.js";
import "highlight.js/styles/obsidian.css";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/hardbin.css";

// hack
window.jQuery = $;
window.$ = $;

let writability_checked = false;
let decryption_key = "";
let content_path = "";

let associations = {
  "application/javascript": "text",
  "application/x-javascript": "text",
  "application/xml": "text",
  "image/svg+xml": "svg",
  // PDF for now only offers 'view in browser'
  "application/pdf": "pdf",
  "application/x-pdf": "pdf",
  "text/plain": "text",
  "audio/aac": "audio",
  "audio/mp4": "audio",
  "audio/mpeg": "audio",
  "audio/ogg": "audio",
  "audio/wav": "audio",
  "audio/webm": "audio",
  "video/mp4": "video",
  "video/ogg": "video",
  "video/webm": "video",
  "audio/wave": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/x-pn-wav": "audio",
  "audio/vnd.wave": "audio",
  "image/tiff": "image",
  "image/x-tiff": "image",
  "image/bmp": "image",
  "image/x-windows-bmp": "image",
  "image/gif": "image",
  "image/x-icon": "image",
  "image/jpeg": "image",
  "image/pjpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "text/": "text"
};

let safeassociations = {
  text: "text/plain",
  svg: "text/plain"
};

Element.prototype.removeAll = function() {
  while (this.firstChild) {
    this.removeChild(this.firstChild);
  }
  return this;
};

function get_association(type) {
  for (let key in associations) {
    if (type.startsWith(key)) {
      return associations[key];
    }
  }
}

function hide(selector) {
  $(selector).addClass("d-none");
}

function show(selector) {
  $(selector).removeClass("d-none");
}

function set_status(text) {
  $("#status").text(text);
}

function modal(title, bodyhtml) {
  $("#model-title").text(title);
  $("#model-body").html(bodyhtml);
  $("#model").modal("show");
}

async function check_writability() {
  console.log("check_writability");
  writability_checked = true;
  if (await can_write()) {
    set_status("");
  } else if (await is_local_gateway()) {
    modal(
      "IPFS Gateway Problem",
      `
    <p>It looks like you're accessing Hardbin over a local gateway. That's good! That's the safest way. But your gateway is not currently writable, which means you won't be able to save your work.</p>
    <p>Kill it and relaunch with <tt>--writable</tt> if you want to save your work:</p>
    <p><pre><code>$ ipfs daemon --writable</code></pre></p>`
    );
    set_status("Error: IPFS gateway is not writable.");
  } else {
    let pathwithfrag = window.location.pathname + window.location.hash;
    modal(
      "IPFS Gateway Problem",
      `
    <p>This IPFS gateway is not writable, which means you won't be able to save your work.</p>
    <p>If you want to save your work, you can either:</p>
    <p>1. view this on the public writable gateway at <a href="https://hardbin.com${pathwithfrag}">hardbin.com</a>, or</p>
    <p>2. <a href="https://ipfs.io/docs/install/">install IPFS</a>, run a local node with <tt>ipfs daemon --writable</tt>, and then view this on your local node at <a href="http://localhost:8080${pathwithfrag}">localhost:8080</a>.</p>`
    );
    set_status("Error: IPFS gateway is not writable.");
  }
}

function unrender() {
  hide(".content");
  show("#input");

  // $("#input").prop("readonly", false);

  $("#top-save").show();
  $("#top-edit").hide();
}

function render_text(text) {
  let bam = hljs.highlightAuto(text);
  let code = document.getElementById("code");
  console.log("bam:" + bam.language);
  code.innerHTML = bam.value;
  $("#input").val(text);
  // $("#input").prop("readonly", true);
  hide("#input");
  hide(".content");
  show("#code-div");

  $("#top-save").hide();
  $("#top-edit").show();
}

function render_image(url) {
  let img = new Image();
  img.src = url;
  document
    .getElementById("content-div")
    .removeAll()
    .append(img);
  hide("#input");
  hide(".content");
  show("#content-div");

  $("#top-save").hide();
  $("#top-edit").hide();
}

function render_link(url) {
  hide("#input");
  hide(".content");
  show("#button-div");
}

function render_media(url, type = "audio") {
  let media = document.createElement(type);
  let source = document.createElement("source");
  source.src = url;
  media.controls = true;
  media.autoplay = true;
  media.appendChild(source);
  document
    .getElementById("content-div")
    .removeAll()
    .append(media);
  hide("#input");
  hide(".content");
  show("#content-div");

  $("#top-save").hide();
  $("#top-edit").hide();
}

function show_pin_instructions() {
  let pathwithfrag = window.location.pathname + "#" + decryption_key;
  let full_location = window.location.href;
  let hash = window.location.pathname;
  hash = hash.replace("/ipfs/", "").replace("/", "");
  full_location = full_location.replace("-firstview", "");
  let is_hardbincom = window.location.hostname == "hardbind.com";
  modal(
    "Content published",
    `
  <p>Congratulations! Your content has been published to the IPFS gateway. It is now reachable by any node on the IPFS network. Share the following URL to share the content:</p>
  <p><a style="word-wrap:break-word" href="${full_location}">${full_location}</a></p>
  ${
    !is_hardbincom
      ? `<p>Or on the hardbin.com public gateway: <a style="word-wrap:break-word" href="https://hardbin.com${pathwithfrag}">https://hardbin.com${pathwithfrag}</a></p>`
      : ""
  }
  <p>The IPFS hash is <b>${hash}</b> and the decryption key is <b>${decryption_key}</b>.</p>
  <p>Content on IPFS is not persistent and will eventually disappear from the IPFS network if it is not pinned anywhere (equivalent to "seeding" in bittorrent). To make the content persistent, you can either pin it on an IPFS node you control:</p>
  <p><tt>$ ipfs pin add ${hash}</tt></p>
  <p>Or use a service like IPFSstore to pin it for you:</p>
  <a href="https://ipfsstore.it/submit.php?hash=${hash}" class="btn btn-primary">Pin on IPFSstore</a>
  `
  );
}

async function load_content() {
  console.log("load_content");
  if (window.location.hash && window.location.hash != "#about") {
    set_status("Loading encrypted content...");
    let [key, path] = window.location.hash
      .replace("-firstview", "")
      .replace("#", "")
      .split(":");

    if (content_path == path && decryption_key == key) {
      console.log("already displaying this!");
      // set clean path
      history.replaceState(
        undefined,
        undefined,
        "#" + decryption_key + ":" + content_path
      );
      return;
    }

    decryption_key = key;
    content_path = path;
    try {
      let data = await read(content_path);

      // TODO: show an error if we couldn't decrypt the content?
      let result = await do_decryption(data, key);
      console.log(result);

      let association = get_association(result.type);
      let safeassociation = safeassociations[association];

      let decrypted = new Blob([result.data], { type: result.type });
      let safedecrypted = new Blob([decrypted], {
        type: safeassociation ? safeassociation : result.type
      });

      let url = URL.createObjectURL(decrypted);
      let safeurl = URL.createObjectURL(safedecrypted);

      console.log("url:" + url + ",safe:" + safeurl + ",ass:" + association);

      if (association == "image" || association == "svg") {
        // show image
        render_image(url);
      } else if (association == "text") {
        // show text
        let content = await b2text(decrypted);
        render_text(content);
      } else if (association == "video") {
        // show video
        render_media(url, "video");
      } else if (association == "audio") {
        // show audio
        render_media(url, "audio");
      } else {
        // show download button
        render_link(url);
      }
      if (window.location.hash.indexOf("firstview") != -1)
        show_pin_instructions();
      history.replaceState(
        undefined,
        undefined,
        "#" + decryption_key + ":" + content_path
      );
      set_status("");
    } catch (error) {
      console.log("error loading content:" + error);
      check_writability();
    }
  } else {
    check_writability();
  }
}

async function publish(blob) {
  let { data, key } = await do_encryption(blob);
  let sz = data.byteLength;
  let bar = document.getElementById("progbar");
  let hash = await write(data, p => {
    let width = Math.floor((p * 100) / sz);
    bar.style.width = width + "%";
    console.log("prog:" + (p * 100) / sz + "," + Math.floor((p * 100) / sz));
  });
  bar.style.width = "0%";
  if (hash) {
    let url = "#" + key + ":" + hash + "-firstview";
    console.log("save:" + url);
    // window.location = "/ipfs/" + hash + "#" + key + "-firstview";
    history.replaceState(undefined, undefined, url);
    load_content();
  } else {
    set_status("Error: Failed to store content. Is the gateway writable?");
  }
}

// events
$("#top-save").click(async () => {
  let text = $("#input").val();
  console.log("input:" + text);
  if (text && text != "") {
    publish(new Blob([text], { type: "text/plain" }));
  } else {
    console.log("nothing to save");
  }
});

document.getElementById("top-edit").addEventListener("click", () => {
  unrender();
  $("#input").focus();
  check_writability(); // todo check flag?
});

document.getElementById("about").addEventListener("click", e => {
  e.preventDefault();
  $("#about-modal").modal("show");
  history.replaceState(undefined, undefined, "#about");
});

document.getElementById("about-modal").addEventListener("hide.bs.modal", () => {
  history.replaceState(undefined, undefined, "#" + decryption_key);
});

// start

document.addEventListener("DOMContentLoaded", async () => {
  console.log("ready");
  load_content();

  let data = await jQuery.ajax({ url: "README.md" });
  let converter = new showdown.Converter();
  $("#about-body").html(converter.makeHtml(data));
  if (window.location.hash == "#about") {
    console.log("about");
    $("#about-modal").modal("show");
  }
});

document.getElementById("input-div").addEventListener("dragenter", e => {
  // e.dataTransfer = e.originalEvent.dataTransfer;
  e.preventDefault();
  console.log("dragenter");
  console.log(e.dataTransfer);
});

document.getElementById("input-div").addEventListener("dragleave", e => {
  // e.dataTransfer = e.originalEvent.dataTransfer;
  e.preventDefault();
  console.log("dragleave");
});

document.getElementById("input-div").addEventListener("dragover", e => {
  // e.dataTransfer = e.originalEvent.dataTransfer;
  e.preventDefault();
  console.log("dragover");
});

document.getElementById("input-div").addEventListener("drop", e => {
  console.log("drop");
  // e.dataTransfer = e.originalEvent.dataTransfer;
  e.preventDefault();
  let file = handle_event(e.dataTransfer);
  console.log(file);
  publish(file);
});

document.addEventListener("paste", e => {
  console.log("paste");
  console.log(e);
  if (e.clipboardData.getData("text")) {
    console.log("text was pasted");
  } else {
    e.preventDefault();
    let file = handle_event(e.clipboardData);
    console.log(file);
    publish(file);
  }
});

window.addEventListener("hashchange", () => {
  console.log("hashchange");
  load_content();
});
