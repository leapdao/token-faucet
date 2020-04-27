const chai = require("chai");
const sinonChai = require("sinon-chai");
const sinon = require("sinon");
const { it, describe, afterEach, beforeEach } = require("mocha");
const { checkSignature, handleEthTurin } = require("../src/addressFaucet.js");

const Db = require("../src/utils/db");

chai.use(sinonChai);

const sdb = {
  getAddr() {},
  setAddr() {},
};

const queue = {
  put() {},
};

const tokenContract = {
  tokensOfOwner: {
    call() {},
  }
};

describe("EthTurin Faucet", () => {
  describe("checkSignature()", () => {
    it("should check signature", () => {
      const sig =
        "0xffd7e226fdefe4de0bf492229b30bb601b8f34fa63efdf2abbca6e1ca71c6dde4b43d7ab5d003babe051a1610caddfa836ebd107fbef9f071189b2b14ec102571c";
      const rsp = checkSignature(
        "0x18421Dfc1F4C623F63E91a72f7cCbA756148d213",
        sig
      );
      chai.expect(rsp).to.equal("0x8db6b632d743aef641146dc943acb64957155388");
    });
  });

  describe("handleEthTurin()", () => {
    it("should allow happy case", async () => {
      const body = {
        address: "0x8db6B632D743aef641146DC943acb64957155388",
        color: 4,
        sig:
          "0xffd7e226fdefe4de0bf492229b30bb601b8f34fa63efdf2abbca6e1ca71c6dde4b43d7ab5d003babe051a1610caddfa836ebd107fbef9f071189b2b14ec102571c",
        toAddress: "0x18421Dfc1F4C623F63E91a72f7cCbA756148d213",
      };

      sinon
        .stub(sdb, "getAddr")
        .resolves({ created: Date.now() - 121 * 60 * 60 * 1000 });
      sinon.stub(sdb, "setAddr").resolves({});

      sinon.stub(queue, "put").resolves({});

      sinon.stub(tokenContract.tokensOfOwner, 'call').yields(null, new String(['10']));

      rsp = await handleEthTurin(body, tokenContract, sdb, queue);
      chai.expect(rsp.statusCode).to.equal(200);
    });

    it("should block on used tokenId", async () => {
      const body = {
        address: "0x8db6B632D743aef641146DC943acb64957155388",
        color: 4,
        sig:
          "0xffd7e226fdefe4de0bf492229b30bb601b8f34fa63efdf2abbca6e1ca71c6dde4b43d7ab5d003babe051a1610caddfa836ebd107fbef9f071189b2b14ec102571c",
        toAddress: "0x18421Dfc1F4C623F63E91a72f7cCbA756148d213",
      };

      sinon.stub(tokenContract.tokensOfOwner, 'call').yields(null, new String(['10']));
      sinon
        .stub(sdb, "getAddr")
        .resolves({ created: Date.now()});
      try {
        rsp = await handleEthTurin(body, tokenContract, sdb, queue);
        throw Error('shouldn\'t be here');
      } catch (e) {
        chai.expect(e.message).to.equal('Bad Request: not enough time passed since the last claim');
      };
      
    });

    it("should block on no token", async () => {
      const body = {
        address: "0x8db6B632D743aef641146DC943acb64957155388",
        color: 4,
        sig:
          "0xffd7e226fdefe4de0bf492229b30bb601b8f34fa63efdf2abbca6e1ca71c6dde4b43d7ab5d003babe051a1610caddfa836ebd107fbef9f071189b2b14ec102571c",
        toAddress: "0x18421Dfc1F4C623F63E91a72f7cCbA756148d213",
      };

      sinon.stub(tokenContract.tokensOfOwner, 'call').yields(null, new String([]));
      try {
        rsp = await handleEthTurin(body, tokenContract, sdb, queue);
        throw Error('shouldn\'t be here');
      } catch (e) {
        chai.expect(e.message).to.equal('Bad Request: 0x8db6B632D743aef641146DC943acb64957155388 not token holder');
      };
      
    });
  });
  afterEach(() => {
    if (sdb.getAddr.restore) sdb.getAddr.restore();
    if (sdb.setAddr.restore) sdb.setAddr.restore();
    if (queue.put.restore) queue.put.restore();
    if (tokenContract.tokensOfOwner.call.restore) tokenContract.tokensOfOwner.call.restore();
  });
});
