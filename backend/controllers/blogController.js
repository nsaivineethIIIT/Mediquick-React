const Blog = require('../models/Blog.js');
const Patient = require('../models/Patient.js');
const Doctor = require('../models/Doctor.js');
const Employee = require('../models/Employee.js');

exports.getBlogs = async (req, res) => {
    try {
        const filter = req.query.filter || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = 6; 

        let query = {};
        if (filter !== 'all') {
            query.theme = filter;
        }

        const totalBlogs = await Blog.countDocuments(query);
        const totalPages = Math.ceil(totalBlogs / limit);
        const blogs = await Blog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            blogs,
            currentFilter: filter,
            currentPage: page,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getPostForm = (req, res) => {
    res.render('post');
};

exports.postSubmit = async (req, res) => {
    try {

    let { title, theme, content, imageUrls } = req.body;
    // If theme is empty, set to 'Default'
    if (!theme) theme = 'Default';

        // Initialize images array
        let images = [];

        // Process uploaded files
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Process image URLs if provided
        if (imageUrls) {
            const urlArray = imageUrls.split('\n')
                .map(url => url.trim())
                .filter(url => url);
            images.push(...urlArray);
        }

        // Determine author information based on session
        let authorName = 'Anonymous';
        let authorEmail = 'anonymous@example.com';
        let authorType = 'user';

        if (req.session.patientId) {
            const patient = await Patient.findById(req.session.patientId).select('name email').lean();
            if (patient) {
                authorName = patient.name;
                authorEmail = patient.email;
                authorType = 'user';
            }
        } else if (req.session.doctorId) {
            const doctor = await Doctor.findById(req.session.doctorId).select('name email').lean();
            if (doctor) {
                authorName = doctor.name;
                authorEmail = doctor.email;
                authorType = 'doctor';
            }
        } else if (req.session.employeeId) {
            const employee = await Employee.findById(req.session.employeeId).select('name email').lean();
            if (employee) {
                authorName = employee.name;
                authorEmail = employee.email;
                authorType = 'employee';
            }
        }

        // Validate required fields
        if (!title || !theme || !content) {
            return res.status(400).render('error', {
                message: 'Title, theme, and content are required',
                redirect: '/post'
            });
        }

        // Create and save the blog post
        const blog = new Blog({
            title,
            theme,
            content,
            authorName,
            authorEmail,
            authorType,
            images
        });

        await blog.save();
        res.redirect('/blog');
    } catch (err) {
        console.error("Error posting blog:", err.message);
        res.status(500).render('error', {
            message: 'Error posting blog',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/post'
        });
    }
};

exports.getSingle = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        res.status(200).json(blog);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};