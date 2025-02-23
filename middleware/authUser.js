import jwt from 'jsonwebtoken';
const SECRET  = process.env.AUTH_SECRET;

const authenticateJwt = (req, res, next) => {
    const token = req.header('authToken');
    if (!token) {
        return res.status(401).json({ error: "Access Denied" });
    }
    try {
        const data = jwt.verify(token, SECRET)
        req.user = data.user;
        next()
    }
    catch (error) {
        res.status(401).send({ error: "Please authenticate with right token!!" })
    }
}

export default authenticateJwt;