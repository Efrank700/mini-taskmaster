import * as mocha from 'mocha';
import {expect, assert, should} from 'chai';
import {TaskMastrEvent, participant, admin, supervisor, runner} from '../Event'
import {EventManager} from '../EventManager'
let genAdmin1: admin = {screenName: "admin1", roomName: "ev1", socketId: 1, tasks: [], location: null};
let genSupervisor1: supervisor = {screenName: "supervisor1", roomName: "ev1", socketId: 2, tasks: [], location: "home"};
let genRunner1: runner = {screenName: "runner1", roomName: "ev1", socketId: 3, task: null};
let genEvent1: TaskMastrEvent = new TaskMastrEvent("ev1", 10000, 10001, 10002, genAdmin1.screenName, []);
let genAdmin2: admin = {screenName: "admin2", roomName: "ev2", socketId: 4, tasks: [], location: null};
let genSupervisor2: supervisor = {screenName: "supervisor2", roomName: "ev2", socketId: 5, tasks: [], location: "home"};
let genRunner2: runner = {screenName: "runner2", roomName: "ev2", socketId: 6, task: null};
let genEvent2: TaskMastrEvent = new TaskMastrEvent("ev2", 10003, 10004, 10005, genAdmin2.screenName, []);
let badAdmin: admin = {screenName: "admin1", roomName: "", socketId: 1, tasks: [], location: null};
let badSupervisor: supervisor = {screenName: "supervisor1", roomName: "ev3", socketId: 2, tasks: [], location: "home"};
let badRunner: runner = {screenName: "runner3", roomName: "not real", socketId: 10, task: null};


// SIMPLE CASE TESTS
describe('EventManager Event Manipulation', () => {
    let newManager = new EventManager();
    it('Creates EventManager Length 0', () => {
        expect(newManager).to.not.be.null;
        expect(newManager.getEventCount()).to.equal(0);
    })

    it("Accepets first event", () => {
        let res = newManager.addEvent(genEvent1);
        expect(res).to.equal(genEvent1);
        expect(newManager.getEventCount()).to.equal(1);
        expect(newManager.getEventList()[0]).to.equal(genEvent1);
    })

    it('Accepts second event', () => {
        let res = newManager.addEvent(genEvent2);
        expect(res).to.equal(genEvent2);
        expect(newManager.getEventCount()).to.equal(2);
        expect(newManager.getEventList()[1]).to.equal(genEvent2);
    })

    it('Does not accept duplicates', () => {
        let res = newManager.addEvent(genEvent1);
        expect(res).to.equal(genEvent1);
        expect(newManager.getEventCount()).to.equal(2);
        expect(newManager.getEventList()[0]).to.equal(genEvent1);
        expect(newManager.getEventList().length).to.equal(2);
    })

    it('Can find event by name', () => {
        let res = newManager.findEventByName("ev1");
        expect(res).to.equal(genEvent1);
    })

    it('Will return null when finding absent event by name', () => {
        let res = newManager.findEventByName("missing");
        expect(res).to.be.null;
    })

    it('Can find event by keys', () => {
        let adminRes = newManager.findEventByKey(10000);
        let superRes = newManager.findEventByKey(10001);
        let runnerRes = newManager.findEventByKey(10002);
        expect(adminRes).to.equal(genEvent1.$eventName);
        expect(superRes).to.equal(genEvent1.$eventName);
        expect(runnerRes).to.equal(genEvent1.$eventName);
    })

    it('Will return null when finding absent event by key', () => {
        let res = newManager.findEventByKey(-1);
        expect(res).to.be.null;
    })

    it('Properly removes event', () => {
        let res = newManager.removeEvent(genEvent1.$eventName);
        expect(res).to.equal(genEvent1);
        expect(newManager.getEventCount()).to.equal(1);
        expect(newManager.getEventList()[0]).to.equal(genEvent2);
    })

    it('Ignores removal of non-present events', () => {
        let res = newManager.removeEvent(genEvent1.$eventName);
        expect(res).to.be.null;
        expect(newManager.getEventCount()).to.equal(1);
        expect(newManager.getEventList()[0]).to.equal(genEvent2);
    })
})

