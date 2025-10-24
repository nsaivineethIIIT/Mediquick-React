const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const Chat = require('../models/Chat');
const Prescription = require('../models/Prescription');
// const Message = require('../models/Message');
// const Review = require('../models/Review');
// const Slot = require('../models/Slot');
const Order = require('../models/Order');
const {checkEmailExists, checkMobileExists} = require('../utils/utils');
const fs = require('fs');
const path = require('path');

exports.signup = async (req, res) => {
    const { name, email, mobile, address, password } = req.body;

    console.log('Received patient signup request:', { name, email, mobile, address, password: '[REDACTED]' });

    try {
        // Validate input fields
        if (!name || !email || !mobile || !address || !password) {
            console.log('Validation failed: Missing required fields', { name, email, mobile, address, password: !!password });
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Please provide name, email, mobile, address, and password'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Validation failed: Invalid email format', { email });
            return res.status(400).json({
                error: 'Invalid email format',
                details: 'Please provide a valid email address'
            });
        }

        // Validate mobile number (10 digits)
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            console.log('Validation failed: Invalid mobile number', { mobile });
            return res.status(400).json({
                error: 'Invalid mobile number',
                details: 'Mobile number must be 10 digits'
            });
        }
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            return res.status(400).json({
                error: 'Email already in use',
                details: 'This email is already registered with another account'
            });
        }

        // Check for existing mobile across all collections
        const mobileExists = await checkMobileExists(mobile);
        if (mobileExists) {
            return res.status(400).json({
                error: 'Mobile number already in use',
                details: 'This mobile number is already registered with another account'
            });
        }
        // Validate password length
        if (password.length < 6) {
            console.log('Validation failed: Password too short', { passwordLength: password.length });
            return res.status(400).json({
                error: 'Invalid password',
                details: 'Password must be at least 6 characters long'
            });
        }

        // Check for existing patient
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            console.log('Validation failed: Email already exists', { email });
            return res.status(400).json({
                error: 'Email already in use',
                details: 'A patient with this email already exists'
            });
        }

        // Create new patient
        const newPatient = new Patient({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            address: address.trim(),
            password: password
        });

        await newPatient.save();
        console.log('Patient signup successful', { email });

        res.status(201).json({
            message: 'Signup successful',
            redirect: '/patient/form'
        });
    } catch (err) {
        console.error('Error during patient signup:', {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });

        if (err.code === 11000) {
            console.log('MongoDB duplicate key error', { key: err.keyValue });
            return res.status(400).json({
                error: 'Duplicate email',
                details: 'A patient with this email already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred during signup'
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Missing email or password'
            });
        }

        const patient = await Patient.findOne({ email, password });

        if (!patient) {
            return res.status(401).json({
                error: 'Invalid credentials',
                details: 'Incorrect email or password'
            });
        }

        req.session.patientId = patient._id.toString();
        return res.status(200).json({
            message: 'Login successful',
            redirect: '/patient/dashboard'
        });
    } catch (err) {
        console.error("Error during patient login:", err.message);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// exports.getProfile = async (req, res) => {
//     try {
//         if (!req.session.patientId) {
//             return res.redirect('/patient/form?error=login_required');
//         }

//         if (!mongoose.Types.ObjectId.isValid(req.session.patientId)) {
//             return res.status(400).render('error', {
//                 message: 'Invalid session data',
//                 redirect: '/patient/form'
//             });
//         }

//         const patient = await Patient.findById(req.session.patientId).lean();

//         if (!patient) {
//             return res.status(404).render('error', {
//                 message: 'Patient not found',
//                 redirect: '/patient/form'
//             });
//         }

//         res.render('patient_profile', {
//             patient,
//             title: 'Patient Profile'
//         });
//     } catch (err) {
//         console.error("Error fetching patient profile:", err.message);
//         res.status(500).render('error', {
//             message: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined,
//             redirect: '/patient/form'
//         });
//     }
// };
exports.getProfile = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient/form?error=login_required');
        }

        // Just render the template without data - data will be fetched via API
        res.render('patient_profile', {
            title: 'Patient Profile'
        });
    } catch (err) {
        console.error("Error rendering patient profile:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient/form'
        });
    }
};

