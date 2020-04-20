import { WebClient, WebAPICallResult, MessageAttachment } from '@slack/web-api'
import * as dotenv from 'dotenv'
import { UserListResponse } from './models/user-list'
import { User } from './models/user'
import * as request from 'request'
import { Block } from './models/interactive-msg'
import { newInteractiveMessage } from './utils/msg-constructor'
import { googleAuthenticate, waitForNetworkIdle } from './utils/puppeteer-helpers'
import puppeteer from 'puppeteer-extra'
/* tslint:disable: no-console */
dotenv.config()
const token = process.env.BOT_USER_OAUTH_TOKEN
const client: WebClient = new WebClient(token);
const meetUrl = process.env.GOOGLE_MEET_URL

interface ChatPostMessageResult extends WebAPICallResult {
    channel: string
    ts: string
    message: {
      text: string
    }
}

const welcomeBlock = {
    type: 'section',
    text: {
        type: 'mrkdwn',
        text: '*The Kitchen Table*'
    }

}
const inviteBlock = {
    type: 'section',
    text: {
        type: 'mrkdwn',
        text: ':coffee:   Where the coffee is hot and so is the conversation   :coffee:'
    }
}

const meetingButton: Block = {
    type: 'actions',
    elements: [
        {
            type: 'button',
            text: {
                type: 'plain_text',
                text: ':speech_balloon:   Join Us'
            },
            url: meetUrl,
            value: "meetingjoin",
            action_id: "button_join_others"
        }
    ]
}

function postInvite(users) {
    console.log('Posting to slack...')
    const names = users.slice(0, users.length - (' on this call'.length))

    const participantBlock = {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `${names} in the kitchen!  :spoon:`
        }
    }

    request.get('https://sv443.net/jokeapi/v2/joke/Programming,Miscellaneous?blacklistFlags=nsfw,religious,political,racist,sexist&type=single', (error, response, body) => {
        const jokeBlock = {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `_${(JSON.parse(body).joke).toString()}_`
            }
        }
        
        const interactiveMessage = newInteractiveMessage('general', `${names} in the kitchen!`, [ participantBlock, jokeBlock, welcomeBlock, inviteBlock, meetingButton])
        
        request({
            url: 'https://slack.com/api/chat.postMessage',
            method: 'POST',
            body: `${JSON.stringify(interactiveMessage)}`,
            headers: {
                Authorization: `Bearer ${token}`,
                'content-type': 'application/json'
            }
        })
    })
}

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
        console.log("Function has been exposed.")
        
        // monitor page for changes
        await newPage.evaluate(() => {            
            let foundUsers = ""
            // find all divs
            const divText = document.querySelector('div')

            // listen for changes to divs, ie. when a user joins and text changes
            const observer = new MutationObserver(() => {
                console.log("Parsing users...")
                console.log(`Found: ${(divText.innerText.split('\n').filter(text => (text.includes('on this call') || text.includes('is here'))))}`)
                const observed = divText.innerText.split('\n').filter(text => (text.includes('on this call') || text.includes('is here')))

                if (observed[0] !== foundUsers) {
                    foundUsers = observed[0]
                    if (foundUsers !== 'No one else is here') { postInvite(foundUsers) }
                }
            })

            observer.observe(divText, { childList: true, characterData: true, attributes: true, subtree: true })
        })
      }
    )
}

// Gets all users in the channel
async function getUsers() {
    const userList = await client.users.list() as UserListResponse
    const users = []
    userList.members.forEach((member) => {
        users.push({
            id: member.id,
            displayName: member.name,
            name: member.real_name,
            isBot: member.is_bot
        } as any as User)
    })
}


// getUsers()
monitorMeeting()