const { downloadVredditVideo } = require('./CaptureVideo')
downloadVredditVideo(
  'https://old.reddit.com/r/PublicFreakout/comments/jkdnfl/florida_maga_man_heckles_pete_buttigieg_who',
  './tests').then().catch()
