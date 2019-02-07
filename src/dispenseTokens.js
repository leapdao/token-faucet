/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const fetch = require('node-fetch');
const { Tx, helpers, Output, Outpoint } = require('leap-core');

const rpc = (url, method, params) =>
  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: "2.0", id: 2895, method, params }),
    headers: { 'Content-Type': 'application/json' },
  }).then(resp => resp.json()).then(resp => resp.result);

exports.handler = async (event) => {
  const requests = event.Records.map(r => JSON.parse(r.body));

  const provider = process.env.PROVIDER_URL;

  const amount = process.env.AMOUNT;
  const totalAmount = amount * requests.length;

  const senderAddr = process.env.SENDER_ADDR;
  const utxos = (await rpc(provider, "plasma_unspent", [senderAddr]))
    .map(u => ({
      output: u.output,
      outpoint: Outpoint.fromRaw(u.outpoint),
    }));

  console.log(utxos);

  if (utxos.length === 0) {
    throw new Error("No LEAPs in the faucet");
  }

  const inputs = helpers.calcInputs(utxos, senderAddr, totalAmount, 0);

  let outputs = helpers.calcOutputs(utxos, inputs, senderAddr, senderAddr, totalAmount, 0);
  if (outputs.length > 1) { // if we have change output
    outputs = outputs.splice(-1); // leave only change
  }

  outputs = outputs.concat(requests.map(r => new Output(amount, r.to, 0)));
  
  const tx = Tx.transfer(inputs, outputs).signAll(process.env.PRIV_KEY);

  console.log(tx.toJSON());

  console.log(await rpc(provider, "eth_sendRawTransaction", [tx.hex()]));
};
