/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

class ExtendableError extends Error {
  constructor(message) {
    super();
    const prefix = this.constructor.name.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    this.message = `${prefix}: ${message}`;
    this.errName = this.constructor.name;
  }
}

class Unauthorized extends ExtendableError {}

class Forbidden extends ExtendableError {}

class BadRequest extends ExtendableError {}

class NotFound extends ExtendableError {}

class Conflict extends ExtendableError {}

class EnhanceYourCalm extends ExtendableError {}

class Teapot extends ExtendableError {}

module.exports = { Unauthorized, NotFound, BadRequest, Forbidden, Conflict, EnhanceYourCalm, Teapot };
