/**
 * This file contains the class description for the TaskMastrEvent Object, which directly defines the 
 * behavior of individual events for taskmastr
 */

"use strict";
import * as helper from "./helperFunctions"
import {participant, admin, runner, supervisor, task} from "./Participant"
export {participant, admin, runner, supervisor, task}
export class TaskMastrEvent{
    private eventName: string; //Event Name in string form, also room name for socket
    private readonly adminKey: number; //Key for admin to login
    private readonly supervisorKey: number; //Key for supervisor to login
    private readonly runnerKey: number; //Key for runner to login
    private readonly owner: string; //Administrator with highest level priviledge
    private taskCount: number; //Running task count for the event
    private admins: admin[]; //Admins currently active in the event
    private supervisors: supervisor[]; //Supervisors currently active in the event
    private freeRunners: runner[]; //Runners currently active and free of task
    private taskedRunners: runner[]; //Runners currently active and tasked
    private materialsAvailable: {itemName: string, count: number}[]; //Name and count of free materials
    private materialsInUse: {itemName: string, count: number, user: admin | supervisor}[]; //Name, count, and using supervisor
    private unfinishedTasks: {assigned: runner | null, task: task}[];
    private waitingTasks: {id: number, task: task}[]; //Tasks currently waiting to be assigned.
    private SUPERADMIN: admin = {screenName: this.eventName, roomName: this.eventName, tasks: [], 
                                 location: "HOME BASE"};
    /**
     * @constructor
     * @param eventName 
     * @param adminkey 
     * @param supervisorKey 
     * @param runnerKey
     * @param owner 
     * @param materialsAvailable
     */
    constructor(eventName: string, adminkey: number, supervisorKey: number, runnerKey: number,
                owner: string, materialsAvailable: {itemName: string, count: number}[]) {
                    this.eventName = eventName;
                    this.adminKey = adminkey;
                    this.supervisorKey = supervisorKey;
                    this.runnerKey = runnerKey;
                    this.taskCount = 0;
                    this.owner = owner;
                    this.admins =  <admin[]>[this.SUPERADMIN];
                    this.supervisors =  <supervisor[]>[];
                    this.freeRunners =  <runner[]>[];
                    this.taskedRunners =  <runner[]>[];
                    this.materialsAvailable =  materialsAvailable;
                    this.materialsInUse =  <{itemName: string, count: number, user: 
                                            admin | supervisor}[]>[];
                    this.unfinishedTasks = <{assigned: runner | null, task:task}[]>[];
                    this.waitingTasks =  <{id: number, task: task}[]>[];
    }
    
     get $uniAdmin() : admin {
         return this.SUPERADMIN;
     }

	 get $eventName(): string {
		return this.eventName;
	}

	 set $eventName(value: string) {
		this.eventName = value;
	}

	 get $adminKey(): number {
		return this.adminKey;
	}

	 get $supervisorKey(): number {
		return this.supervisorKey;
	}

	 get $runnerKey(): number {
		return this.runnerKey;
	}

	 get $owner(): string {
		return this.owner;
	}

	 get $taskCount(): number {
		return this.taskCount;
	}

     adminList() : admin[] {
        let ret = <admin[]>[];
        this.admins.forEach((element) => {
            
            if(element !== this.SUPERADMIN) ret.push(element);
        });
        return(ret);
    }
    
     supervisorList() : supervisor[] {
        const ret = [] as supervisor[];
        this.supervisors.forEach(element =>{
            ret.push(element);
        });
        return(ret);
    }

    freeRunnerList() : runner[] {
        const ret = [] as runner[];
        this.freeRunners.forEach(element => {
            ret.push(element);
        });
        return(ret);
    }

    taskedRunnerList() : runner[] {
        const ret = [] as runner[];
        this.taskedRunners.forEach(element => {
            ret.push(element);
        });
        return(ret);
    }

