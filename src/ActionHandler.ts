import {TaskMastrEvent, admin, supervisor, runner, task, participant} from "./Event";
import {participantTypes} from "./Participant";

export class ActionHandler {
    
    private event: TaskMastrEvent;
   
    constructor() {
        let keys = TaskMastrEvent.generateKeys();
        this.event = new TaskMastrEvent("SOUP 2019", keys[0], keys[2], keys[2], "admin", []);
    }


    public addUserToEvent(user: string, screen: string, socket: number,  
        eventKey: number, location?: string): [boolean, participantTypes] {
        if(eventKey === this.event.$adminKey) {
            let adminLocation = location === undefined ? null : location;
            let adminToAdd: admin = {screenName: screen, 
                                        roomName: this.event.$eventName,
                                        location: adminLocation,
                                        tasks: [],
                                        socketId: socket};
            let success = this.event.addAdmin(adminToAdd);
            return([true, participantTypes.admin]);
        }
        else if(eventKey === participantTypes.supervisor) {
            if(location === undefined) return [false, participantTypes.supervisor];
            let supervisorToAdd: supervisor = {screenName: screen,
                                                roomName: this.event.$eventName,
                                                location: location,
                                                tasks: [],
                                                socketId: socket};
            let success = this.event.addSupervisor(supervisorToAdd);
            return([true, participantTypes.supervisor]);
        }
        else {
            let runnerToAdd: runner = {screenName: screen,
                                        roomName: this.event.$eventName,
                                        task: null,
                                        socketId: socket};
            let success = this.event.addRunner(runnerToAdd);
            return([true, participantTypes.runner]);
        }
    }

    // public kick(authorizingSocket: number, targetScreen: string, eventKey: number): 
    //                          [boolean, number] | null {
    //         if(targetScreen == this.event.$owner) return null;
    //         let targetAdmin = this.event.getAdminBySocket(authorizingSocket);
    //         let authenticated =  targetAdmin != null && targetAdmin.screenName == this.event.$owner;
    //         if(!authenticated) {
    //             return null;
    //         }
    //         let retAdmin: admin|null = null;
    //         let retSupervisor
    //         let retRunner: runner|null = null;
    //         if(delAdmin !== null) {
    //             retAdmin = delAdmin[0];
    //             retRunner = delAdmin[1];
    //         }
    //         let deleteResolution = await deletePromise;
    //         if(deleteResolution === null) return([false, retAdmin, retRunner]);
    //         else return([deleteResolution, retAdmin, retRunner]);
    // }

    public addMaterials(eventKey: number, materialName: string, quantity: number) : boolean {
        if(quantity <= 0) return false;
        else {
            let addition = this.event.addFreeMaterials(materialName, quantity);
            return(addition)
        }
    }

    public removeMaterials(eventKey: number, materialName: string, quantity: number): boolean | null {
            if(quantity <= 0) return null;
            else{
                    let addition = this.event.removeFreeMaterials(materialName, quantity);
                    return(addition > 0)
            }
    }

    // public async logUserIn(eventKey: number, user: string, pass: string, socketId: number, location?: string): Promise<[boolean, string, string | null] | null> {
    //     try{
    //         let loginPromise = MongoDriver.authenticate(eventKey, user, pass);
    //         let eventName = this.event.findEventByKey(eventKey);
    //         let login = await loginPromise;
    //         if(login === null) return null;
    //         else if(!login[0]) {
    //             return([login[0], login[1], null]);
    //         }
    //         else {
    //             if(eventName === null) {
    //                 let targetEvent = await MongoDriver.retrieveEvent(eventKey);
    //                 if(targetEvent === null) return null;
    //                 this.event.addEvent(targetEvent);
    //                 eventName = targetEvent.$eventName;
    //             }
    //             if(login[2] === participantTypes.admin) {
    //                 let targetLocation: string | null;
    //                 if(location === undefined) targetLocation = null;
    //                 else targetLocation = location;
    //                 let adminToAdd: admin = {screenName: login[1],roomName:eventName, location: targetLocation, tasks: [], socketId: socketId};
    //                 let adminAdded = this.event.addAdmin(adminToAdd);
    //                 return([adminToAdd !== null, login[1], eventName]);
    //             }
    //             else if(login[2] === participantTypes.supervisor) {
    //                 let targetLocation: string;
    //                 if(location === undefined) targetLocation = "UNKNOWN";
    //                 else targetLocation = location;
    //                 let supervisorToAdd: supervisor = {screenName: login[1],roomName:eventName, 
    //                                             location: targetLocation, tasks: [], socketId: socketId};
    //                 let supervisorAdded = this.event.addSupervisor(supervisorToAdd);
    //                 return([supervisorToAdd !== null, login[1], eventName]);
    //             }
    //             else {
    //                 let runnerToAdd: runner = {screenName: login[1],roomName:eventName, 
    //                                             task: null, socketId: socketId};
    //                 let runnerAdded = this.event.addRunner(runnerToAdd);
    //                 return([runnerToAdd !== null, login[1], eventName]);
    //             }
    //         }
    //     } catch (error) {
    //         let castError = error as Error;
    //         throw new Error(castError.message);
    //     }
    // }

