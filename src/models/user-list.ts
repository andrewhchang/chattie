import { WebAPICallResult } from '@slack/web-api'

export interface UserListResponse extends WebAPICallResult{
    ok: boolean,
    members?: [{
        id: string,
        team_id: string,
        name: string,
        real_name: string,
        profile: {
            phone: string,
            title: string,
            display_name: string,
        }
        is_admin: boolean,
        is_bot: boolean
    }]
}