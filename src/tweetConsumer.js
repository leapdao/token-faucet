/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const url = require('url');
const { isValidAddress } = require('ethereumjs-util');
const { BadRequest } = require('./utils/errors');

const isValidUrl = (string) => {
  try {
    const res = url.parse(string);
    return (res.hostname === 'twitter.com');
  } catch (err) {
    return false;
  }
};

function getTweet(client, id) {
  return new Promise((resolve, reject) => {
    client.get(`statuses/show/${id}`, {}, (error, tweet) => {
      if (error) {
        return reject(error);
      }
      return resolve(tweet);
    });
  });
}

module.exports = class TweetConsumer {

  constructor(queue, twitter, db) {
    this.queue = queue;
    this.twitter = twitter;
    this.db = db;
  }

  async tweetFund(tweetUrl, amount) {
    if (!isValidUrl(tweetUrl)) {
      // http 400
      throw new BadRequest(`url ${tweetUrl} not valid.`);
    }
    
    // parse url
    const [tweetId] = tweetUrl.match(/(?:[0-9]*)$/g);
    if (tweetId.length < 18) {
      // http 400
      throw new BadRequest(`could not parse tweet id, got '${tweetId}'.`);
    }
    
    // check tweetId not used before
    // get tweet content
    const tweet = await getTweet(this.twitter, tweetId);
    
    // parse address
    let address = tweet.text.match(/(?:0x[a-fA-F0-9]{40})/g);
    if (!address || !isValidAddress(address[0])) {
      throw new BadRequest(`Tweet should include valid Ethereum address 🤷‍♂️`);
    }

    let leapMention = tweet.text.match(/@Leapdao/i);
    if (!leapMention) {
      throw new BadRequest(`Tweet should be mentioning @Leapdao 🤷‍♂️`);
    }
    address = address[0];

    const { created } = await this.db.getAddr(address);
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (dayAgo < created) {
      throw new BadRequest(`not enough time passed since the last claim`);
    }

    await this.queue.put(address, amount);
    await this.db.setAddr(address);

    return address;
  }

}
