/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const AWS = require('aws-sdk');

const Twitter = require('twitter');
const Db = require('./utils/db');
const { Queue } = require('leap-lambda-boilerplate');
const TweetHandler = require('./tweetHandler');

exports.handler = async (event, context) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  const client = new Twitter({
    consumer_key: process.env.TW_CONSUMER_KEY,
    consumer_secret: process.env.TW_CONSUMER_SECRET,
    access_token_key: process.env.TW_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET,
  });

  const awsAccountId = context.invokedFunctionArn.split(':')[4];
  const queueUrl = `https://sqs.${process.env.REGION}.amazonaws.com/${awsAccountId}/${process.env.QUEUE_NAME}`;

  const queue = new Queue(new AWS.SQS(), queueUrl);

  const service = new TweetHandler(
    queue,
    client,
    new Db(process.env.TABLE_NAME),
    Number(process.env.ATTEMPTS_PER_ACCOUNT || 0),
  );

  const address = await service.handleTweet(body.tweetUrl);

  return { 
    statusCode: 200,
    body: address
  };
};
