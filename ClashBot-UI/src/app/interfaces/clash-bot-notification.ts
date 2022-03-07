export interface ClashBotNotification {
    id: string,
    alertLevel: number,
    from: string,
    message: string,
    timeAdded: Date,
    dismissed: boolean
}
