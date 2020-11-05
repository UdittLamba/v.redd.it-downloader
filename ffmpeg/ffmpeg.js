const when = require('when')
const fs = require('fs')

const errors = require('./errors')
const utils = require('./utils')
const Configs = require('./configs')
const Video = require('./video')

const ffmpeg = function (/* inputFilepath, settings, callback */) {
  /**
   *  Retrieve the list of the codec supported by the ffmpeg software
   */
  const _ffmpegInfoConfiguration = function (settings) {
    // New 'promise' instance
    const deferred = when.defer()
    // Instance the new arrays for the format
    const format = { modules: [], encode: [], decode: [] }
    // Make the call to retrieve information about the ffmpeg
    utils.exec(['ffmpeg', '-formats', '2>&1'], settings, (error, stdout) => {
      // Get the list of modules
      const configuration = /configuration:(.*)/.exec(stdout)
      // Check if exists the configuration
      if (configuration) {
        // Get the list of modules
        const modules = configuration[1].match(/--enable-([a-zA-Z0-9-]+)/g)
        // Scan all modules
        for (const indexModule in modules) {
          // Add module to the list
          format.modules.push(/--enable-([a-zA-Z0-9-]+)/.exec(modules[indexModule])[1])
        }
      }
      // Get the codec list
      const codecList = stdout.match(/ (DE|D|E) (.*) {1,} (.*)/g)
      // Scan all codec
      for (const i in codecList) {
        // Get the match value
        const match = / (DE|D|E) (.*) {1,} (.*)/.exec(codecList[i])
        // Check if match is valid
        if (match) {
          // Get the value from the match
          const scope = match[1].replace(/\s/g, '')
          const extension = match[2].replace(/\s/g, '')
          // Check which scope is best suited
          if (scope === 'D' || scope === 'DE') { format.decode.push(extension) }
          if (scope === 'E' || scope === 'DE') { format.encode.push(extension) }
        }
      }
      // Returns the list of supported formats
      deferred.resolve(format)
    })
    // Return 'promise' instance
    return deferred.promise
  }

  /**
   * Get the video info
   */
  const _videoInfo = function (fileInput, settings) {
    // New 'promise' instance
    const deferred = when.defer()
    // Make the call to retrieve information about the ffmpeg
    utils.exec(['ffmpeg', '-i', fileInput, '2>&1'], settings, (error, stdout, stderr) => {
      // Perse output for retrieve the file info
      const filename = /from '(.*)'/.exec(stdout) || []
      const title = /(INAM|title)\s+:\s(.+)/.exec(stdout) || []
      const artist = /artist\s+:\s(.+)/.exec(stdout) || []
      const album = /album\s+:\s(.+)/.exec(stdout) || []
      const track = /track\s+:\s(.+)/.exec(stdout) || []
      const date = /date\s+:\s(.+)/.exec(stdout) || []
      const isSynched = (/start: 0.000000/.exec(stdout) !== null)
      const duration = /Duration: (([0-9]+):([0-9]{2}):([0-9]{2}).([0-9]+))/.exec(stdout) || []

      const container = /Input #0, ([a-zA-Z0-9]+),/.exec(stdout) || []
      const videoBitrate = /bitrate: ([0-9]+) kb\/s/.exec(stdout) || []
      const videoStream = /Stream #([0-9.]+)([a-z0-9()[\]]*)[:] Video/.exec(stdout) || []
      const videoCodec = /Video: ([\w]+)/.exec(stdout) || []
      const resolution = /(([0-9]{2,5})x([0-9]{2,5}))/.exec(stdout) || []
      const pixel = /[SP]AR ([0-9:]+)/.exec(stdout) || []
      const aspect = /DAR ([0-9:]+)/.exec(stdout) || []
      const fps = /([0-9.]+) (fps|tb\(r\))/.exec(stdout) || []

      const audioStream = /Stream #([0-9.]+)([a-z0-9()[\]]*)[:] Audio/.exec(stdout) || []
      const audioCodec = /Audio: ([\w]+)/.exec(stdout) || []
      const sampleRate = /([0-9]+) Hz/i.exec(stdout) || []
      const channels = /Audio:.* (stereo|mono)/.exec(stdout) || []
      const audioBitrate = /Audio:.* ([0-9]+) kb\/s/.exec(stdout) || []
      const rotate = /rotate[\s]+:[\s]([\d]{2,3})/.exec(stdout) || []
      // Build return object
      const ret = {
        filename: filename[1] || '',
        title: title[2] || '',
        artist: artist[1] || '',
        album: album[1] || '',
        track: track[1] || '',
        date: date[1] || '',
        synched: isSynched,
        duration: {
          raw: duration[1] || '',
          seconds: duration[1] ? utils.durationToSeconds(duration[1]) : 0
        },
        video: {
          container: container[1] || '',
          bitrate: (videoBitrate.length > 1) ? parseInt(videoBitrate[1], 10) : 0,
          stream: videoStream.length > 1 ? parseFloat(videoStream[1]) : 0.0,
          codec: videoCodec[1] || '',
          resolution: {
            w: resolution.length > 2 ? parseInt(resolution[2], 10) : 0,
            h: resolution.length > 3 ? parseInt(resolution[3], 10) : 0
          },
          resolutionSquare: {},
          aspect: {},
          rotate: rotate.length > 1 ? parseInt(rotate[1], 10) : 0,
          fps: fps.length > 1 ? parseFloat(fps[1]) : 0.0
        },
        audio: {
          codec: audioCodec[1] || '',
          bitrate: audioBitrate[1] || '',
          sample_rate: sampleRate.length > 1 ? parseInt(sampleRate[1], 10) : 0,
          stream: audioStream.length > 1 ? parseFloat(audioStream[1]) : 0.0,
          channels: {
            raw: channels[1] || '',
            value: (channels.length > 0) ? ({ stereo: 2, mono: 1 }[channels[1]] || 0) : ''
          }
        }
      }
      // Check if exist aspect ratio
      if (aspect.length > 0) {
        const aspectValue = aspect[1].split(':')
        ret.video.aspect.x = parseInt(aspectValue[0], 10)
        ret.video.aspect.y = parseInt(aspectValue[1], 10)
        ret.video.aspect.string = aspect[1]
        ret.video.aspect.value = parseFloat((ret.video.aspect.x / ret.video.aspect.y))
      } else {
        // If exists horizontal resolution then calculate aspect ratio
        if (ret.video.resolution.w > 0) {
          const gcdValue = utils.gcd(ret.video.resolution.w, ret.video.resolution.h)
          // Calculate aspect ratio
          ret.video.aspect.x = ret.video.resolution.w / gcdValue
          ret.video.aspect.y = ret.video.resolution.h / gcdValue
          ret.video.aspect.string = ret.video.aspect.x + ':' + ret.video.aspect.y
          ret.video.aspect.value = parseFloat((ret.video.aspect.x / ret.video.aspect.y))
        }
      }
      // Save pixel ratio for output size calculation
      if (pixel.length > 0) {
        ret.video.pixelString = pixel[1]
        const pixelValue = pixel[1].split(':')
        ret.video.pixel = parseFloat((parseInt(pixelValue[0], 10) / parseInt(pixelValue[1], 10)))
      } else {
        if (ret.video.resolution.w !== 0) {
          ret.video.pixelString = '1:1'
          ret.video.pixel = 1
        } else {
          ret.video.pixelString = ''
          ret.video.pixel = 0.0
        }
      }
      // Correct video.resolution when pixel aspectratio is not 1
      if (ret.video.pixel !== 1 || ret.video.pixel !== 0) {
        if (ret.video.pixel > 1) {
          ret.video.resolutionSquare.w = parseInt(ret.video.resolution.w * ret.video.pixel, 10)
          ret.video.resolutionSquare.h = ret.video.resolution.h
        } else {
          ret.video.resolutionSquare.w = ret.video.resolution.w
          ret.video.resolutionSquare.h = parseInt(ret.video.resolution.h / ret.video.pixel, 10)
        }
      }
      // Returns the list of supported formats
      deferred.resolve(ret)
    })
    // Return 'promise' instance
    return deferred.promise
  }

  /**
   * Get the info about ffmpeg's codec and about file
   */
  const _getInformation = function (fileInput, settings) {
    const deferreds = []
    // Add promise
    deferreds.push(_ffmpegInfoConfiguration(settings))
    deferreds.push(_videoInfo(fileInput, settings))
    // Return defer
    return when.all(deferreds)
  }

  const __constructor = function (args) {
    // Check if exist at least one option
    if (args.length === 0 || args[0] === undefined) { throw errors.renderError('empty_input_filepath') }
    // Check if first argument is a string
    if (typeof args[0] !== 'string') { throw errors.renderError('input_filepath_must_be_string') }
    // Get the input filepath
    const inputFilepath = args[0]
    // Check if file exist
    if (!fs.existsSync(inputFilepath)) { throw errors.renderError('fileinput_not_exist') }

    // New instance of the base configuration
    const settings = new Configs()
    // Callback to call
    let callback = null

    // Scan all arguments
    for (let i = 1; i < args.length; i++) {
      // Check the type of variable
      switch (typeof args[i]) {
        case 'object' :
          utils.mergeObject(settings, args[i])
          break
        case 'function' :
          callback = args[i]
          break
      }
    }

    // Building the value for return value. Check if the callback is not a function. In this case will created a new instance of the deferred class
    const deferred = typeof callback !== 'function' ? when.defer() : { promise: null }

    when(_getInformation(inputFilepath, settings), function (data) {
      // Check if the callback is a function
      if (typeof callback === 'function') {
        // Call the callback function e return the new instance of 'video' class
        callback(null, new Video(inputFilepath, settings, data[0], data[1]))
      } else {
        // Positive response
        deferred.resolve(new Video(inputFilepath, settings, data[0], data[1]))
      }
    }, function (error) {
      // Check if the callback is a function
      if (typeof callback === 'function') {
        // Call the callback function e return the error found
        callback(error, null)
      } else {
        // Negative response
        deferred.reject(error)
      }
    })

    // Return a possible promise instance
    return deferred.promise
  }

  return __constructor.call(this, arguments)
}

module.exports = ffmpeg
