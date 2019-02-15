"use strict";
import * as express from "express";
import * as bodyparser from "body-parser";
import {createServer, Server} from "http";
import * as path from "path";
import * as helmet from "helmet";
import * as bcrypt from "bcryptjs";
import {ActionHandler} from "./ActionHandler";
import * as BodyParser from "body-parser";
import * as exphbs from "express-handlebars";
import * as jwt from "jsonwebtoken";
import * as session from "express-session"
import * as uuid from "uuid";
import { participantTypes } from "./Participant";
import * as session_fs from "session-file-store";
import { isArray } from "util";

let app = express();

let FileStore = session_fs(session);
app.use(helmet());
app.use(BodyParser.urlencoded({extended: true}));
app.use(BodyParser.json());
app.use(session({
    genid: (req) => {
        return uuid();
    },
    secret: process.env.SECRETIVE || 'its a secret',
    resave: false,
    saveUninitialized: true,
    name: "MiniTasks"
}))

app.set('views', path.join(__dirname, '../views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars');

let actionHander = new ActionHandler();
let server = createServer(app);

function renderRunner(req:any , res:any , screen: any, additionalData: any, err:any) {
    let runner = actionHander.getRunnerByScreenName(screen);
    if(runner == null) {
        req.session.destroy((error: any) => {
            res.render('login', {error:error, logicError: "Account not found, please log in again"});
        })
    }
    else {
        let renderObj:any = {screen: screen}
        if(additionalData) {
            renderObj = additionalData;
        }
        if (runner.task) {
            renderObj.task = runner.task
        }
        res.render('runner', renderObj)
    }
}

app.get('/runner_test', (req, res) => {
    res.render('admin', {screen: "Eric Frank", helpers: {
        isArr: function(arr: any ) {return (isArray(arr))}
    }})
})

app.get('/guide', (req, res) => {
    res.render('guide')
})

app.get('/', (req, res) => {
    if(req.session && req.session.key) {
        if(req.session.key == actionHander.adminKey) {
            res.render('admin')
        }
        else if(req.session.key == actionHander.superKey) {
            res.render('supervisor')
        }
        else if(req.session.key == actionHander.runnerKey) {
            renderRunner(req, res, req.session.screen, null, null)
        }
        else {
            req.session.destroy((err) => {
                res.render('login');
            })
        }
    }
    else {
        res.render('guide');
    }
})

app.get('/keys', (req, res) => {
    res.json({admin: actionHander.adminKey, super: actionHander.superKey, run: actionHander.runnerKey});
})

app.get('/login', (req, res) => {
    if(req.session && req.session.key) {
        if(req.session.key == actionHander.adminKey) {
            res.render('admin')
        }
        else if(req.session.key == actionHander.superKey) {
            res.render('supervisor')
        }
        else if(req.session.key == actionHander.runnerKey) {
            renderRunner(req, res, req.session.screen, null, null)
        }
        else {
            req.session.destroy((err) => {
                res.render('login')
            })
        }
    }
    else {
        res.render('login');
    }
})

app.post('/login', (req, res) => {
    if(req.body && req.body.screen && req.body.key) {
        let key = req.body.key;
        let screen = req.body.screen as string;
        let addition = actionHander.addUserToEvent(screen, key, req.body.loc?req.body.loc as string : undefined);
        let success = addition[0];
        if(success == null) {
            res.render('login', {badKey: true})
            console.log("null")
        }
        else {
            if (!success) {
                if(addition[1] == participantTypes.runner) {
                    req.session!.key = key;
                    req.session!.screen = screen;
                    renderRunner(req, res, req.session!.screen, null, null)
                }
                else {
                    res.render('login', {taken: true})
                }
            }

            else {
                req.session!.key = key;
                req.session!.screen = screen;
                console.log(key)
                console.log(actionHander.adminKey)
                if(key == actionHander.adminKey) {
                    res.render('admin')
                }
                else if(key == actionHander.superKey) {
                    res.render('supervisor')
                    console.log("rdrs")
                }
                else if(key == actionHander.runnerKey) {
                    renderRunner(req, res, req.session!.screen, null, null)
                }
                else {
                    req.session!.destroy((err) => {
                        console.log("destroy")
                        if(err) {
                            res.render('login', {error: err});
                        }
                        else {
                            res.render('login')
                        }
                    })
                }
            }
        }
        
    }
    else {
        res.render('login', {error: "Insufficient Data Sent"})
    }
})


app.post('/logout', (req, res) => {
    if(!req.session || !req.session.key || !req.session.screen) {
        res.render('login')
    }
    else {
        let logout = actionHander.logUserOut(req.session.screen, req.session.key);
        req.session.destroy((err) => {
            if(err) {
                res.render('login', {flash: "you have successfully been logged out", error: err})
            }
            res.render('login', {flash: "you have successfully been logged out"})
        })
    }
})

app.get('/runner', (req, res) => {
    if(req.session && req.session.key) {
        if(req.session.key == actionHander.adminKey) {
            res.render('admin')
        }
        else if(req.session.key == actionHander.superKey) {
            res.render('supervisor')
        }
        else if(req.session.key == actionHander.runnerKey) {
            renderRunner(req, res, req.session.screen, null, null)
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        console.log("no")
        res.render('login');
    }
})

app.post('/upLoc', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            if(!req.body.location) {
                res.json({success: false});
            }
            else {
                let admin = actionHander.getAdminByScreenName(req.session.screen);
                if(admin == null) {
                    res.json({success: false});
                }
                else {
                    admin.location = req.body.location;
                    res.json({success: true});
                }
            }
        }
        else if(req.session.key == actionHander.superKey) {
            if(!req.body.location) {
                res.json({success: false});
            }
            else {
                let admin = actionHander.getSupervisorByScreenName(req.session.screen);
                if(admin == null) {
                    res.json({success: false});
                }
                else {
                    admin.location = req.body.location;
                    res.json({success: true});
                }
            }
        }
        else if(req.session.key == actionHander.runnerKey) {
            res.json({success: false});
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        res.render('login');
    }
})

