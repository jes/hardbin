import image from "../test/image.png";
import { b2text } from "../src/util";
import { handle_event } from "../src/hardbin";
import { expect } from "chai";

describe("File handling", () => {
  it("fake file drop/paste", async () => {
    let file = await fetch(image).then(r => r.blob());
    let dataTransfer = {
      getData: type => {},
      files: [file]
    };

    let result = handle_event(dataTransfer);
    expect(result).to.equal(file);
  });

  it("fake text drop/paste", async () => {
    let text = "some testing text";
    let dataTransfer = {
      getData: type => {
        return text;
      },
      files: []
    };
    let result = handle_event(dataTransfer);
    expect(await b2text(result)).to.equal(text);
  });
});
