"use strict";
import * as express from "express";
import * as bodyparser from "body-parser";
import {createServer, Server} from "http";
import * as socket from "socket.io";
import * as path from "path";
import * as helmet from "helmet";
import * as bcrypt from "bcryptjs";
import {ActionHandler} from "./ActionHandler";
import * as BodyParser from "body-parser";
import * as exphbs from "express-handlebars";
import * as jwt from "jsonwebtoken";
import {SocketIdStore} from "./ConnectionStore"

let app = express();
let socketStore = new SocketIdStore();
app.use(helmet());
app.use(BodyParser.urlencoded({extended: true}));
app.use(BodyParser.json());
app.set('views', path.join(__dirname, '../views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars');

let actionHander = new ActionHandler();
let server = createServer(app);
let io = socket.listen(server);


app.get('/home', (req, res) => {
    res.render("socketTest.handlebars", {title: "test"});
})

/*io.use(async (socket, next) => {
    console.log(socket);
    let data = socket.request;
    let user = data.username;
    let pass = data.pass;
    console.log(user + "   :   " + pass);
    socket.join(user);
    socket.send("HIHIHI");
    next();
})*/
io.on('connection', (socket) => {
    console.log("socket.rooms");
})



server.listen(3000, () => console.log('Example app listening on port 3000!'))

/*io.use(async (socket, next) => {
    let data = socket.request;
    let dataType = data.dataType;

    //Done because of potential consequesces of new String(string)
    if(!(typeof dataType === 'string' || dataType instanceof String)){
        next(new Error('IMPROPER CONFIG'));
    }
    else if (dataType === "evCreate") {
        let user = data.userName;
        let pass = data.userPass;
        let eventName = data.eventName;
        let screen = data.screen;
        let location = data.location;
        let socketNumber = parseFloat(socket.id);
        if(user === undefined || pass === undefined || eventName === undefined 
            || screen === undefined || location === undefined) {
                next(new Error('PARAM MISSING'))
        }
        let userString = user as string;
        let passString = pass as string;
        let eventNameString = eventName as string;
        let screenString = screen as string;
        let locationString = location as string;
        if(userString.length < 5 || passString.length < 5 || screenString.length < 5) {
            next(new Error('INSUFF STRING'))
        }
        try {
            let createdEvent = await actionHander.addEvent(eventNameString, userString, passString, 
                                                        screenString, socketNumber, locationString);
            if(createdEvent === null) {
                next(new Error(JSON.stringify({status: "ERROR", error: "ERROR CREATING EVENT"})))
            }
            else if(!createdEvent[0]) {
                next(new Error(JSON.stringify({status: "ERROR", error: "NAME NOT UNIQUE"})))
            }
            else {
                let targetEvent = createdEvent[1];
                if(targetEvent === null) {
                    next(new Error(JSON.stringify({status: "ERROR", error: "NAME NOT UNIQUE"})))
                }
                else {
                    socket.join(targetEvent.$eventName);
                    socket.send(
                    JSON.stringify({status: "SUCCESS", 
                                    adminKey: targetEvent.$adminKey,
                                    supervisorKey: targetEvent.$supervisorKey,
                                    runnerKey: targetEvent.$runnerKey}))
                    next();
                }
            }
            
        } catch (error) {
            next(new Error ("Unable to create event"));
            console.error(error);
        }
    }
    else if(dataType === "login") {
        let user = data.userName;
        let pass = data.userPass;
        let evKey = data.eventKey;
        let location = data.location;
        let socketNumber = parseFloat(socket.id);
        if(user === undefined || pass === undefined || evKey === undefined 
            || screen === undefined || location === undefined) {
                next(new Error('PARAM MISSING'))
        }
        let userString = user as string;
        let passString = pass as string;
        let evKeyParsed = parseInt(evKey);
        if(userString.length < 5 || passString.length < 5 || evKey === NaN) {
            next(new Error('INCORRECT PARAM'))
        }
        try {
            let login = await actionHander.logUserIn(evKeyParsed, userString, passString, 
                                                     socketNumber, location);
            if(login === null) {

            }
        } catch (error) {
            
        }
    }
})*/