describe("EventManager User Manipulations", () => {
    let newManager = new EventManager();
    newManager.addEvent(genEvent1);
    newManager.addEvent(genEvent2);
    
    it("Can successfully identify when an event is empty",() => {
        expect(EventManager.isEmpty(genEvent1)).to.be.true
    })
    it("Properly inserts admins when all events are empty", () => {
        let res = newManager.addAdmin(genAdmin1);
        expect(res).to.equal(genAdmin1);
        expect(genEvent1.adminList().length).to.equal(1);
        expect(genEvent1.adminList()[0]).to.equal(genAdmin1);
        expect(genEvent2.adminList().length).to.equal(0);
    })

    it("can successfully identify if an event is not empty", () => {
        expect(EventManager.isEmpty(genEvent1)).to.be.false;
    })

    it("Properly inserts admin when an event has members", () => {
        let res = newManager.addAdmin(genAdmin2);
        expect(res).to.equal(genAdmin2);
        expect(genEvent2.adminList().length).to.equal(1);
        expect(genEvent1.adminList().length).to.equal(1);
    })

    it("Returns null when adding admin of unadded channel", () => {
        let res = newManager.addAdmin(badAdmin);
        expect(res).to.be.null;
        expect(genEvent1.adminList().length).to.equal(1);
        expect(genEvent2.adminList().length).to.equal(1);
    })

    it("Properly removes admin", () => {
        let res = newManager.removeAdmin(genAdmin1.screenName, genAdmin1.roomName);
        if(res === null) expect(false).to.be.true;
         else{
            expect(res[0]).to.equal(genAdmin1);
            expect(genEvent1.adminList().length).to.equal(0);
            expect(genEvent2.adminList().length).to.equal(1);
         }
    })

    it("Ignores remove on irrelevant admin", () => {
        let res = newManager.removeAdmin(badAdmin.screenName, badAdmin.roomName);
        expect(res).to.be.null; 
        expect(genEvent2.adminList().length).to.equal(1);
    })

    it("Properly inserts supervisors when all events are empty", () => {
        let res = newManager.addSupervisor(genSupervisor1);
        expect(res).to.equal(genSupervisor1);
        expect(genEvent1.supervisorList().length).to.equal(1);
        expect(genEvent1.supervisorList()[0]).to.equal(genSupervisor1);
        expect(genEvent2.supervisorList().length).to.equal(0);
    })

    it("Properly inserts supervisor when an event has members", () => {
        let res = newManager.addSupervisor(genSupervisor2);
        expect(res).to.equal(genSupervisor2);
        expect(genEvent2.supervisorList().length).to.equal(1);
        expect(genEvent1.supervisorList().length).to.equal(1);
    })

    it("Returns null when adding supervisor of unadded channel", () => {
        let res = newManager.addSupervisor(badSupervisor);
        expect(res).to.be.null;
        expect(genEvent1.supervisorList().length).to.equal(1);
        expect(genEvent2.supervisorList().length).to.equal(1);
    })

    it("Properly removes supervisor", () => {
        let res = newManager.removeSupervisor(genSupervisor1.screenName, genSupervisor1.roomName);
        if(res === null) expect(false).to.be.true; 
        else{
            expect(res[0]).to.equal(genSupervisor1);
            expect(genEvent1.supervisorList().length).to.equal(0);
            expect(genEvent2.supervisorList().length).to.equal(1);
        }
    })

    it("Ignores remove on irrelevant supervisor", () => {
        let res = newManager.removeSupervisor(badSupervisor.screenName, badSupervisor.roomName);
        expect(res).to.be.null;
        expect(genEvent2.supervisorList().length).to.equal(1);
    })

    it("Properly inserts runner when all events are empty", () => {
        let res = newManager.addRunner(genRunner1);
        expect(res).to.equal(genRunner1);
        expect(genEvent1.freeRunnerList().length).to.equal(1);
        expect(genEvent1.freeRunnerList()[0]).to.equal(genRunner1);
        expect(genEvent2.freeRunnerList().length).to.equal(0);
    })

    it("Properly inserts runner when an event has members", () => {
        let res = newManager.addRunner(genRunner2);
        expect(res).to.equal(genRunner2);
        expect(genEvent2.freeRunnerList().length).to.equal(1);
        expect(genEvent1.freeRunnerList().length).to.equal(1);
    })

    it("Returns null when adding runner of unadded channel", () => {
        let res = newManager.addRunner(badRunner);
        expect(res).to.be.null;
        expect(genEvent1.freeRunnerList().length).to.equal(1);
        expect(genEvent2.freeRunnerList().length).to.equal(1);
    })

    it("Properly removes runner", () => {
        let res = newManager.removeRunner(genRunner1.screenName, genRunner1.roomName);
        if(res === null) expect(false).to.be.true; 
        else{
            expect(res[0]).to.be.false;
            expect(res[1]).to.equal(genRunner1);
            expect(genEvent1.freeRunnerList().length).to.equal(0);
            expect(genEvent2.freeRunnerList().length).to.equal(1);
        }
    })

    it("Ignores remove on irrelevant runner", () => {
        let res = newManager.removeRunner(badRunner.screenName, badRunner.roomName);
        expect(res).to.be.null;
        expect(genEvent2.freeRunnerList().length).to.equal(1);
    })
})


