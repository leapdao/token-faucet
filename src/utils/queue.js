/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = class Queue {

  constructor(sqs, queueUrl) {
    this.sqs = sqs;
    this.queueUrl = queueUrl;
  }

  put(address) {
    return new Promise((resolve, reject) => {
      this.sqs.sendMessage({
        MessageBody: address,
        QueueUrl: this.queueUrl,
      }, (err, data) => {
        if (err) {
          reject(`sqs error: ${err}`);
        } else {
          resolve(data);
        }
      });
    });
  }

}
