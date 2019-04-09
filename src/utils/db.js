/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Db } = require('leap-lambda-boilerplate');

module.exports = class FaucetDb extends Db {

  constructor(tableName) {
    super(tableName);
  }

  setAddr(addr) {
    this.setAttr(addr, new Date().toString());
  }

  setTwitterAccountRequestAttempts(account, count) {
    this.setAttr(account, String(count));
  }

  async getAddr(addr) {
    return this.getAttr(addr).then(a => ({ created: new Date(a.created) }));
  }

  async getTwitterAccountRequestAttempts(account) {
    return this.getAttr(account).then(a => ({ created: Number(a.created) }));
  }
  
}
