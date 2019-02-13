/**
 * EXTRACTED IN CASE I CHOOSE TO INTEGRATE SOMETHING SUCH AS REDIS IN THE FUTURE
 */

export class SocketIdStore {

    private sockets: number[];
    private ids: number[];
    private count: number = 0;
    constructor() {
        this.sockets = [];
        this.ids = [];
    }

    public addPair(id: number, socket: number) : boolean {
        let targetIndex = this.sockets.indexOf(socket);
        if(targetIndex != -1) return false;
        else {
            this.sockets.push(socket);
            this.ids.push(id);
            return true;
        }
    }

    public changeSocket(id: number, socket: number) : boolean {
        let targetIndex = this.ids.indexOf(id);
        if(targetIndex == -1) return false;
        else {
            this.sockets[targetIndex] = socket;
            return true;
        }
    }

    public changeId(id: number, socket: number) : boolean {
        let targetIndex = this.sockets.indexOf(socket);
        if(targetIndex == -1) return false;
        else {
            this.ids[targetIndex] = id;
            return true;
        }
    }

    public getId(socket: number) : number {
        let targetIndex = this.sockets.indexOf(socket);
        if(targetIndex == -1) return Infinity;
        else {
            return this.ids[targetIndex];
        }
    }

    public getSocket(id: number) : number {
        let targetIndex = this.ids.indexOf(id);
        if(targetIndex == -1) return Infinity;
        else {
            return this.sockets[targetIndex];
        }
    }

    public removePair(id: number, socket: number) : number {
        let targetIndex = this.ids.indexOf(id);
        if(targetIndex == -1) return Infinity;
        else {
            if(this.sockets[targetIndex] != socket) return -1 * Infinity;
            this.ids.splice(targetIndex, 1);
            this.sockets.splice(targetIndex, -1);
            return 1;
        }
    }
}