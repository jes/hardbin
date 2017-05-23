/* data encryption + storage functions for hardbin
 * make sure to also load jquery + aes.js
 */

function constant_time_compare(a, b) {
    if (typeof a !== 'string') {
        throw "String expected, got " + (typeof a);
    }
    if (typeof b !== 'string') {
        throw "String expected, got " + (typeof b);
    }
    if (a.length !== b.length) {
        return false;
    }
    var d = 0;
    var i = 0;
    for (i = 0; i < a.length; i++) {
        d |= a.charAt(i) ^ b.charAt(i);
    }
    return d === 0;
}

function encrypt(data, key) {
    var unauthed = CryptoJS.AES.encrypt(data, key);
    var mac = CryptoJS.HmacSHA256(data, key);
    return mac.toString() + unauthed.toString();
}

function decrypt(data, key) {
    var mac = data.substring(0, 32);
    var message = data.substring(32);
    var calc = CryptoJS.HmacSHA256(message, key).toString();
    if (!constant_time_compare(calc, mac)) {
        throw "Invalid message authentication code!";
    }
    return CryptoJS.AES.decrypt(message, key).toString(CryptoJS.enc.Utf8);
}

function generate_key() {
    var alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var randombytes = new Uint8Array(32);
    crypto.getRandomValues(randombytes);

    var k = '';
    for (var i = 0; i < 32; i++) {
        var idx = Math.floor(randombytes[i] * alphabet.length / 256);
        k += alphabet.charAt(idx);
    }
    return k;
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
