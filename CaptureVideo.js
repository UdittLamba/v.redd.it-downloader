'use strict'
const fs = require('fs')
const axios = require('axios')
const { toSnakeCase } = require('./utils')
const Ffmpeg = require('ffmpeg')

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
      if (video === false && audio === false) {
        throw new Error('variables audio and video cannot be both false')
      }
      const sanitizedUrl = await sanitizeUrlFromReddit(url)
      if (video) {
        // eslint-disable-next-line no-unused-vars
        const redditVideo = await captureVredditAudioVideo(
          sanitizedUrl.videoUrl, toSnakeCase(sanitizedUrl.title) + '.mp4',
          outputPath)
      }
      if (audio) {
        const redditAudioMp4 = await captureVredditAudioVideo(
          sanitizedUrl.audioUrl, toSnakeCase(sanitizedUrl.title) + '_audio' + '.mp4',
          outputPath)
        // Ffmpeg(redditAudioMp4, (err, audio) => {
        //   if (!err) {
        //     // eslint-disable-next-line no-unused-vars
        //     console.log(audio.setVideoCodec('mp3'))
        //   } else {
        //     console.log('Error: ' + err)
        //   }
        // })
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
  async (
    url, outputFileName, outputPath, method = 'get', responseType = 'stream'
  ) => {
    const buffArray = []
    const response = await axios({
      method: method,
      url: url,
      responseType: responseType
    })
    await response.data.on('data', (chunk) => {
      buffArray.push(chunk)
    })

    await response.data.on('end', () => {
      const buff = Buffer.concat(buffArray)
      fs.writeFile(outputPath + '/' + outputFileName, buff, (dt) => {
        console.log('File created')
      })
    })
    return outputPath + '/' + outputFileName
  }
