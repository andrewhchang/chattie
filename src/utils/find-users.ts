import { UserListResponse } from '../models/user-list'
import { User } from '../models/user'
import { WebClient } from '@slack/web-api';

const token = process.env.BOT_USER_OAUTH_TOKEN
const client: WebClient = new WebClient(token);

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