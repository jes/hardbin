import { b2text, b2url, b2ab } from "../src/util";
import { expect } from "chai";

describe("Blob utils", () => {
  it("text from blob", async () => {
    let out = await b2text(new Blob(["testing"]));
    expect(out).to.equal("testing");
  });

  it("url from blob", async () => {
    let blob = new Blob([new Uint16Array([35]), new Uint8Array([6])]);
    let out = await b2url(blob);
    expect(out).to.equal("data:application/octet-stream;base64,IwAG");
  });

  it("ab from blob", async () => {
    let blob = new Blob([new Uint16Array([35]), new Uint8Array([6])]);
    let out = await b2ab(blob);
    expect(Array.from(out)).to.have.members([35, 0, 6]);
  });
});
