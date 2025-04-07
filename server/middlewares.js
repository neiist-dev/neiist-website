const { authService } = require('./services');

const authMiddleware = (req, res, next) => {
    if (!req.session.user)
        return res.status(401).json({ error: 'Unauthorized' });

    next();
}

const collaboratorMiddleware = (req, res, next) => {
    if (!req.session.user)
        return res.status(401).json({ error: 'Unauthorized' });

    if (!req.session.user.isCollab)
        return res.status(403).json({ error: 'Forbidden' });

    next();
}

const coordinatorMiddleware = (req, res, next) => {
    if (!req.session.user)
        return res.status(401).json({ error: 'Unauthorized' });

    if (!req.session.user.isCoordenator)
        return res.status(403).json({ error: 'Forbidden' });

    next();
}

const gacMiddleware = (req, res, next) => {
    console.log(req.session)
    if (!req.session.user)
        return res.status(401).json({ error: 'Unauthorized' });

    if (!req.session.user.isGacMember)
        return res.status(403).json({ error: 'Forbidden' });

    next();
}

const adminMiddleware = (req, res, next) => {
    if (!req.session.user)
        return res.status(401).json({ error: 'Unauthorized' });

    if (!req.session.user.isAdmin)
        return res.status(403).json({ error: 'Forbidden' });

    next();
}

module.exports = {
    authMiddleware,
    collaboratorMiddleware,
    coordinatorMiddleware,
    gacMiddleware,
    adminMiddleware,
}