// New API endpoint to fetch patient profile data
exports.getProfileData = async (req, res) => {
    try {
        console.log('Session ID:', req.session.patientId); // Debug log
        
        if (!req.session.patientId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.patientId)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid session data' 
            });
        }

        const patient = await Patient.findById(req.session.patientId).lean();
        console.log('Patient found:', patient);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Patient not found'
            });
        }

        const profileData = {
            success: true,
            patient: {
                name: patient.name,
                email: patient.email,
                mobile: patient.mobile,
                address: patient.address,
                profilePhoto: patient.profilePhoto
            }
        };
        
        console.log('Profile data being sent:', profileData);

        res.status(200).json(profileData);
    } catch (err) {
        console.error("Error fetching patient profile data:", err.message);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getPreviousAppointments = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get current date and time for filtering appointments
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentTime = now.getHours() * 100 + now.getMinutes();

        // Fetch previous appointments
        const previousAppointments = await Appointment.find({
            patientId: req.session.patientId,
            $or: [
                { date: { $lt: currentDate } },
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
                    },
                    $expr: {
                        $lte: [
                            {
                                $add: [
                                    { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$time", ":"] }, 0] } }, 100] },
                                    { $toInt: { $arrayElemAt: [{ $split: [{ $substrBytes: ["$time", 3, 2] }, " "] }, 0] } }
                                ]
                            },
                            currentTime
                        ]
                    },
                    status: { $nin: ['completed', 'cancelled'] }
                },
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
                    },
                    status: { $in: ['completed', 'cancelled'] }
                },
                {
                    date: { $lt: currentDate },
                    status: { $in: ['completed', 'cancelled'] }
                }
            ]
        })
        .populate('doctorId', 'name specialization')
        .sort({ date: -1, time: -1 })
        .lean();

        // Format appointments
        const formattedAppointments = previousAppointments.map(appt => {
            const date = new Date(appt.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return {
                id: appt._id,
                doctorName: appt.doctorId?.name || 'Unknown Doctor',
                specialization: appt.doctorId?.specialization || 'General Physician',
                date: formattedDate,
                time: appt.time,
                type: appt.type,
                status: appt.status,
                notes: appt.notes
            };
        });

        res.json(formattedAppointments);
    } catch (err) {
        console.error("Error fetching previous appointments:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getUpcomingAppointments = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get current date and time for filtering appointments
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentTime = now.getHours() * 100 + now.getMinutes();

        // Fetch upcoming appointments
        const upcomingAppointments = await Appointment.find({
            patientId: req.session.patientId,
            $or: [
                { date: { $gt: currentDate } },
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
                    },
                    $expr: {
                        $gt: [
                            {
                                $add: [
                                    { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$time", ":"] }, 0] } }, 100] },
                                    { $toInt: { $arrayElemAt: [{ $split: [{ $substrBytes: ["$time", 3, 2] }, " "] }, 0] } }
                                ]
                            },
                            currentTime
                        ]
                    }
                }
            ],
            status: { $nin: ['completed', 'cancelled'] }
        })
        .populate('doctorId', 'name specialization')
        .sort({ date: 1, time: 1 })
        .lean();

        // Format appointments
        const formattedAppointments = upcomingAppointments.map(appt => {
            const date = new Date(appt.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return {
                id: appt._id,
                doctorName: appt.doctorId?.name || 'Unknown Doctor',
                specialization: appt.doctorId?.specialization || 'General Physician',
                date: formattedDate,
                time: appt.time,
                type: appt.type,
                status: appt.status,
                notes: appt.notes
            };
        });

        res.json(formattedAppointments);
    } catch (err) {
        console.error("Error fetching upcoming appointments:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getEditProfile = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.patientId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/patient/form'
            });
        }

        const patient = await Patient.findById(req.session.patientId)
            .select('name email mobile address profilePhoto')
            .lean();

        if (!patient) {
            return res.status(404).render('error', {
                message: 'Patient not found',
                redirect: '/patient_form'
            });
        }

        res.render('patient_edit_profile', {
            patient,
            title: 'Edit Patient Profile'
        });
    } catch (err) {
        console.error("Error fetching patient data:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient_form'
        });
    }
};

