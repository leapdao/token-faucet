/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const AWS = require('aws-sdk');
const { bufferToHex, privateToAddress, toBuffer } = require('ethereumjs-util');

const dispenseTokens = require('./dispenseTokens');

const ssm = new AWS.SSM();

const readEncryptedProperty = name => new Promise((resolve, reject) => {
  ssm.getParameter({ Name: name, WithDecryption: true }, (err, data) => {
    if (err) return reject(err);
    return resolve(data.Parameter.Value);
  });
});

exports.handler = async (event) => {
  const provider = process.env.PROVIDER_URL;
  const amount = process.env.AMOUNT;
  const privKey = await readEncryptedProperty(`/faucet/${process.env.ENV}/PRIV_KEY`);
  const faucetAddr = bufferToHex(privateToAddress(toBuffer(privKey)));

  const requests = event.Records.map(r => r.body);

  await dispenseTokens(requests, provider, faucetAddr, privKey, amount);
};
