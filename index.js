const { downloadVredditVideo } = require('./src/CaptureVideo')
downloadVredditVideo(
  'https://old.reddit.com/r/modernwarfare/comments/jng91o/the_modern_warfare_anime_experience/',
  './test/vid/').catch(console.log)
