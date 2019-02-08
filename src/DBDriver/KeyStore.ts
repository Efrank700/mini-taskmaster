import * as mongoose from "mongoose";
interface iKey {
    key: number
}
type keyStoreType = iKey & mongoose.Document;

export const keyStore = mongoose.model<keyStoreType>('Key', new mongoose.Schema({
    key: Number
}));
