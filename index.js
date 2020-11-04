const { downloadVredditVideo } = require('./src/CaptureVideo')
downloadVredditVideo(
  'https://old.reddit.com/r/modernwarfare/comments/jnj20h/cod_timing_is_real_i_pooped_my_pants/',
  './test/vid/').catch(console.log)
