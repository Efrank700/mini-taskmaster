import * as mongoose from "mongoose";
import {eventStore} from './EventStore';
import {keyStore} from './KeyStore';
import {participantTypes, admin} from '../Participant';
import {TaskMastrEvent} from '../Event';
import * as bcrypt from "bcryptjs";
(<any>mongoose).Promise = Promise;

mongoose.connection.on('error', console.error.bind(console, "MONGO ERROR"));
export class MongoDriver {

    constructor() {
        let connectPromise = mongoose.connect('mongodb://localhost:27017/taskmaster', {useMongoClient: true});
        while(connectPromise.connection !== undefined && connectPromise.connection.readyState == 2);
    }

    private static async generateKey(): Promise<number> {
        try {
            let num = Math.round(Math.random() * 999999999);
            let count = await keyStore.count({'key': num});
            while(count > 0) {
                let num = Math.round(Math.random() * 999999999);
                let count = await keyStore.count({'key': num});
            }
            const toStore = new keyStore({key: num});
            toStore.save();
            return num;
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async generateKeySet(): Promise<number[]> {
        try {
            let firstResultPromise = this.generateKey();
            let secondResultPromise = this.generateKey();
            let thirdResultPromise = this.generateKey();
            let firstResult = await firstResultPromise;
            let secondResult = await secondResultPromise;
            let thirdResult = await thirdResultPromise;
            return [firstResult, secondResult, thirdResult];
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async userNameAvailable(evKey: number, userName: string): 
                                          Promise<boolean | null> {
        try {
            let res = await eventStore.findOne().or([
                {adminKey: evKey}, 
                {supervisorKey: evKey}, 
                {runnerKey: evKey}]);
            if(res === null) return null;
            return(res.logins.findIndex((target) => {return target.user === userName}) === -1);
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async screenNameAvailable(evKey: number, screenName: string): 
                                            Promise<boolean | null> {
        try {
            let res = await eventStore.findOne().or([
                {adminKey: evKey}, 
                {supervisorKey: evKey}, 
                {runnerKey: evKey}]);
            if(res === null) return null;
            return(res.logins.findIndex((target) => {return target.screenName === screenName}) === -1);
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async addUser(evKey: number, userName: string, userScreen: string, 
                                userPass: string): Promise<participantTypes | null> {
        try {
            let saltPromise = bcrypt.genSalt(10);
            let res = await eventStore.findOne().or([
                {adminKey: evKey}, 
                {supervisorKey: evKey}, 
                {runnerKey: evKey}]);
            if(res === null) return null;
            let passPromise = bcrypt.hash(userPass, await saltPromise);
            let index = res.logins.findIndex((user) => {return user.user === userName 
                                                        || user.screenName === userScreen});
            if(index > -1) throw new Error('SUEXISTS');
            let position;
            if(evKey === res.adminKey) position = 0;
            else if(evKey === res.supervisorKey) position = 1;
            else position = 2;
            let result = eventStore.findOneAndUpdate({eventName: res.eventName}, 
                {$push: {logins: {user: userName, pass: await passPromise, screenName: userScreen,
                                  pos: position}}});
            let retVal: participantTypes;
            if(position === 0) retVal = participantTypes.admin;
            else if(position === 1) retVal = participantTypes.supervisor;
            else retVal = participantTypes.runner;
            await result;
            return retVal;
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async authenticateOwner(evKey: number, ownerUser: string, ownerPass: string):
    Promise<[boolean, string]> {
        try {
            let res = await eventStore.findOne({adminKey: evKey});
            if(res === null) return [false, "NSEVENT"];
            let adminIndex = res.logins.findIndex((target) => {return target.user === ownerUser});
            if(adminIndex === -1) return [false, "NSUSER"];
            let passMatchPromise = bcrypt.compare(ownerPass, res.logins[adminIndex].pass);
            if(res.owner.screenName !== res.logins[adminIndex].screenName) return [false, "NOWNS"];
            let matches = await passMatchPromise;
            if(matches) return [true, "SUCCESS"];
            return [false, "IPASS"];
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async authenticate(evKey: number, userName: string, userPass: string): 
                                    Promise<[boolean, string, participantTypes]> {
        try {
            let res = await eventStore.findOne().or([
                {adminKey: evKey}, 
                {supervisorKey: evKey}, 
                {runnerKey: evKey}]);
            if(res === null) return [false, "NSEVENT", participantTypes.admin];
            let targetIndex = res.logins.findIndex((user) => {return user.user === userName});
            if(targetIndex === -1) return [false, "NSUSER", participantTypes.admin];
            const targetUser = res.logins[targetIndex];
            let passMatchPromise = bcrypt.compare(userPass, targetUser.pass);
            let participantType: participantTypes;
            if(targetUser.pos === 0) participantType = participantTypes.admin;
            else if(targetUser.pos === 1) participantType = participantTypes.supervisor;
            else participantType = participantTypes.runner;
            if(targetUser.pos === 0 && evKey !== res.adminKey 
                || targetUser.pos === 1 && evKey !== res.supervisorKey
                || targetUser.pos === 2 && evKey !== res.runnerKey) {
                    return([false, "IKEY", participantTypes.admin]);
                }
            if(!(await passMatchPromise)) return([false, "IPASS", participantTypes.admin]);
            return([true, targetUser.screenName, participantType]);
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async deleteAdmin(evKey: number, screenName: string): Promise<boolean | null> {
        try {
            let res = await eventStore.findOne({adminKey: evKey});
            if(res === null) return null;
            else {
                let position = res.logins.findIndex((target) => {return target.screenName === screenName});
                if(position === -1) return false;
                else {
                    if(res.logins[position].user === res.owner.user) return false;
                    else {
                        res.logins.splice(position, 1);
                        let savePromise = res.save();
                        await savePromise;
                        return true;
                    }
                }
            }
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async deleteSupervisor(evKey: number, screenName: string): Promise<boolean | null> {
        try {
            let res = await eventStore.findOneAndUpdate({adminKey: evKey}, 
                {$pull: {logins: {screenName: screenName, pos: 1}}});
            if(res === null) return null;
            else {
                let position = res.logins.findIndex((target) => {return target.screenName === screenName});
                return(position !== -1);
            }
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async deleteRunner(evKey: number, screenName: string): Promise<boolean | null> {
        try {
            let res = await eventStore.findOneAndUpdate({adminKey: evKey}, 
                {$pull: {logins: {screenName: screenName, pos: 2}}});
            if(res === null) return null;
            else {
                let position = res.logins.findIndex((target) => {return target.screenName === screenName});
                return(position !== -1);
            }
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async eventNameAvailable(eventName: string): Promise<boolean> {
        try {
            let res = await eventStore.findOne({eventName: eventName});
            return res === null;
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async createEvent(eventName: string, owner: admin, ownerUser: string, 
                                    ownerPass: string): Promise<TaskMastrEvent | null> {
        try {
            let keysPromise = this.generateKeySet();
            let nameExists = (await eventStore.findOne({'eventName': eventName})) !== null;
            if(nameExists) return null;
            let keys = await keysPromise;
            let evToSave = new eventStore({
                eventName: eventName,
                adminKey: keys[0],
                supervisorKey: keys[1],
                runnerKey: keys[2],
                owner: {user: ownerUser, pass: ownerPass, screenName: owner.screenName, pos: 0},
                logins: [{user: ownerUser, pass: ownerPass, screenName: owner.screenName, pos: 0}],
                materials: []
            });
            let savePromise = evToSave.save();
            owner.roomName = eventName;
            await savePromise;
            return new TaskMastrEvent(eventName, keys[0], keys[1], keys[2], owner.screenName, []);
        }
        catch (error){
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async retrieveEvent(evKey: number): Promise<TaskMastrEvent | null> {
        try {
            let res = await eventStore.findOne().or([{adminKey: evKey}, 
                                                     {supervisorKey: evKey}, 
                                                     {runnerKey: evKey}]);
            if(res === null) return null;
            const evName = res.eventName;
            const keys = [res.adminKey, res.supervisorKey, res.runnerKey];
            const materials = res.materials;
            return new TaskMastrEvent(evName, keys[0], keys[1], keys[2], res.owner.screenName, materials);
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async deleteEventByName(eventIdentifier: string): Promise<boolean> {
        try {
            let delResponse = await eventStore.findOneAndRemove({eventName: eventIdentifier});
            if(delResponse === null) return false;
            keyStore.findOneAndRemove({key: delResponse.adminKey});
            keyStore.findOneAndRemove({key: delResponse.supervisorKey});
            keyStore.findOneAndRemove({key: delResponse.runnerKey});
            return (true);
        } catch (error) {
            throw new Error(error);
        }
    }
    
    public static async deleteEventByAdminID(eventIdentifier: number): Promise<boolean> {
        try {
            let targetEvent = await eventStore.findOne({adminKey: eventIdentifier});
            if(targetEvent === null)return false;
            let delResponse = await eventStore.findOneAndRemove({adminKey: eventIdentifier});
            if(delResponse === null) return false;
            keyStore.findOneAndRemove({key: delResponse.adminKey});
            keyStore.findOneAndRemove({key: delResponse.supervisorKey});
            keyStore.findOneAndRemove({key: delResponse.runnerKey});
            return (true);
        } catch (error) {
            throw new Error(error);
        }
    }
    

    public static async addMaterials(evKey: number, materialName: string, quantity: number): 
                                     Promise<boolean | null> {
        try {
            let resPromise = eventStore.findOne({adminKey: evKey});
            if(quantity <= 0) return null;
            let res = await resPromise;
            if(res === null) return null;
            let materials = res.materials;
            const targetIndex = materials.findIndex((target) => {
                return target.itemName === materialName
            });
            if(targetIndex !== -1) {
                res.materials[targetIndex].count += quantity;
                await res.save();
                return true;
            }
            else {
                res.materials.concat({itemName: materialName, count: quantity});
                await res.save();
                return false;
            }
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }

    public static async removeMaterials(evKey: number, materialName: string, quantity: number):
                                        Promise<boolean | null> {
        try {
            let resPromise = eventStore.findOne({adminKey: evKey});
            if(quantity <= 0) return null;
            let res = await resPromise;
            if(res === null) return null;
            let materials = res.materials;
            const targetIndex = materials.findIndex((target) => {
                return target.itemName === materialName
            });
            if(targetIndex === -1) {
               return false;
            }
            else {
                if(materials[targetIndex].count < quantity) {
                    return false;
                }
                else {
                    res.materials[targetIndex].count -= quantity;
                    await res.save();
                    return true;
                }
            }
        } catch (error) {
            const castError = error as Error;
            throw new Error(castError.message);
        }
    }
}