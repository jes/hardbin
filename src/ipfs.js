function get_ipfs() {
  return new Promise(async (resolve, reject) => {
    if (window.ipfs) {
      // todo check if readable?
      // try reading ipfs intro readme
      let ipfs = window.ipfs;
      let result = await ipfs.files.cat(
        "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme"
      );
      if (result) {
        console.log("window.ipfs is available");
        resolve(ipfs);
        return;
      }
      return;
    }

    try {
      let ipfsAPI = await import("ipfs-api");
      if (ipfsAPI) {
        console.log("trying ipfs-api");
        let ipfs = ipfsAPI.default();
        // try reading ipfs intro readme
        let result = await ipfs.files.cat(
          "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme"
        );
        if (result) {
          console.log("ipfs-api is available");
          resolve(ipfs);
          return;
        }
      }
    } catch (error) {
      console.log("ipfs-api failed: " + error);
    }

    try {
      let ipfs = await import("ipfs");
      let node = await new Promise(resolve => {
        let node = new ipfs.default();
        node.once("ready", () => resolve(node));
      });
      // try reading ipfs intro readme
      let result = await node.files.cat(
        "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme"
      );
      if (result) {
        console.log("ipfs node is available");
        resolve(node);
        return;
      }
    } catch (error) {
      console.log("ipfs failed: " + error);
    }
    reject(Error("no working ipfs client found"));
  });
}

const ipfsPrompise = get_ipfs();

/**
 * is this a local gateway
 */
let is_local_gateway = () => window.location.hostname == "localhost";

/**
 * test if we can write something to ipfs
 */
async function can_write() {
  return (await write(new TextEncoder().encode("testing 123"))) != "";
}

/**
 * write an ArrayBuffer (or Typed Array) to ipfs and return the corresponding hash.
 * returns empty string if add failed.
 * @param {ArrayBuffer} content
 */
function write(content, progress) {
  return new Promise(async resolve => {
    try {
      console.log("get");
      let ipfs = await ipfsPrompise;
      console.log("got" + ipfs);
      let result = await ipfs.files.add(Buffer.from(content), {
        pin: false,
        progress: progress
      });
      let hash = result[0].hash;

      console.log("content added to ipfs:" + hash);

      resolve(hash);
    } catch (error) {
      console.log("error adding to ipfs:" + error);
      resolve("");
    }
  });
}

/**
 * read data from ipfs
 * @param {string} path - ipfs path to read
 * @returns array buffer
 */
function read(path) {
  return new Promise(async resolve => {
    try {
      console.log("get:" + path);
      let ipfs = await ipfsPrompise;
      console.log("got" + ipfs);
      let result = await ipfs.files.cat(path);

      console.log("retreived from ipfs:" + result);

      resolve(result);
    } catch (error) {
      console.log("error reading from  ipfs:" + error);
      resolve("");
    }
  });
}

export { read, write, can_write, is_local_gateway, get_ipfs };
