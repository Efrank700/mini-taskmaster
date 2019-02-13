import * as mocha from 'mocha';
import {expect, assert, should} from 'chai';
import {TaskMastrEvent} from '../Event';

import {task} from "../task";
import {participant, admin, supervisor, runner} from "../Participant";

const genAdmin: admin = {screenName: "hello", roomName: "hello", tasks: <task[]>[], location: null};
const secondAdmin: admin = {screenName: "hi", roomName: "hello", tasks: <task[]>[], location: null};
const falseAdmin: admin = {screenName: "not", roomName: "hello", tasks: <task[]>[], location: null};
const genSupervisor: supervisor = {screenName: "wow", roomName: "hello", tasks: <task[]>[], location: "null"};
const falseSupervisor: supervisor = {screenName: "nope", roomName: "hello", tasks: <task[]>[], location: "null"};
const genRunner: runner = {screenName: "woot", roomName: "hello", task: null};
const falseRunner: runner = {screenName: "haha", roomName: "hello", task: null};

describe('Event Generation', () => {
    const newEvent = new TaskMastrEvent("hello", 100, 101, 102, genAdmin.screenName, <{itemName: string, count: number}[]>[]);
    it('should generate a new Event', () => {
        expect(newEvent).to.not.equal(null);
    })
    it('can get owner', () => {
        expect(newEvent.$owner).to.equal(genAdmin.screenName);
    })
    it('can add admin', () => {
        expect(newEvent.addAdmin(genAdmin)).to.equal(genAdmin);
    })
    it('can add supervisor', () => {
        expect(newEvent.addSupervisor(genSupervisor)).to.equal(genSupervisor);
    })
    it('can add runner', () => {
        expect(newEvent.addRunner(genRunner)).to.equal(genRunner);
    })
    it('can get admins, supervisors, and runners', () => {
        expect(newEvent.adminList()[0]).to.equal(genAdmin);
        expect(newEvent.supervisorList()[0]).to.equal(genSupervisor);
        expect(newEvent.freeRunnerList()[0]).to.equal(genRunner);
    })
})

describe('Participant Removal', () => {
    const newEvent = new TaskMastrEvent("hello", 100, 101, 102, genAdmin.screenName, <{itemName: string, count: number}[]>[]);
    newEvent.addAdmin(secondAdmin);
    newEvent.addSupervisor(genSupervisor);
    newEvent.addRunner(genRunner);
    newEvent.addAdmin(genAdmin);
    it('can remove admin', () => {
        let res = newEvent.removeAdmin(secondAdmin);
        expect(res).to.not.be.null;
        if(res == null) {
            expect(1).to.equal(2);
        }
        else {
            expect(res[0]).to.equal(secondAdmin)
        }
        
    })
    it('can ignore an irrelevant admin', () => {
        newEvent.addAdmin(secondAdmin);
        let result = newEvent.removeAdmin(falseAdmin);
        expect(result).to.equal(null);
        expect(newEvent.adminList().length).to.equal(2);
    })
    it('can remove a supervisor', () => {
        let res = newEvent.removeSupervisor(genSupervisor);
        expect(res).to.not.be.null;
        if(res == null) {
            expect(1).to.equal(2);
        }
        else {
            expect(res[0]).to.equal(genSupervisor)
        }
        expect(newEvent.supervisorList().length).to.equal(0);
    })
    it('can ignore unrelated supervisors', () => {
        newEvent.addSupervisor(genSupervisor);
        let result = newEvent.removeSupervisor(falseSupervisor);
        expect(result).to.equal(null);
        expect(newEvent.supervisorList().length).to.equal(1);
    })
    it('can ignore unrelated runners', () => {
        let result = newEvent.removeRunner(falseRunner);
        expect(result[0]).to.equal(false);
        expect(result[1]).to.equal(null);
        expect(newEvent.freeRunnerList().length).to.equal(1);
    })
    it('can remove runners', () => {
        let result = newEvent.removeRunner(genRunner);
        expect(result[0]).to.equal(false);
        expect(result[1]).to.equal(genRunner);
    })
})
describe('Material manipulation', () => {
    const newEvent = new TaskMastrEvent("hello", 100, 101, 102, genAdmin.screenName, <{itemName: string, count: number}[]>[]);
    newEvent.addSupervisor(genSupervisor);
    newEvent.addRunner(genRunner);
    it('can add new materials', () => {
       expect( newEvent.addFreeMaterials("fun", 10)).to.be.false;
       expect(newEvent.getMaterialCount("fun")).to.equal(10);
    })
    it('properly adds existing materials', () => {
        expect(newEvent.addFreeMaterials("fun", 10)).to.be.true;
        expect(newEvent.getMaterialCount("fun")).to.equal(20);
    })
    it('can properly check out materials', () => {
        let result = newEvent.checkoutMaterials("fun", 10, genSupervisor)
        expect(result[0]).to.be.true;
        expect(result[1]).to.equal(10);
        expect(newEvent.getMaterialCount("fun")).to.equal(10);
    })
    it('properly handles not having enough materials', () => {
        let result = newEvent.checkoutMaterials("fun", 20, genSupervisor);
        expect(result[0]).to.be.false;
        expect(result[1]).to.equal(10);
        expect(newEvent.getMaterialCount("fun")).to.equal(10);
    })
    it('properly handles material returns', () => {
        let result = newEvent.returnMaterials("fun", 10, genSupervisor);
        expect(result[0]).to.be.true;
        expect(result[1]).to.equal(10);
        expect(result[2]).to.equal(genSupervisor);
    })
})

