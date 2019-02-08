import {admin, supervisor} from "./Participant"
export interface task {
    supervisor: admin | supervisor,
    runnerRequest: boolean,
    recieveLocation: string,
    depositLocation:string,
    item?: string | string[]
    quantity?: number | number[]
}