     /**
     * @returns the list of all available materials
     */
    getMaterialList(): {itemName: string, count: number}[]{
        let retArr: {itemName: string, count: number}[] = [];
        this.materialsAvailable.forEach(element => {
            retArr.push(element);
        });
        return(retArr);
    }

    /**
     * @returns the list of all materials in use
     */
    getUsedMaterialList(): {itemName: string, count: number, user: admin | supervisor}[]{
        let retArr: {itemName: string, count: number, user: admin | supervisor}[] = [];
        this.materialsInUse.forEach(element => {
            retArr.push(element);
        });
        return(retArr);
    }

    taskList(): {assigned: runner | null, task: task}[] {
        const ret = <{assigned: runner | null, task:task}[]>[];
        this.unfinishedTasks.forEach(element => {
            ret.push(element);
        });
        this.waitingTasks.forEach(element => {
            ret.push({assigned: null, task: element.task});
        });
        return(ret);
    }

    public static generateKeys(): [number, number, number] {
        let ret: [number, number, number] = [0, 0, 0];
        let num = Math.round(Math.random() * 999999999);
        ret[0] = num;
        while (num == ret[0]) {
            num = Math.round(Math.random() * 999999999);
        }
        ret[1] = num;
        while (num == ret[1] || num == ret[0]) {
            num = Math.round(Math.random() * 999999999);
        }
        ret[2] = num;
        return ret;
    }

    /******************************************************************************************************************************************************************
     * Participant Interactions
     *****************************************************************************************************************************************************************/
   
     /**
     * @param admin
     * @returns
     */
     addAdmin(admin: admin) : admin | null {
        let exists = this.getAdminByScreenName(admin.screenName);
        if(exists) {
            return null;
        }
        helper.uniqueInsert(admin, this.admins);
        return(admin);
    }

     addSupervisor(supervisor: supervisor) : supervisor | null{
        let exists = this.getSupervisorByScreenName(supervisor.screenName);
        if(exists) {
            return null;
        }
        helper.uniqueInsert(supervisor, this.supervisors);
        return(supervisor);
    }

    /**
     * @param runner to be added
     * @returns runner added
     */
     addRunner(runner: runner) : runner | null{
        let exists = this.getRunnerByScreenName(runner.screenName);
        if(exists) {
            return null;
        }
        if(runner.task !== null) {
            helper.uniqueInsert(runner, this.taskedRunners);
            return(runner);
        }
        else {
            if(this.waitingTasks.length !== 0) {
                runner.task = this.waitingTasks[0].task;
                let removedTask = this.waitingTasks.splice(0, 1);
                this.unfinishedTasks.push({assigned: runner, task: removedTask[0].task});
                helper.uniqueInsert(runner, this.taskedRunners);
                return(runner);
            }
            else {
                helper.uniqueInsert(runner, this.freeRunners);
                return(runner);
            }
        }
    }

    /**
     * @param screenName
     * @returns admin target Admin 
     */
     getAdminByScreenName(screenName: string) : admin | null{
        const found: number = (this.admins.findIndex((targetAdmin) => {
                                    return(targetAdmin.screenName == screenName)
                                }));
        if(found == -1) return(null);
        else return(this.admins[found]);
    }

    /**
     * @param screenName
     * @returns supervisor target supervisor 
     */
     getSupervisorByScreenName(screenName: string) : supervisor | null{
        const found: number = (this.supervisors.findIndex((targetSup) => {
                                    return(targetSup.screenName == screenName)
                              }));
        if (found == -1) return(null);
        else return(this.supervisors[found]);
    }

    /**
     *@param screenName
     *@return runner target runner 
     */
      getRunnerByScreenName(screenName: string) : runner | null{
       const freePos = this.freeRunners.findIndex((targetRunner) => {
                            return targetRunner.screenName == screenName
                        });
       if(freePos !== -1) return(this.freeRunners[freePos]);
       else{
           const taskedPos = this.taskedRunners.findIndex((targetRunner) => {
                                return targetRunner.screenName == screenName
                            });
           if(taskedPos !== -1) return(this.taskedRunners[taskedPos]);
           else return(null);
       }
     }

