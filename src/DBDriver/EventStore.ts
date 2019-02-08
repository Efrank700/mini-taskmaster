import * as mongoose from "mongoose";
import {admin} from '../Participant';

interface IEvent {
    eventName: string;
    adminKey: number;
    supervisorKey: number;
    runnerKey: number;
    owner: {user: string, pass: string, screenName: string, pos: number};
    logins: {user: string, pass: string, screenName: string, pos: number}[];
    materials: {itemName: string, count: number}[];
}

type eventType = IEvent & mongoose.Document;

export const eventStore = mongoose.model<eventType>('Event', new mongoose.Schema({
    eventName: String,
    adminKey: Number,
    supervisorKey: Number,
    runnerKey: Number,
    owner: {user: String, pass: String, screenName: String, pos: Number},
    logins: [{user: String, pass: String, screenName: String, pos: Number}],
    materials: [{itemName: String, count: Number}]
}));