import { googleAuthenticate, waitForNetworkIdle } from './utils/puppeteer-helpers'
import { postInvite } from './utils/post-invite'
import puppeteer from 'puppeteer-extra'
import { quantifyString } from './utils/helpers'
/* tslint:disable: no-console */

declare global {
interface Window {
    quantifyString: any
    postInvite: any
    sleep:any
}
}

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
    console.log("Waiting for network idle...")
    await waitForNetworkIdle(newPage, 2000, 2)
    
    newPage.exposeFunction('postInvite', postInvite)
    newPage.exposeFunction('quantifyString', quantifyString)
    newPage.exposeFunction('sleep', sleep)
    
    console.log("Listening to meeting lobby.")

    // monitor page for changes
    let count = 0
    while (true) {
        await sleep(10000)
        count = await newPage.evaluate(async(injectedCount) => {            
            let foundUsers = ""

            // find all divs
            const divText = document.querySelector('div')

            const observed = divText.innerText.split('\n').filter((text) => (
                    text.includes('on this call') || 
                    text.includes('is here') || 
                    text.includes('has ended'))
                )
            console.log(`Found: ${observed}`)
            
            if (observed[0] !== foundUsers) {
                foundUsers = observed[0]
            }

            /* 
                if there is someone on the call, we should call api only if # of participants has increased
                this way, api doesn't get hit if someone leaves the call
            */

            let updatedCount

            if (foundUsers.includes('on this call')) {
                window.quantifyString(foundUsers).then((result) => {
                    
                    if (result > injectedCount){
                        window.postInvite(foundUsers)
                    }

                updatedCount = result
            })} else {
                updatedCount = 0 
            }
            
            await sleep(500)
            return updatedCount
        }, count) }
    })
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

monitorMeeting()