describe("EventManager Materials and Tasks", () => {
    let newManager = new EventManager();
    newManager.addEvent(genEvent1);
    newManager.addEvent(genEvent2);
    newManager.removeSupervisor(genSupervisor1.screenName, genSupervisor1.roomName);
    newManager.removeSupervisor(genSupervisor2.screenName, genSupervisor2.roomName);
    newManager.removeRunner(genRunner1.screenName, genRunner1.roomName);
    newManager.removeRunner(genRunner2.screenName, genRunner2.roomName);
    it("Properly adds materials to rooms when valid", () => {
        let res = newManager.addMaterials("ev1", "pencils", 10);
        expect(res).to.be.false;
        expect(genEvent1.getMaterialCount("pencils")).to.equal(10);
        expect(genEvent2.getMaterialCount("pencils")).to.equal(0);
        expect(newManager.addMaterials("ev1", "pencils", 10)).to.be.true;
    })

    it("Ignores invalid rooms or amounts", () => {
        let res = newManager.addMaterials("ev5", "pens", 1);
        expect(res).to.be.null;
        let res1 = newManager.addMaterials("ev1", "pens", -1);
        expect(res1).to.be.null;
    })

    it("Properly generates task on material request", () => {
        newManager.addAdmin(genAdmin1);
        newManager.addAdmin(genAdmin2);
        let res = newManager.requestMaterial(genAdmin1.roomName, genAdmin1.screenName, "pencils", 5);
        if(res === null) expect(0).to.equal(1);
        else {
            let task = res[1];
            let runner = res[2];
            expect(res[0]).to.be.false;
            if(task === null) expect(0).to.equal(1);
            else {
                expect(task.item).to.equal("pencils");
                expect(task.quantity).to.equal(5);
                expect(task.runnerRequest).to.be.false;
                expect(task.recieveLocation).to.equal('HOME BASE');
                expect(task.supervisor).to.equal(genAdmin1);
                expect(task.depositLocation).to.equal(`UNKNOWN: LOCATION OF ${genAdmin1.screenName} -- CONTACT ADMINISTRATOR`);
            }
            expect(genEvent1.taskList()[0].assigned).to.be.null;
            expect(genEvent1.taskList()[0].task).to.equal(task);
            expect(runner).to.be.null;
        }
    })

    it("Properly generates task on runner request", () => {
        newManager.removeRunner(genRunner1.screenName, genRunner1.roomName);
        newManager.removeRunner(genRunner2.screenName, genRunner2.roomName);
        let res = newManager.requestRunner(genAdmin2.roomName, genAdmin2.screenName);
        if(res === null) expect(1).to.equal(0);
        else {
            let task = res[1];
            let runner = res[2];
            expect(res[0]).to.be.false;
            if(task === null) expect(0).to.equal(1);
            else {
                expect(task.item).to.be.undefined;
                expect(task.quantity).to.be.undefined;
                expect(task.runnerRequest).to.be.true;
                expect(task.recieveLocation).to.equal('YOUR LOCATION');
                expect(task.supervisor).to.equal(genAdmin2);
                expect(task.depositLocation).to.equal(`UNKNOWN: LOCATION OF ${genAdmin2.screenName} -- CONTACT ADMINISTRATOR`);
            }
            expect(genEvent2.taskList()[0].assigned).to.be.null;
            expect(genEvent2.taskList()[0].task).to.equal(task);
            expect(runner).to.be.null;
        }
    })

    it("Properly completes a task", () => {
        let genAdmin4: admin = {screenName: "admin2", roomName: "ev4", socketId: 4, tasks: [], location: null};
        let event = new TaskMastrEvent("ev4", 1010101, 2020202, 3030303, genAdmin4.screenName, [{itemName: "pencil", count: 10}]);
        let runner = {screenName: "runner1", roomName: "ev1", socketId: 3, task: null}
        event.addAdmin(genAdmin4);
        event.addRunner(runner);
        newManager.addEvent(event);
        let request = newManager.requestMaterial("ev4", "admin2", "pencil", 3);
        if(request === null) expect(0).to.equal(1);
        else {
            expect(request[0]).to.be.true;
            if(request[2] === null) {
                expect(0).to.equal(2);
                return;
            }
            else {
                if(request[2] === null) return;
                let runner = request[2] as runner;
                let complete = newManager.taskComplete("ev4", "runner1");
                expect(complete).to.not.be.null;
                if(complete === null) return;
                else {
                    let task = complete[0];
                    let target = complete[1];
                    let req = complete[2];
                    expect(target).to.equal(runner);
                    expect(req).to.equal(genAdmin4);
                    expect(event.getMaterialCount("pencil")).to.equal(7);
                    expect(event.freeRunnerList().length).to.equal(1);
                }
            }
        }
    }) 
    
    it("properly deletes a task", () => {
        let genAdmin4: admin = {screenName: "admin2", roomName: "ev5", socketId: 4, tasks: [], location: null};
        let event = new TaskMastrEvent("ev5", 1010101, 2020202, 3030303, genAdmin4.screenName, [{itemName: "pencil", count: 10}]);
        let runner = {screenName: "runner1", roomName: "ev5", socketId: 3, task: null}
        event.addAdmin(genAdmin4);
        event.addRunner(runner);
        newManager.addEvent(event);
        let request = newManager.requestMaterial("ev5", "admin2", "pencil", 3);
        if(request === null) expect(0).to.equal(1);
        else {
            expect(request[0]).to.be.true;
            if(request[2] === null) {
                expect(0).to.equal(2);
                return;
            }
            else {
                if(request[2] === null) return;
                let runner = request[2] as runner;
                let complete = newManager.deleteTask("ev5", "runner1");
                expect(complete).to.not.be.null;
                if(complete === null) return;
                else {
                    let task = complete[0];
                    let target = complete[1];
                    let req = complete[2];
                    expect(target).to.equal(runner);
                    expect(req).to.equal(genAdmin4);
                    expect(event.getMaterialCount("pencil")).to.equal(10);
                    expect(event.freeRunnerList().length).to.equal(1);
                }
            }
        }
    })
})