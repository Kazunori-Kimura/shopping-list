export interface Thing {
    id?: number;
    name: string;
    boughtAt?: string;
    isFromServer: 0 | 1;
    isModified: 0 | 1;
    isActive: 0 | 1;
    createdAt: string;
    updatedAt: string;
}
