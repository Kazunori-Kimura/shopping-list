import Dexie, { Table } from 'dexie';
import { Thing } from '../models/thing';

export class ShoppingListDb extends Dexie {
    things!: Table<Thing>;

    constructor() {
        super('shopping_list');

        this.version(1).stores({
            things: 'id, isModified, isActive, isFromServer',
        });
    }
}

const db = new ShoppingListDb();
export default db;
