import * as mocha from 'mocha';
import {expect, assert, should} from 'chai';
import {TaskMastrEvent, participant, admin, supervisor, runner} from '../Event';
import {MongoDriver} from '../DBDriver/DBDriver';
import * as mongoose from 'mongoose';
import {eventStore} from '../DBDriver/EventStore';
import {keyStore} from '../DBDriver/KeyStore';
import { participantTypes } from '../Participant';
import * as bcrypt from 'bcryptjs';
(<any>mongoose).Promise = Promise;

let genAdmin1: admin = {screenName: 'hi', roomName: 'eventName', location: null, tasks: [], socketId: 1};
let genAdmin2: admin = {screenName: 'hi', roomName: 'eventName', location: null, tasks: [], socketId: 1};
let genAdmin3: admin = {screenName: 'hi', roomName: 'eventName', location: null, tasks: [], socketId: 1};
let genAdmin4: admin = {screenName: 'hi', roomName: 'eventName', location: null, tasks: [], socketId: 1};
let genAdmin5: admin = {screenName: 'hi', roomName: 'eventName', location: null, tasks: [], socketId: 1};
let genAdmin6: admin = {screenName: 'hi', roomName: 'eventName', location: null, tasks: [], socketId: 1};
let genAdmin7: admin = {screenName: 'hi', roomName: 'eventName', location: null, tasks: [], socketId: 1};