    public logUserOut(socket: number): 
    [admin | null, supervisor | null, runner | null, runner[] | null, boolean] | null {
        let targetAdmin = this.event.getAdminBySocket(socket);
        let targetSupervisor = this.event.getSupervisorBySocket(socket);
        let targetRunner = this.event.getRunnerBySocket(socket);

        if(targetAdmin === null && targetRunner === null && targetSupervisor === null) return null;
        else {
            if(targetAdmin !== null) {
                let ret = this.event.removeAdmin(targetAdmin)
                if(ret == null) return null
                return [ret[0], null, null, ret[1], false];
            }
            else if(targetSupervisor !== null) {
                let ret = this.event.removeSupervisor(targetSupervisor)
                if(ret == null) return null
                return [null, ret[0], null, ret[1], false];
            }
            else if(targetRunner !== null) {
                let ret = this.event.removeRunner(targetRunner)
                if(ret == null) return null
                return [null, null, ret[1], null, ret[0]];
            }
            else return null;
        }
    }

    public getMaterials(eventName: string): [{itemName: string, count: number, user: 
    admin | supervisor}[], {itemName: string, count: number}[]] | null {
        let retFreeMaterials = this.event.getMaterialList();
        let retUsedMaterials = this.event.getUsedMaterialList();
        if(retFreeMaterials === null || retUsedMaterials === null) return null;
        else return [retUsedMaterials, retFreeMaterials];
    }

    public getUsersLoggedIn(): [string[], string[], string[], string[]] | null {
        let admins = this.event.adminList();
        let supervisors = this.event.supervisorList();
        let freeRunners = this.event.freeRunnerList();
        let taskedRunners = this.event.taskedRunnerList();
        if(admins === null || supervisors === null 
            || freeRunners === null || taskedRunners === null) return null;
        let adminNames = admins.map((admin) => {return admin.screenName});
        let supervisorNames = supervisors.map((supervisor) => {return supervisor.screenName});
        let freeRunnerNames = freeRunners.map((runner) => {return runner.screenName});
        let taskedRunnerNames = taskedRunners.map((runner) => {return runner.screenName});
        return([adminNames, supervisorNames, freeRunnerNames, taskedRunnerNames]);
    }
    
    public getCurrentTasks(eventName: string) : {assigned: runner | null,task: task}[] | null {
        return this.event.taskList();
    }

    public addTask(eventName: string, requesterScreenName: string, userRequest: boolean, 
    materialName?: string, quantity?: number):
    [boolean, task | null, runner | null] | null {
        if(!userRequest && (materialName === undefined || quantity === undefined)) return null;
        else if(materialName !== undefined && quantity === undefined) return null;
        else if(materialName === undefined && quantity !== undefined) return null;
        else if(materialName !== undefined && quantity !== undefined) {
            if(userRequest) {
                return this.event.addTask({});
            }
            else {
                return this.event.requestMaterial(eventName, requesterScreenName, materialName, quantity);
            }
        }
        else {
            return this.event.requestRunner(eventName, requesterScreenName)
        }
    }

    public cancelTask(eventName: string, runnerScreenName: string) : [task | null, runner | null, supervisor | admin] | null{
        return this.event.deleteTask(eventName, runnerScreenName);
    }

    public taskComplete(eventName: string, runnerScreenName: string) : [task | null, runner | null, supervisor | admin] | null {
        return this.event.taskComplete(eventName, runnerScreenName);
    }
}