const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5001;

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
// Serve the uploads folder so files can be opened in the browser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories and database file exist
const uploadDir = path.join(__dirname, 'uploads');
const usersFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

// --- 2. STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage: storage });

// --- 3. DATABASE HELPERS ---
const getUsers = () => JSON.parse(fs.readFileSync(usersFile, 'utf8'));
const saveUsers = (users) => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

// --- 4. AUTH ROUTES (Login & Signup) ---
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: "Username already taken" });
    }

    users.push({ username, password });
    saveUsers(users);
    
    console.log(`[SIGNUP] New user registered: ${username}`);
    res.json({ success: true, message: "Account created successfully!" });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        console.log(`[LOGIN] User verified: ${username}`);
        res.json({ 
            success: true, 
            token: "session-token-" + Date.now(), 
            user: username 
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid username or password" });
    }
});

// --- 5. DASHBOARD ROUTES (Files) ---
app.get('/api/dashboard', (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir).filter(file => file !== '.DS_Store');
        res.json({ success: true, pdfs: files });
    } catch (err) {
        res.status(500).json({ success: false, error: "Unable to read directory" });
    }
});

// matches: formData.append('pdfs', file)
app.post('/api/upload', upload.array('pdfs'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    console.log(`[UPLOAD] Received ${req.files.length} file(s)`);
    res.json({ success: true, count: req.files.length });
});

app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

app.delete('/api/delete', (req, res) => {
    const { filenames } = req.body;
    if (!filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ success: false });
    }

    try {
        filenames.forEach(file => {
            const filePath = path.join(uploadDir, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[DELETE] Removed: ${file}`);
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- 6. START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.clear();
    console.log(`✅ SERVER RUNNING: http://localhost:${PORT}`);
    console.log(`📁 UPLOADS DIR: ${uploadDir}`);
    console.log(`👤 USERS FILE: ${usersFile}`);
});
