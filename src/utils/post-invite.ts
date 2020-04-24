import * as request from 'request'
import { Block } from '../models/interactive-msg'
import { newInteractiveMessage } from './msg-constructor'
import * as dotenv from 'dotenv'
// import { sleep } from './helpers'

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

export async function postInvite(users) {
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

    request.get({
        url: 'https://icanhazdadjoke.com/',
        headers: {'accept': 'application/json'}
        }, (error, response, body) => {
        const jokeBlock = {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `_${JSON.parse(body).joke.toString()}_`
            }
        }
        
        const interactiveMessage = newInteractiveMessage(process.env.CHANNEL_NAME, `${names} in the kitchen!`, [ participantBlock, jokeBlock, welcomeBlock, inviteBlock, meetingButton])
        
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
    // await sleep(300000)
}