describe('Mongoose Driver tests', () => {
    let driver: MongoDriver;
    before((done) => {
        driver = new MongoDriver();
        eventStore.findOne({eventName: "targetEvent"}).then((res) => {
            if(res === null) {
                bcrypt.genSalt(10).then((res) => {
                    bcrypt.hash("ownerPass", res).then((hashRes) => {
                        let evToSave = new eventStore({
                            eventName: "targetEvent", 
                            adminKey: 1111,
                            supervisorKey: 1112,
                            runnerKey: 1113,
                            owner: {user: "ownerUser", pass: hashRes, screenName: "ownerScreen", pos: 0},
                            logins: [{user: "ownerUser", pass: hashRes, screenName: "ownerScreen", pos: 0}],
                            materials: []
                        });
                        evToSave.save().then((saveRes) => {
                            done();
                        }).catch((err) => {
                            done(err);
                        })
                    }).catch((err) => {
                        done(err);
                    })
                }).catch((err) => {
                    done(err);
                })
            }
            else {
                done();
            }
        }).catch((err) => {
            done(err);
        })
    }) 
    after(() => {
        mongoose.disconnect();
    })

    it('generates keys', (done) => {
        MongoDriver.generateKeySet().then((numArr) => {
            let first = numArr[0];
            let second = numArr[1];
            let third = numArr[2];
            expect(first).to.be.a('number');
            expect(second).to.be.a('number');
            expect(third).to.be.a('number');
            keyStore.findOne({key: first}).then((val) => {
                expect(val).to.not.be.null;
            }).then(() => {
                keyStore.findOne({key: second}).then((val) => {
                    expect(val).to.not.be.null; 
                }).then(() => {
                    keyStore.findOne({key: third}).then((val) => {
                        expect(val).to.not.be.null; 
                        done();
                    }).catch((err) => {
                        done(err)
                    })
                }).catch((err) => {
                    done(err);
                })
            }).catch((err) => {
            done(err)
            })
        })
    })

    it('generates event, does not allow for a repeat', (done) => {
        MongoDriver.createEvent('eventName', genAdmin1, 'ownerUser', 'ownerPass').then((res) => {
            let success = res != null;
            eventStore.find({eventName: "eventName"}).then((res1) => {
                if(!success){ 
                    expect(res1).to.not.be.null;
                    done();
                }
                else {
                    expect(res1[0]).to.equal(res);
                    done();
                }
            }).catch((err) => {
                done(err);
            })
        }).catch((err) => {
            done(err);
        })
    })

    it('can identify event name availability', (done) => {
        MongoDriver.createEvent('notAvailable', genAdmin2, 'ownerUser', 'ownerPass').then((res) => {
            MongoDriver.eventNameAvailable('notAvailable').then((availability) => {
                expect(availability).to.be.false;
                MongoDriver.eventNameAvailable('available').then((freedom) => {
                    expect(freedom).to.be.true;
                    done();
                }).catch((err) => {
                    done(err);
                })
            }).catch((err) => {
                done(err);
            })
        }).catch((err) => {
            done(err);
        })
    })

    it('can retrieve events', (done) => {
        eventStore.find({eventName: "eventName"}).then((res) => {
            let adminNumber = res[0].adminKey;
            MongoDriver.retrieveEvent(adminNumber).then((event) => {
                if(event === null) expect(1).to.equal(0);
                else {
                    expect(event.$owner).to.equal(genAdmin1.screenName);
                    expect(event.$eventName).to.equal("eventName");
                    expect(event.$adminKey).to.equal(adminNumber);
                    done();
                }
            }).catch((err) => {
                done(err);
            })
        }).catch((err) => {
            done(err);
        })
    })

    it('will return null on incorrect key', (done) => {
        MongoDriver.retrieveEvent(-1).then((res) => {
            expect(res).to.be.null;
            done()
        }).catch((err) => {
            done(err);
        })
    })

    /*Test error due to latency issues with Mongo. Resolution to be investigated later.
      Tested methods confirmed to work individually.*/
    it('successfully deletes event with proper key', (done) => {
        MongoDriver.createEvent("ev2", genAdmin3, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "ev2"}).then((findRes) => {
                    if(findRes === null) {
                        expect(1).to.equal(0);
                        done()
                    }
                    else {
                        MongoDriver.deleteEventByAdminID(findRes.adminKey).then((delRes) => {
                            eventStore.findOne({eventName: "ev2"}).then((endRes) => {
                                expect(delRes).to.be.true;
                                expect(endRes).to.be.null;
                                done();
                            }).catch((err) => {
                                done(err);
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                })
            }
            else {
                MongoDriver.deleteEventByName("ev2").then((res) => {
                    expect(res).to.be.true
                    eventStore.findOne({eventName: "ev2"}).then((findRes) => {
                        expect(findRes).to.be.null;
                        done();
                    }).catch((err) => {
                        done(err);
                    })
                }).catch((err) => {
                    done(err);
                })
            }
        }).catch((err) => {
            done(err);
        })
    })

    it('will return null if admin key is not valid', (done) => {
        MongoDriver.deleteEventByAdminID(-1).then((res) => {
            expect(res).to.be.false;
            done();
        }).catch((err) => {
            done(err);
        })
    })
    
    it('will return null if event name is not valid', (done) => {
        MongoDriver.deleteEventByName("invalidEV").then((res) => {
            expect(res).to.be.false;
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('can add user properly given proper values', function(done) {
        this.retries(2);
        MongoDriver.createEvent("userEvent", genAdmin4, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "userEvent"}).then((findRes) => {
                    if(findRes === null) {
                        expect(1).to.equal(0);
                        done()
                    }
                    else {
                        MongoDriver.addUser(findRes.adminKey, "target", "target", "target").then((addRes) => {
                            expect(addRes).to.equal(participantTypes.admin);
                            eventStore.findOne({eventName: "userEvent"}).then((findRes) => {
                                if(findRes === null) {
                                    expect(1).to.equal(2);
                                    eventStore.findOneAndRemove({eventName: "userEvent"}).then((end) => {
                                        done()
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                                else {
                                    expect(findRes.logins.length).to.equal(2);
                                    expect(findRes.logins.findIndex((target) => {
                                        return target.screenName == "target";
                                    })).to.not.equal(-1);
                                    eventStore.findOneAndRemove({eventName: "userEvent"}).then((end) => {
                                        done()
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                            }).catch((err) => {
                                done(err);
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
            else {
                MongoDriver.addUser(res.$adminKey, "target", "target", "target").then((addRes) => {
                    expect(addRes).to.equal(participantTypes.admin);
                    eventStore.findOne({eventName: "userEvent"}).then((findRes) => {
                        if(findRes === null) {
                            expect(1).to.equal(3);
                            eventStore.findOneAndRemove({eventName: "userEvent"}).then((end) => {
                                done()
                            }).catch((err) => {
                                done(err);
                            })
                        }
                        else {
                            expect(findRes.logins.length).to.equal(2);
                            expect(findRes.logins.findIndex((target) => {
                                return target.screenName == "target";
                            })).to.not.equal(-1);
                            eventStore.findOneAndRemove({eventName: "userEvent"}).then((end) => {
                                done()
                            }).catch((err) => {
                                done(err);
                            })
                        }
                    }).catch((err) => {
                        done(err);
                    })
                }).catch((err) => {
                    done(err);
                })
            }
        }).catch((err) => {
            done(err);
        })
    })

    it('Throws error when attempting to add a repeat user', (done) => {
        MongoDriver.addUser(1111, "user", "screen", "pass").then((typeRes) => {
            if(typeRes === null) {
                expect(0).to.equal(1);
                done()
            }
            else {
                MongoDriver.addUser(1111, "user", "screen", "pass").then((res) => {
                    if(res != undefined) expect(0).to.equal(2);
                    done()
                }).catch((err) => {
                    const castErr = err as Error;
                    if(castErr.message === "SUEXISTS") {
                        expect(1).to.equal(1);
                        done()
                    }
                    else {
                        done(err);
                    }
                })
            }
        }).catch((err) => {
            const castErr = err as Error;
            if(castErr.message === "SUEXISTS") {
                expect(1).to.equal(1);
                done()
            }
            else {
                done(err);
            }
        })
    })

    it('Returns null when finding unlisted event', (done) => {
        MongoDriver.addUser(-1, "user", "screen", "pass").then((res) => {
            expect(res).to.be.null;
            done()
        }).catch((err) => {
            done(err);
        })
    })

    it('authenticates owner when given proper info', (done) => {
        MongoDriver.authenticateOwner(1111, "ownerUser", "ownerPass").then((res) => {
            expect(res[0]).to.be.true;
            expect(res[1]).to.equal("SUCCESS");
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('fails to authenticate given incorrect user: owner', (done) => {
        MongoDriver.authenticateOwner(1111, "ownerUser1", "ownerPass").then((res) => {
            expect(res[0]).to.be.false;
            expect(res[1]).to.equal("NSUSER");
            done()
        }).catch((err) => {
            done(err);
        })
    })

    it('fails to authenticate given incorrect pass: owner', (done) => {
        MongoDriver.authenticateOwner(1111, "ownerUser", "notPass").then((res) => {
            expect(res[0]).to.be.false;
            expect(res[1]).to.equal("IPASS")
            done();
        }).catch((err) => {
            done(err);
        })
    })
    it('authenticates when supplied proper info', (done) => {
        MongoDriver.authenticate(1111, "user", "pass").then((res) => {
            if(res === null) {
                expect(0).to.equal(1);
                done();
            }
            else {
                expect(res[0]).to.be.true;
                expect(res[1]).to.equal("screen");
                expect(res[2]).to.equal(participantTypes.admin);
                done();
            }
        }).catch((err) => {
            done(err);
        })
    })

    it('fails authentication when supplied incorrect key', (done) => {
        MongoDriver.authenticate(1112, "user", "pass").then((res) => {
            if(res === null) {
                expect(0).to.equal(1);
                done();
            }
            else {
                expect(res[0]).to.be.false;
                expect(res[1]).to.equal("IKEY");
                expect(res[2]).to.equal(participantTypes.admin);
                done();
            }
        }).catch((err) => {
            done(err);
        })
    })

    it('fails authentication when supplied invalid event', (done) => {
        MongoDriver.authenticate(-1, "user", "pass").then((res) => {
            expect(res[0]).to.be.false;
            expect(res[1]).to.equal("NSEVENT");
            expect(res[2]).to.equal(participantTypes.admin);
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('fails authentication when supplied invalid username', (done) => {
        MongoDriver.authenticate(1111, "user1", "pass").then((res) => {
            expect(res[0]).to.be.false;
            expect(res[1]).to.equal("NSUSER");
            expect(res[2]).to.equal(participantTypes.admin);
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('fails authentication when supplied invalid password', (done) => {
        MongoDriver.authenticate(1111, "user", "pass1").then((res) => {
            expect(res[0]).to.be.false;
            expect(res[1]).to.equal("IPASS");
            expect(res[2]).to.equal(participantTypes.admin);
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('can delete admin', function(done) {
        this.retries(2);
        MongoDriver.addUser(1111, "user", "screen", "pass").then((res) => {
            MongoDriver.deleteAdmin(1111, "screen").then((ev) => {
                expect(ev).to.be.true;
                done()
            }).catch((err) => {
                done(err);
            })
        }).catch((err) => {
            const castErr = err as Error;
            if(castErr.message === "SUEXISTS") {
                MongoDriver.deleteAdmin(1111, "screen").then((ev) => {
                    expect(ev).to.be.true;
                    done()
                }).catch((err) => {
                    done(err);
                })
            }
            else done(err);
        })
    })

    it('returns null on delete user for invalid event', (done) => {
        MongoDriver.deleteAdmin(-1, "fun").then((res) => {
            expect(res).to.be.null;
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('returns false on delete user for invalid user', (done) => {
        MongoDriver.deleteAdmin(1111, "fun").then((res) => {
            expect(res).to.be.false;
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('can add new type of material to existing event', (done) => {
        MongoDriver.createEvent("matTestEvent", genAdmin5, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "matTestEvent"}).then((findRes) => {
                    if(findRes === null) {
                        expect(0).to.equal(1);
                        done()
                    }
                    else {
                        MongoDriver.addMaterials(findRes.adminKey, "pencils", 5).then((addRes) => {
                            expect(addRes).to.be.false;
                            eventStore.findOne({eventName: "matTestEvent"}).then((materialFind) => {
                                if(materialFind === null) {
                                    expect(0).to.equal(2);
                                    done()
                                }
                                else {
                                   expect(materialFind.materials[0].itemName).to.equal("pencils");
                                   expect(materialFind.materials[0].count).to.equal(5);
                                   eventStore.findOneAndRemove({adminKey: findRes.adminKey})
                                   .then((delRes) => {
                                        done()
                                   }).catch((err) => {
                                    done(err);
                                })
                                }
                            }).catch((err) => {
                                done(err);
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
            else{
                MongoDriver.addMaterials(res.$adminKey, "pencils", 5).then((addRes) => {
                    expect(addRes).to.be.false;
                    eventStore.findOne({eventName: "matTestEvent"}).then((materialFind) => {
                        if(materialFind === null) {
                            expect(0).to.equal(2);
                            done()
                        }
                        else {
                           expect(materialFind.materials[0].itemName).to.equal("pencils");
                           expect(materialFind.materials[0].count).to.equal(5);
                           eventStore.findOneAndRemove({adminKey: res.$adminKey})
                           .then((delRes) => {
                                done()
                           }).catch((err) => {
                            done(err);
                        })
                        }
                    }).catch((err) => {
                        done(err);
                    })
                }).catch((err) => {
                    done(err);
                })
            }
        })
    })

    it('returns null for adding material to invalid event', (done) => {
        MongoDriver.addMaterials(-1, "pencils", 5).then((res) => {
            expect(res).to.be.null;
            done();
        }).catch((err) => {
            done(err);
        })
    })

    it('successfully adds material to event with existing material', (done) => {
        MongoDriver.createEvent("matTestEvent1", genAdmin6, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "matTestEvent1"}).then((findRes) => {
                    if(findRes === null) {
                        expect(0).to.equal(1);
                        done()
                    }
                    else {
                        MongoDriver.addMaterials(findRes.adminKey, "pencils", 5).then((initialAddRes) => {
                            if(initialAddRes === null) {
                                expect(0).to.equal(3);
                                done();
                            }
                            MongoDriver.addMaterials(findRes.adminKey, "pencils", 5).then((addRes) => {
                                if(addRes === null) {
                                    expect(0).to.equal(3);
                                    done();
                                }
                                else {
                                    expect(addRes).to.be.true;
                                    eventStore.findOne({eventName: "matTestEvent1"}).then((materialFind) => {
                                        if(materialFind === null) {
                                            expect(0).to.equal(2);
                                            done()
                                        }
                                        else {
                                           expect(materialFind.materials[0].itemName).to.equal("pencils");
                                           expect(materialFind.materials[0].count).to.equal(10);
                                           eventStore.findOneAndRemove({adminKey: materialFind.adminKey})
                                           .then((delRes) => {
                                                done()
                                           }).catch((err) => {
                                            done(err);
                                        })
                                        }
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
            else{
                MongoDriver.addMaterials(res.$adminKey, "pencils", 5).then((initialAddRes) => {
                    if(initialAddRes === null) {
                        expect(0).to.equal(3);
                        done();
                    }
                    MongoDriver.addMaterials(res.$adminKey, "pencils", 5).then((addRes) => {
                        expect(addRes).to.be.true;
                        eventStore.findOne({eventName: "matTestEvent1"}).then((materialFind) => {
                            if(materialFind === null) {
                                expect(0).to.equal(2);
                                done()
                            }
                            else {
                               expect(materialFind.materials[0].itemName).to.equal("pencils");
                               expect(materialFind.materials[0].count).to.equal(10);
                               eventStore.findOneAndRemove({adminKey: res.$adminKey})
                               .then((delRes) => {
                                    done()
                               }).catch((err) => {
                                done(err);
                            })
                            }
                        }).catch((err) => {
                            done(err);
                        })
                    }).catch((err) => {
                        done(err);
                    })
                }).catch((err) => {
                    done(err);
                })
            }
        })
    })

    it('can remove materials given appropriate count and event', (done) => {
        MongoDriver.createEvent('remMatEvent', genAdmin7, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "remMatEvent"}).then((findRes) => {
                    if(findRes === null) {
                        expect(0).to.equal(1);
                        done();
                    }
                    else {
                        MongoDriver.addMaterials(findRes.adminKey, "pencils", 5).then((addRes) => {
                            if(addRes === null) {
                                MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                    expect(0).to.equal(2);
                                    done();
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                            else {
                                MongoDriver.removeMaterials(findRes.adminKey, "pencils", 4).then((remRes) => {
                                    eventStore.findOne({adminKey: findRes.adminKey}).then((remFindRes) => {
                                        if(remFindRes === null) {
                                            MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                                expect(0).to.equal(3);
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                        else {
                                            MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                                expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                                expect(remFindRes.materials[0].count).to.equal(1);
                                                expect(remRes).to.be.true;
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
            else {
                MongoDriver.addMaterials(res.$adminKey, "pencils", 5).then((addRes) => {
                    if(addRes === null) {
                        MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                            expect(0).to.equal(2);
                            done();
                        }).catch((err) => {
                            done(err);
                        })
                    }
                    else {
                        MongoDriver.removeMaterials(res.$adminKey, "pencils", 4).then((remRes) => {
                            eventStore.findOne({adminKey: res.$adminKey}).then((remFindRes) => {
                                if(remFindRes === null) {
                                    MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                        expect(0).to.equal(3);
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                                else {
                                    MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                        expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                        expect(remFindRes.materials[0].count).to.equal(1);
                                        expect(remRes).to.be.true;
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                            }).catch((err) => {
                                done(err);
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
        }).catch((err) => {
            done(err);
        })
    })

    it('returns false when attempting to remove too many of an item', (done) => {
        MongoDriver.createEvent('remMatEvent', genAdmin7, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "remMatEvent"}).then((findRes) => {
                    if(findRes === null) {
                        expect(0).to.equal(1);
                        done();
                    }
                    else {
                        MongoDriver.addMaterials(findRes.adminKey, "pencils", 5).then((addRes) => {
                            if(addRes === null) {
                                MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                    expect(0).to.equal(2);
                                    done();
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                            else {
                                MongoDriver.removeMaterials(findRes.adminKey, "pencils", 6).then((remRes) => {
                                    eventStore.findOne({adminKey: findRes.adminKey}).then((remFindRes) => {
                                        if(remFindRes === null) {
                                            MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                                expect(0).to.equal(3);
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                        else {
                                            MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                                expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                                expect(remFindRes.materials[0].count).to.equal(5);
                                                expect(remRes).to.be.false;
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
            else {
                MongoDriver.addMaterials(res.$adminKey, "pencils", 5).then((addRes) => {
                    if(addRes === null) {
                        MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                            expect(0).to.equal(2);
                            done();
                        }).catch((err) => {
                            done(err);
                        })
                    }
                    else {
                        MongoDriver.removeMaterials(res.$adminKey, "pencils", 6).then((remRes) => {
                            eventStore.findOne({adminKey: res.$adminKey}).then((remFindRes) => {
                                if(remFindRes === null) {
                                    MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                        expect(0).to.equal(3);
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                                else {
                                    MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                        expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                        expect(remFindRes.materials[0].count).to.equal(5);
                                        expect(remRes).to.be.false;
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                            }).catch((err) => {
                                done(err);
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
        }).catch((err) => {
            done(err);
        })
    })

    it('returns null when attempting to remove negative items', (done) => {
        MongoDriver.createEvent('remMatEvent', genAdmin7, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "remMatEvent"}).then((findRes) => {
                    if(findRes === null) {
                        expect(0).to.equal(1);
                        done();
                    }
                    else {
                        MongoDriver.addMaterials(findRes.adminKey, "pencils", 5).then((addRes) => {
                            if(addRes === null) {
                                MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                    expect(0).to.equal(2);
                                    done();
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                            else {
                                MongoDriver.removeMaterials(findRes.adminKey, "pencils", -6).then((remRes) => {
                                    eventStore.findOne({adminKey: findRes.adminKey}).then((remFindRes) => {
                                        if(remFindRes === null) {
                                            MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                                expect(0).to.equal(3);
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                        else {
                                            MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                                expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                                expect(remFindRes.materials[0].count).to.equal(5);
                                                expect(remRes).to.be.null;
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
            else {
                MongoDriver.addMaterials(res.$adminKey, "pencils", 5).then((addRes) => {
                    if(addRes === null) {
                        MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                            expect(0).to.equal(2);
                            done();
                        }).catch((err) => {
                            done(err);
                        })
                    }
                    else {
                        MongoDriver.removeMaterials(res.$adminKey, "pencils", -6).then((remRes) => {
                            eventStore.findOne({adminKey: res.$adminKey}).then((remFindRes) => {
                                if(remFindRes === null) {
                                    MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                        expect(0).to.equal(3);
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                                else {
                                    MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                        expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                        expect(remFindRes.materials[0].count).to.equal(5);
                                        expect(remRes).to.be.null;
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                            }).catch((err) => {
                                done(err);
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
        }).catch((err) => {
            done(err);
        })
    })
    
    it('returns false when attempting to remove non-existant itme', (done) => {
        MongoDriver.createEvent('remMatEvent', genAdmin7, "user", "pass").then((res) => {
            if(res === null) {
                eventStore.findOne({eventName: "remMatEvent"}).then((findRes) => {
                    if(findRes === null) {
                        expect(0).to.equal(1);
                        done();
                    }
                    else {
                        MongoDriver.addMaterials(findRes.adminKey, "pencils", 5).then((addRes) => {
                            if(addRes === null) {
                                MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                    expect(0).to.equal(2);
                                    done();
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                            else {
                                MongoDriver.removeMaterials(findRes.adminKey, "pencil", 1).then((remRes) => {
                                    eventStore.findOne({adminKey: findRes.adminKey}).then((remFindRes) => {
                                        if(remFindRes === null) {
                                            MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                                expect(0).to.equal(3);
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                        else {
                                            MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                                expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                                expect(remFindRes.materials[0].count).to.equal(5);
                                                expect(remRes).to.be.false;
                                                done();
                                            }).catch((err) => {
                                                done(err);
                                            })
                                        }
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }).catch((err) => {
                                    done(err);
                                })
                            }
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
            else {
                MongoDriver.addMaterials(res.$adminKey, "pencils", 5).then((addRes) => {
                    if(addRes === null) {
                        MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                            expect(0).to.equal(2);
                            done();
                        }).catch((err) => {
                            done(err);
                        })
                    }
                    else {
                        MongoDriver.removeMaterials(res.$adminKey, "pencil", 1).then((remRes) => {
                            eventStore.findOne({adminKey: res.$adminKey}).then((remFindRes) => {
                                if(remFindRes === null) {
                                    MongoDriver.deleteEventByName("remMatEvent").then((delRes) => {
                                        expect(0).to.equal(3);
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                                else {
                                    MongoDriver.deleteEventByAdminID(remFindRes.adminKey).then((delRes) => {
                                        expect(remFindRes.materials[0].itemName).to.equal("pencils");
                                        expect(remFindRes.materials[0].count).to.equal(5);
                                        expect(remRes).to.be.false;
                                        done();
                                    }).catch((err) => {
                                        done(err);
                                    })
                                }
                            }).catch((err) => {
                                done(err);
                            })
                        }).catch((err) => {
                            done(err);
                        })
                    }
                }).catch((err) => {
                    done(err);
                })
            }
        }).catch((err) => {
            done(err);
        })
    })

    it('returns null when told to remove from non-existant event', (done) => {
        MongoDriver.removeMaterials(-1, "pencils", 1).then((res) => {
            expect(res).to.be.null;
            done()
        }).catch((err) => {
            done(err);
        })
    })
})