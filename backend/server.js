const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.text({ limit: '50mb' })); 

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    const defaultData = {
        users: [],
        attendance: {},
        holidays: [],
        pdfConfig: {},
        appSettings: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
}

const deepMerge = (target, source) => {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
            result[key] = deepMerge(target[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
};

app.get('/api/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.type('json').send(data);
    });
});

app.post('/api/data', (req, res) => {
    let payload = req.body;
    if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) {}
    }

    fs.readFile(DATA_FILE, 'utf8', (err, currentDataRaw) => {
        let currentData = {};
        if (!err && currentDataRaw) {
            try { currentData = JSON.parse(currentDataRaw); } catch(e) {}
        }
        
        const mergedData = deepMerge(currentData, payload);
        
        fs.writeFile(DATA_FILE, JSON.stringify(mergedData, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save data' });
            res.json({ success: true, message: "Data tersimpan" });
        });
    });
});

const FRONTEND_DIST = fs.existsSync(path.join(__dirname, 'frontend/dist')) 
    ? path.join(__dirname, 'frontend/dist') 
    : path.join(__dirname, '../frontend/dist');
app.use(express.static(FRONTEND_DIST));

app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend Server berjalan di port ${PORT}`);
});