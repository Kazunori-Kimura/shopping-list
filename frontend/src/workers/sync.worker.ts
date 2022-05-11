/* eslint-disable no-restricted-globals */
import db from '../database/db';
import { isThingResponse, Thing, ThingResponse } from '../models/thing';

const SyncMessageTypes = ['start', 'pause', 'once'] as const;
type SyncMessageType = typeof SyncMessageTypes[number];
const isSyncMessageType = (item: unknown): item is SyncMessageType => {
    if (typeof item === 'string') {
        return SyncMessageTypes.some((message) => message === item);
    }
    return false;
};

interface SyncStartMessage {
    type: 'start';
    endpointUrl: string;
    lastSync?: string;
}
interface SyncOnceMessage {
    type: 'once';
    endpointUrl: string;
    lastSync?: string;
}
interface SyncPauseMessage {
    type: 'pause';
}
export type SyncMessage = SyncStartMessage | SyncOnceMessage | SyncPauseMessage;

const isSyncMessage = (item: unknown): item is SyncMessage => {
    if (item && typeof item === 'object') {
        const values = item as Record<string, unknown>;
        if (isSyncMessageType(values.type)) {
            if (values.type === 'start' || values.type === 'once') {
                return typeof values.endpointUrl === 'string';
            } else {
                return true;
            }
        }
    }
    return false;
};

/**
 * 最終同期日時の通知メッセージ
 */
export interface LastSyncMessage {
    lastSync: string;
}
/**
 * 最終同期日時
 */
let lastSync: string | undefined;

// 同期間隔
const SyncInterval = 30 * 1000;
let syncTimer: NodeJS.Timer | undefined;

/**
 * API URL
 */
let endpointUrl = 'http://localhost:8080';

/**
 * 同期処理: Remote -> Local
 */
