'use strict'

const Base = require('bfx-facs-base')

class HttpFacility extends Base {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)

    this.name = 'http'
    this._hasConf = false
    this.init()
  }
}

module.exports = HttpFacility
