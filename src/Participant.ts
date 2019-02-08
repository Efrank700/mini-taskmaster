import {task} from "./task"
export {task}
export interface participant {
    screenName: string,
    roomName: string,
    socketId: number
}

export enum participantTypes {
    admin, supervisor, runner
}

export interface admin{
    screenName: string,
    roomName: string,
    location: string | null,
    tasks: task[],
    socketId: number
}

export interface supervisor{
    screenName: string,
    roomName: string,
    location: string,
    tasks: task[],
    socketId: number
}

export interface runner extends participant{
    screenName: string,
    roomName: string,
    task: task | null,
    socketId: number
}