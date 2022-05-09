import Dexie, { Table } from 'dexie';
import { Thing } from '../models/thing';

export class ShoppingListDb extends Dexie {
    things!: Table<Thing>;

    constructor() {
        super('shoppingList');
        this.version(2).stores({
            things: '++id, isModified, isActive',
        });
    }
}

const db = new ShoppingListDb();
export default db;
