

describe('crypto', () => {
    it('simple text encrypt/decrypt', async () => {

        let text = "some text to encrypt";

        let key = await generate_key();

        let data = new TextEncoder().encode(text);
        let {iv, ctb, name, type} = await encrypt(data, key, "pasted", "text" );
        let ct = new Uint8Array(ctb);
        chai.assert.equal(name, 'pasted');
        chai.assert.equal(type, 'text');
        chai.assert.isNotEmpty(ct);

        let pt = await decrypt(iv, key, ct);

        // chai.assert.equal(pt.name, 'pasted');
        // chai.assert.equal(pt.type, 'text')
        chai.assert.equal(text, pt);
    })
})