describe("Task Manipulations", () => {
    let newEvent = new TaskMastrEvent("hello", 100001, 10000, 101010, genAdmin.screenName, []);
    newEvent.addFreeMaterials("Fun", 25);
    newEvent.addSupervisor(genSupervisor);
    let genTask: task = {supervisor: genSupervisor, runnerRequest: false, recieveLocation: "Here", 
    depositLocation: "there", item: "Fun",quantity: 10};
    it("Correctly creates a Task", () => {
        let result = newEvent.addTask(genTask);
        expect(genSupervisor.tasks[0]).to.equal(genTask);
        expect(newEvent.$taskCount).to.equal(1);
        let retList = newEvent.taskList();
        expect(retList.length).to.equal(1);
        expect(retList[0].assigned).to.be.null;
        expect(retList[0].task).to.equal(genTask);
    })

    it("Assigns task when runner is added", () => {
        let result = newEvent.addRunner(genRunner);
        expect(result.task).to.equal(genTask);
        expect(newEvent.taskList().length).to.equal(1);
        expect(newEvent.taskList()[0].assigned).to.equal(genRunner);
        expect(newEvent.taskList()[0].task).to.equal(genTask);
    })

    it("Behaves properly when task is removed", () => {
        let removal = newEvent.removeTask(genTask);
        expect(removal[0]).to.equal(genTask);
        expect(removal[1]).to.equal(genRunner);
        expect(newEvent.taskList().length).to.equal(0);
        expect(genRunner.task).to.be.null;
        expect(newEvent.freeRunnerList().length).to.equal(1);
    })

    it("Assigns task when runner present and task added", () => {
        let result = newEvent.addTask(genTask);
        expect(result[0]).to.be.true;
        expect(result[1]).to.equal(genTask);
        expect(result[2]).to.equal(genRunner);
        let listofTasks = newEvent.taskList();
        expect(listofTasks.length).to.equal(1);
        expect(listofTasks[0].task).to.equal(genTask);
    })

    it("Correctly manipulates task on tasked runner removal", () => {
        let result = newEvent.removeRunner(genRunner);
        expect(result[0]).to.be.true;
        expect(result[1]).to.equal(genRunner);
        let listofTasks = newEvent.taskList();
        expect(listofTasks.length).to.equal(1);
        expect(listofTasks[0].assigned).to.be.null;
    })

    it("Properly removes unassigned task", () => {
        let result = newEvent.removeTask(genTask);
        expect(result[0]).to.equal(genTask);
        expect(result[1]).to.be.null;
        let listofTasks = newEvent.taskList;
        expect(listofTasks.length).to.equal(0);
    })

    it("Properly removes event when UpperLevelWorker removed", () => {
        newEvent.addTask(genTask);
        newEvent.addRunner(genRunner);
        newEvent.removeSupervisor(genSupervisor);
        expect(genRunner.task).to.be.null;
        expect(newEvent.taskList().length).to.equal(0);
    })
})
