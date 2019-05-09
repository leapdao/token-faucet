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
	const list = (values[`${elem.color}`] || []);
	list.push(elem.address);
  return Object.assign({}, values, {
    [`${elem.color}`]: list
  });
};

exports.handler = async (event) => {
  const provider = process.env.PROVIDER_URL;
  const amount = process.env.AMOUNT;
  const privKey = await Properties.readEncrypted(`/faucet/${process.env.ENV}/PRIV_KEY`);
  const faucetAddr = bufferToHex(privateToAddress(toBuffer(privKey)));

  const requests = event.Records.map(r => r.body);

  // todo, order requests by color here
  const colorList = requests.reduce(groupValuesByColor, {});

  Object.keys(colorList).forEach(color => 
     dispenseTokens(colorList[color], provider, faucetAddr, privKey, amount, parseInt(color))
  )  
};
