const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');


exports.createPrescription = async (req, res) => {
    try {
        const {
            appointmentId,
            age,
            gender,
            weight,
            symptoms,
            medicines,
            additionalNotes
        } = req.body;

       
        if (!appointmentId || !age || !gender || !weight || !symptoms || !medicines) {
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Missing appointmentId, age, gender, weight, symptoms, or medicines'
            });
        }

        
        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                error: 'Invalid medicines',
                details: 'Medicines must be a non-empty array'
            });
        }

        
        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId')
            .populate('doctorId');

        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found'
            });
        }

        
        if (appointment.doctorId._id.toString() !== req.session.doctorId) {
            return res.status(403).json({
                error: 'Unauthorized',
                details: 'You can only create prescriptions for your own appointments'
            });
        }

        
        const existingPrescription = await Prescription.findOne({ appointmentId });
        if (existingPrescription) {
            return res.status(400).json({
                error: 'Prescription already exists',
                details: 'A prescription already exists for this appointment'
            });
        }

        
        const prescription = new Prescription({
            patientName: appointment.patientId.name,
            patientEmail: appointment.patientId.email,
            doctorEmail: appointment.doctorId.email,
            age,
            gender,
            weight,
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            symptoms,
            medicines,
            additionalNotes,
            appointmentId,
            doctorId: req.session.doctorId,
            patientId: appointment.patientId._id
        });

        await prescription.save();

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            prescription
        });

    } catch (err) {
        console.error("Error creating prescription:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


exports.getDoctorPrescriptions = async (req, res) => {
    try {
        if (!req.session.doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const prescriptions = await Prescription.find({ doctorId: req.session.doctorId })
            .populate('patientId', 'name email mobile')
            .populate('appointmentId', 'date time type')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            prescriptions
        });

    } catch (err) {
        console.error("Error fetching doctor prescriptions:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


exports.getPatientPrescriptions = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const prescriptions = await Prescription.find({ patientId: req.session.patientId })
            .populate('doctorId', 'name specialization email')
            .populate('appointmentId', 'date time type')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            prescriptions
        });

    } catch (err) {
        console.error("Error fetching patient prescriptions:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Get prescription by ID
exports.getPrescriptionById = async (req, res) => {
    try {
        const { id } = req.params;

        const prescription = await Prescription.findById(id)
            .populate('patientId', 'name email mobile address')
            .populate('doctorId', 'name specialization email mobile')
            .populate('appointmentId', 'date time type status');

        if (!prescription) {
            return res.status(404).json({
                error: 'Prescription not found'
            });
        }

        // Check authorization
        if (req.session.doctorId && prescription.doctorId._id.toString() !== req.session.doctorId) {
            return res.status(403).json({
                error: 'Unauthorized to view this prescription'
            });
        }

        if (req.session.patientId && prescription.patientId._id.toString() !== req.session.patientId) {
            return res.status(403).json({
                error: 'Unauthorized to view this prescription'
            });
        }

        res.json({
            success: true,
            prescription
        });

    } catch (err) {
        console.error("Error fetching prescription:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Update prescription
exports.updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { symptoms, medicines, additionalNotes } = req.body;

        const prescription = await Prescription.findById(id);

        if (!prescription) {
            return res.status(404).json({
                error: 'Prescription not found'
            });
        }

        // Only the prescribing doctor can update
        if (prescription.doctorId.toString() !== req.session.doctorId) {
            return res.status(403).json({
                error: 'Unauthorized to update this prescription'
            });
        }

        // Update fields
        if (symptoms) prescription.symptoms = symptoms;
        if (medicines) prescription.medicines = medicines;
        if (additionalNotes !== undefined) prescription.additionalNotes = additionalNotes;

        await prescription.save();

        res.json({
            success: true,
            message: 'Prescription updated successfully',
            prescription
        });

    } catch (err) {
        console.error("Error updating prescription:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};