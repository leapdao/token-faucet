/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

// transform from key/value to list and back
const transform = (data) => {
  let attributes;
  if (Array.isArray(data)) {
    attributes = {};
    data.forEach((aPair) => {
      if (!attributes[aPair.Name]) {
        attributes[aPair.Name] = {};
      }
      attributes[aPair.Name] = aPair.Value;
    });
  } else {
    attributes = [];
    Object.keys(data).forEach((anAttributeName) => {
      if (Array.isArray(data[anAttributeName])) {
        data[anAttributeName].forEach((aValue) => {
          attributes.push({
            Name: anAttributeName,
            Value: aValue,
          });
        });
      } else {
        attributes.push({
          Name: anAttributeName,
          Value: data[anAttributeName],
        });
      }
    });
  }
  return attributes;
};

module.exports = class Db {

  constructor(sdb, tableName) {
    this.sdb = sdb;
    this.tableName = tableName;
  }

  setAddr(addr) {
    return this.putAttributes({
      DomainName: this.tableName,
      ItemName: addr,
      Attributes: [
        { Name: 'created', Value: new Date().toString(), Replace: true },
      ],
    });
  }

  async getAddr(addr) {
    const data = await this.getAttributes({
      DomainName: this.tableName,
      ItemName: addr,
    });

    if (!data.Attributes) {
      return null;
    }

    const rsp = transform(data.Attributes);
    rsp.created = Date.parse(rsp.created);
    return rsp;
  }

  method(name, params) {
    return new Promise((resolve, reject) => {
      this.sdb[name](params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  putAttributes(params) {
    return this.method('putAttributes', params);
  }

  getAttributes(params) {
    return this.method('getAttributes', params);
  }

}
