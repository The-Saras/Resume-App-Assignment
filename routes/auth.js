import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';  

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            password: secPass
        });

        const data = {
            user: {
                id: user.id
            }
        };
        const authToken = jsonwebtoken.sign(data, process.env.AUTH_SECRET);
        res.status(200).json({ authToken });


    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: "Invalid Credentials" });
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
           
            return res.status(400).json({success, error: "Enter valid details" });
        }
        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jsonwebtoken.sign(data, process.env.AUTH_SECRET);
        res.status(200).json({ authToken });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
