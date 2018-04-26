let writability_checked = false;
let decryption_key = "";

let assocations = {
  'application/javascript': 'text',
  'application/x-javascript': 'text',
  'application/xml': 'text',
  'image/svg+xml': 'svg',
  // PDF for now only offers 'view in browser'
  'application/pdf': 'pdf',
  'application/x-pdf': 'pdf',
  'text/plain': 'text',
  'audio/aac': 'audio',
  'audio/mp4': 'audio',
  'audio/mpeg': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'audio/webm': 'audio',
  'video/mp4': 'video',
  'video/ogg': 'video',
  'video/webm': 'video',
  'audio/wave': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/x-pn-wav': 'audio',
  'audio/vnd.wave': 'audio',
  'image/tiff': 'image',
  'image/x-tiff': 'image',
  'image/bmp': 'image',
  'image/x-windows-bmp': 'image',
  'image/gif': 'image',
  'image/x-icon': 'image',
  'image/jpeg': 'image',
  'image/pjpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'text/': 'text'
}

let safeassociations = {
  'text': 'text/plain',
  'svg': 'text/plain'
}

function get_association(type) {
  for( let key in assocations ) {
    if(type.startsWith(key)){
      return assocations[key];
    }
  }
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
  console.log('check_writability')
  writability_checked = true;
  if (await can_write()) {
    set_status("");
  } else if (is_local_gateway()) {
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

function render(content) {
  $("#input").val(content);
  $("#input").prop("readonly", true);

  $("#top-save").hide();
  $("#top-edit").show();
}

function unrender() {
  $("#input").prop("readonly", false);

  $("#top-save").show();
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
  <p><a style="word-wrap:break-word" href="${fulllocation}">${fulllocation}</a></p>
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
  console.log("load_content")
  if (window.location.hash && window.location.hash != "#about") {
    set_status("Loading encrypted content...");
    let key = window.location.hash.replace("-firstview", "").replace("#", "");
    decryption_key = key;
    try {
      let data = await $.ajax({ url: "content" });

      // TODO: show an error if we couldn't decrypt the content?
      let result = await do_decryption(data, key);

      let assocation = get_association(result.type)
      let safeassociation = safeassociations[assocation]

      let decrypted = new Blob([result.data], {type: result.type})
      let safedecrypted = new Blob([decrypted], {type: safeassociation ? safeassociation : result.type })

      let url = URL.createObjectURL(decrypted)
      let safeurl = URL.createObjectURL(safedecrypted)

      if (association == 'image' || assocation == 'svg'){
        // show image
      } else if( assocation == 'text') {
        // show text
        let content = await b2text(decrypted)
        render_text(content);
      } else if(assocation == 'video'){
        // show video
      } else if(assocation == 'audio'){
        // show audio
      } else {
      }
      if (window.location.hash.indexOf("firstview") != -1)
        show_pin_instructions();
      history.replaceState(undefined, undefined, "#" + decryption_key);
      set_status("");
    } catch (error) {
      check_writability();
    }
  } else {
    check_writability();
  }
}

// events

$("#top-save").click(async () => {
  let key = generate_key();
  let hash = await write(encrypt($("#input").val(), key));
  if (hash) {
    window.location = "/ipfs/" + hash + "#" + key + "-firstview";
  } else {
    set_status("Error: Failed to store content. Is the gateway writable?");
  }
});

$("#top-edit").click(() => {
  unrender();
  $("#input").focus();
  check_writability(); // todo check flag?
});

$("#about").click(e => {
  e.preventDefault();
  $("#about-modal").modal("show");
  history.replaceState(undefined, undefined, "#about");
});

$("#about-modal").on("hide.bs.modal", () => {
  history.replaceState(undefined, undefined, "#" + decryption_key);
});

// start

$(document).ready( () => async function() {
  console.log("ready")
  load_content();

 let data = await $.ajax({ url: "README.md" });
  let converter = new showdown.Converter();
  $("#about-body").html(converter.makeHtml(data));
  if (window.location.hash == "#about") {
    $("#about-modal").modal("show");
  }
}());

$("#input").on('dragenter', e => {
  e.dataTransfer = e.originalEvent.dataTransfer;
  e.preventDefault()
  console.log('dragenter')
  console.log(e.dataTransfer)
});

$("#input").on('dragleave', e => {
  e.dataTransfer = e.originalEvent.dataTransfer;
  e.preventDefault()
  console.log('dragleave')
});

$("#input").on('drop', e =>{
  e.dataTransfer = e.originalEvent.dataTransfer;
  e.preventDefault()
  console.log('drop')
  console.log(e.dataTransfer.types)
  console.log(e.dataTransfer.files)
})

$(document).on('paste', e => {
  console.log('paste')
  console.log(e)
})
