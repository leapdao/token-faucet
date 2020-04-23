/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const AWS = require("aws-sdk");
const { isValidAddress } = require("ethereumjs-util");
const { Queue, Errors } = require("leap-lambda-boilerplate");
const Db = require("./utils/db");
const util = require("ethereumjs-util");
const Web3 = require("web3");
const ERC721ABI = [
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  }, {"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"tokensOfOwner","outputs":[{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"}
];


const votingBalanceCardColor = 49159;

const checkSignature = (voteAddr, signature) => {
  const nonce = util.hashPersonalMessage(Buffer.from(voteAddr.replace('0x', '')), 'hex');
  const {v, r, s} = util.fromRpcSig(signature);
  const pubKey  = util.ecrecover(nonce, v, r, s);
  const addrBuf = util.pubToAddress(pubKey);
  const addr    = util.bufferToHex(addrBuf);
  return addr;
};

exports.checkSignature = checkSignature;

const handleResponse = (fulfill, reject) => (err, value) => {
  if (err) {
    reject(`Error: ${err.toString()}`);
    return;
  }
  fulfill(value);
};

const balanceOf = (tokenContract, addr) =>
  new Promise((fulfill, reject) =>
    tokenContract.balanceOf.call(addr, handleResponse(fulfill, reject)));

const tokensOfOwner = (tokenContract, addr) =>
  new Promise((fulfill, reject) =>
    tokenContract.tokensOfOwner.call(addr, handleResponse(fulfill, reject)));


const handleEthTurin = async (body, tokenContract, db, queue) => {


  const tokenCount = await tokensOfOwner(tokenContract, body.address);
  if (tokenCount.length < 1) {
    throw new Errors.BadRequest(`${body.address} not token holder`);
  }

  const { created } = await db.getAddr(`${tokenCount[0]}`);
  const dayAgo = Date.now() - 120 * 60 * 60 * 1000; // 5 days
  if (dayAgo < created) {
    throw new Errors.BadRequest("not enough time passed since the last claim");
  }

  // check signature
  const recovered = checkSignature(body.toAddress, body.sig);
  if (util.toChecksumAddress(body.address) !== util.toChecksumAddress(recovered)) {
    throw new Errors.BadRequest(
      `address not signer: ${body.address}, recovered: ${recovered}`
    );
  }

  if (body.color !== 4) {
    throw new Errors.BadRequest("wrong voice credit color");
  }

  await queue.put(
    JSON.stringify({
      address: body.toAddress,
      color: body.color
    })
  );
  await queue.put(
    JSON.stringify({
      address: body.toAddress,
      color: votingBalanceCardColor
    })
  );
  // todo: also send balance card
  await db.setAddr(`${tokenCount[0]}`);

  return {
    statusCode: 200,
    body: { address: body.address, color: body.color },
  };
};

exports.handleEthTurin = handleEthTurin;

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = true;

  const body =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const address = body.address;
  const color = parseInt(body.color) || 0;

  const awsAccountId = context.invokedFunctionArn.split(":")[4];
  const queueUrl = `https://sqs.${process.env.REGION}.amazonaws.com/${awsAccountId}/${process.env.QUEUE_NAME}`;
  const nftAddr = process.env.NFT_ADDR;
  const providerUrl = process.env.PROVIDER_URL;

  const queue = new Queue(new AWS.SQS(), queueUrl);
  const db = new Db(process.env.TABLE_NAME);

  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const tokenContract = web3.eth.contract(ERC721ABI).at(nftAddr);

  if (!isValidAddress(address)) {
    throw new Errors.BadRequest(`Not a valid Ethereum address: ${address}`);
  }

  if (color > 0 && body.sig) {
    return handleEthTurin(body, tokenContract, db, queue);
  }

  const { created } = await db.getAddr(address);
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (dayAgo < created) {
    throw new Errors.BadRequest(`not enough time passed since the last claim`);
  }

  await queue.put(JSON.stringify({ address, color }));
  await db.setAddr(address);

  return {
    statusCode: 200,
    body: { address, color },
  };
};
