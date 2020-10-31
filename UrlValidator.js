'use strict'
const axios = require('axios')

const validUrl = [
  'old.reddit.com',
  'www.reddit.com',
  'v.redd.it',
  'vcf.redd.it'
]

/**
 *
 * @param url
 * @return {Promise<boolean>}
 */
const checkRedditUrl = async (url) => {
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
 * @return {Promise<{audioUrl: string, videoUrl: string}>}
 */
module.exports.sanitizeUrlFromReddit = async (redditUrl) => {
  try {
    let result = null
    if (await checkRedditUrl(redditUrl)) {
      const urlJson = redditUrl + '.json'
      const response = await axios({
        method: 'get',
        url: urlJson,
        responseType: 'json'
      })
      // Abstract the overly complex reddit json object
      const narrowedDownData = response.data[0].data.children[0].data
      if (narrowedDownData.is_reddit_media_domain &&
        narrowedDownData.is_video &&
        narrowedDownData.secure_media.reddit_video.is_gif === false) {
        result = {
          title: narrowedDownData.title,
          videoUrl: narrowedDownData.secure_media.reddit_video.fallback_url,
          audioUrl: narrowedDownData.url + '/DASH_audio.mp4'
        }
      } else {
        throw new Error(
          'error: ' + narrowedDownData.url + ' is not reddit media domain.')
      }
      return result
    }
    throw new Error('invalid Reddit url: ' + redditUrl)
  } catch (err) {
    console.log(err)
  }
}
