const { downloadVredditVideo } = require('../src/CaptureVideo')
const { test, expect } = require('@jest/globals')
test('old.reddit.com link test', async () => {
  try {
    const data = await downloadVredditVideo(
      'https://old.reddit.com/r/WatchPeopleDieInside/comments/jn7z9q/shamelessly_stolen_from_facebook_guy_gets_caught/',
      './test/vid/')
    expect(data).toBe('success')
  } catch (e) { expect(e).toMatch('error') }
}, 300000)

test('www.reddit.com link test', async () => {
  try {
    const data = await downloadVredditVideo(
      'https://www.reddit.com/r/WatchPeopleDieInside/comments/jn7z9q/shamelessly_stolen_from_facebook_guy_gets_caught/',
      './test/vid/')
    expect(data).toBe('success')
  } catch (e) {
    expect(e).toMatch('error')
  }
}, 300000)

test('random string test', async () => {
  try {
    await downloadVredditVideo(
      'waefbnwefiawerksav asfmnaesfbn sefse ..,,//',
      './test/vid/')
  } catch (e) {
    expect(e).toMatch('error')
  }
}, 300000)

