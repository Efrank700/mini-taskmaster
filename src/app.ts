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
let app = express();

app.use(helmet());
app.use(BodyParser.urlencoded({extended: true}));
app.use(BodyParser.json());
app.use(session({
    genid: (req) => {
        return uuid();
    },
    secret: 'its a secret',
    resave: false,
    saveUninitialized: true
}))

app.set('views', path.join(__dirname, '../views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars');

let actionHander = new ActionHandler();
let server = createServer(app);


app.get('/', (req, res) => {
    
})

app.get('/login', (req, res) => {

})

app.post('/login', (req, res) => {
    if(req.body && req.body.screen && req.body.key) {
        let key = req.body.key as number;
        let screen = req.body.screen as string;
        let addition = actionHander.addUserToEvent(screen, key, req.body.loc?req.body.loc as string : undefined);
        if(!addition[0] && addition[1] == participantTypes.admin) {
            res.status(403);
            res.json({"error": "Incorrect User Key"});
        }
        else if(participantTypes.admin == addition[1]) {

        }
    }
})

app.post('/logout', (req, res) => {

})

app.get('/runner', (req, res) => {
    
})

app.post('/runner', (req, res) => {
    
})

app.post('/upLoc', (req, res) => {

})

app.post('/makeTask', (req, res) => {

})

app.post('/cancelTask', (req, res) => {

})

app.post('/completeTask', (req, res) => {

})

app.get('/supervisor', (req, res) => {
    
})

app.post('/supervisor', (req, res) => {
    
})

app.post('/remMat', (req, res) => {
    
})

app.post('/addMat', (req, res) => {
    
})

app.post('/getMat', (req, res) => {
    
})

app.get('/admin', (req, res) => {
    
})

app.post('/admin', (req, res) => {
    
})

server.listen(3000, () => console.log('Example app listening on port 3000!'))