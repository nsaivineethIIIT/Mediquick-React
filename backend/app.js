//latest file as of 12 september
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const app = express();
const port = 3002;
const cors = require('cors');

// Add this before your routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/mediquick', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

connectDB();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.set('views', path.join(__dirname, 'views'));

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const multer = require('multer');
const fs = require('fs');

// Multer configuration for general uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './Uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Multer configuration for blog uploads
const storageBlog = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadBlog = multer({
    storage: storageBlog,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
    }
});

// Session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret key in production
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Route imports
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const homeRoutes = require('./routes/homeRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const blogRoutes = require('./routes/blogRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Mount routes
app.use('/appointment', appointmentRoutes);
app.use('/admin', adminRoutes);
app.use('/supplier', supplierRoutes);
app.use('/patient', patientRoutes);
app.use('/doctor', doctorRoutes);
app.use('/', homeRoutes);
app.use('/employee', employeeRoutes);
app.use('/chat', chatRoutes);
app.use('/medicine', medicineRoutes);
app.use('/blog', blogRoutes);
app.use('/order', orderRoutes);

// Fallback routes (remove or adjust as needed since they are now in homeRoutes)
app.get('/about', (req, res) => res.redirect('/about'));
app.get('/faqs', (req, res) => res.redirect('/faqs'));
app.get('/terms', (req, res) => res.redirect('/terms'));
app.get('/privacy', (req, res) => res.redirect('/privacy'));
app.get('/doctor_form', (req, res) => res.redirect('/doctor_form'));
app.get('/patient_form', (req, res) => res.redirect('/patient_form'));
app.get('/admin_form', (req, res) => res.redirect('/admin_form'));
app.get('/supplier_form', (req, res) => res.redirect('/supplier_form'));
app.get('/employee_form', (req, res) => res.redirect('/employee_form'));
app.get('/', (req, res) => res.redirect('/'));
app.get('/logout', (req, res) => res.redirect('/logout'));
app.get('/test-error', (req, res) => res.redirect('/test-error'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).render('error', {
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        redirect: '/'
    });
});

// Start server after MongoDB connection
mongoose.connection.once('open', () => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log('Current date and time:', new Date('2025-09-12T03:47:00Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    });
});

module.exports = app; // Export app for testing if needed