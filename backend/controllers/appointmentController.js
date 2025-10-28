const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

exports.postCreate = async (req, res) => {
    if (!req.session.patientId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { doctorId, date, time, type, notes } = req.body;

    if (!doctorId || !date || !time || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        
        const existingAppointment = await Appointment.findOne({
            doctorId,
            date: new Date(date),
            time,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            return res.status(400).json({
                error: 'Time slot already booked',
                details: 'This time slot is no longer available'
            });
        }

        // Create new appointment
        const appointment = new Appointment({
            patientId: req.session.patientId,
            doctorId,
            date: new Date(date),
            time,
            type: doctor.onlineStatus,
            consultationFee: doctor.consultationFee,
            notes,
            status: 'pending'
        });

        await appointment.save();
        console.log('New appointment created:', appointment);

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (err) {
        console.error("Error booking appointment:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDoctorAppointments = async (req, res) => {
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

exports.patchUpdateStatus =  async (req, res) => {
    if (!req.session.doctorId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status } = req.body;

    if (!status || !['confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const appointment = await Appointment.findOneAndUpdate(
            {
                _id: req.params.id,
                doctorId: req.session.doctorId
            },
            { status },
            { new: true }
        ).populate('patientId', 'name email mobile');

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        console.log('Appointment status updated:', appointment);
        res.json({
            message: 'Appointment updated successfully',
            appointment
        });
    } catch (err) {
        console.error("Error updating appointment:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAvailableSlots = () => {
    return async (req, res) => {
        try {
            const { doctorId } = req.query;
            if (!doctorId) {
                return res.status(400).json({ error: 'Doctor ID is required' });
            }

            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }

            const existingAppointments = await Appointment.find({
                doctorId,
                $or: [
                    { status: { $in: ['pending', 'confirmed'] } },
                    { isBlockedSlot: true }
                ]
            });

            const slots = generateAvailableSlots(doctor, existingAppointments);
            res.json(slots);
        } catch (err) {
            console.error("Error generating available slots:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

exports.getBookedSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ error: 'Doctor ID and date are required' });
        }

        const appointments = await Appointment.find({
            doctorId,
            date: new Date(date),
            $or: [
                { status: { $in: ['pending', 'confirmed'] } }, // Regular appointments
                { isBlockedSlot: true } // Blocked slots
            ]
        });

        res.json(appointments.map(a => a.time));
    } catch (err) {
        console.error("Error fetching booked slots:", err);
        res.status(500).json([]);
    }
};

exports.postBlockSlot = async (req, res) => {
    if (!req.session.doctorId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { date, time } = req.body;

    try {
        // Check if slot is already booked or blocked
        const existing = await Appointment.findOne({
            doctorId: req.session.doctorId,
            date: new Date(date),
            time,
            $or: [
                { status: { $in: ['pending', 'confirmed'] } }, // Regular appointments
                { isBlockedSlot: true } // Blocked slots
            ]
        });

        if (existing) {
            return res.status(400).json({
                error: 'Slot not available',
                details: existing.isBlockedSlot ? 'Slot is already blocked' : 'Slot already has an appointment'
            });
        }

        // Create blocked slot entry
        const blocked = new Appointment({
            doctorId: req.session.doctorId,
            date: new Date(date),
            time,
            status: 'blocked',
            isBlockedSlot: true,
            type: 'online',
            consultationFee: 0,
            patientId: null
        });

        await blocked.save();
        res.json({
            message: 'Slot blocked successfully',
            appointmentId: blocked._id
        });
    } catch (err) {
        console.error("Error blocking slot:", err);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.postUnblockSlot = async (req, res) => {
    if (!req.session.doctorId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { appointmentId } = req.body;

    try {
        const result = await Appointment.deleteOne({
            _id: appointmentId,
            doctorId: req.session.doctorId,
            isBlockedSlot: true
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Blocked slot not found' });
        }

        res.json({ message: 'Slot unblocked successfully' });
    } catch (err) {
        console.error("Error unblocking slot:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBlockedSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId) {
            return res.status(400).json({ error: 'Doctor ID is required' });
        }

        const query = {
            doctorId,
            isBlockedSlot: true
        };

        if (date) {
            query.date = new Date(date);
        }

        const blockedSlots = await Appointment.find(query)
            .sort({ date: 1, time: 1 });

        res.json(blockedSlots.map(slot => ({
            _id: slot._id,
            date: slot.date.toISOString().split('T')[0],
            time: slot.time
        })));
    } catch (err) {
        console.error("Error fetching blocked slots:", err);
        res.status(500).json([]);
    }
};

function generateAvailableSlots(doctor, existingAppointments) {
    const slots = [];
    const days = 14; // Show availability for next 14 days
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const interval = 30; // 30 minute intervals

    const now = new Date();

    // Convert existing appointments to Set for faster lookup
    const bookedSlots = new Set();
    existingAppointments.forEach(appt => {
        const dateStr = appt.date.toISOString().split('T')[0];
        bookedSlots.add(`${dateStr}_${appt.time}`);
    });

    for (let day = 0; day <= days; day++) {
        const date = new Date();
        date.setDate(now.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                // Skip if time is in the past
                if (day === 0 && (hour < now.getHours() ||
                    (hour === now.getHours() && minute < now.getMinutes()))) {
                    continue;
                }

                const timeString = `${hour % 12 === 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
                const slotKey = `${dateStr}_${timeString}`;

                // Only add if slot is not booked
                if (!bookedSlots.has(slotKey)) {
                    slots.push({
                        date: dateStr,
                        time: timeString,
                        datetime: `${dateStr}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
                    });
                }
            }
        }
    }

    return slots;
}

exports.patchCancelByPatient = async (req, res) => {
    if (!req.session.patientId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const appointment = await Appointment.findOneAndUpdate(
            {
                _id: req.params.id,
                patientId: req.session.patientId,
                status: { $in: ['pending', 'confirmed'] } // Only allow canceling pending/confirmed appointments
            },
            { status: 'cancelled' },
            { new: true }
        ).populate('doctorId', 'name specialization');

        if (!appointment) {
            return res.status(404).json({ 
                error: 'Appointment not found or cannot be cancelled',
                details: 'Appointment may have already been completed, cancelled, or does not exist'
            });
        }

        console.log('Appointment cancelled by patient:', appointment);
        res.json({
            message: 'Appointment cancelled successfully',
            appointment
        });
    } catch (err) {
        console.error("Error cancelling appointment:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};