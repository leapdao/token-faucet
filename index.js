/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const Web3 = require('web3');
const AWS = require('aws-sdk');
const Twitter = require('twitter');

const Db = require('./src/db');
const Token = require('./src/token');
const FaucetService = require('./src/index');

const simpledb = new AWS.SimpleDB();
let web3Provider;

exports.handler = function handler(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false; // eslint-disable-line no-param-reassign

  try {
    const client = new Twitter({
      consumer_key: process.env.CONSUMER_KEY,
      consumer_secret: process.env.CONSUMER_SECRET,
      access_token_key: process.env.ACCESS_TOKEN_KEY,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    });

    // get configuration
    const tableName = process.env.TABLE_NAME;
    const providerUrl = process.env.PROVIDER_URL;
    const path = (event.context || {})['resource-path'] || '';
    let web3;

    // set up web3 and worker
    if (!web3Provider) {
      web3 = new Web3();
      web3Provider = new web3.providers.HttpProvider(providerUrl);
    }
    web3 = new Web3(web3Provider);
    const token = new Token(
      web3,
      process.env.SENDER_ADDR,
      new AWS.SQS(),
      process.env.QUEUE_URL,
      process.env.TOKEN_ADDR
    );
    const service = new FaucetService(
      token,
      client,
      new Db(simpledb, tableName),
      web3
    );

    const getRequestHandler = () => {
      if (path.indexOf('tweetFund') > -1) {
        return service.tweetFund(event.tweetUrl, parseInt(process.env.AMOUNT, 10));
      }
      return Promise.reject(`Not Found: unexpected path: ${path}`);
    };

    getRequestHandler()
      .then(data => callback(null, data))
      .catch(err => callback(err));
  } catch (err) {
    callback(err);
  }
};
