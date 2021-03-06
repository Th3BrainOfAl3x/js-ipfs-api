'use strict'

const promisify = require('promisify-es6')
const once = require('once')
const parseUrl = require('url').parse

const request = require('../../request')
const addToDagNodesTransform = require('./../../add-to-dagnode-transform')

module.exports = (send) => {
  return promisify((url, opts, callback) => {
    if (typeof (opts) === 'function' &&
        callback === undefined) {
      callback = opts
      opts = {}
    }

    // opts is the real callback --
    // 'callback' is being injected by promisify
    if (typeof opts === 'function' &&
        typeof callback === 'function') {
      callback = opts
      opts = {}
    }

    if (typeof url !== 'string' ||
        !url.startsWith('http')) {
      return callback(new Error('"url" param must be an http(s) url'))
    }

    const sendWithTransform = send.withTransform(addToDagNodesTransform)
    callback = once(callback)

    request(parseUrl(url).protocol)(url, (res) => {
      res.once('error', callback)
      if (res.statusCode >= 400) {
        return callback(new Error(`Failed to download with ${res.statusCode}`))
      }

      sendWithTransform({
        path: 'add',
        qs: opts,
        files: res
      }, callback)
    }).end()
  })
}