// Quick profile photo upload endpoint
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
                message: 'Please select a photo to upload'
            });
        }

        const patientBefore = await Patient.findById(req.session.patientId).lean();
        const updateData = {
            profilePhoto: '/uploads/profiles/' + req.file.filename
        };

        const updatedPatient = await Patient.findByIdAndUpdate(
            req.session.patientId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Patient not found'
            });
        }

        // Cleanup old profile photo file if it was a local upload
        try {
            const oldProfilePhoto = patientBefore && patientBefore.profilePhoto;
            if (oldProfilePhoto && oldProfilePhoto.startsWith('/uploads/profiles/')) {
                const filePath = path.join(process.cwd(), 'public', oldProfilePhoto.replace(/^\//, ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error('Failed to cleanup old patient profile photo file:', err.message);
        }

        res.status(200).json({
            success: true,
            message: 'Profile photo updated successfully',
            profilePhoto: updatedPatient.profilePhoto
        });
    } catch (err) {
        console.error("Error uploading patient profile photo:", err.message);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Remove profile photo endpoint
exports.removeProfilePhoto = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        const patientBefore = await Patient.findById(req.session.patientId).lean();
        const updateData = {
            profilePhoto: '/images/default-patient.svg'
        };

        const updatedPatient = await Patient.findByIdAndUpdate(
            req.session.patientId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Patient not found'
            });
        }

        // Cleanup old profile photo file if it was a local upload
        try {
            const oldProfilePhoto = patientBefore && patientBefore.profilePhoto;
            if (oldProfilePhoto && oldProfilePhoto.startsWith('/uploads/profiles/')) {
                const filePath = path.join(process.cwd(), 'public', oldProfilePhoto.replace(/^\//, ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error('Failed to cleanup old patient profile photo file:', err.message);
        }

        res.status(200).json({
            success: true,
            message: 'Profile photo removed successfully',
            profilePhoto: updatedPatient.profilePhoto
        });
    } catch (err) {
        console.error("Error removing patient profile photo:", err.message);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.patientId)) {
            return res.status(400).json({ error: 'Invalid session data' });
        }

    const { name, email, mobile, address, removeProfilePhoto } = req.body;

        if (!name || !email || !mobile || !address) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'All fields are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid email format'
            });
        }

        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Mobile number must be 10 digits'
            });
        }

        const emailExists = await Patient.findOne({
            email,
            _id: { $ne: req.session.patientId }
        });
        if (emailExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Email already in use by another patient'
            });
        }

        const mobileExists = await Patient.findOne({
            mobile,
            _id: { $ne: req.session.patientId }
        });
        if (mobileExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Mobile number already in use by another patient'
            });
        }

        const patientBefore = await Patient.findById(req.session.patientId).lean();
        const updateData = { name, email, mobile, address };

        // Handle profile photo upload (file saved by uploadProfile middleware into public/uploads/profiles)
        if (req.file && req.file.filename) {
            updateData.profilePhoto = '/uploads/profiles/' + req.file.filename;
        }

        // If user requested to remove profile photo, set to default
        if (removeProfilePhoto === 'on' || removeProfilePhoto === 'true') {
            updateData.profilePhoto = '/images/default-patient.svg';
        }

        const updatedPatient = await Patient.findByIdAndUpdate(
            req.session.patientId,
            updateData,
            { new: true, runValidators: true }
        );

        // Cleanup old profile photo file if it was a local upload and we've replaced/removed it
        try {
            const oldProfilePhoto = patientBefore && patientBefore.profilePhoto;
            const newProfilePhoto = updateData.profilePhoto;
            if (oldProfilePhoto && oldProfilePhoto.startsWith('/uploads/profiles/') && oldProfilePhoto !== newProfilePhoto) {
                const filePath = path.join(process.cwd(), 'public', oldProfilePhoto.replace(/^\//, ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error('Failed to cleanup old patient profile photo file:', err.message);
        }

        if (!updatedPatient) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Patient not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            redirect: '/patient/profile',
            profilePhoto: updatedPatient.profilePhoto,
            name: updatedPatient.name
        });
    } catch (err) {
        console.error("Error updating patient profile:", err.message);
        res.status(500).json({
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Avatar-only upload for quick changes from dashboard
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.session.patientId) return res.status(401).json({ error: 'Unauthorized' });
        const patientBefore = await Patient.findById(req.session.patientId).lean();
        const updateData = {};
        if (req.file && req.file.filename) {
            updateData.avatar = '/uploads/' + req.file.filename;
        }
        const updatedPatient = await Patient.findByIdAndUpdate(req.session.patientId, updateData, { new: true });
        // cleanup old file
        try {
            const oldAvatar = patientBefore && patientBefore.avatar;
            const newAvatar = updateData.avatar;
            if (oldAvatar && oldAvatar.startsWith('/uploads/') && oldAvatar !== newAvatar) {
                const filePath = path.join(process.cwd(), 'public', oldAvatar.replace(/^\//, ''));
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Failed to cleanup old avatar during quick upload:', err.message);
        }
        res.json({ success: true, message: 'Avatar updated', avatar: updatedPatient.avatar, name: updatedPatient.name });
    } catch (err) {
        console.error('uploadAvatar error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Remove avatar (reset to dummy) - affects only patient's avatar
exports.removeAvatar = async (req, res) => {
    try {
        if (!req.session.patientId) return res.status(401).json({ error: 'Unauthorized' });
        const patientBefore = await Patient.findById(req.session.patientId).lean();
        const dummy = 'https://static.thenounproject.com/png/638636-200.png';
        const updatedPatient = await Patient.findByIdAndUpdate(req.session.patientId, { avatar: dummy }, { new: true });
        // delete old local file if any
        try {
            const oldAvatar = patientBefore && patientBefore.avatar;
            if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
                const filePath = path.join(process.cwd(), 'public', oldAvatar.replace(/^\//, ''));
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Failed to cleanup old avatar during remove:', err.message);
        }
        res.json({ success: true, message: 'Avatar removed', avatar: updatedPatient.avatar, name: updatedPatient.name });
    } catch (err) {
        console.error('removeAvatar error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient_form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.patientId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/patient_form'
            });
        }

    const patient = await Patient.findById(req.session.patientId).select('email password avatar name').lean();

        if (!patient) {
            return res.status(404).render('error', {
                message: 'Patient not found',
                redirect: '/patient_form'
            });
        }

        console.log(`Login Details for Patient - Email: ${patient.email}, Password: ${patient.password}`);

    res.render('patient_dashboard', { patient });
    } catch (err) {
        console.error("Error accessing patient dashboard:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient_form'
        });
    }
};

exports.getForm = (req, res) => {
    res.render('patient_form');
}

exports.getBookAppointment = async (req, res) => {
    // Check if patient is logged in
    if (!req.session.patientId) {
        return res.redirect('/patient_form?error=login_required');
    }

    try {
        // Fetch offline doctors (using consistent field name and values)
        const doctors = await Doctor.find({ onlineStatus: 'offline' });

        // Transform the data for the template
        const doctorsData = doctors.map(doc => ({
            id: doc._id.toString(),
            name: doc.name,
            specialization: doc.specialization || 'General Physician',
            location: doc.location,
            email: doc.email,
            availability: '9:00 AM - 5:00 PM',
            experience: '5+ years',
            qualifications: doc.college ? `${doc.college}, ${doc.yearOfPassing}` : 'MD',
            about: `Dr. ${doc.name} is a specialist in ${doc.specialization || 'General Medicine'} practicing in ${doc.location}.`,
            reviews: []
        }));

        res.render('bookAppointment', {
            doctorsOffline: doctorsData,
            title: 'Book Offline Appointment'
        });
    } catch (err) {
        console.error("Error fetching doctors:", err);
        res.status(500).render('error', { message: 'Error fetching doctors' });
    }
};

exports.getBookDocOnline = async (req, res) => {
    // Check if patient is logged in
    if (!req.session.patientId) {
        return res.redirect('/patient_form?error=login_required');
    }

    try {
        // Fetch online doctors (using consistent field name and values)
        const doctors = await Doctor.find({ onlineStatus: 'online' });

        // Transform the data for the template
        const doctorsData = doctors.map(doc => ({
            id: doc._id.toString(),
            name: doc.name,
            specialization: doc.specialization || 'General Physician',
            location: doc.location,
            email: doc.email,
            availability: '9:00 AM - 5:00 PM',
            experience: '5+ years',
            qualifications: doc.college ? `${doc.college}, ${doc.yearOfPassing}` : 'MD',
            about: `Dr. ${doc.name} is a specialist in ${doc.specialization || 'General Medicine'} practicing in ${doc.location}.`,
            reviews: []
        }));

        res.render('bookDocOnline', {
            doctorsOnline: doctorsData,
            title: 'Book Online Appointment'
        });
    } catch (err) {
        console.error("Error fetching doctors:", err);
        res.status(500).render('error', { message: 'Error fetching doctors' });
    }
};

exports.getDoctorProfilePatient = async (req, res) => {
    if (!req.session.patientId) {
        return res.redirect('/patient_form?error=login_required');
    }

    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).render('error', { message: 'Doctor not found' });
        }

        // Get existing appointments for this doctor (next 14 days)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 14);

        const existingAppointments = await Appointment.find({
            doctorId: doctor._id,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: ['pending', 'confirmed'] }
        });

        // Format the doctor data for the view
        const doctorData = {
            id: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization || 'General Physician',
            location: doctor.location,
            email: doctor.email,
            availability: '9:00 AM - 5:00 PM',
            experience: '5+ years',
            qualifications: doctor.college ? `${doctor.college}, ${doctor.yearOfPassing}` : 'MD',
            about: `Dr. ${doctor.name} is a specialist in ${doctor.specialization || 'General Medicine'} practicing in ${doctor.location}.`,
            reviews: [
                { patientName: 'Rahul', comment: 'Excellent doctor, very patient and understanding.' },
                { patientName: 'Priya', comment: 'Great diagnosis and treatment plan.' }
            ],
            languages: 'English, Hindi',
            image: 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png',

            consultationFee: doctor.consultationFee || 100
        };

        res.render('doctor_profile_patient', {
            doctor: doctorData,
            title: `Dr. ${doctor.name}'s Profile`
        });
    } catch (err) {
        console.error("Error fetching doctor:", err);
        res.status(500).render('error', { message: 'Error fetching doctor details' });
    }
};

exports.getOrderMedicines = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient/form?error=login_required');
        }

        const medicines = await Medicine.find().lean();

        // Format medicines if needed (e.g., add formatted dates)
        const formattedMedicines = medicines.map(med => ({
            ...med,
            formattedExpiryDate: med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Not specified'
        }));

        res.render('order_medicine', {
            medicines: formattedMedicines,
            title: 'Order Medicines'
        });
    } catch (err) {
        console.error("Error fetching medicines for order:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient/dashboard'
        });
    }
};
exports.postAddToCart = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { medicineId, quantity } = req.body;

        if (!medicineId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Check medicine availability
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        if (medicine.quantity < quantity) {
            return res.status(400).json({
                error: 'Insufficient stock',
                available: medicine.quantity
            });
        }

        // In a real app, you would add to a cart collection or session
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'Added to cart',
            medicine: {
                id: medicine._id,
                name: medicine.name,
                price: medicine.cost,
                quantity: quantity
            }
        });
    } catch (err) {
        console.error("Error adding to cart:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getMedicinesSearch = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Search query too short' });
        }

        const medicines = await Medicine.find({
            name: { $regex: query, $options: 'i' },
            quantity: { $gt: 0 }
        })
            .limit(10)
            .select('name medicineID cost manufacturer')
            .lean();

        res.json(medicines);
    } catch (err) {
        console.error("Error searching medicines:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDoctorsOnline = async (req, res) => {
    try {
        // Fetch online doctors
        const doctors = await Doctor.find({ onlineStatus: 'online', isApproved: true });

        // Transform the data for the frontend
        const doctorsData = doctors.map(doc => ({
            id: doc._id.toString(),
            name: doc.name,
            specialization: doc.specialization || 'General Physician',
            location: doc.location,
            email: doc.email,
            availability: '9:00 AM - 5:00 PM',
            experience: '5+ years',
            qualifications: doc.college ? `${doc.college}, ${doc.yearOfPassing}` : 'MD',
            about: `Dr. ${doc.name} is a specialist in ${doc.specialization || 'General Medicine'} practicing in ${doc.location}.`
        }));

        res.json(doctorsData);
    } catch (err) {
        console.error("Error fetching online doctors:", err);
        res.status(500).json({ error: 'Error fetching doctors' });
    }
};

exports.getDoctorsOffline = async (req, res) => {
    try {
        
        const doctors = await Doctor.find({ onlineStatus: 'offline',isApproved:true });

        
        const doctorsData = doctors.map(doc => ({
            id: doc._id.toString(),
            name: doc.name,
            specialization: doc.specialization || 'General Physician',
            location: doc.location,
            email: doc.email,
            availability: '9:00 AM - 5:00 PM',
            experience: '5+ years',
            qualifications: doc.college ? `${doc.college}, ${doc.yearOfPassing}` : 'MD',
            about: `Dr. ${doc.name} is a specialist in ${doc.specialization || 'General Medicine'} practicing in ${doc.location}.`,
            reviews: []
        }));

        res.json(doctorsData);
    } catch (err) {
        console.error("Error fetching doctors:", err);
        res.status(500).json({ error: 'Error fetching doctors' });
    }
};

exports.getDoctorsAll = async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .select('_id specialization')
            .lean();
        res.json(doctors);
    } catch (err) {
        console.error("Error fetching doctors:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
exports.getPreviousAppointments =  async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get current date and time for filtering appointments
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentTime = now.getHours() * 100 + now.getMinutes();

        // Fetch previous appointments - include ALL appointment statuses
        const previousAppointments = await Appointment.find({
            patientId: req.session.patientId,
            $or: [
                // Past appointments (any status)
                { date: { $lt: currentDate } },
                // Today's appointments that have already happened (any status)
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
                    },
                    $expr: {
                        $lte: [
                            {
                                $add: [
                                    { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$time", ":"] }, 0] } }, 100] },
                                    { $toInt: { $arrayElemAt: [{ $split: [{ $substrBytes: ["$time", 3, 2] }, " "] }, 0] } }
                                ]
                            },
                            currentTime
                        ]
                    }
                },
                // All completed and cancelled appointments (regardless of date/time)
                { status: { $in: ['completed', 'cancelled'] } }
            ]
        })
        .populate('doctorId', 'name specialization')
        .sort({ date: -1, time: -1 })
        .lean();

        // Format appointments
        const formattedAppointments = previousAppointments.map(appt => {
            const date = new Date(appt.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return {
                id: appt._id,
                doctorName: appt.doctorId?.name || 'Unknown Doctor',
                specialization: appt.doctorId?.specialization || 'General Physician',
                date: formattedDate,
                time: appt.time,
                type: appt.type,
                status: appt.status,
                notes: appt.notes
            };
        });

        res.json(formattedAppointments);
    } catch (err) {
        console.error("Error fetching previous appointments:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getUpcomingAppointments = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get current date and time for filtering appointments
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentTime = now.getHours() * 100 + now.getMinutes();

        // Fetch upcoming appointments - include ALL appointment statuses
        const upcomingAppointments = await Appointment.find({
            patientId: req.session.patientId,
            $or: [
                // Future appointments (any status)
                { date: { $gt: currentDate } },
                // Today's appointments that haven't happened yet (any status)
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
                    },
                    $expr: {
                        $gt: [
                            {
                                $add: [
                                    { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$time", ":"] }, 0] } }, 100] },
                                    { $toInt: { $arrayElemAt: [{ $split: [{ $substrBytes: ["$time", 3, 2] }, " "] }, 0] } }
                                ]
                            },
                            currentTime
                        ]
                    }
                }
            ]
            // REMOVED the status filter to include all appointment types
            // status: { $nin: ['completed', 'cancelled'] }
        })
        .populate('doctorId', 'name specialization')
        .sort({ date: 1, time: 1 })
        .lean();

        // Format appointments
        const formattedAppointments = upcomingAppointments.map(appt => {
            const date = new Date(appt.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return {
                id: appt._id,
                doctorName: appt.doctorId?.name || 'Unknown Doctor',
                specialization: appt.doctorId?.specialization || 'General Physician',
                date: formattedDate,
                time: appt.time,
                type: appt.type,
                status: appt.status,
                notes: appt.notes
            };
        });

        res.json(formattedAppointments);
    } catch (err) {
        console.error("Error fetching upcoming appointments:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// code for prescriptions
exports.getPrescriptions = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient/form?error=login_required');
        }

        
        const prescriptions = await Prescription.find({ 
            patientId: req.session.patientId 
        })
        .populate('doctorId', 'name specialization registrationNumber')
        .populate('patientId', 'name email mobile') 
        .sort({ createdAt: -1 })
        .lean();

        console.log('Fetched prescriptions:', prescriptions); 

        
        const transformedPrescriptions = prescriptions.map(prescription => {
            console.log('Processing prescription:', prescription); 
            
            return {
                _id: prescription._id,
                patientName: prescription.patientName,
                patientEmail: prescription.patientEmail,
                age: prescription.age,
                gender: prescription.gender,
                weight: prescription.weight,
                symptoms: prescription.symptoms,
                additionalNotes: prescription.additionalNotes,
                appointmentDate: prescription.appointmentDate,
                appointmentTime: prescription.appointmentTime,
                doctorId: {
                    name: prescription.doctorId?.name || 'Unknown Doctor',
                    specialization: prescription.doctorId?.specialization || 'General Physician',
                    registrationNumber: prescription.doctorId?.registrationNumber
                },
                medicines: prescription.medicines || []
            };
        });

        console.log('Transformed prescriptions:', transformedPrescriptions); 

        res.render('patient_prescriptions', {
            prescriptions: transformedPrescriptions,
            title: 'My Prescriptions'
        });
    } catch (err) {
        console.error("Error fetching prescriptions:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient/dashboard'
        });
    }
};

