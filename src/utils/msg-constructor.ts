import { InteractiveMessage } from "../models/interactive-msg"

export function newInteractiveMessage(channel, text, blocks) {
    const message: InteractiveMessage = {
        channel: `${channel}`,
        text: `${text}`,
        blocks
    }
    return message
}