         /**
     * @param socketId
     * @returns admin target Admin 
     */
    //  getAdminBySocket(socketId: number) : admin | null{
    //     const found: number = (this.admins.findIndex((targetAdmin) => {return(targetAdmin.socketId == socketId)}));
    //     if(found == -1) return(null);
    //     else return(this.admins[found]);
    // }

    // /**
    //  * @param socketId
    //  * @returns supervisor target supervisor 
    //  */
    //  getSupervisorBySocket(socketId: number) : supervisor | null{
    //     const found: number = (this.supervisors.findIndex((targetSup) => {return(targetSup.socketId == socketId)}));
    //     if (found == -1) return(null);
    //     else return(this.supervisors[found]);
    // }

    // /**
    //  *@param socketId
    //  *@return runner target runner 
    //  */
    //   getRunnerBySocket(socketId: number) : runner | null{
    //    const freePos = this.freeRunners.findIndex((targetRunner) => {return targetRunner.socketId == socketId});
    //    if(freePos !== -1) return(this.freeRunners[freePos]);
    //    else{
    //        const taskedPos = this.taskedRunners.findIndex((targetRunner) => {return targetRunner.socketId == socketId});
    //        if(taskedPos !== -1) return(this.taskedRunners[taskedPos]);
    //        else return(null);
    //    }
    // }
    
    /**
     * @param admin administrator to be removed
     * @return admin indicates removal, null for failure
     */
     removeAdmin(admin : admin) : [admin, runner[]] | null {
        if(this.admins.length == 0) return(null);
        else {
            const adminIndex: number = this.admins.findIndex((targetAdmin: admin) => {
                return(targetAdmin.screenName == admin.screenName);
            });
            if(adminIndex == -1) return(null);
            else{
                let runners : runner[] = [];
                const retAdmin : admin = this.admins[adminIndex];
                retAdmin.tasks.forEach(element => {
                    let res = this.removeTask(element);
                    let target = res[1]
                    if(target != null) {
                        runners.concat(target);
                    }
                });
                this.admins.splice(adminIndex, 1);
                return([admin, runners]);
            }
        }
    }
    
    /**
     * @param supervisor
     * @returns supervisor is removed supervisor, null for failure
     */
     removeSupervisor(supervisor : supervisor) : [supervisor, runner[]] | null {
        if(this.supervisors.length == 0) return(null);
        else {
            let supervisorIndex = this.supervisors.findIndex((targetSupervisor : supervisor) => {
                return targetSupervisor == supervisor;
            });
            if(supervisorIndex == -1) return(null);
            else {
                let runners : runner[] = [];
                let retSupervisor : supervisor = this.supervisors[supervisorIndex];
                retSupervisor.tasks.forEach(element => {
                    let res = this.removeTask(element);
                    let target = res[1]
                    if(target != null) {
                        runners.concat(target);
                    }
                });
                this.supervisors.splice(supervisorIndex, 1);
                return([retSupervisor, runners]);
            }
        }
    }
    
    /**
     * @param runner
     * @returns [tasked, removedRunner] tasked indicates if a task had to be assigned, removedRunner
     * indicates the actual removed object
     */
     removeRunner(runner : runner) : [boolean, runner | null] {
        let freePosition = this.freeRunners.findIndex((freeRunner) => {return runner == freeRunner});
        if(freePosition == -1) {
            let taskedPosition = this.taskedRunners.findIndex((taskedRunner) => {return runner == taskedRunner});
            if(taskedPosition == -1) return([false, null]);
            else {
                let [remTask, remRun] = this.unassignTask(this.taskedRunners[taskedPosition]);
                let retVal = this.removeRunner(runner)[1];
                if(remTask != null) {
                    this.addTask(remTask)
                }
                return([true, retVal]);
            }
        }
        else{
            this.freeRunners.splice(freePosition, 1);
            return([false, runner]);
        }
    }


