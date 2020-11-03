const fs = require('fs')
const axios = require('axios')
const Ffmpeg = require('./ffmpeg/ffmpeg')
/**
 * @param string {string}
 * @return {string}
 */
module.exports.toSnakeCase = string => {
  return string.replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_')
}

module.exports.mergeAudioVideo = async (videoPath, audioPath, outputPath) => {
  await Ffmpeg(videoPath, async (err, video) => {
    if (!err) {
      console.log('merging...')
      video.addCommand('-i', videoPath)
      video.addCommand('-i', audioPath)
      video.addCommand('-c', 'copy')
      await video.save(outputPath)
      fs.unlink(videoPath, (err) => {
        if (err) throw err
        console.log(videoPath + ' was deleted')
      })
      fs.unlink(audioPath, (err) => {
        if (err) throw err
        console.log(audioPath + ' was deleted')
      })
    } else {
      console.log('Error: ' + err)
    }
  })
}

/**
 *
 * @param url
 * @return {Promise<boolean>}
 */
module.exports.isUrlAccessible = async (url) => {
  try {
    await axios({
      method: 'get',
      url: url,
      responseType: 'json'
    })
    return true
  } catch (e) {
    return false
  }
}
