import { Container, createTheme, CssBaseline, Stack, ThemeProvider } from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import db from '../database/db';
import { Thing } from '../models/thing';
import ShoppingList from './ShoppingList';
import ThingForm from './ThingForm';

const theme = createTheme();

const App: React.FC = () => {
    const things = useLiveQuery(() => db.things.where({ isActive: 1 }).toArray(), []);

    /**
     * アイテムの追加
     */
    const createThing = useCallback(async (name: string) => {
        try {
            if (name) {
                const now = new Date().toISOString();
                await db.things.add({
                    name,
                    isFromServer: 0,
                    isModified: 1,
                    isActive: 1,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    /**
     * 購入
     */
    const buyThing = useCallback(async (thing: Thing) => {
        try {
            const now = new Date().toISOString();
            await db.things.update(thing, {
                boughtAt: now,
                isModified: 1,
                updatedAt: now,
            });
        } catch (err) {
            console.error(err);
        }
    }, []);

    /**
     * 購入のキャンセル
     */
    const cancelBought = useCallback(async (thing: Thing) => {
        try {
            const now = new Date().toISOString();
            await db.things.update(thing, {
                boughtAt: undefined,
                isModified: 1,
                updatedAt: now,
            });
        } catch (err) {
            console.error(err);
        }
    }, []);

    /**
     * アイテムの削除
     */
    const deleteThing = useCallback(async (thing: Thing) => {
        try {
            const now = new Date().toISOString();
            await db.things.update(thing, {
                isModified: 1,
                isActive: 0,
                updatedAt: now,
            });
        } catch (err) {
            console.error(err);
        }
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="sm" sx={{ pt: 2 }}>
                <Stack direction="column" spacing={2}>
                    <ThingForm onCreate={createThing} />
                    <ShoppingList
                        items={things ?? []}
                        onBought={buyThing}
                        onCancel={cancelBought}
                        onDelete={deleteThing}
                    />
                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default App;
