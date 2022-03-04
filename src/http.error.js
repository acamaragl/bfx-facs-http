'use strict'

const { format } = require('util')

/**
 * User friendly error that is shown directly to endusers
 */
class HttpError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - Http status code
   * @param {string} statusText - Http status message
   * @param {Object<string, string>} [headers] - Http response headers
   * @param {any} [response] - Http response body
   */
  constructor (message, status, statusText, headers = {}, response = null) {
    super(message)

    this.name = this.constructor.name
    this.status = status
    this.statusText = statusText
    this.headers = headers
    this.response = response

    Error.captureStackTrace(this, this.constructor)
    const [errText, ...trace] = this.stack.split('\n')
    this.stack = [
      errText,
      `Headers: ${format(this.headers)}`,
      `Response: ${format(this.response)}`,
      ...trace
    ].join('\n')
  }

  /**
   * This method is called from JSON.stringify function when serializing object
   * @returns {{ message: string, code: number, name: string }}
   */
  toJSON () {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      response: this.response
    }
  }
}

module.exports = HttpError
