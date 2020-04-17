import { WebClient, WebAPICallResult, MessageAttachment } from '@slack/web-api'
import * as dotenv from 'dotenv'
import { UserListResponse } from './models/user-list'
import { User } from './models/user'
import * as request from 'request'
import { Block } from './models/interactive-msg'
import { newInteractiveMessage } from './utils/msg-constructor'
import { sniffUsers } from './utils/puppeteer-helpers'

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

async function postInvite() {
    const users = await sniffUsers(meetUrl)

    if (users == null) {
        return null
    }
    
    const names = users.slice(0, users.length - (' on this call'.length))
    const interactiveMessage = newInteractiveMessage('general', `${names} in the kitchen!`, [welcomeBlock, inviteBlock, meetingButton])
    
    request({
        url: 'https://slack.com/api/chat.postMessage',
        method: 'POST',
        body: `${JSON.stringify(interactiveMessage)}`,
        headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json'
        }
    })
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
postInvite()