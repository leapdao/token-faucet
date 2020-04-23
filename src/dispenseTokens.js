/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const fetch = require('node-fetch');
const { bi, multiply } = require('jsbi-utils');
const { Tx, helpers, Output, Outpoint } = require('leap-core');

const poorManRpc = url => (method, params) =>
  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: "2.0", id: 2895, method, params }),
    headers: { 'Content-Type': 'application/json' },
  }).then(resp => resp.json()).then(resp => resp.result);
const NFT_COLOR = 32769;


module.exports = async (requests, provider, faucetAddr, privKey, amount, color) => {
  amount = bi(amount);
  const totalOutputValue = multiply(amount, bi(requests.length));
  
  const rpc = poorManRpc(provider);

  // let's create faucet tx

  // calc inputs
  const utxos = (await rpc("plasma_unspent", [faucetAddr, color]))
    .map(u => ({
      output: u.output,
      outpoint: Outpoint.fromRaw(u.outpoint),
    }));

  if (utxos.length === 0) {
    throw new Error(`No tokens of color ${color} in the faucet`);
  }

  let tx;
  let inputs = [];
  let outputs = [];
  if (color < NFT_COLOR) {
    inputs = helpers.calcInputs(utxos, faucetAddr, totalOutputValue, color);

    // create change output if needed
    outputs = helpers.calcOutputs(utxos, inputs, faucetAddr, faucetAddr, totalOutputValue, color);
    if (outputs.length > 1) { // if we have change output
      outputs = outputs.splice(-1); // leave only change
    } else {
      outputs = [];
    }

    // add output for each faucet request
    outputs = outputs.concat(requests.map(address => new Output(amount, address, color)));
    
    tx = Tx.transfer(inputs, outputs).signAll(privKey);
  } else {
    for (let i = 0; i < requests.length; i++) {
      inputs.push(utxos[i]);
      outputs.push(new Output(utxos[i].output.value, requests[i], color, utxos.output.data));
    }
    tx = Tx.transfer(inputs, outputs).signAll(privKey);
  }

  console.log(tx.toJSON()); // eslint-disable-line no-console

  // eslint-disable-next-line no-console
  console.log(await rpc("eth_sendRawTransaction", [tx.hex()])); 
}