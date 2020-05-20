import * as request from 'request'
import { Block } from '../models/interactive-msg'
import { newInteractiveMessage } from './msg-constructor'
import * as dotenv from 'dotenv'
import * as AsyncLock from 'async-lock'

/* tslint:disable: no-console */
dotenv.config()
const token = process.env.BOT_USER_OAUTH_TOKEN
const meetUrl = process.env.GOOGLE_MEET_URL

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
const lock = new AsyncLock

export async function postInvite(users) {
    lock.acquire("key", (done) => {
        
        // "Person 1 and Person 2 is/are"
        const names = users.slice(0, users.length - (' on this call'.length))

        console.log('Posting to slack...')
        const participantBlock = {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `${names} in the kitchen!  :spoon:`
            }
        }

        try {
            request.get({
            url: 'https://icanhazdadjoke.com/',
            headers: {'accept': 'application/json'}
            }, (error, response, body) => {
            const jokeBlock = {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `\`\`\`${JSON.parse(body).joke.toString()}\`\`\``
                }
            }
            
            const interactiveMessage = newInteractiveMessage(process.env.SLACK_CHANNEL_NAME, `${names} in the kitchen!`, [ participantBlock, jokeBlock, welcomeBlock, inviteBlock, meetingButton])

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
        setTimeout(() => done(), 60000)
    } catch (err) {
        console.log(err)
    }}, (err, ret) => {
        err ? console.log(err) : console.log('No error')
        ret ? console.log(ret) : console.log('No ret')
    }, {})
}