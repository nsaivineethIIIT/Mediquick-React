const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const mongoose = require('mongoose');
const { DOCTOR_SECURITY_CODE } = require('../constants/constants');

const {checkEmailExists, checkMobileExists} = require('../utils/utils');
const fs = require('fs');
const path = require('path');

exports.signup = async (req, res) => {
    const {
        name, email, mobile, address, registrationNumber,
        specialization, college, yearOfPassing, location,
        onlineStatus, securityCode, password, consultationFee
    } = req.body;

    console.log('Received doctor signup request:', {
        name, email, mobile, address, registrationNumber,
        specialization, college, yearOfPassing, location,
        onlineStatus, securityCode, password: '[REDACTED]',
        consultationFee, document: req.file ? req.file.filename : 'None'
    });

    try {
        // Validate required fields
        if (!name || !email || !mobile || !address || !registrationNumber ||
            !college || !yearOfPassing || !location || !onlineStatus || !securityCode || !password) {
            console.log('Validation failed: Missing required fields', {
                name, email, mobile, address, registrationNumber,
                college, yearOfPassing, location, onlineStatus, securityCode, password: !!password
            });
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Please provide all required fields'
            });
        }

        // Validate security code
        if (securityCode !== DOCTOR_SECURITY_CODE) {
            console.log('Validation failed: Invalid security code', { securityCode });
            return res.status(400).json({
                error: 'Invalid security code',
                details: 'The provided security code is incorrect'
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
        
        const regNumRegex = /^[a-zA-Z0-9]{6,20}$/;
        if (!regNumRegex.test(registrationNumber)) {
            console.log('Validation failed: Invalid registration number', { registrationNumber });
            return res.status(400).json({
                error: 'Invalid registration number',
                details: 'Registration number must be 6-20 alphanumeric characters'
            });
        }

        
        if (password.length < 6) {
            console.log('Validation failed: Password too short', { passwordLength: password.length });
            return res.status(400).json({
                error: 'Invalid password',
                details: 'Password must be at least 6 characters long'
            });
        }

        
        const fee = parseFloat(consultationFee) || 100;
        if (isNaN(fee) || fee < 0) {
            console.log('Validation failed: Invalid consultation fee', { consultationFee });
            return res.status(400).json({
                error: 'Invalid consultation fee',
                details: 'Consultation fee must be a non-negative number'
            });
        }

        // Check for existing doctor
        const existingDoctor = await Doctor.findOne({
            $or: [{ email }, { registrationNumber }]
        });
        if (existingDoctor) {
            console.log('Validation failed: Duplicate doctor data', { email, registrationNumber });
            return res.status(400).json({
                error: 'Doctor already exists',
                details: 'A doctor with this email or registration number already exists'
            });
        }

        // Create new doctor
        const newDoctor = new Doctor({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            address: address.trim(),
            registrationNumber: registrationNumber.trim(),
            specialization: specialization ? specialization.trim() : '',
            college: college.trim(),
            yearOfPassing: yearOfPassing.trim(),
            location: location.trim(),
            onlineStatus: onlineStatus.trim(),
            securityCode,
            password,
            documentPath: req.file ? req.file.path : null,
            consultationFee: fee
        });

        await newDoctor.save();
        console.log('Doctor signup successful', { email, registrationNumber });

        res.status(201).json({
            message: 'Signup successful. Await approval.',
            redirect: '/doctor/form'
        });
    } catch (err) {
        console.error('Error during doctor signup:', {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });

        if (err.code === 11000) {
            console.log('MongoDB duplicate key error', { key: err.keyValue });
            return res.status(400).json({
                error: 'Duplicate data',
                details: 'A doctor with this email or registration number already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred during signup'
        });
    }
};

exports.login = async (req, res) => {
    const { email, password, securityCode } = req.body;

    try {
        if (!email || !password || !securityCode) {
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Missing email, password, or security code'
            });
        }

        if (securityCode !== DOCTOR_SECURITY_CODE) {
            return res.status(400).json({
                error: 'Invalid security code',
                details: 'The provided security code is incorrect'
            });
        }

        const doctor = await Doctor.findOne({ email });

        if (!doctor) {
            return res.status(401).json({
                error: 'Invalid credentials',
                details: 'No doctor found with this email'
            });
        }

        if (!doctor.isApproved) {
            return res.status(401).json({
                error: 'Not approved yet. Wait for employee confirmation.'
            });
        }

        if (doctor.password !== password) {
            return res.status(401).json({
                error: 'Invalid credentials',
                details: 'Incorrect password'
            });
        }

        // Update lastLogin
        doctor.lastLogin = new Date();
        await doctor.save();
        
        // Set session
        req.session.doctorId = doctor._id.toString();
        req.session.doctorEmail = doctor.email;
        
        console.log('Doctor logged in, session set:', {
            doctorId: req.session.doctorId,
            sessionId: req.sessionID
        });

        return res.status(200).json({
            message: 'Login successful',
            redirect: '/doctor/dashboard',
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email
            }
        });
    } catch (err) {
        console.error("Error during doctor login:", err.message);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        console.log('Session doctorId:', req.session.doctorId);

        if (!req.session.doctorId) {
            console.log('Redirecting to /doctor_form due to missing session');
            return res.redirect('/doctor/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.doctorId)) {
            console.log('Invalid doctorId format:', req.session.doctorId);
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/doctor/form'
            });
        }

        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        const doctor = await Doctor.findById(req.session.doctorId).lean();
        console.log('Doctor found:', doctor);
        console.log('Doctor profilePhoto:', doctor.profilePhoto);

        if (!doctor) {
            console.log('Doctor not found, rendering error view');
            return res.status(404).render('error', {
                message: 'Doctor not found',
                redirect: '/doctor/form'
            });
        }

        if (!doctor.isApproved) {
            console.log('Doctor not approved, rendering error view');
            return res.status(401).render('error', {
                message: 'Not approved yet. Wait for employee confirmation.',
                redirect: '/doctor/form'
            });
        }

        // Get current date and time for filtering appointments
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
        const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

        // Fetch upcoming appointments (future dates or today's appointments after current time)
        const upcomingAppointments = await Appointment.find({
            doctorId: req.session.doctorId,
            isBlockedSlot: { $ne: true }, // Exclude blocked slots
            $or: [
                { date: { $gt: currentDate } }, // Future dates
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // Today
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
            status: { $in: ['pending', 'confirmed'] } // Only pending or confirmed
        })
            .populate('patientId', 'name')
            .sort({ date: 1, time: 1 })
            .lean();
        // Fetch previous appointments (past dates, today before current time, or completed/cancelled)
        const previousAppointments = await Appointment.find({
            doctorId: req.session.doctorId,
            isBlockedSlot: { $ne: true }, // Exclude blocked slots
            $or: [
                { date: { $lt: currentDate } }, // Past dates
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // Today
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
                    status: { $nin: ['completed', 'cancelled'] } // Only pending or confirmed for today before current time
                },
                {
                    date: {
                        $gte: currentDate,
                        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // Today
                    },
                    status: { $in: ['completed', 'cancelled'] } // Completed or cancelled on today
                },
                {
                    date: { $lt: currentDate }, // Past dates with completed/cancelled status
                    status: { $in: ['completed', 'cancelled'] }
                }
            ]
        })
            .populate('patientId', 'name')
            .sort({ date: -1, time: -1 })
            .lean();

        // Format appointments for the view
        const formatAppointment = (appt) => {
            const date = new Date(appt.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return {
                id: appt._id,
                patientId: appt.patientId || { name: 'Unknown Patient' }, // Fallback for missing patientId
                date: formattedDate,
                time: appt.time,
                type: appt.type,
                status: appt.status,
                notes: appt.notes
            };
        };
        const isJson = req.query.format === 'json' || req.headers.accept === 'application/json';
        if (isJson) {
            const safeDoctor = { ...doctor };
            delete safeDoctor.password;
            delete safeDoctor.securityCode;
            res.json({
                doctor: safeDoctor,
                upcomingAppointments,
                previousAppointments
            });
        }
        else{
            console.log('Rendering doctor_profile view with doctor:', doctor);
            res.render('doctor_profile', {
            doctor,
            upcomingAppointments: upcomingAppointments.map(formatAppointment),
            previousAppointments: previousAppointments.map(formatAppointment),
            title: 'Doctor Profile'
        });
        }
    } catch (err) {
       console.error("Error fetching doctor profile:", err.message);
        if (req.query.format === 'json' || req.headers.accept === 'application/json') {
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        } else {
            res.status(500).render('error', {
                message: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined,
                redirect: '/'
            });
        }
    }      
};