// exports.getPrescriptions = async (req, res) => {
//     try {
//         if (!req.session.patientId) {
//             return res.redirect('/patient/form?error=login_required');
//         }

//         // Fetch prescriptions for the patient using your schema
//         const prescriptions = await Prescription.find({ 
//             patientId: req.session.patientId 
//         })
//         .populate('doctorId', 'name specialization registrationNumber')
//         .populate('appointmentId')
//         .sort({ createdAt: -1 })
//         .lean();

//         // Transform the data to match your schema
//         const transformedPrescriptions = prescriptions.map(prescription => ({
//             _id: prescription._id,
//             doctorId: {
//                 name: prescription.doctorId?.name || 'Unknown Doctor',
//                 specialization: prescription.doctorId?.specialization || 'General Physician',
//                 registrationNumber: prescription.doctorId?.registrationNumber
//             },
//             patientId: {
//                 name: prescription.patientName,
//                 age: prescription.age,
//                 gender: prescription.gender
//             },
//             date: prescription.appointmentDate,
//             diagnosis: prescription.symptoms, // Using symptoms as diagnosis
//             medicines: prescription.medicines.map(med => ({
//                 name: med.medicineName,
//                 dosage: med.dosage,
//                 frequency: med.frequency,
//                 duration: med.duration,
//                 instructions: med.instructions,
//                 quantity: 1 // You might want to add quantity to your schema
//             })),
//             additionalInstructions: prescription.additionalNotes,
//             appointmentId: prescription.appointmentId
//         }));

