const { it, describe, beforeEach } = require('mocha');

const chai = require('chai');
const { expect } = chai;

const TweetHandler = require('./tweetHandler');

const expectThrow = async (promise, message) => {
  try {
    await promise;
    expect.fail('Expected to throw');
  } catch (e) {
    expect(e.message).to.contain(message);
  }
};


const validTweet = 'Requesting faucet funds into 0x8db6B632D743aef641146DC943acb64957155388 on the #Rinkeby #Ethereum @leapdao test network.';

const validTweetData = {
  created_at: 'Sun Jun 17 08:52:13 +0000 2018',
  id: 1008271083080994800,
  id_str: '1008271083080994817',
  text: validTweet,
  user: {
    id_str: '123'
  }
};

const validTweetUrl = 'https://twitter.com/JohBa/status/1008271083080994817';

describe('TweetHandler', () => {
  let queue, db, twitter;

  beforeEach(() => {
    db = {
      setAddr: () => {},
      getAddr: () => ({ created: 0 }),
      setTwitterAccountRequestAttempts: (acc, count) => { db[acc] = count; },
      getTwitterAccountRequestAttempts: (acc) => ({ created: db[acc] || 0 }),
    };
    
    queue = {
      put: (address) => { queue[address] = true; },
    };
    
    twitter = {
      get: (a, b, cb) => cb({ message: 'no withTweet call in the test' }),
    };
  });

  const handler = () => new TweetHandler(queue, twitter, db, 2);

  const withTweet = tweet => {
    twitter.get = (a, b, cb) => cb(null, { ...validTweetData, text: tweet });
  }

  it('should throw on invalid url', async () => {
    await expectThrow(
      handler().handleTweet('bla-com', 0),
      'Bad Request: url bla-com not valid.'
    );
  });

  it('should throw on invalid tweet URL', async () => {
    await expectThrow(
      handler().handleTweet('https://twitter.com/JohBa/status/abc', 0),
      'Bad Request: could not parse tweet id'
    );
  });

  it('should throw if no address in tweet', async () => {
    withTweet('Requesting @leapdao tokens');
    await expectThrow(
      handler().handleTweet(validTweetUrl, 0),
      'Bad Request: Tweet should include valid Ethereum address'
    );
  });

  it('should throw on invalid address in tweet', async () => {
    withTweet('Requesting into 0x00 @leapdao');
    await expectThrow(
      handler().handleTweet(validTweetUrl, 0),
      'Bad Request: Tweet should include valid Ethereum address'
    );
  });

  it('should throw if no @leapdao handle in tweet', async () => {
    withTweet('Requesting into 0x8db6B632D743aef641146DC943acb64957155388');
    await expectThrow(
      handler().handleTweet(validTweetUrl, 0),
      'Bad Request: Tweet should be mentioning @Leapdao'
    );
  });

  describe('valid tweet - ', () => {
    it('should throw if time too short', async () => {
      withTweet(validTweet);
      db.getAddr = () => ({ created: new Date() });
  
      await expectThrow(
        handler().handleTweet(validTweetUrl, 200),
        'Bad Request: not enough time passed since the last claim'
      );
  
      expect(queue['0x8db6B632D743aef641146DC943acb64957155388']).to.be.undefined;
    });

    it('should throw if already requested from this account', async () => {
      withTweet(validTweet);
      const oneTimeHandler = new TweetHandler(queue, twitter, db, 1);
      await oneTimeHandler.handleTweet(validTweetUrl, 200);
      await expectThrow(
        oneTimeHandler.handleTweet(validTweetUrl, 200),
        'Bad Request: Can request only 1 time per Twitter account'
      );
    });

    it('should put address into sending queue if twitter account check is disabled', async () => {
      withTweet(validTweet);
      db.getTwitterAccountRequestAttempts = () => ({ created: 1 });
  
      const handler = new TweetHandler(queue, twitter, db, 0)
      await handler.handleTweet(validTweetUrl, 0);
      expect(queue['{"address":"0x8db6B632D743aef641146DC943acb64957155388","color":0}']).to.be.true;
    });

    it('should put address into sending queue if address is reused', async () => {
      withTweet(validTweet);
      const earlier = new Date();
      earlier.setHours(-25);
      db.getAddr = () => ({ created: earlier });
  
      await handler().handleTweet(validTweetUrl, 0);
  
      expect(queue['{"address":"0x8db6B632D743aef641146DC943acb64957155388","color":0}']).to.be.true;
    });

    it('should put address into sending queue', async () => {
      withTweet(validTweet);
  
      await handler().handleTweet(validTweetUrl, 0);
  
      expect(queue['{"address":"0x8db6B632D743aef641146DC943acb64957155388","color":0}']).to.be.true;
    });


  })


});
