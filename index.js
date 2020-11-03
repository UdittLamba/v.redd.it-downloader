const { downloadVredditVideo } = require('./CaptureVideo')
downloadVredditVideo(
  'https://old.reddit.com/r/instantkarma/comments/jn48d2/shouldnt_have_done_that/',
  './tests').catch(console.log)
