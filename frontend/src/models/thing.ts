export interface Thing {
    id?: string;
    name: string;
    boughtAt?: string | null;
    isFromServer: 0 | 1;
    isModified: 0 | 1;
    isActive: 0 | 1;
    createdAt: string;
    updatedAt: string;
}

export type ThingResponse = Pick<Thing, 'id' | 'name' | 'boughtAt' | 'createdAt' | 'updatedAt'>;

export const isThingResponse = (item: unknown): item is ThingResponse => {
    if (item && typeof item === 'object') {
        const values = item as Record<string, unknown>;
        return (
            typeof values.id === 'string' &&
            typeof values.name === 'string' &&
            typeof values.createdAt === 'string' &&
            typeof values.updatedAt === 'string'
        );
    }
    return false;
};