app.post('/makeTask', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            if(req.body.userRequest == undefined) {
                res.json({success: false});
            }
            else {
                if(!req.body.userRequest && (!req.body.materialName || !req.body.quantity)) {
                    res.json({success: false});
                }
                else {
                    if(req.body.materialName && req.body.quantity) {
                        let request = actionHander.addTask(req.session.screen, req.body.userRequest,
                            participantTypes.admin, req.body.materialName, parseInt(req.body.quantity));
                        if (request == null || request == [false, null, null]) {
                            res.render('admin', {logicError: "Task Unable to be added, please review request and try again"});
                        }
                        else {
                            res.render('admin')
                        }
                    }
                }
            }
        }
        else if(req.session.key == actionHander.superKey) {
            if(req.body.userRequest == undefined) {
                res.json({success: false});
            }
            else {
                if(!req.body.userRequest && (!req.body.materialName || !req.body.quantity)) {
                    res.json({success: false});
                }
                else {
                    if(req.body.materialName && req.body.quantity) {
                        let request = actionHander.addTask(req.session.screen, req.body.userRequest,
                            participantTypes.supervisor, req.body.materialName, parseInt(req.body.quantity));
                        if (request == null || request == [false, null, null]) {
                            res.render('supervisor', {logicError: "Task Unable to be added, please review request and try again"});
                        }
                        else {
                            res.render('supervisor')
                        }
                    }
                }
            }
        }
        else if(req.session.key == actionHander.runnerKey) {
            res.json({success: false});
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        res.render('login');
    }
})

app.post('/cancelTask', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            if(req.body.runnerName == undefined) {
                res.json({success: false});
            }
            else {
                let result = actionHander.cancelTask(req.body.runnerName)
                if (result == null) {
                    res.render('supervisor', {logicError: "Task unable to be located properly"})
                }
            }
        }
        else if(req.session.key == actionHander.superKey) {
            if(req.body.runnerName == undefined) {
                res.json({success: false});
            }
            else {
                let result = actionHander.cancelTask(req.body.runnerName)
                if (result == null) {
                    res.render('supervisor', {logicError: "Task unable to be located properly"})
                }
            }
        }
        else if(req.session.key == actionHander.runnerKey) {
            res.json({success: false});
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        res.render('login');
    }
})

