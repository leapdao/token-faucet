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

describe("EthTurin Faucet", () => {
  describe("checkSignature()", () => {
    it("should check signature", () => {
      const sig =
        "0xe828e92dc11e85a42704beb90cc34f6a384933f98b082533ec9d609bae6f569547fd5024c75711ae3a09d7eb41013583e9cc1abc0f50c22f57264a75d46630a901";
      const rsp = checkSignature(
        "0xeDfb8EFBB5a040f38d0B9b3E24c7b366C8DED412",
        sig
      );
      chai.expect(rsp).to.equal("0x89AB6D3C799d35f5b17194Ee7F07253856A67949");
    });
  });

  describe("handleEthTurin()", () => {
    it("should allow happy case", async () => {
      const body = {
        address: "0x89ab6d3c799d35f5b17194ee7f07253856a67949",
        color: 4,
        sig:
          "0xe828e92dc11e85a42704beb90cc34f6a384933f98b082533ec9d609bae6f569547fd5024c75711ae3a09d7eb41013583e9cc1abc0f50c22f57264a75d46630a901",
        toAddress: "0xeDfb8EFBB5a040f38d0B9b3E24c7b366C8DED412",
      };

      const web3 = null;

      sinon
        .stub(sdb, "getAddr")
        .resolves({ created: Date.now() - 25 * 60 * 60 * 1000 });
      sinon.stub(sdb, "setAddr").yields(null, {});

      sinon.stub(queue, "put").yields(null, {});

      rsp = await handleEthTurin(body, web3, sdb, queue);
      console.log(rsp);
    });
  });
});
