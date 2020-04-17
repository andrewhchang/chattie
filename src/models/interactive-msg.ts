export interface InteractiveMessage {
    channel: string
    text: string
    blocks: Block[]
}

export interface Block {
    type: string
    text?: {
        type: string
        text: string
    }
    elements?: Element[]
}
  
export interface Text {
    type: string
    text: string
}
  
export interface Element {
    type: string
    text: {
        type: string
        text: string
    }
    url?: string
    value?: string
    action_id?: string
}
