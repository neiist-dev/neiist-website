import { NextFunction, Request, Response } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    next();
}

export const collaboratorMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (!req.session.user.isCollab) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    next();
}

export const coordinatorMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (!req.session.user.isCoordinator) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    next();
}

export const gacMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (!req.session.user.isGacMember) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    next();
}

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (!req.session.user.isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return
    }

    next();
}
