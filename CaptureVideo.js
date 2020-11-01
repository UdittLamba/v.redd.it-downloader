'use strict'
const fs = require('fs')
const axios = require('axios')
const { toSnakeCase, mergeAudioVideo } = require('./utils')
const { sanitizeUrlFromReddit } = require('./UrlValidator.js')

/**
 * Downloads v.redd.it video.
 * video === true && audio === true <default>: gets video with audio.
 * video === true && audio === false: video without audio (mp4 GIF).
 * video === false && audio === true: audio without video.
 * video === false && audio === false: throw an error.
 *
 * @param url {String}
 * @param outputPath {String}
 * @param method {String}
 * @param responseType {String}
 * @param video {Boolean}
 * @param audio {Boolean}
 * @return {Promise<void>}
 */
module.exports.downloadVredditVideo =
  async (
    url, outputPath, method = 'get', responseType = 'stream', video = true,
    audio = true
  ) => {
    try {
      let redditVideo, redditAudio
      if (video === false && audio === false) {
        throw new Error('variables audio and video cannot be both false')
      }
      const sanitizedUrl = await sanitizeUrlFromReddit(url)
      if (video) {
        // eslint-disable-next-line no-unused-vars
        redditVideo = captureVredditAudioVideo(
          sanitizedUrl.videoUrl, toSnakeCase(sanitizedUrl.title) + '.mp4',
          outputPath)
      }
      if (audio) {
        redditAudio = captureVredditAudioVideo(
          sanitizedUrl.audioUrl, toSnakeCase(sanitizedUrl.title) + '_audio' + '.mp3',
          outputPath)
        // console.log(redditAudio)
      }
      if (video === true && audio === true) {
        const values = await Promise.all([redditVideo, redditAudio])
        await mergeAudioVideo(values[0], values[1])
        // const value = await mergeAudioVideo(redditVideo, redditAudio)
        // console.log(value)
      }
    } catch (err) {
      console.log(err)
    }
  }

/**
 *
 * @param url
 * @param outputFileName
 * @param method
 * @param responseType
 * @param outputPath
 * @return {Promise<string>}
 */
const captureVredditAudioVideo =
  (
    url, outputFileName, outputPath, method = 'get', responseType = 'stream'
  ) => {
    return new Promise((resolve, reject) => {
      const buffArray = []
      axios({
        method: method,
        url: url,
        responseType: responseType
      }).then((response) => {
        // console.log(response)
        response.data.on('data', (chunk) => {
          buffArray.push(chunk)
        })
        response.data.on('end', () => {
          const buff = Buffer.concat(buffArray)
          fs.writeFile(outputPath + '/' + outputFileName, buff, (dt) => {
            if (dt === null) {
              console.log('File created at: ' + outputPath + '/' + outputFileName)
              resolve(outputPath + '/' + outputFileName)
            } else {
              reject(dt)
              console.log('Error while writing file :' + outputFileName)
            }
          })
        })
      })
    })
  }