exports.getUpcomingAppointments = async (req, res) => {
    try {
        if (!req.session.doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const upcomingAppointments = await Appointment.find({
            doctorId: req.session.doctorId,
            isBlockedSlot: { $ne: true },
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
            // REMOVE the status filter to include all appointment types
            // status: { $in: ['pending', 'confirmed'] }
        })
        .populate('patientId', 'name')
        .sort({ date: 1, time: 1 })
        .lean();

        res.json(upcomingAppointments);
    } catch (err) {
        console.error("Error fetching upcoming appointments:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getPreviousAppointments = async (req, res) => {
    try {
        if (!req.session.doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const previousAppointments = await Appointment.find({
            doctorId: req.session.doctorId,
            isBlockedSlot: { $ne: true },
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
                    }
                },
                // Include all completed and cancelled appointments regardless of date/time
                { status: { $in: ['completed', 'cancelled'] } }
            ]
        })
        .populate('patientId', 'name')
        .sort({ date: -1, time: -1 })
        .lean();

        res.json(previousAppointments);
    } catch (err) {
        console.error("Error fetching previous appointments:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// exports.getUpcomingAppointments = async (req, res) => {
//     try {
//         if (!req.session.doctorId) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         const now = new Date();
//         const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//         const currentTime = now.getHours() * 100 + now.getMinutes();

//         const upcomingAppointments = await Appointment.find({
//             doctorId: req.session.doctorId,
//             isBlockedSlot: { $ne: true },
//             $or: [
//                 { date: { $gt: currentDate } },
//                 {
//                     date: {
//                         $gte: currentDate,
//                         $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
//                     },
//                     $expr: {
//                         $gt: [
//                             {
//                                 $add: [
//                                     { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$time", ":"] }, 0] } }, 100] },
//                                     { $toInt: { $arrayElemAt: [{ $split: [{ $substrBytes: ["$time", 3, 2] }, " "] }, 0] } }
//                                 ]
//                             },
//                             currentTime
//                         ]
//                     }
//                 }
//             ],
//             status: { $in: ['pending', 'confirmed'] }
//         })
//         .populate('patientId', 'name')
//         .sort({ date: 1, time: 1 })
//         .lean();

//         res.json(upcomingAppointments);
//     } catch (err) {
//         console.error("Error fetching upcoming appointments:", err.message);
//         res.status(500).json({
//             error: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// };

// exports.getPreviousAppointments = async (req, res) => {
//     try {
//         if (!req.session.doctorId) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         const now = new Date();
//         const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//         const currentTime = now.getHours() * 100 + now.getMinutes();

//         const previousAppointments = await Appointment.find({
//             doctorId: req.session.doctorId,
//             isBlockedSlot: { $ne: true },
//             $or: [
//                 { date: { $lt: currentDate } },
//                 {
//                     date: {
//                         $gte: currentDate,
//                         $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
//                     },
//                     $expr: {
//                         $lte: [
//                             {
//                                 $add: [
//                                     { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$time", ":"] }, 0] } }, 100] },
//                                     { $toInt: { $arrayElemAt: [{ $split: [{ $substrBytes: ["$time", 3, 2] }, " "] }, 0] } }
//                                 ]
//                             },
//                             currentTime
//                         ]
//                     },
//                     status: { $nin: ['completed', 'cancelled'] }
//                 },
//                 {
//                     date: {
//                         $gte: currentDate,
//                         $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
//                     },
//                     status: { $in: ['completed', 'cancelled'] }
//                 },
//                 {
//                     date: { $lt: currentDate },
//                     status: { $in: ['completed', 'cancelled'] }
//                 }
//             ]
//         })
//         .populate('patientId', 'name')
//         .sort({ date: -1, time: -1 })
//         .lean();

//         res.json(previousAppointments);
//     } catch (err) {
//         console.error("Error fetching previous appointments:", err.message);
//         res.status(500).json({
//             error: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// };

// Remove profile photo endpoint
exports.removeProfilePhoto = async (req, res) => {
    try {
        if (!req.session.doctorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        const doctorBefore = await Doctor.findById(req.session.doctorId).lean();
        const updateData = {
            profilePhoto: '/images/default-doctor.svg'
        };

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            req.session.doctorId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Doctor not found'
            });
        }

        // Cleanup old profile photo file if it was a local upload
        try {
            const oldProfilePhoto = doctorBefore && doctorBefore.profilePhoto;
            if (oldProfilePhoto && oldProfilePhoto.startsWith('/uploads/profiles/')) {
                const filePath = path.join(process.cwd(), 'public', oldProfilePhoto.replace(/^\//, ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error('Failed to cleanup old doctor profile photo file:', err.message);
        }

        res.status(200).json({
            success: true,
            message: 'Profile photo removed successfully',
            profilePhoto: updatedDoctor.profilePhoto
        });
    } catch (err) {
        console.error("Error removing doctor profile photo:", err.message);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getEditProfile = async (req, res) => {
    try {
        console.log('Accessing /doctor_edit_profile, Session doctorId:', req.session.doctorId);
        if (!req.session.doctorId) {
            console.log('Redirecting to /doctor_form due to missing session');
            return res.redirect('/doctor/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.doctorId)) {
            console.log('Invalid doctorId format:', req.session.doctorId);
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/doctor/form'
            });
        }

        const doctor = await Doctor.findById(req.session.doctorId)
            .select('name email mobile address specialization college yearOfPassing location onlineStatus consultationFee profilePhoto')
            .lean();

        if (!doctor) {
            console.log('Doctor not found, rendering error view');
            return res.status(404).render('error', {
                message: 'Doctor not found',
                redirect: '/doctor/form'
            });
        }

        console.log('Rendering doctor_edit_profile view with doctor:', doctor);
        res.render('doctor_edit_profile', {
            doctor,
            title: 'Edit Doctor Profile'
        });
    } catch (err) {
        console.error("Error fetching doctor data for edit:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        console.log('Received POST /update_doctor_profile, Session doctorId:', req.session.doctorId);
        console.log('Request body:', req.body);

        if (!req.session.doctorId) {
            console.log('Unauthorized: No session doctorId');
            return res.status(401).json({ error: 'Unauthorized: Please log in first' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.doctorId)) {
            console.log('Invalid doctorId format:', req.session.doctorId);
            return res.status(400).json({ error: 'Invalid session data' });
        }

    const { name, email, mobile, address, specialization, college, yearOfPassing, location, onlineStatus, consultationFee, removeProfilePhoto } = req.body;

        if (!name || !email || !mobile || !address || !specialization || !college || !yearOfPassing || !location || !onlineStatus || !consultationFee) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (isNaN(consultationFee) || consultationFee < 0) {
            console.log('Validation failed: Invalid consultation fee:', consultationFee);
            return res.status(400).json({ error: 'Consultation fee must be a valid non-negative number' });
        }
        const ifemailExists = await checkEmailExists(email, req.session.doctorId);
        if (ifemailExists) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Check for existing mobile across all collections
        const ifmobileExists = await checkMobileExists(mobile, req.session.doctorId);
        if (ifmobileExists) {
            return res.status(400).json({ error: 'Mobile number already in use' });
        }
        const emailExists = await Doctor.findOne({ email, _id: { $ne: req.session.doctorId } });
        if (emailExists) {
            console.log('Validation failed: Email already in use:', email);
            return res.status(400).json({ error: 'Email already in use' });
        }

        const mobileExists = await Doctor.findOne({ mobile, _id: { $ne: req.session.doctorId } });
        if (mobileExists) {
            console.log('Validation failed: Mobile number already in use:', mobile);
            return res.status(400).json({ error: 'Mobile number already in use' });
        }

        const doctorBefore = await Doctor.findById(req.session.doctorId).lean();
        const updateData = { name, email, mobile, address, specialization, college, yearOfPassing, location, onlineStatus, consultationFee };

        // handle profile photo file if uploaded (uploadProfile stores in public/uploads/profiles)
        if (req.file && req.file.filename) {
            updateData.profilePhoto = '/uploads/profiles/' + req.file.filename;
        }

        if (removeProfilePhoto === 'on' || removeProfilePhoto === 'true') {
            updateData.profilePhoto = '/images/default-doctor.svg';
        }

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            req.session.doctorId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            console.log('Doctor not found for update, ID:', req.session.doctorId);
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Cleanup old profile photo file if local and replaced/removed
        try {
            const oldProfilePhoto = doctorBefore && doctorBefore.profilePhoto;
            const newProfilePhoto = updateData.profilePhoto;
            if (oldProfilePhoto && oldProfilePhoto.startsWith('/uploads/profiles/') && oldProfilePhoto !== newProfilePhoto) {
                const filePath = path.join(process.cwd(), 'public', oldProfilePhoto.replace(/^\//, ''));
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Failed to cleanup old doctor profile photo file:', err.message);
        }

        console.log('Doctor profile updated successfully:', updatedDoctor);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            redirect: '/doctor/profile',
            profilePhoto: updatedDoctor.profilePhoto,
            name: updatedDoctor.name
        });
    } catch (err) {
        console.error("Error updating doctor profile:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getDashboard = async (req, res) => {
    // Check if doctor is logged in
    if (!req.session.doctorId) {
        return res.redirect('/doctor/form?error=login_required');
    }

    try {
        const doctor = await Doctor.findById(req.session.doctorId);
        if (!doctor) {
            return res.status(404).render('error', { message: 'Doctor not found' });
        }

        res.render('doctor_dashboard', { doctor });
    } catch (err) {
        console.error("Error fetching doctor data:", err);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};

exports.getForm = (req, res) => {
    res.render('doctor_form');
}


exports.getDailyEarnings = async (req, res) => {
    try {
        if (!req.session.doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch completed appointments for the doctor
        const appointments = await Appointment.find({
            doctorId: req.session.doctorId,
            isBlockedSlot: { $ne: true },
            status: 'completed'
        })
        .sort({ date: 1 })
        .lean();

        // Group appointments by date and calculate earnings
        const earningsByDate = {};
        
        appointments.forEach(appt => {
            const dateStr = appt.date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            if (!earningsByDate[dateStr]) {
                earningsByDate[dateStr] = {
                    date: dateStr,
                    count: 0,
                    totalFees: 0,
                    totalRevenue: 0
                };
            }
            
            earningsByDate[dateStr].count++;
            earningsByDate[dateStr].totalFees += appt.consultationFee || 0;
            earningsByDate[dateStr].totalRevenue += (appt.consultationFee || 0) * 0.9; // Doctor keeps 90%
        });

        // Convert to array and sort by date (newest first)
        const dailyEarnings = Object.values(earningsByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(dailyEarnings);
    } catch (err) {
        console.error("Error fetching daily earnings:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getDoctorAppiontments = async (req, res) => {
    if (!req.session.doctorId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { status } = req.query;
        //   let query = { doctorId: req.session.doctorId };
        let query = {
            doctorId: req.session.doctorId,
            isBlockedSlot: { $ne: true } // Exclude blocked slots
        };

        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email mobile')
            .sort({ date: 1, time: 1 });

        // Categorize appointments based on current date and time
        const now = new Date();
        const categorized = {
            upcoming: [],
            previous: []
        };

        appointments.forEach(appt => {
            const apptDate = new Date(appt.date);
            const [time, period] = appt.time.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            apptDate.setHours(hours, minutes, 0, 0);

            if (apptDate >= now && appt.status !== 'cancelled' && appt.status !== 'completed') {
                categorized.upcoming.push(appt);
            } else {
                categorized.previous.push(appt);
            }
        });

        res.json(categorized);
    } catch (err) {
        console.error("Error fetching appointments:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDoctorDetails = async (req, res) => {
    try {
        if (!req.session.doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const doctor = await Doctor.findById(req.session.doctorId).lean();
        
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Remove sensitive data
        delete doctor.password;
        delete doctor.securityCode;

        res.json(doctor);
    } catch (err) {
        console.error("Error fetching doctor profile:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// New code for presrciptions is writter here
// Add these routes to your doctorController.js

// Generate Prescription Page
// exports.getGeneratePrescriptionPage = async (req, res) => {
//     try {
//         if (!req.session.doctorId) {
//             return res.redirect('/doctor_form?error=login_required');
//         }

//         // Fetch completed appointments for prescription generation
//         const appointments = await Appointment.find({
//             doctorId: req.session.doctorId,
//             status: 'completed'
//         })
//         .populate('patientId', 'name email mobile')
//         .sort({ date: -1 })
//         .lean();

//         res.render('generate_prescriptions', {
//             appointments,
//             title: 'Generate Prescription'
//         });
//     } catch (err) {
//         console.error("Error loading generate prescription page:", err.message);
//         res.status(500).render('error', {
//             message: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined,
//             redirect: '/doctor_dashboard'
//         });
//     }
// };

// // View Prescriptions Page
// exports.getPrescriptionsPage = async (req, res) => {
//     try {
//         if (!req.session.doctorId) {
//             return res.redirect('/doctor_form?error=login_required');
//         }

//         // Fetch all prescriptions by this doctor
//         const prescriptions = await Prescription.find({ doctorId: req.session.doctorId })
//             .populate('patientId', 'name email mobile')
//             .populate('appointmentId', 'date time')
//             .sort({ createdAt: -1 })
//             .lean();

//         res.render('prescriptions', {
//             prescriptions,
//             title: 'My Prescriptions'
//         });
//     } catch (err) {
//         console.error("Error loading prescriptions page:", err.message);
//         res.status(500).render('error', {
//             message: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined,
//             redirect: '/doctor_dashboard'
//         });
//     }
// };

// Remove this line that's causing syntax error:
// New code for presrciptions is writter here

// And fix the function (remove the extra text):
exports.getGeneratePrescriptionPage = async (req, res) => {
    try {
        console.log('Accessing generate prescription page, Session doctorId:', req.session.doctorId);
        
        if (!req.session.doctorId) {
            console.log('Redirecting to doctor form - no session');
            return res.redirect('/doctor/form?error=login_required');
        }

        // Verify doctor exists and is approved
        const doctor = await Doctor.findById(req.session.doctorId);
        if (!doctor) {
            console.log('Doctor not found');
            return res.redirect('/doctor/form?error=doctor_not_found');
        }

        if (!doctor.isApproved) {
            console.log('Doctor not approved');
            return res.redirect('/doctor/form?error=not_approved');
        }

        // Fetch completed appointments for prescription generation
        const appointments = await Appointment.find({
            doctorId: req.session.doctorId,
            status: 'completed',
            // Exclude appointments that already have prescriptions
            _id: { 
                $nin: await Prescription.distinct('appointmentId', { 
                    doctorId: req.session.doctorId 
                })
            }
        })
        .populate('patientId', 'name email mobile')
        .sort({ date: -1, time: -1 })
        .lean();

        console.log(`Found ${appointments.length} completed appointments for prescriptions`);

        res.render('generate_prescriptions', {
            appointments,
            title: 'Generate Prescription',
            doctorName: doctor.name
        });

    } catch (err) {
        console.error("Error loading generate prescription page:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/doctor/dashboard'
        });
    }
};

exports.getPrescriptionsPage = async (req, res) => {
    try {
        console.log('Accessing prescriptions page, Session doctorId:', req.session.doctorId);
        
        if (!req.session.doctorId) {
            return res.redirect('/doctor/form?error=login_required');
        }

        
        const doctor = await Doctor.findById(req.session.doctorId);
        if (!doctor) {
            return res.redirect('/doctor/form?error=doctor_not_found');
        }

        
        const prescriptions = await Prescription.find({ doctorId: req.session.doctorId })
            .populate('patientId', 'name email mobile')
            .populate('appointmentId', 'date time type')
            .sort({ createdAt: -1 })
            .lean();

        console.log(`Found ${prescriptions.length} prescriptions`);

        res.render('prescriptions', {
            prescriptions,
            title: 'My Prescriptions',
            doctorName: doctor.name
        });

    } catch (err) {
        console.error("Error loading prescriptions page:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/doctor/dashboard'
        });
    }
};
// Add this function to your doctorController.js
// const generatePrescriptionPDF = (prescription) => {
//     const PDFDocument = require('pdfkit');
//     const doc = new PDFDocument();
    
//     // Add content to PDF
//     doc.fontSize(20).text('MEDIQUICK PRESCRIPTION', { align: 'center' });
//     doc.moveDown();
    
//     // Doctor info
//     doc.fontSize(12);
//     doc.text(`Doctor: Dr. ${prescription.doctorId?.name || 'Unknown Doctor'}`);
//     doc.text(`Specialization: ${prescription.doctorId?.specialization || 'General Physician'}`);
//     if (prescription.doctorId?.registrationNumber) {
//         doc.text(`Registration: ${prescription.doctorId.registrationNumber}`);
//     }
//     doc.moveDown();
    
//     // Patient info
//     doc.text(`Patient: ${prescription.patientName}`);
//     doc.text(`Email: ${prescription.patientEmail}`);
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
    
//     // Medicines
//     doc.fontSize(14).text('PRESCRIBED MEDICINES:', { underline: true });
//     doc.moveDown();
    
//     if (prescription.medicines && prescription.medicines.length > 0) {
//         prescription.medicines.forEach((medicine, index) => {
//             doc.text(`${index + 1}. ${medicine.medicineName.toUpperCase()}`, { continued: false });
//             doc.text(`   Dosage: ${medicine.dosage}`, { indent: 20 });
//             doc.text(`   Frequency: ${medicine.frequency}`, { indent: 20 });
//             doc.text(`   Duration: ${medicine.duration}`, { indent: 20 });
//             if (medicine.instructions) {
//                 doc.text(`   Instructions: ${medicine.instructions}`, { indent: 20 });
//             }
//             doc.moveDown();
//         });
//     } else {
//         doc.text('No medicines prescribed');
//         doc.moveDown();
//     }
    
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
//     doc.text(`Doctor: Dr. ${prescription.doctorId?.name || 'Unknown Doctor'}`, { align: 'center' });
    
//     doc.end();
//     return doc;
// };

// Add this download function to your doctorController.js
// exports.downloadPrescription = async (req, res) => {
//     try {
//         if (!req.session.doctorId) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         const prescriptionId = req.params.id;
        
//         const prescription = await Prescription.findById(prescriptionId)
//             .populate('doctorId', 'name specialization registrationNumber')
//             .lean();

//         if (!prescription) {
//             return res.status(404).json({ error: 'Prescription not found' });
//         }

//         // Check if the prescription belongs to the logged-in doctor
//         if (prescription.doctorId && prescription.doctorId._id.toString() !== req.session.doctorId) {
//             return res.status(403).json({ error: 'Access denied' });
//         }

//         // Generate PDF
//         const pdfContent = generatePrescriptionPDF(prescription);
        
//         // Set headers for PDF download
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
        
//         // Send PDF
//         pdfContent.pipe(res);
        
//     } catch (err) {
//         console.error("Error downloading prescription:", err.message);
//         res.status(500).json({
//             error: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// };
// In your doctorController.js or prescriptionController.js
// Updated generatePrescriptionPDF function with better styling
const generatePrescriptionPDF = (prescription) => {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    // Set up colors and fonts
     const primaryColor = '#444d53';
    const secondaryColor ='#0188df';
    const accentColor = '#0188df';
    
    // Header with styling
    doc.fillColor(accentColor)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('MEDIQUICK PRESCRIPTION', { align: 'center' });
    
    // Add decorative line
    doc.moveTo(50, 90)
       .lineTo(550, 90)
       .strokeColor(accentColor)
       .lineWidth(2)
       .stroke();
    
    doc.moveDown(1.5);
    
    // Doctor info with styling
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
    
    // Patient info with styling
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
    
    // Medicines with styling
    doc.fillColor(accentColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('PRESCRIBED MEDICINES:');
    
    doc.moveDown(0.5);
    
    prescription.medicines.forEach((medicine, index) => {
        // Medicine name with background
        doc.fillColor('#e8f6f3')
           .rect(50, doc.y, 500, 20)
           .fill();
        
        doc.fillColor(accentColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${medicine.medicineName.toUpperCase()}`, 55, doc.y + 4);
        
        doc.moveDown(1.5);
        
        // Medicine details with styling
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
    
    // Additional Notes with styling
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
    
    // Important medical information with styling
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
    
    // Footer with styling
    doc.fillColor('#7f8c8d')
       .fontSize(9)
       .font('Helvetica')
       .text('This is a computer-generated prescription. For any concerns, please consult your doctor.', { 
           align: 'center'
        });
    
    doc.text(`Prescription ID: ${prescription._id}`, { align: 'center' });
    doc.text(`Patient Email: ${prescription.patientEmail}`, { align: 'center' });
    
    // Add final decorative line
    doc.moveTo(50, doc.y + 10)
       .lineTo(550, doc.y + 10)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();
    
    doc.end();
    return doc;
};
//this is the 2nd latest one
// exports.downloadPrescription = async (req, res) => {
//     try {
//         if (!req.session.doctorId) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         const prescriptionId = req.params.id;
        
//         const prescription = await Prescription.findById(prescriptionId)
//             .populate('patientId', 'name email mobile')
//             .lean();

//         if (!prescription) {
//             return res.status(404).json({ error: 'Prescription not found' });
//         }

//         // Check if the prescription belongs to the logged-in doctor
//         if (prescription.doctorId.toString() !== req.session.doctorId) {
//             return res.status(403).json({ error: 'Access denied' });
//         }

//         // Generate PDF using your existing function (same as patient)
//         const pdfContent = generatePrescriptionPDF(prescription);
        
//         // Set headers for PDF download
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
        
//         // Send PDF
//         pdfContent.pipe(res);
        
//     } catch (err) {
//         console.error("Error downloading prescription:", err.message);
//         res.status(500).json({
//             error: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// };

exports.downloadPrescription = async (req, res) => {
    try {
        if (!req.session.doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const prescriptionId = req.params.id;
        
        // Get prescription without populate first
        const prescription = await Prescription.findById(prescriptionId)
            .populate('patientId', 'name email mobile')
            .lean();

        if (!prescription) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        // Check if the prescription belongs to the logged-in doctor
        if (prescription.doctorId.toString() !== req.session.doctorId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get doctor details separately
        const doctor = await Doctor.findById(req.session.doctorId)
            .select('name specialization registrationNumber')
            .lean();

        // Create a new object with doctor data
        const prescriptionWithDoctor = {
            ...prescription,
            doctorId: doctor // Replace the ObjectId with actual doctor data
        };

        console.log('=== COMBINED PRESCRIPTION DATA ===');
        console.log('Doctor Name:', prescriptionWithDoctor.doctorId.name);
        console.log('Specialization:', prescriptionWithDoctor.doctorId.specialization);
        console.log('=== END COMBINED DATA ===');

        // Generate PDF with the combined data
        const pdfContent = generatePrescriptionPDF(prescriptionWithDoctor);
        
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
        
        // Send PDF
        pdfContent.pipe(res);
        
    } catch (err) {
        console.error("Error downloading prescription:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Remove avatar for doctor (reset to dummy and delete local file)
exports.removeAvatar = async (req, res) => {
    try {
        if (!req.session.doctorId) return res.status(401).json({ error: 'Unauthorized' });
        const doctorBefore = await Doctor.findById(req.session.doctorId).lean();
        const dummy = 'https://static.thenounproject.com/png/638636-200.png';
        const updatedDoctor = await Doctor.findByIdAndUpdate(req.session.doctorId, { avatar: dummy }, { new: true });
        try {
            const oldAvatar = doctorBefore && doctorBefore.avatar;
            if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
                const filePath = path.join(process.cwd(), 'public', oldAvatar.replace(/^\//, ''));
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Failed to cleanup old doctor avatar during remove:', err.message);
        }
        res.json({ success: true, message: 'Avatar removed', avatar: updatedDoctor.avatar, name: updatedDoctor.name });
    } catch (err) {
        console.error('doctor removeAvatar error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get doctor profile data for dashboard (JSON response)
exports.getProfileData = async (req, res) => {
  try {
    if (!req.session.doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const doctor = await Doctor.findById(req.session.doctorId).select('_id profilePhoto').lean();
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ doctor });
  } catch (err) {
    console.error('Error fetching doctor profile data:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Ensure getDoctorAppointments returns JSON (add or update if needed)
exports.getDoctorAppointments = async (req, res) => {
  if (!req.session.doctorId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { status } = req.query;
    let query = {
      doctorId: req.session.doctorId,
      isBlockedSlot: { $ne: true } // Exclude blocked slots
    };

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email mobile')
      .sort({ date: 1, time: 1 });

    // Categorize appointments based on current date and time
    const now = new Date();
    const categorized = {
      upcoming: [],
      previous: []
    };

    appointments.forEach(appt => {
      const apptDate = new Date(appt.date);
      const [time, period] = appt.time.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const apptTime = new Date(apptDate);
      apptTime.setHours(hours, minutes, 0, 0);

      if (apptTime >= now && ['pending', 'confirmed'].includes(appt.status)) {
        categorized.upcoming.push(appt);
      } else {
        categorized.previous.push(appt);
      }
    });

    res.json(categorized);
  } catch (err) {
    console.error("Error fetching doctor's appointments:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add this to your doctorController.js
exports.getDoctorAppointmentsAPI = async (req, res) => {
  try {
    if (!req.session.doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const appointments = await Appointment.find({
      doctorId: req.session.doctorId,
      isBlockedSlot: { $ne: true }
    })
    .populate('patientId', 'name email mobile')
    .sort({ date: 1, time: 1 })
    .lean();

    // Categorize appointments
    const now = new Date();
    const categorized = {
      upcoming: [],
      previous: []
    };

    appointments.forEach(appt => {
      const apptDate = new Date(appt.date);
      const [time, period] = appt.time.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const apptDateTime = new Date(apptDate);
      apptDateTime.setHours(hours, minutes, 0, 0);

      if (apptDateTime >= now && ['pending', 'confirmed'].includes(appt.status)) {
        categorized.upcoming.push(appt);
      } else {
        categorized.previous.push(appt);
      }
    });

    res.json(categorized);
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};