    /******************************************************************************************************************************************************************
     * Materials Interactions
     *****************************************************************************************************************************************************************/
    /**
     * @param name: the name of the  object to get the count of
     * @return amount of that material that is free
     */
     getMaterialCount(name: string): number {
        let position = this.materialsAvailable.findIndex((element) => {return element.itemName == name});
        if(position == -1) return 0;
        return(this.materialsAvailable[position].count);
    }

    addFreeMaterials(name: string, quantity: number): boolean{
        if(quantity <= 0) return false;
        let position = this.materialsAvailable.findIndex((element) => {
            return element.itemName == name
        });
        if(position == -1) {
            this.materialsAvailable.push({itemName: name, count: quantity});
            return(false);
        }
        this.materialsAvailable[position].count += quantity;
        return(true);
    }

    removeFreeMaterials(name: string, quantity: number): number{
        if(quantity <= 0) return(-1);
        let position = this.materialsAvailable.findIndex((element) => {
            return(element.itemName == name);
        });
        if(position == -1) return 0;
        else if(this.materialsAvailable[position].count <= quantity) {
            return(0);
        }
        else {
            this.materialsAvailable[position].count -= quantity;
            return(quantity);
        }
    }

    checkoutMaterials(name: string, quantity: number, caller: admin | supervisor): [boolean, number]{
        if(quantity <= 0) return([false, -1]);
        let position = this.materialsAvailable.findIndex((element) => {return element.itemName == name});
        if(position == -1) return([false, 0]);
        if(this.materialsAvailable[position].count < quantity) {
            return([false, this.materialsAvailable[position].count]);
        }
        else {
            this.materialsAvailable[position].count -= quantity;
            let matPosition = this.materialsInUse.findIndex((element) => {
                return(element.user == caller && element.itemName == name);
            });
            if(matPosition == -1) {
                this.materialsInUse.push({itemName: name, count: quantity, user: caller});
                return([true, quantity]);
            }
            else {
                this.materialsInUse[matPosition].count += quantity;
                return([true, quantity]);
            }
        }
    }
    
    returnMaterials(name: string, quantity: number, supervisor: admin | supervisor) : [boolean, number, admin | supervisor] {
        if(quantity <= 0) return([false, -1, supervisor]);
        if(supervisor.roomName !== this.eventName) return([false, -1, supervisor]);
        else {
            let supervisorMats = this.materialsInUse.findIndex((element) => {
                return(element.itemName == name && element.user == supervisor)
            });
            if(supervisorMats == -1) return([false, -1, supervisor]);
            let takenAmount = this.materialsInUse[supervisorMats].count;
            if(takenAmount < quantity) return([false, takenAmount, supervisor]);
            else if(takenAmount == quantity) {
                this.addFreeMaterials(name, quantity);
                this.materialsInUse.splice(supervisorMats, 1);
            }
            else {
                this.addFreeMaterials(name, quantity);
                this.materialsInUse[supervisorMats].count -= quantity;
            }
            return([true, quantity, supervisor]);
        }
    }

    requestValid(itemName: string, quantity: number): boolean {
        if(quantity < 0) return false;
        let itemIndex = this.materialsAvailable.findIndex((element) => element.itemName == itemName);
        if(itemIndex == -1) return false;
        else {
            return this.materialsAvailable[itemIndex].count >= quantity;
        }

    }
    /******************************************************************************************************************************************************************
     * Task Interactions
     *****************************************************************************************************************************************************************/


