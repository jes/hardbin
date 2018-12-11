import { write, read } from "../src/ipfs";
import { expect } from "chai";

describe("Ipfs (needs ipfs daemon)", () => {
  it("try writing", async () => {
    let hash = await write("test write");
    console.log(hash);
    expect(hash).to.not.equal("");
  });

  it("try reading", async () => {
    let data = await read("QmYAq3B3d4VrNVmBqmkPaBpohpiGh1CoLqKERXGQUpiCLg");
    console.log("data:" + data + ";");
    let result = new TextDecoder().decode(data);
    console.log(result);
    expect(result).to.equal("test write");
  });
});
