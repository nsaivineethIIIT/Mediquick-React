const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.post('/', appointmentController.postCreate); // Create a new appointment (patient)
router.get('/doctor/appointments', appointmentController.getDoctorAppointments); // Get doctor's appointments
router.patch('/:id', appointmentController.patchUpdateStatus); // Update appointment status (doctor)
router.get('/api/available-slots', appointmentController.getAvailableSlots()); // Get available slots for a doctor
router.get('/api/booked-slots', appointmentController.getBookedSlots); // Get booked slots for a doctor on a date
router.post('/api/block-slot', appointmentController.postBlockSlot); // Block a slot (doctor)
router.post('/api/unblock-slot', appointmentController.postUnblockSlot); // Unblock a slot (doctor)
router.get('/api/blocked-slots', appointmentController.getBlockedSlots);
router.post('/appointments',appointmentController.postCreate) ;// Get all blocked slots for a doctor
router.patch('/patient/:id/cancel', appointmentController.patchCancelByPatient);
module.exports = router;