//         res.render('patient_prescriptions', {
//             prescriptions: transformedPrescriptions || [],
//             title: 'My Prescriptions'
//         });
//     } catch (err) {
//         console.error("Error fetching prescriptions:", err.message);
//         res.status(500).render('error', {
//             message: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined,
//             redirect: '/patient/dashboard'
//         });
//     }
// };

exports.downloadPrescription = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const prescriptionId = req.params.id;
        
        const prescription = await Prescription.findById(prescriptionId)
            .populate('doctorId', 'name specialization registrationNumber')
            .lean();

        if (!prescription) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        
        if (prescription.patientId.toString() !== req.session.patientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        
        const pdfContent = generatePrescriptionPDF(prescription);
        
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
        
        
        pdfContent.pipe(res);
        
    } catch (err) {
        console.error("Error downloading prescription:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
const generatePrescriptionPDF = (prescription) => {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    
     const primaryColor = '#444d53';
    const secondaryColor ='#0188df';
    const accentColor = '#0188df';
    
    
    doc.fillColor(accentColor)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('MEDIQUICK PRESCRIPTION', { align: 'center' });
    
    
    doc.moveTo(50, 90)
       .lineTo(550, 90)
       .strokeColor(accentColor)
       .lineWidth(2)
       .stroke();
    
    doc.moveDown(1.5);
    
    
    doc.fillColor(primaryColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('DOCTOR INFORMATION:');
    
    doc.fillColor(secondaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(`Dr. ${prescription.doctorId.name}`, { indent: 20 });
    
    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica')
       .text(`Specialization: ${prescription.doctorId.specialization}`, { indent: 20 });
    
    if (prescription.doctorId.registrationNumber) {
        doc.text(`Registration: ${prescription.doctorId.registrationNumber}`, { indent: 20 });
    }
    
    doc.moveDown();
    
    
    doc.fillColor(primaryColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('PATIENT INFORMATION:');
    
    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica')
       .text(`Patient: ${prescription.patientName}`, { indent: 20 });
    
    doc.text(`Age: ${prescription.age}`, { indent: 20 });
    doc.text(`Gender: ${prescription.gender}`, { indent: 20 });
    
    if (prescription.weight) {
        doc.text(`Weight: ${prescription.weight} kg`, { indent: 20 });
    }
    
    doc.text(`Date: ${new Date(prescription.appointmentDate).toLocaleDateString()}`, { indent: 20 });
    doc.text(`Time: ${prescription.appointmentTime}`, { indent: 20 });
    
    doc.moveDown();
    
    // Symptoms with styling
    if (prescription.symptoms) {
        doc.fillColor(accentColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('SYMPTOMS & DIAGNOSIS:');
        
        doc.fillColor(primaryColor)
           .fontSize(11)
           .font('Helvetica')
           .text(prescription.symptoms, { 
               indent: 20,
               align: 'left'
           });
        
        doc.moveDown();
    }
    
    
    doc.fillColor(accentColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('PRESCRIBED MEDICINES:');
    
    doc.moveDown(0.5);
    
    prescription.medicines.forEach((medicine, index) => {
        
        doc.fillColor('#e8f6f3')
           .rect(50, doc.y, 500, 20)
           .fill();
        
        doc.fillColor(accentColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${medicine.medicineName.toUpperCase()}`, 55, doc.y + 4);
        
        doc.moveDown(1.5);
        
        
        doc.fillColor(primaryColor)
           .fontSize(10)
           .font('Helvetica')
           .text(`   Dosage: ${medicine.dosage}`, { indent: 20 });
        
        doc.text(`   Frequency: ${medicine.frequency}`, { indent: 20 });
        doc.text(`   Duration: ${medicine.duration}`, { indent: 20 });
        
        if (medicine.instructions) {
            doc.text(`   Instructions: ${medicine.instructions}`, { indent: 20 });
        }
        
        doc.moveDown();
    });
    
    
    if (prescription.additionalNotes) {
        doc.fillColor(accentColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('ADDITIONAL NOTES:');
        
        doc.fillColor(primaryColor)
           .fontSize(11)
           .font('Helvetica')
           .text(prescription.additionalNotes, {
               indent: 20,
               align: 'left'
           });
        
        doc.moveDown();
    }
    
    
    doc.fillColor('#e74c3c')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('IMPORTANT MEDICAL INFORMATION:');
    
    doc.fillColor(primaryColor)
       .fontSize(10)
       .font('Helvetica')
       .text('• Take medicines as prescribed by the doctor', { indent: 20 });
    
    doc.text('• Do not stop medication without consulting your doctor', { indent: 20 });
    doc.text('• Complete the full course of treatment', { indent: 20 });
    doc.text('• Contact your doctor in case of any adverse reactions', { indent: 20 });
    
    doc.moveDown(2);
    
    
    doc.fillColor('#7f8c8d')
       .fontSize(9)
       .font('Helvetica')
       .text('This is a computer-generated prescription. For any concerns, please consult your doctor.', { 
           align: 'center'
        });
    
    doc.text(`Prescription ID: ${prescription._id}`, { align: 'center' });
    doc.text(`Patient Email: ${prescription.patientEmail}`, { align: 'center' });
    
    
    doc.moveTo(50, doc.y + 10)
       .lineTo(550, doc.y + 10)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();
    
    doc.end();
    return doc;
};
// Updated PDF generation function for your schema
// const generatePrescriptionPDF = (prescription) => {
//     const PDFDocument = require('pdfkit');
//     const doc = new PDFDocument();
    
//     // Add content to PDF
//     doc.fontSize(20).text('MEDIQUICK PRESCRIPTION', { align: 'center' });
//     doc.moveDown();
    
//     // Doctor info
//     doc.fontSize(12);
//     doc.text(`Doctor: Dr. ${prescription.doctorId.name}`);
//     doc.text(`Specialization: ${prescription.doctorId.specialization}`);
//     if (prescription.doctorId.registrationNumber) {
//         doc.text(`Registration: ${prescription.doctorId.registrationNumber}`);
//     }
//     doc.moveDown();
    
//     // Patient info from your schema
//     doc.text(`Patient: ${prescription.patientName}`);
//     doc.text(`Age: ${prescription.age}`);
//     doc.text(`Gender: ${prescription.gender}`);
//     if (prescription.weight) {
//         doc.text(`Weight: ${prescription.weight} kg`);
//     }
//     doc.text(`Date: ${new Date(prescription.appointmentDate).toLocaleDateString()}`);
//     doc.text(`Time: ${prescription.appointmentTime}`);
//     doc.moveDown();
    
//     // Symptoms (used as diagnosis)
//     if (prescription.symptoms) {
//         doc.fontSize(14).text('SYMPTOMS/DIAGNOSIS:', { underline: true });
//         doc.fontSize(12).text(prescription.symptoms);
//         doc.moveDown();
//     }
    
//     // Medicines from your schema
//     doc.fontSize(14).text('PRESCRIBED MEDICINES:', { underline: true });
//     doc.moveDown();
    
//     prescription.medicines.forEach((medicine, index) => {
//         doc.text(`${index + 1}. ${medicine.medicineName.toUpperCase()}`, { continued: false });
//         doc.text(`   Dosage: ${medicine.dosage}`, { indent: 20 });
//         doc.text(`   Frequency: ${medicine.frequency}`, { indent: 20 });
//         doc.text(`   Duration: ${medicine.duration}`, { indent: 20 });
//         if (medicine.instructions) {
//             doc.text(`   Instructions: ${medicine.instructions}`, { indent: 20 });
//         }
//         doc.moveDown();
//     });
    
//     // Additional Notes
//     if (prescription.additionalNotes) {
//         doc.fontSize(14).text('ADDITIONAL NOTES:', { underline: true });
//         doc.fontSize(12).text(prescription.additionalNotes);
//         doc.moveDown();
//     }
    
//     // Important medical information
//     doc.moveDown();
//     doc.fontSize(10).text('IMPORTANT:', { underline: true });
//     doc.fontSize(10).text('• Take medicines as prescribed by the doctor');
//     doc.text('• Do not stop medication without consulting your doctor');
//     doc.text('• Complete the full course of treatment');
//     doc.text('• Contact your doctor in case of any adverse reactions');
    
//     // Footer
//     doc.moveDown(2);
//     doc.fontSize(10).text('This is a computer-generated prescription. For any concerns, please consult your doctor.', { align: 'center' });
//     doc.text(`Prescription ID: ${prescription._id}`, { align: 'center' });
//     doc.text(`Patient Email: ${prescription.patientEmail}`, { align: 'center' });
    
//     doc.end();
//     return doc;
// };
// exports.getProfile = async (req, res) => {
//     try {
//         if (!req.session.patientId) {
//             return res.redirect('/patient/form?error=login_required');
//         }

//         if (!mongoose.Types.ObjectId.isValid(req.session.patientId)) {
//             return res.status(400).render('error', {
//                 message: 'Invalid session data',
//                 redirect: '/patient/form'
//             });
//         }

//         const patient = await Patient.findById(req.session.patientId).lean();

//         if (!patient) {
//             return res.status(404).render('error', {
//                 message: 'Patient not found',
//                 redirect: '/patient/form'
//             });
//         }

//         // Render template with patient data directly
//         res.render('patient_profile', {
//             patient: {
//                 name: patient.name,
//                 email: patient.email,
//                 mobile: patient.mobile,
//                 address: patient.address,
//                 profilePhoto: patient.profilePhoto || '/images/default-patient.svg'
//             },
//             title: 'Patient Profile'
//         });
//     } catch (err) {
//         console.error("Error rendering patient profile:", err.message);
//         res.status(500).render('error', {
//             message: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined,
//             redirect: '/patient/form'
//         });
//     }
// };

//   <h1 id="patientName"><%= patient.name %></h1>
//                     <p id="patientEmail">Email: <%= patient.email %></p>
//                     <p id="patientMobile">Mobile: <%= patient.mobile %></p>
//                     <p id="patientAddress">Address: <%= patient.address %></p>
exports.getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid doctor ID' });
        }
        const doctor = await Doctor.findById(id).select('-password'); // Exclude sensitive fields like password
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (err) {
        console.error('Error fetching doctor by ID:', err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};