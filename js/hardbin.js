/* data encryption + storage functions for hardbin
 * make sure to also load jquery + aes.js
 */

function encrypt(data, key) {
    return CryptoJS.AES.encrypt(data, key).toString();
}

function decrypt(data, key) {
    return CryptoJS.AES.decrypt(data, key).toString(CryptoJS.enc.Utf8);
}

function generate_key() {
    var alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var randombytes = new Uint8Array(32);
    crypto.getRandomValues(randombytes);
    return base58.encode(Array.from(randombytes));
}

function is_local_gateway() {
    return window.location.hostname == 'localhost';
}

function write(content, cb) {
    $.ajax({
        url: "content",
        type: "DELETE",
        success: function(data, status, xhr) {
            $.ajax({
                url: "/ipfs/" + xhr.getResponseHeader('Ipfs-Hash') + "/content",
                type: "PUT",
                data: content,
                success: function(data, status, xhr) {
                    cb(xhr.getResponseHeader('Ipfs-Hash'));
                },
                timeout: function() {
                    cb("");
                },
                error: function() {
                    cb("");
                },
            });
        },
        timeout: function() {
            cb("");
        },
        error: function() {
            cb("");
        },
    });
}
