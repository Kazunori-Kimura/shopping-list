import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const prisma = new PrismaClient();
const router = Router();

// GET: /thing
router.get('/', async (req, res) => {
    const things = await prisma.thing.findMany({
        orderBy: {
            id: 'desc',
        },
    });

    res.status(200).json(things);
});

// GET: /thing/:id
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({ message: 'Bad Request' });
        return;
    }

    const thing = await prisma.thing.findUnique({ where: { id } });
    if (thing) {
        res.status(200).json(thing);
    } else {
        res.status(404).json({ message: 'Not Found' });
    }
});

// POST: /thing
router.post('', async (req, res) => {
    const { name, boughtAt, createdAt } = req.body;

    let valid = true;
    // name は必須
    if (typeof name !== 'string' || name.length === 0) {
        valid = false;
    }
    // boughtAt が string
    if (boughtAt) {
        if (typeof boughtAt !== 'string') {
            valid = false;
        }
    }
    // createdAt は必須
    if (typeof createdAt !== 'string' || createdAt.length === 0) {
        valid = false;
    }

    if (!valid) {
        res.status(400).json({ message: 'Bad Request' });
        return;
    }

    const data = await prisma.thing.create({
        data: {
            name,
            boughtAt,
            createdAt,
            updatedAt: createdAt,
        },
    });

    res.status(201).json(data);
});

// PUT: /thing/:id
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({ message: 'Bad Request' });
        return;
    }

    const thing = await prisma.thing.findUnique({
        where: { id },
    });
    if (thing === null) {
        res.status(404).json({ message: 'Not Found' });
        return;
    }

    const { name, boughtAt, updatedAt } = req.body;
    let valid = true;
    // name は必須
    if (typeof name !== 'string' || name.length === 0) {
        valid = false;
    }
    // boughtAt が string
    if (boughtAt) {
        if (typeof boughtAt !== 'string') {
            valid = false;
        }
    }
    // updatedAt は必須
    if (typeof updatedAt !== 'string' || updatedAt.length === 0) {
        valid = false;
    }

    if (!valid) {
        res.status(400).json({ message: 'Bad Request' });
        return;
    }

    // DB側の updatedAt のほうが新しければ 409 conflict
    if (updatedAt < thing.updatedAt) {
        res.status(409).json({ message: 'Conflict' });
        return;
    }

    // 更新処理
    const data = await prisma.thing.update({
        where: { id },
        data: {
            name,
            boughtAt,
            updatedAt,
        },
    });

    res.status(200).json(data);
});

// DELETE: /thing/:id
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({ message: 'Bad Request' });
        return;
    }

    const thing = await prisma.thing.findUnique({
        where: { id },
    });
    if (thing === null) {
        res.status(404).json({ message: 'Not Found' });
        return;
    }

    await prisma.thing.delete({
        where: { id },
    });

    res.status(204).send();
});

export default router;
