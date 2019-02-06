/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import { BadRequest } from './errors';

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

export default class FaucetService {

  constructor(token, twitter, db, web3) {
    this.token = token;
    this.twitter = twitter;
    this.db = db;
    this.web3 = web3;
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
    if (!address || !this.web3._extend.utils.isAddress(address[0])) {
      // http 400
      throw new BadRequest(`could not parse valid ethereum address, got '${address}'.`);
    }
    address = address[0];
    let dbRsp = await this.db.getAddr(address);
    dbRsp = (dbRsp) || { created: 0 };
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (dayAgo < dbRsp.created) {
      // http 400
      throw new BadRequest(`not enough time passed since last claim ${dbRsp.created}.`);
    }
    await this.token.transfer(address, amount);
    await this.db.setAddr(address);
    return address;
  }

}
