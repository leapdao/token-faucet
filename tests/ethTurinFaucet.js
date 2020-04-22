const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
const { it, describe, afterEach, beforeEach } = require('mocha');
const { checkSignature, handleEthTurin } = require('../src/addressFaucet.js');

chai.use(sinonChai);

describe('EthTurin Faucet', () => {
  describe('checkSignature()', () => {
    it('should check signature', () => {
    	const sig = '0x6019dfb626d5747ed84f49be3fe987206daeb22422145735cb9d863e991775d1227cd676eb69db5ed3ad98bfb32205e2bd2b271ba8806430aa1400fc7d28d2b201';
    	const rsp = checkSignature('0x49A0D89e69402FF1F03168De804BE755C3a57cCc', sig);
    	chai.expect(rsp).to.equal('0x89ab6d3c799d35f5b17194ee7f07253856a67949');
    });
  });
});
