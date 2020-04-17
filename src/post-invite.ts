import * as request from 'request'

export default async function postInvite(meetingUrl) {
    const inviteTemplate = {
        type: 'modal',
        title: 'Test Modal',
        text: meetingUrl,
        submit: {
            type: 'plain_text',
            text: 'Join',
            emoji: false,
        }
    }
}