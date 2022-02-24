/* eslint-env mocha */

'use strict'

const _last = require('lodash/last')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai.use(require('dirty-chai'))
const { format } = require('util')
const { HttpError } = require('../')

describe('http facility tests', () => {
  const message = 'ERR_HTTP: 500 - Internal Server Error'
  const status = 500
  const statusText = 'Internal Server Error'
  const headers = { 'content-type': 'application/json' }
  const response = { foo: 'bar' }

  const logs = []
  const errStub = sinon.stub(console, 'error').callsFake((...args) => {
    const log = format(...args)
    logs.push(log)
  })

  after(() => {
    errStub.restore()
  })

  it('constructor should work without optional params', () => {
    const err = new HttpError(message, status, statusText)
    expect(err).to.be.instanceOf(Error)
    expect(err.status).to.be.equal(status)
    expect(err.statusText).to.be.equal(statusText)
    expect(err.headers).to.be.deep.equal({})
    expect(err.response).to.be.null()
  })

  it('constructor should set optional arguments when provided', () => {
    const err = new HttpError(message, status, statusText, headers, response)
    expect(err).to.be.instanceOf(Error)
    expect(err.status).to.be.equal(status)
    expect(err.statusText).to.be.equal(statusText)
    expect(err.headers).to.be.deep.equal(headers)
    expect(err.response).to.be.deep.equal(response)
  })

  it('toString should print only message as default Error class', () => {
    const err = new HttpError(message, status, statusText, headers, response)
    expect(err.toString()).to.be.equal(`HttpError: ${message}`)
  })

  it('toJSON should return object containing all http info', () => {
    const err = new HttpError(message, status, statusText, headers, response)
    expect(err.toJSON()).to.be.deep.equal({
      name: 'HttpError', message, status, statusText, headers, response
    })
  })

  it('stack trace should print all http related details', () => {
    const err = new HttpError(message, status, statusText, headers, response)
    console.error(err)
    const log = _last(logs)

    expect(log.includes(`HttpError: ${message}`)).to.be.true()
    expect(log.includes(status)).to.be.true()
    expect(log.includes(statusText)).to.be.true()
    expect(log.includes(format(headers))).to.be.true()
    expect(log.includes(format(response))).to.be.true()
  })
})
