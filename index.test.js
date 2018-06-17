import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import { it, describe, afterEach } from 'mocha';

import Token from './src/token';
import FaucetSerivce from './src/index';
import Db from './src/db';

chai.use(sinonChai);

const sdb = {
  getAttributes() {},
  putAttributes() {},
};

const sqs = {
  sendMessage() {},
};

const twitter = {
  get() {},
};

const contract = {
  balanceOf: {
    getData() {},
    call() {},
  },
  transfer: {
    getData() {},
    estimateGas() {},
  },
};

const web3 = { eth: {
  contract() {},
  at() {},
},
  _extend: {
    utils: {
      isAddress() {},
    } } };

sinon.stub(web3.eth, 'contract').returns(web3.eth);
sinon.stub(web3.eth, 'at', address => ({ ...contract, address }));
sinon.stub(web3._extend.utils, 'isAddress').returns(true);


describe('Twitter faucet', () => {
  it('should throw on invalid url', async () => {
    const manager = new FaucetSerivce(null, twitter, new Db(sdb), web3);
    try {
      await manager.tweetFund('bla-com', 200);
    } catch (err) {
      expect(err.message).to.contain('Error: url bla-com not valid.');
    }
  });

  it('should throw on invalid tweet', async () => {
    const manager = new FaucetSerivce(null, twitter, new Db(sdb), web3);
    try {
      await manager.tweetFund('https://twitter.com/JohBa/status/abc', 200);
    } catch (err) {
      expect(err.message).to.contain('Error: could not parse tweet id');
    }
  });

  it('should throw on invalid address', async () => {
    sinon.stub(twitter, 'get').yields(null, {
      created_at: 'Sun Jun 17 08:52:13 +0000 2018',
      id: 1008271083080994800,
      id_str: '1008271083080994817',
      text: 'Requesting faucet funds into 0x00 on the #Rinkeby #Ethereum test network.',
    });
    const manager = new FaucetSerivce(null, twitter, new Db(sdb), web3);
    try {
      await manager.tweetFund('https://twitter.com/JohBa/status/1008271083080994817', 200);
    } catch (err) {
      expect(err.message).to.contain('Error: could not parse valid ethereum address');
    }
  });

  it('should throw if time too short', async () => {
    sinon.stub(twitter, 'get').yields(null, {
      created_at: 'Sun Jun 17 08:52:13 +0000 2018',
      id: 1008271083080994800,
      id_str: '1008271083080994817',
      text: 'Requesting faucet funds into 0x8db6B632D743aef641146DC943acb64957155388 on the #Rinkeby #Ethereum test network.',
    });
    const earlier = new Date();
    sinon.stub(sdb, 'getAttributes').yields(null, {
      Attributes: [{ Name: 'created', Value: earlier.toString() }],
    });
    const manager = new FaucetSerivce(null, twitter, new Db(sdb), web3);
    try {
      await manager.tweetFund('https://twitter.com/JohBa/status/1008271083080994817', 200);
    } catch (err) {
      expect(err.message).to.contain('Error: not enough time passed since last claim');
    }
  });

  it('should send tokens on valid tweet', async () => {
    sinon.stub(contract.transfer, 'estimateGas').yields(null, 1000);
    sinon.stub(contract.transfer, 'getData').returns('0x112233');
    sinon.stub(sqs, 'sendMessage').yields(null, {});
    sinon.stub(twitter, 'get').yields(null, {
      created_at: 'Sun Jun 17 08:52:13 +0000 2018',
      id: 1008271083080994800,
      id_str: '1008271083080994817',
      text: 'Requesting faucet funds into 0x8db6B632D743aef641146DC943acb64957155388 on the #Rinkeby #Ethereum test network.',
    });
    const earlier = new Date();
    earlier.setHours(-25);
    sinon.stub(sdb, 'getAttributes').yields(null, {});
    sinon.stub(sdb, 'putAttributes').yields(null, {});
    const token = new Token(web3, '0x1255', sqs, 'url', '0x2233');
    const manager = new FaucetSerivce(token, twitter, new Db(sdb), web3);
    await manager.tweetFund('https://twitter.com/JohBa/status/1008271083080994817', 200);
    expect(sqs.sendMessage).calledWith({
      MessageBody: '{"from":"0x1255","to":"0x2233","gas":1200,"data":"0x112233"}',
      MessageGroupId: 'someGroup',
      QueueUrl: 'url',
    }, sinon.match.any);
  });

  afterEach(() => {
    if (contract.transfer.getData.restore) contract.transfer.getData.restore();
    if (contract.transfer.estimateGas.restore) contract.transfer.estimateGas.restore();
    if (twitter.get.restore) twitter.get.restore();
    if (sqs.sendMessage.restore) sqs.sendMessage.restore();
    if (sdb.getAttributes.restore) sdb.getAttributes.restore();
    if (sdb.putAttributes.restore) sdb.putAttributes.restore();
  });
});
