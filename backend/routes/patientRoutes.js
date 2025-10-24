const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const medicineController = require('../controllers/medicineController');
const { uploadBlog, uploadProfile } = require('../middlewares/upload');

router.get('/dashboard', patientController.getDashboard); // Patient dashboard
router.post('/signup', patientController.signup); // Patient signup
router.post('/login', patientController.login); // Patient login
router.get('/profile', patientController.getProfile); // Patient profile
router.get('/edit-profile', patientController.getEditProfile); // Edit profile form
router.post('/update-profile', uploadProfile.single('profilePhoto'), patientController.updateProfile); // Update profile (accept profilePhoto)
router.post('/profile-photo/upload', uploadProfile.single('profilePhoto'), patientController.uploadProfilePhoto);
router.post('/profile-photo/remove', patientController.removeProfilePhoto);
router.get('/form', patientController.getForm); // Get form
router.get('/book-appointment', patientController.getBookAppointment); // Book offline appointment
router.get('/book-doc-online', patientController.getBookDocOnline); // Book online appointment
router.get('/doctor-profile-patient/:id', patientController.getDoctorProfilePatient); // View doctor profile
router.get('/order-medicines', patientController.getOrderMedicines); // View medicines to order
router.post('/api/add-to-cart', patientController.postAddToCart); // Add medicine to cart
router.get('/api/doctors/online', patientController.getDoctorsOnline); // Get online doctors
router.get('/api/doctors/offline', patientController.getDoctorsOffline); // Get offline doctors
router.get('/api/doctors/all', patientController.getDoctorsAll); // Get all doctors
router.get('/api/medicines/search', patientController.getMedicinesSearch);
router.get('/medicines/:id', medicineController.getDetail); // NEW ROUTE FOR MEDICINE DETAIL
router.get('/api/patient/appointments/previous',patientController.getPreviousAppointments);
router.get('/api/patient/appointments/upcoming',patientController.getUpcomingAppointments); // Search medicines
router.get('/prescriptions', patientController.getPrescriptions);
router.get('/prescriptions/download/:id', patientController.downloadPrescription);
router.get('/profile-data', patientController.getProfileData);
router.get('/api/doctor/:id', patientController.getDoctorById); // Get single doctor by ID
module.exports = router;