     /**
      * @param task 
      * @param runner
      * @return success code, runner | null 
      */
     private assignTask(task : task, runner : runner) : runner | null {
        const runnerPos = this.freeRunners.findIndex((targetRunner) => {
                                           return targetRunner.screenName == runner.screenName
                                        });
        if(runnerPos == -1) return(null);
        else {
            const targetRunner = this.freeRunners[runnerPos];
            targetRunner.task = task;
            this.freeRunners.splice(runnerPos, 1);
            helper.uniqueInsert(targetRunner, this.taskedRunners);
            return(targetRunner);
        }
     }

     /**
      * @param runner
      * @returns [task, runner] - both or each may be null
      */
     private unassignTask(runner : runner) : [task | null, runner | null] {
        if(runner.task == null) return([null, null]);
        let runnerTask : task = runner.task;
        runner.task = null;
        let runnerIndex = this.taskedRunners.findIndex((targetRunner) => {return targetRunner == runner});
        if(runnerIndex == -1) {
            if(runner.roomName == this.eventName) {
                return([runnerTask, runner]);
            }
            else return([null, runner]);
        }
        else {
            let removedRunner = this.taskedRunners.splice(runnerIndex, 1);
            this.freeRunners.push(removedRunner[0])
            let taskIndex = this.unfinishedTasks.findIndex((element) => {
                return element.task == runnerTask
            });
            this.removeRunner(runner);
            this.addRunner(runner)
            if(taskIndex == -1) return[null, runner];
            else {
                let remTask = this.unfinishedTasks.splice(taskIndex, 1);
                return[runnerTask, runner];
            }

        }
    }
    /**
     * @param task
     * @returns [assigned, task, assignedRunner]
     */
      addTask(task : task) : [boolean, task, runner | null]{
          
         task.supervisor.tasks.push(task);
        if(this.freeRunners.length > 0) {
            let res : runner | null = this.assignTask(task, this.freeRunners[0]);
            if(res == null) {
                this.waitingTasks.push({id: this.taskCount, task: task});
                this.taskCount++;
                return([false, task, null]);
            }
            else {
                this.taskCount++;
                this.unfinishedTasks.push({assigned: res, task: task});
                return([true, task, res]);
            }
        }
        else {
            this.waitingTasks.push({id: this.taskCount, task: task});
            this.taskCount++;
            return([false, task, null]);
        }
     }


    /**
     * @param task 
     * @returns isAssigned
     */
    private taskIsAssigned(task : task) : boolean {
        let taskIndex = this.taskedRunners.findIndex((targetRunner) => {return targetRunner.task == task});
        return(taskIndex !== -1);
    }
    /**
     * @param task
     * @returns [taskRemoved, taskedRunner] 
     */
    private removeAssignedTask(task : task) : [task | null, runner | null] {
        let taskedIndex = this.taskedRunners.findIndex((targetRunner) => {return targetRunner.task == task});
        if(taskedIndex == -1) return([null, null]);
        else {
            let targetTask = this.taskedRunners[taskedIndex].task;
            if(targetTask == null) return([null, null]);
            else {
                let [retTask, retRunner] = this.unassignTask(this.taskedRunners[taskedIndex]);
                if(retTask == null) return([null, null]);
                else{
                    return([retTask, retRunner]);
                }
            }
        }
    }
    /**
     * @param task
     * @returns [removed, taskInEvent] 
     */
    private removeFreeTask(task : task) : [boolean, task | null] {
        let taskIndex = this.waitingTasks.findIndex((targetTask) => {return targetTask.task == task});
        if(taskIndex == -1) return([true, null]);
        else {
            let targetTask = this.waitingTasks[taskIndex];
            this.waitingTasks.splice(taskIndex, 1);
            return([true, targetTask.task]);
        }
    }

    
    /**
     * @param task
     * @returns [removed, taskInEvent, taskedRunner] 
     */
     removeTask(task : task) : [task | null, runner | null] {
        if(this.taskIsAssigned(task)) return(this.removeAssignedTask(task));
        else {
            let retRemFreeTask = this.removeFreeTask(task);
            let retTask = retRemFreeTask[1];
            return([retTask, null]);
        }
    }
}