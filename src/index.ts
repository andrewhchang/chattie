import { WebClient, WebAPICallResult } from '@slack/web-api'
import * as dotenv from 'dotenv'
import { UserListResponse } from './models/user-list'
import { User } from './models/user'

dotenv.config()
const token = process.env.BOT_USER_OAUTH_TOKEN
const client: WebClient = new WebClient(token);

interface ChatPostMessageResult extends WebAPICallResult {
    channel: string;
    ts: string;
    message: {
      text: string;
    }
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

    const res = (await client.chat.postMessage({
        text: JSON.stringify(users),
        channel: 'general'
    }) as ChatPostMessageResult)
}

getUsers()