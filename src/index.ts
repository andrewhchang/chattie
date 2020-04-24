import { googleAuthenticate, waitForNetworkIdle } from './utils/puppeteer-helpers'
import { postInvite } from './utils/post-invite'
import puppeteer from 'puppeteer-extra'
import { quantifyString } from './utils/helpers'
/* tslint:disable: no-console */

const meetUrl = process.env.GOOGLE_MEET_URL

async function monitorMeeting() {
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
        await newPage.goto(meetUrl)
        console.log("Waiting...")
        await waitForNetworkIdle(newPage, 2000, 2)
        
        newPage.exposeFunction('postInvite', postInvite)
        newPage.exposeFunction('quantifyString', quantifyString)
        
        console.log("Listening...")
        // monitor page for changes
        await newPage.evaluate(() => {            
            let foundUsers = ""
            let count = 0

            // find all divs
            const divText = document.querySelector('div')

            // listen for changes to divs, ie. when a user joins and text changes
            const observer = new MutationObserver(() => {
                console.log("Parsing users...")
                
                // extract only text that includes below
                const observed = divText.innerText.split('\n').filter((text) => (
                    text.includes('on this call') || 
                    text.includes('is here') || 
                    text.includes('has ended'))
                )
                console.log(`Found: ${observed}`)

                if (observed[0] !== foundUsers) {
                    foundUsers = observed[0]
/* 
                    if there is someone on the call, we should call api only if # of participants has increased
                    this way, api doesn't get hit if someone leaves the call
*/
                    if (foundUsers.includes('on this call')) {
                        let currentCount

                        try {
                            currentCount = quantifyString(foundUsers)
                            console.log(currentCount)
                        } catch (err) {
                            console.log(err)
                        }

                        if (currentCount > count) {
                            postInvite(foundUsers)
                        }

                        count = currentCount
                    }
                }
            })
            
            observer.observe(divText, { childList: true, characterData: true, attributes: true, subtree: true })
        })
      }
    )
}

monitorMeeting()