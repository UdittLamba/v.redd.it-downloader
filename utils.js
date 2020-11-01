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

module.exports.mergeAudioVideo = async (videoPath, audioPath) => {
  await Ffmpeg(videoPath, (err, video) => {
    if (!err) {
      video.addCommand('-i', videoPath)
      video.addCommand('-i', audioPath)
      video.addCommand('-shortest')
      video.save('./tests/output.mp4')
    } else {
      console.log('Error: ' + err)
    }
  })
}
