const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');


router.post('/doctor/prescriptions', prescriptionController.createPrescription);
router.get('/doctor/prescriptions', prescriptionController.getDoctorPrescriptions);
router.get('/doctor/prescriptions/:id', prescriptionController.getPrescriptionById);
router.put('/doctor/prescriptions/:id', prescriptionController.updatePrescription);


router.get('/patient/prescriptions', prescriptionController.getPatientPrescriptions);
router.get('/patient/prescriptions/:id', prescriptionController.getPrescriptionById);

module.exports = router;