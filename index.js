const { downloadVredditVideo } = require('./src/CaptureVideo')
downloadVredditVideo(
  'https://old.reddit.com/r/WatchPeopleDieInside/comments/jn7z9q/shamelessly_stolen_from_facebook_guy_gets_caught/',
  './test/').catch(console.log)
