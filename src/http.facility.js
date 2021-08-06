'use strict'

const _ = require('lodash')
const async = require('async')
const Base = require('bfx-facs-base')
const fetch = require('node-fetch')

class HttpFacility extends Base {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)

    this.name = 'http'
    this._hasConf = false
    this.init()
  }

  _start (cb) {
    async.series([
      next => { super._start(next) },
      next => {
        this.baseUrl = (this.opts.baseUrl || '').replace(/\/$/, '')
        this.timeout = this.opts.timeout || 3000
        this.debug = !!this.opts.debug
        next()
      }
    ], cb)
  }

  _stop (cb) {
    async.series([
      next => { super._stop(next) },
      next => {
        this.baseUrl = ''
        next()
      }
    ], cb)
  }

  /**
   * @param {string} path
   * @param {Object} [opts]
   * @param {string|object} [opts.body]
   * @param {Object<string, string>} [opts.headers]
   * @param {'get'|'head'|'post'|'put'|'delete'|'options'|'patch'} [opts.method]
   * @param {boolean} [opts.redirect]
   * @param {http.Agent} [opts.agent]
   * @param {boolean} [opts.compress]
   * @param {number} [opts.timeout]
   * @param {string|{ req?: string, res?: string }} [opts.encoding]
   * @param {Function} [cb]
   */
  async request (path, opts = {}, cb = null) {
    try {
      if (_.isFunction(opts)) {
        cb = opts
        opts = {}
      }

      const url = path.includes('://') ? path : `${this.baseUrl}/${path.replace(/^\//, '')}`

      const reqOpts = _.pick(opts, ['body', 'headers', 'method', 'redirect', 'agent', 'compress', 'timeout'])
      if (!reqOpts.method) reqOpts.method = 'get'
      if (!reqOpts.timeout) reqOpts.timeout = this.timeout
      reqOpts.redirect = !reqOpts.redirect ? 'manual' : 'follow'

      let reqEnc = 'text'
      let resEnc = 'text'
      switch (typeof opts.encoding) {
        case 'string':
          reqEnc = opts.encoding
          resEnc = opts.encoding
          break
        case 'object':
          reqEnc = opts.encoding.req || 'text'
          resEnc = opts.encoding.res || 'text'
          break
      }

      if (reqEnc === 'json') {
        reqOpts.headers = reqOpts.headers || {}
        reqOpts.headers['content-type'] = 'application/json'
        reqOpts.body = JSON.stringify(reqOpts.body)
      }

      let httpErr = null
      const resp = await fetch(url, reqOpts)
      let respBody = null

      if (!resp.ok) {
        httpErr = new Error(`ERR_HTTP: ${resp.status} - ${resp.statusText}`)
        httpErr.status = resp.status
        httpErr.statusText = resp.statusText
      }

      if (reqOpts.method === 'head' || reqOpts.method === 'options') {
        respBody = resp.headers
        return this._response(httpErr, respBody, cb)
      }

      try {
        switch (resEnc) {
          case 'json':
            respBody = await resp.json()
            break
          case 'text':
            respBody = await resp.text()
            break
          default:
            respBody = await resp.buffer()
            break
        }
      } catch (err) {
        if (this.debug) console.error(new Date().toISOString(), err)
        if (!httpErr) return this._response(err, null, cb)
      }

      if (httpErr && respBody) httpErr.response = respBody

      return this._response(httpErr, respBody, cb)
    } catch (err) {
      return this._response(err, null, cb)
    }
  }

  async get (path, opts = {}, cb = null) {
    if (_.isFunction(opts)) {
      cb = opts
      opts = {}
    }

    return this.request(path, { ...opts, method: 'get' }, cb)
  }

  async post (path, opts = {}, cb = null) {
    if (_.isFunction(opts)) {
      cb = opts
      opts = {}
    }

    return this.request(path, { ...opts, method: 'post' }, cb)
  }

  async patch (path, opts = {}, cb = null) {
    if (_.isFunction(opts)) {
      cb = opts
      opts = {}
    }

    return this.request(path, { ...opts, method: 'patch' }, cb)
  }

  async put (path, opts = {}, cb = null) {
    if (_.isFunction(opts)) {
      cb = opts
      opts = {}
    }

    return this.request(path, { ...opts, method: 'put' }, cb)
  }

  async delete (path, opts = {}, cb = null) {
    if (_.isFunction(opts)) {
      cb = opts
      opts = {}
    }

    return this.request(path, { ...opts, method: 'delete' }, cb)
  }

  _response (err, res, cb) {
    if (_.isFunction(cb)) return cb(err, res)

    if (err) return Promise.reject(err)
    return Promise.resolve(res)
  }
}

module.exports = HttpFacility
