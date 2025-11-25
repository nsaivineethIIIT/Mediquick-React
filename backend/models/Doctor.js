const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    documentPath: String,
    isApproved: { type: Boolean, default: false },
    ssn: { type: String, default: null },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    specialization: String,
    college: { type: String, required: true },
    yearOfPassing: { type: String, required: true },
    location: { type: String, required: true },
    onlineStatus: {
        type: String,
        required: true,
        enum: ['online', 'offline'], // Only allow these values
        lowercase: true, // Automatically convert to lowercase
        default: 'offline'
    },
    consultationFee: {
        type: Number,
        required: true,
        min: [0, 'Consultation fee cannot be negative'],
        default: 100
    },
    dateOfBirth: { type: Date },
    gender: { 
        type: String, 
        enum: ['male', 'female', 'other'], 
        lowercase: true 
    },
    securityCode: { type: String, required: true },
    password: { type: String, required: true },
    lastLogin: { type: Date }
    ,
    profilePhoto: { type: String, default: '/images/default-doctor.svg' }
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
