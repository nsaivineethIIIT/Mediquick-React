const Chat = require('../models/Chat');
const Appointment = require('../models/Appointment');
const path = require('path');

exports.postSend = async (req, res) => {
    try {
        const { appointmentId, message, senderType } = req.body;
        const senderId = senderType === 'patient' ? req.session.patientId : req.session.doctorId;

        if (!senderId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Verify the user is part of this appointment
        if (senderType === 'patient' && appointment.patientId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: 'Not authorized to chat for this appointment' });
        }
        if (senderType === 'doctor' && appointment.doctorId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: 'Not authorized to chat for this appointment' });
        }

        // Only allow chat for confirmed appointments
        if (appointment.status !== 'confirmed') {
            return res.status(400).json({ error: 'Chat is only available for confirmed appointments' });
        }

        const chat = new Chat({
            appointmentId,
            senderId,
            senderType,
            message
        });

        await chat.save();
        res.json({ success: true, chat });
    } catch (err) {
        console.error('Error sending chat message:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postSendFile = async (req, res) => {
    try {
        const { appointmentId, senderType } = req.body;
        const senderId = senderType === 'patient' ? req.session.patientId : req.session.doctorId;

        if (!senderId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        
        if (senderType === 'patient' && appointment.patientId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: 'Not authorized to chat for this appointment' });
        }
        if (senderType === 'doctor' && appointment.doctorId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: 'Not authorized to chat for this appointment' });
        }

        
        if (appointment.status !== 'confirmed') {
            return res.status(400).json({ error: 'Chat is only available for confirmed appointments' });
        }

        const chat = new Chat({
            appointmentId,
            senderId,
            senderType,
            message: `File: ${req.file.originalname}`,
            filePath: req.file.path,
            fileName: req.file.filename,
            originalFileName: req.file.originalname,
            fileType: req.file.mimetype,
            isFile: true
        });

        await chat.save();
        res.json({ success: true, chat });
    } catch (err) {
        console.error('Error sending chat file:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getChat = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.session.patientId || req.session.doctorId;
        const userType = req.session.patientId ? 'patient' : 'doctor';

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Verify the user is part of this appointment
        if (userType === 'patient' && appointment.patientId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to view this chat' });
        }
        if (userType === 'doctor' && appointment.doctorId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to view this chat' });
        }

        const messages = await Chat.find({ appointmentId })
            .sort({ timestamp: 1 })
            .lean();

        res.json({ messages });
    } catch (err) {
        console.error('Error fetching chat messages:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};