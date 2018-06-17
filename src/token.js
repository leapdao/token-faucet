import Contract from './contract';

export const TOKEN_ABI = [{ constant: true, inputs: [{ name: '_owner', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ name: '_to', type: 'address' }, { name: '_amountBabz', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }];

export default class Token extends Contract {

  constructor(web3, senderAddr, sqs, queueUrl, tokenAddr) {
    super(web3, senderAddr, sqs, queueUrl);
    this.tokenAddr = tokenAddr;
  }

  balanceOf(address) {
    const contract = this.web3.eth.contract(TOKEN_ABI).at(this.tokenAddr);
    return this.call(contract.balanceOf.call, address);
  }

  transfer(to, amount) {
    const contract = this.web3.eth.contract(TOKEN_ABI).at(this.tokenAddr);
    return this.sendTransaction(
      contract,
      'transfer',
      200000,
      [to, amount],
    );
  }

}
