/* tslint:disable: no-console */

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function quantifyString(participantString) {
    const participants = participantString.slice(0, participantString.length - (' on this call'.length))
                                                .replace(/\ and\ |\,\ /g, ",")
                                                .replace(/\ are|\ is/g, "")
                                                .split(",")
    const lastMember = participants[participants.length - 1]

    if (lastMember.includes(' more')) {
        console.log(participants.length - 1 + Number(lastMember.replace(' more', "")))
        return participants.length - 1 + Number(lastMember.replace(' more', ""))
    }
    
    return participants.length
}