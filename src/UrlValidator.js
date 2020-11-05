'use strict'
const axios = require('axios')
const { isUrlAccessible } = require('./utils')

const validUrl = [
  'old.reddit.com',
  'www.reddit.com'
]

/**
 *
 * @param url
 * @return {boolean}
 */
const checkRedditUrl = (url) => {
  for (const pattern of validUrl) {
    if (url.includes(pattern)) {
      return true
    }
  }
  return false
}

/**
 *
 * @param redditUrl
 * @return {Promise<{audioUrl: string, videoUrl: string, title: *}|{audioUrl: [*], videoUrl: *, title: *}>}
 */
module.exports.sanitizeUrlFromReddit = async (redditUrl) => {
  let isAccessible, audioUrl
  let result = null
  if (checkRedditUrl(redditUrl)) {
    const urlJson = redditUrl + '.json'
    const response = await axios({
      method: 'get',
      url: urlJson,
      responseType: 'json'
    })
    // Abstracting the overly complex reddit json object
    const narrowedDownData = response.data[0].data.children[0].data
    if (narrowedDownData.is_reddit_media_domain) {
      if (!narrowedDownData.secure_media.reddit_video.is_gif) {
        isAccessible = await isUrlAccessible(narrowedDownData.url + '/audio')
        if (isAccessible) {
          audioUrl = narrowedDownData.url + '/audio'
        } else {
          audioUrl = narrowedDownData.url + '/DASH_audio.mp4'
        }
        result = {
          title: narrowedDownData.title,
          videoUrl: narrowedDownData.secure_media.reddit_video.fallback_url,
          // reddit for some reason uses two different nomenclatures for audio so, had to keep it in mind.
          audioUrl: audioUrl
        }
      } else {
        result = {
          title: narrowedDownData.title,
          videoUrl: narrowedDownData.secure_media.reddit_video.fallback_url,
          audioUrl: ''
        }
      }
    } else {
      throw new Error(
        'error: ' + narrowedDownData.url + ' is not reddit media domain.')
    }
    return result
  }
  throw new Error('invalid Reddit url: ' + redditUrl)
}
