const { downloadVredditVideo } = require('./CaptureVideo')
downloadVredditVideo(
  'https://old.reddit.com/r/WatchPeopleDieInside/comments/jn7z9q/shamelessly_stolen_from_facebook_guy_gets_caught/',
  './tests/').catch(console.log)
