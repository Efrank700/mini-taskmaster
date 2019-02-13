import {task} from "./task"
export {task}
export interface participant {
    screenName: string,
    roomName: string,
}

export enum participantTypes {
    admin, supervisor, runner
}

export interface admin{
    screenName: string,
    roomName: string,
    location: string | null,
    tasks: task[],
}

export interface supervisor{
    screenName: string,
    roomName: string,
    location: string,
    tasks: task[],
}

export interface runner extends participant{
    screenName: string,
    roomName: string,
    task: task | null,
}