app.post('/completeTask', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            if(req.body.runnerName == undefined) {
                res.json({success: false});
            }
            else {
                let result = actionHander.taskComplete(req.body.runnerName)
                if (result == null) {
                    res.render('supervisor', {logicError: "Task unable to be located properly"})
                }
            }
        }
        else if(req.session.key == actionHander.superKey) {
            if(req.body.runnerName == undefined) {
                res.json({success: false});
            }
            else {
                let result = actionHander.taskComplete(req.body.runnerName)
                if (result == null) {
                    res.render('supervisor', {logicError: "Task unable to be located properly"})
                }
            }
        }
        else if(req.session.key == actionHander.runnerKey) {
            res.json({success: false});
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        res.render('login');
    }
})

app.get('/supervisor', (req, res) => {
    if(req.session && req.session.key) {
        if(req.session.key == actionHander.adminKey) {
            res.render('admin')
        }
        else if(req.session.key == actionHander.superKey) {
            res.render('supervisor')
        }
        else if(req.session.key == actionHander.runnerKey) {
            renderRunner(req, res, req.session.screen, null, null)
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        console.log("no")
        res.render('login');
    }
})

app.post('/supervisor', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.superKey) {
            let allMat = actionHander.getMaterials();
            if(allMat) {
                let freeMat = allMat[1];
                let usedmat = allMat[0].filter((element) => {element.user.screenName == req.session!.screen})
                let allTasks = actionHander.getCurrentTasks().filter((element) => {
                    element.task.supervisor.screenName == req.session!.screen
                })
                res.json({freeMat: freeMat, used: usedmat, tasks: allTasks});
            }
        }
        else {
            res.json({success: false})
        }
    }
    else {
        res.json({success: false})
    }
})

app.post('/admin', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            let allMat = actionHander.getMaterials();
            if(allMat) {
                let freeMat = allMat[1];
                let usedmat = allMat[0].filter((element) => {element.user.screenName == req.session!.screen})
                let allTasks = actionHander.getCurrentTasks();
                let myTasks = allTasks.filter((element) => {
                    element.task.supervisor.screenName == req.session!.screen
                })
                res.json({freeMat: freeMat, used: allMat[0], tasks: allTasks, myMat: usedmat, mytask: myTasks});
            }
        }
        else {
            res.send('no')
        }
    }
    else {
        res.json({success: false})
    }
})

app.post('/remMat', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            if(req.body.material == undefined || req.body.quantity == undefined) {
                res.json({success: false});
            }
            else {
                let result = actionHander.removeMaterials(req.body.material, parseInt(req.body.quantity))
                res.json({success: result})
            }
        }
        else if(req.session.key == actionHander.superKey) {
            res.json({success: false});
        }
        else if(req.session.key == actionHander.runnerKey) {
            res.json({success: false});
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        res.render('login');
    }
})

app.post('/addMat', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            if(req.body.material == undefined || req.body.quantity == undefined) {
                res.json({success: false});
            }
            else {
                let result = actionHander.removeMaterials(req.body.material, parseInt(req.body.quantity))
                res.json({success: result})
            }
        }
        else if(req.session.key == actionHander.superKey) {
            res.json({success: false});
        }
        else if(req.session.key == actionHander.runnerKey) {
            res.json({success: false});
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        res.render('login');
    }
})

app.post('/getMat', (req, res) => {
    if(req.session && req.session.key && req.session.screen) {
        if(req.session.key == actionHander.adminKey) {
            res.json({materials: actionHander.getMaterials})
        }
        else if(req.session.key == actionHander.superKey) {
            res.json({materials: actionHander.getMaterials})
        }
        else if(req.session.key == actionHander.runnerKey) {
            res.json({success: false});
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        res.render('login');
    }
})

app.get('/admin', (req, res) => {
    if(req.session && req.session.key) {
        if(req.session.key == actionHander.adminKey) {
            res.render('admin')
        }
        else if(req.session.key == actionHander.superKey) {
            res.render('supervisor')
        }
        else if(req.session.key == actionHander.runnerKey) {
            renderRunner(req, res, req.session.screen, null, null)
        }
        else {
            req.session.destroy((err) => {
                if(err) {
                    res.render('login', {error: err});
                }
                else {
                    res.render('login')
                }
            })
        }
    }
    else {
        console.log("no")
        res.render('login');
    }
})

server.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))