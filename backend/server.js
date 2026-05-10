const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serving the uploads folder as static
const uploadDir = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.pdf') {
            return cb(new Error('Only PDFs are allowed!'), false);
        }
        cb(null, true);
    }
});

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB!'))
    .catch(err => console.error('❌ Connection error:', err));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    pdfFiles: [String] 
}));

const SECRET_KEY = process.env.SECRET_KEY || "my_super_secret_key";

// --- ROUTES ---

// SIGNUP & LOGIN
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ success: true, message: "User registered!" });
    } catch (error) {
        res.status(400).json({ success: false, message: "User exists" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ success: true, token });
    } catch (error) { res.status(500).json({ success: false }); }
});

// MULTI-UPLOAD
app.post('/api/upload', upload.array('pdf', 10), async (req, res) => {
    const token = req.headers['authorization'];
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        const filenames = req.files.map(file => file.filename);
        await User.findOneAndUpdate(
            { username: verified.username },
            { $push: { pdfFiles: { $each: filenames } } }
        );
        res.json({ success: true, count: filenames.length });
    } catch (err) { res.status(401).json({ success: false }); }
});

// BULK DELETE
app.delete('/api/delete', async (req, res) => {
    const token = req.headers['authorization'];
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        const { filenames } = req.body;
        
        await User.findOneAndUpdate(
            { username: verified.username },
            { $pull: { pdfFiles: { $in: filenames } } }
        );

        filenames.forEach(file => {
            const filePath = path.join(uploadDir, decodeURIComponent(file));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/dashboard', async (req, res) => {
    const token = req.headers['authorization']; 
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        const user = await User.findOne({ username: verified.username });
        res.json({ user: verified.username, pdfs: user.pdfFiles || [] });
    } catch (err) { res.status(401).send("Denied"); }
});

app.listen(5000, () => console.log(`🚀 Server: http://localhost:5000`));
