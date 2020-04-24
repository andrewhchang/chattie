import puppeteer from 'puppeteer-extra'

/* tslint:disable: no-console */
// waitForNetworkIdle source: https://github.com/puppeteer/puppeteer/issues/1353 @aslushnikov
export function waitForNetworkIdle(page, timeout, maxInflightRequests = 0) {
  page.on('request', onRequestStarted)
  page.on('requestfinished', onRequestFinished)
  page.on('requestfailed', onRequestFinished)

  let inflight = 0
  let fulfill
  const promise = new Promise(x => fulfill = x)
  let timeoutId = setTimeout(onTimeoutDone, timeout)
  return promise

  function onTimeoutDone() {
    page.removeListener('request', onRequestStarted)
    page.removeListener('requestfinished', onRequestFinished)
    page.removeListener('requestfailed', onRequestFinished)
    fulfill();
  }

  function onRequestStarted() {
    ++inflight
    if (inflight > maxInflightRequests)
      clearTimeout(timeoutId)
  }
  
  function onRequestFinished() {
    if (inflight === 0)
      return;
    --inflight;
    if (inflight === maxInflightRequests)
      timeoutId = setTimeout(onTimeoutDone, timeout)
  }
}


export async function googleAuthenticate(page) {
  const navigationPromise = page.waitForNavigation()

  // visit google sign in
  console.log('Navigating to google account login...')
  await page.goto('https://accounts.google.com')
  await navigationPromise

  // enter email
  console.log('Finding email field...')
  await page.waitForSelector('input[type="email"]')
  await page.click('input[type="email"]')
  await navigationPromise
  console.log('Entering email...')
  await page.type('input[type="email"]', process.env.GOOGLE_ACCOUNT_EMAIL)

  // next
  await page.waitForSelector('#identifierNext')
  await page.click('#identifierNext')
  await navigationPromise

  // enter password
  console.log('Finding password field...')
  await page.waitFor(2500)
  await page.waitForSelector('input[type="password"]')
  await page.click('input[type="password"]')
  await navigationPromise
  console.log('Entering password...')
  await page.type('input[type="password"]', process.env.GOOGLE_ACCOUNT_PASSWORD)

  // next
  await page.waitForSelector('#passwordNext')
  await page.click('#passwordNext')
  await navigationPromise
  await page.waitFor(500)

  // in case of a confirm screen
  try {
      await page.waitForSelector('#confirm', {timeout: 500})
      await page.click('#confirm')
      await navigationPromise
  } catch (err) {
      console.log("No confirm page found. Navigating to meeting...")
  }
}

export async function sniffUsers(url) {
  const StealthPlugin = require('puppeteer-extra-plugin-stealth')
  const chromium = require('chrome-aws-lambda')
  puppeteer.use(StealthPlugin())
  
  return chromium.puppeteer.launch(
    {
      executablePath: await chromium.executablePath,
      args: chromium.args,
      defaultViewPort: chromium.defaultViewPort,
      headless: chromium.headless
    }).then(async browser => {
      const page = await browser.newPage()
      
      // authenticate google account
      await googleAuthenticate(page)
      page.close()

      // visit meeting room
      const newPage = await browser.newPage()
      await newPage.goto(url)
      console.log("Waiting...")
      await waitForNetworkIdle(newPage, 2000, 2)
      
      // find users
      console.log("Finding users...")
      const divText = await newPage.evaluate(() => document.querySelector('div').innerText)
      console.log("Parsing users...")
      console.log(`Found: ${(divText.split('\n').filter(text => (text.includes('on this call') || text.includes('one here'))))}`)
      const users = (divText.split('\n').filter(text => text.includes('on this call')))
      browser.close()

      return users.length > 0 ? users[0] : null
    }
  )
}
