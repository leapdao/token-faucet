/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { bufferToHex, privateToAddress, toBuffer } = require('ethereumjs-util');
const { Properties } = require('leap-lambda-boilerplate');
const dispenseTokens = require('./dispenseTokens');

const groupValuesByColor = (values, str) => {
	const elem = JSON.parse(str);
  return Object.assign({}, values, {
    [`${elem.color}`]: (values[`${elem.color}`] || new Set()).add(BigInt(elem.address))
  });
};

exports.handler = async (event) => {
  const provider = process.env.PROVIDER_URL;
  const amount = process.env.AMOUNT;
  const privKey = await Properties.readEncrypted(`/faucet/${process.env.ENV}/PRIV_KEY`);
  const faucetAddr = bufferToHex(privateToAddress(toBuffer(privKey)));

  let requests = event.Records.map(r => r.body);

  // todo, order requests by color here
  requests = requests.reduce(groupValuesByColor, {});
  console.log('requests: ', requests);

  for (var color in requests) {
    if (requests.hasOwnProperty(color)) {
        await dispenseTokens(requests[color], provider, faucetAddr, privKey, amount, parseInt(color));
    }
	}

  
};