async function syncRemote() {
    console.log('-- start syncRemote');
    let updateCount = 0;
    let insertCount = 0;

    try {
        let url = `${endpointUrl}/thing`;

        if (lastSync) {
            // 前回同期時刻 - 1h を QueryString で渡す
            // (-1h は他端末との同期タイミングのズレなどを考慮したバッファ)
            const date = new Date(lastSync);
            date.setHours(date.getHours() - 1);
            const params = { lastSync: date.toISOString() };
            const query = new URLSearchParams(params);
            url = `${url}?${query}`;
        }

        const now = new Date().toISOString();
        const res = await fetch(url, { mode: 'cors', cache: 'no-cache' });
        const { ok } = res;

        if (ok) {
            const data = await res.json();

            if (Array.isArray(data) && data.every(isThingResponse)) {
                await db.transaction('rw', db.things, async () => {
                    const upsertPromises = data.map(async (resThing) => {
                        const { id } = resThing;

                        const thing = await db.things.where({ id }).first();
                        if (thing) {
                            // IndexedDB の内容が更新されており
                            // API から取得したデータより新しければ何もしない
                            if (thing.isModified === 1 && thing.updatedAt > resThing.updatedAt) {
                                return;
                            }

                            // update
                            await db.things.update(thing, {
                                ...resThing,
                                isFromServer: 1,
                                isModified: 0,
                                isActive: 1,
                            });
                            updateCount++;
                        } else {
                            // insert
                            await db.things.add({
                                ...resThing,
                                isFromServer: 1,
                                isModified: 0,
                                isActive: 1,
                            });
                            insertCount++;
                        }
                    });

                    await Promise.all(upsertPromises);
                });

                // 同期時刻の更新
                lastSync = now;
                self.postMessage({ lastSync });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        console.log(`-- end syncRemote (insert: ${insertCount}, update: ${updateCount})`);
    }
}

/**
 * サーバー側に存在しない項目を IndexedDB から削除する
 */
async function syncDelete() {
    console.log('-- start syncDelete');
    let deleteCount = 0;

    try {
        // サーバー側の ID のリストを取得
        const res = await fetch(`${endpointUrl}/thing/ids`, { mode: 'cors', cache: 'no-cache' });
        const { ok } = res;
        if (ok) {
            const data = await res.json();

            if (Array.isArray(data) && data.every((item) => typeof item === 'string')) {
                const ids = data as string[];
                await db.transaction('rw', db.things, async () => {
                    // IndexedDB に保持している項目を取得
                    const things = await db.things.where({ isFromServer: 1 }).toArray();
                    const promises = things.map(async (thing) => {
                        // サーバー側のリストになければ削除
                        if (thing.id && !ids.includes(thing.id)) {
                            await db.things.where({ id: thing.id }).delete();
                            deleteCount++;
                        }
                    });

                    await Promise.all(promises);
                });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        console.log(`-- end syncDelete (delete: ${deleteCount})`);
    }
}

async function fetchPost(thing: Thing): Promise<ThingResponse | undefined> {
    const options: RequestInit = {
        mode: 'cors',
        cache: 'no-cache',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(thing),
    };

    const res = await fetch(`${endpointUrl}/thing`, options);
    const { ok, status } = res;
    if (ok) {
        const data = await res.json();
        if (isThingResponse(data)) {
            return data;
        }
        console.warn(data);
    }

    if (status === 400 || status === 409) {
        // Bad Request | Conflict 時は後続処理を継続する
        console.warn(status);
        return;
    }

    // 想定外のレスポンス
    throw new Error('invalid response');
}

async function fetchPut(thing: Thing): Promise<ThingResponse | undefined> {
    const options: RequestInit = {
        mode: 'cors',
        cache: 'no-cache',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(thing),
    };

    const res = await fetch(`${endpointUrl}/thing/${thing.id ?? ''}`, options);
    const { ok, status } = res;
    if (ok) {
        const data = await res.json();
        if (isThingResponse(data)) {
            return data;
        }
        console.warn(data);
    }

    if (status === 400 || status === 404 || status === 409) {
        // Bad Request | Not Found | Conflict 時は後続処理を継続する
        console.warn(status);
        return;
    }

    // 想定外のレスポンス
    throw new Error('invalid response');
}

async function fetchDelete(thing: Thing): Promise<boolean> {
    const options: RequestInit = {
        mode: 'cors',
        cache: 'no-cache',
        method: 'DELETE',
    };

    const res = await fetch(`${endpointUrl}/thing/${thing.id ?? ''}`, options);
    return res.ok;
}

/**
 * 同期処理: Local -> Remote
 */
async function syncLocal() {
    console.log('-- start syncLocal');
    let postCount = 0;
    let putCount = 0;
    let deleteCount = 0;

    try {
        // ローカルで変更されたデータ
        const things = await db.things.where({ isModified: 1 }).toArray();
        for (let i = 0; i < things.length; i++) {
            const thing = things[i];

            if (thing.isFromServer === 0 && thing.isActive === 1) {
                // POST
                const res = await fetchPost(thing);
                if (res) {
                    // 登録成功
                    await db.things.update(thing, {
                        isFromServer: 1,
                        isModified: 0,
                        isActive: 1,
                    });
                    postCount++;
                }
            } else if (thing.isFromServer === 1 && thing.isActive === 1) {
                // PUT
                const res = await fetchPut(thing);
                if (res) {
                    // 更新成功
                    await db.things.update(thing, {
                        isFromServer: 1,
                        isModified: 0,
                        isActive: 1,
                    });
                    putCount++;
                }
            } else if (thing.isFromServer === 1 && thing.isActive === 0) {
                // DELETE
                const res = await fetchDelete(thing);
                if (res) {
                    // 削除成功
                    await db.things.where({ id: thing.id }).delete();
                    deleteCount++;
                }
            } else if (thing.isFromServer === 0 && thing.isActive === 0) {
                // 同期前にローカルから削除された
                // -> IndexedDB から削除
                await db.things.where({ id: thing.id }).delete();
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        console.log(
            `-- end syncLocal (POST: ${postCount}, PUT: ${putCount}, DELETE: ${deleteCount})`
        );
    }
}

async function syncMain(url?: string, isOnce = false) {
    console.time('syncMain');
    if (url) {
        endpointUrl = url;
    }

    if (self.navigator.onLine) {
        // Local -> Remote
        await syncLocal();
        // Remote -> Local
        await syncRemote();
        // Local の不要データ削除
        await syncDelete();
    }

    if (!isOnce) {
        syncTimer = setTimeout(() => syncMain(), SyncInterval);
    }
    console.timeEnd('syncMain');
}

self.onmessage = (event: MessageEvent<SyncMessage>) => {
    console.log('receive message:', event.data);
    const message = event.data;
    if (isSyncMessage(message)) {
        switch (message.type) {
            case 'once':
                if (message.lastSync) {
                    lastSync = message.lastSync;
                }
                syncMain(message.endpointUrl, true);
                break;
            case 'start':
                if (message.lastSync) {
                    lastSync = message.lastSync;
                }
                syncMain(message.endpointUrl);
                break;
            case 'pause':
                if (syncTimer) {
                    clearTimeout(syncTimer);
                    syncTimer = undefined;
                }
                break;
        }
    }
};

self.onerror = (event) => {
    console.error(event);
};
