/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { bufferToHex, privateToAddress, toBuffer } = require('ethereumjs-util');
const { Properties } = require('leap-lambda-boilerplate');
const dispenseTokens = require('./dispenseTokens');

exports.handler = async (event) => {
  const provider = process.env.PROVIDER_URL;
  const amount = process.env.AMOUNT;
  const privKey = await Properties.readEncrypted(`/faucet/${process.env.ENV}/PRIV_KEY`);
  const faucetAddr = bufferToHex(privateToAddress(toBuffer(privKey)));

  const requests = event.Records.map(r => r.body);

  await dispenseTokens(requests, provider, faucetAddr, privKey, amount);
};
