# hardbin.

> *The world's most secure pastebin, guaranteed* *

Hardbin is an encrypted pastebin, with the decryption key passed in the
URL fragment, and the code and data served securely with IPFS.

Compared to a traditional encrypted pastebin (e.g.
[ZeroBin](https://zerobin.net)), this means neither the code nor the
data can be modified by the pastebin server operator. This means there
is no possibility for the server operator to insert malicious code to
exfiltrate the plaintext or decryption key. It's the perfect pastebin.

(* not guaranteed)

## Usage

Note that the security guarantees of hardbin only apply when accessing
it over a local (or otherwise trusted) gateway. If you access it over
a gateway that you do not control, then the security model degrades to
be equivalent to that of traditional encrypted pastebins.

If you trust the hardbin.com server and hosting company and the HTTPS CA
infrastructure, then you can always find the latest version of hardbin
by going straight to [hardbin.com](https://hardbin.com/).

The [github repo](https://github.com/jes/hardbin) should also link
directly to the latest IPFS hash.

It doesn't matter which IPFS gateway is used to access hardbin.com, but
you won't be able to publish anything unless you use a writable gateway
(i.e. ```ipfs daemon --writable```). I am operating a public writable
gateway on hardbin.com to smooth the user experience. But remember that
using a public gateway means you are trusting the public gateway not to
ship malicious code to (for example) exfiltrate the plaintext.

In general it should either work out-of-the-box or give good instructions
on how to make it work.

The content will need to be pinned to make sure it stays
around for long term (the same as any content stored in
IPFS). [IPFSstore](https://ipfsstore.it/) is a service offering to pin
content for a very, *very* small fee. Failing that, content will stay
around as long as it is cached on any node (e.g. a public gateway).

If you want to share a link to hardbin which will automatically
load this README, append ```#about``` as the fragment. For example,
[https://hardbin.com/#about](https://hardbin.com/#about) will always
load the latest version of the code and show the README text.

### Local gateway

A local gateway that you run yourself is the safest way to use hardbin.

Follow the <a href="https://ipfs.io/docs/getting-started/">IPFS Getting
Started guide</a>, but make sure to run the gateway with ```ipfs daemon
--writable```, else you won't be able to publish anything.

You can then install a browser extension such as <a
href="https://chrome.google.com/webstore/detail/ipfs-station/kckhgoigikkadogfdiojcblegfhdnjei">IPFS
Station</a> for Chrome to automatically redirect IPFS paths to your
local gateway.

### Public gateway

Any public gateway will work fine for viewing content, but you won't
be able to publish anything on a non-writable gateway. Using a public
gateway also trusts the public gateway not to insert malicious code to
exfiltrate content (or do anything else it shouldn't).

### Writable public gateway

A writable public gateway will work fine for viewing and publishing,
but you're still trusting the public gateway not to insert malicious code.

Using the writable public gateway at [hardbin.com](https://hardbin.com/)
presents largely the same trust model as other encrypted pastebin
services.

## How it works

The hardbin code is served out of IPFS. The user then inputs the
content. When the content is published, a key is generated and the
content is encrypted in javascript in the browser. The new content is
then pushed to the IPFS gateway.

The decryption key is passed in the URL fragment, and the URL can be
shared with others.

As long as the IPFS gateway is not compromised, and the user visits a
known-good hash in the first place, there is no possibility for anybody
to modify either the code or the data, because to do so would change
the IPFS hash.

Since nobody can modify the code, and nobody can view the key unless you
show it to them, nobody without the key can either read the plaintext
or ship a malicious viewer which would exfiltrate the plaintext (or key).

## Self-hosting

You can "self-host" hardbin as follows:

    git clone https://github.com/jes/hardbin
    ipfs add -r hardbin/

## Custom modifications

If you want to use any custom modifications, you can simply make them,
publish your new code on IPFS with ```ipfs addd```, and then it's
available and ready to use. It's just as much a first-class citizen as
the version in this git repo, and you're equally welcome to access it
via the hardbin.com public writable gateway.

Of course, pull requests are always welcome for improvements that might
be useful to others.

## Security considerations

You still need to share the paste URL securely, otherwise a third-party
can read it as easily as anybody else can.

You need to make very sure to use a known-good version of the code when
creating pastes, as it would be trivial to create a malicious version
that looks identical. The best thing to do is write down the hash the
first time you use it, and always use the same hash. If you want to
upgrade to a new version of the software, you'll need to update your hash.

If you don't use a local (or otherwise trusted) IPFS gateway, then
the gateway server operator can perform all the same attacks that a
traditional encrypted pastebin operator could perform.

I don't recommend using hardbin for highly critical stuff as the code
has not been thoroughly audited by anyone but me. If you want to audit
it please contact me.

## Contact me

Hardbin was created by James Stanley. You can email me on
[james@incoherency.co.uk](mailto:james@incoherency.co.uk), or read my
blog at [incoherency.co.uk](http://incoherency.co.uk/).
