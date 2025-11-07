const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
// At the top of patientRoutes.js, add:
// const Patient = require('../models/Patient');
const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const patientController = require('../controllers/patientController');
const medicineController = require('../controllers/medicineController');
const cartController = require('../controllers/cartController');
const checkoutController = require('../controllers/checkoutController');
const { uploadBlog, uploadProfile } = require('../middlewares/upload');

router.get('/dashboard', patientController.getDashboard); // Patient dashboard
router.post('/signup', patientController.signup); // Patient signup
router.post('/login', patientController.login); // Patient login
router.get('/profile', patientController.getProfile); // Patient profile
router.get('/edit-profile', patientController.getEditProfile); // Edit profile form
router.post('/update-profile', uploadProfile.single('profilePhoto'), patientController.updateProfile); // Update profile (accept profilePhoto)
// Quick profile photo-only endpoints
router.post('/profile-photo/upload', uploadProfile.single('profilePhoto'), patientController.uploadProfilePhoto);
router.post('/profile-photo/remove', patientController.removeProfilePhoto);
router.get('/form', patientController.getForm); // Get form
router.get('/book-appointment', patientController.getBookAppointment); // Book offline appointment
router.get('/book-doc-online', patientController.getBookDocOnline); // Book online appointment
router.get('/doctor-profile-patient/:id', patientController.getDoctorProfilePatient); // View doctor profile
router.get('/order-medicines', medicineController.getAllMedicines); // View medicines to order
// NOTE: Removed mapping to patientController.postAddToCart: the real add-to-cart
// logic is implemented in cartController.addToCart (registered below). The
// previous handler returned a success message without persisting to the cart.
router.get('/api/doctors/online', patientController.getDoctorsOnline); // Get online doctors
router.get('/api/doctors/offline', patientController.getDoctorsOffline); // Get offline doctors
router.get('/api/doctors/all', patientController.getDoctorsAll); // Get all doctors 
router.get('/api/doctor/:id', patientController.getDoctorAPI); // Get single doctor as JSON
router.get('/api/medicines/:id', medicineController.getDetail); // Get medicine details
router.get('/api/medicines/search', patientController.getMedicinesSearch);
router.get('/medicines/:id', medicineController.getDetail); // NEW ROUTE FOR MEDICINE DETAIL
// Orders routes
router.get('/orders', (req, res) => res.render('patient_orders')); // New orders page
router.get('/orders/:id', patientController.getOrderDetails); // Order details page
// Patient API routes
router.get('/api/orders/:id', patientController.getOrderDetailsAPI); // NEW: Get specific order details as JSON
router.get('/api/orders', patientController.getOrders);
router.get('/api/patient/appointments/previous',patientController.getPreviousAppointments);
router.get('/api/patient/appointments/upcoming',patientController.getUpcomingAppointments); // Search medicines
router.get('/prescriptions', patientController.getPrescriptions);
router.get('/prescriptions/download/:id', patientController.downloadPrescription);
router.get('/profile-data', patientController.getProfileData);
// Cart
router.post('/api/add-to-cart', cartController.addToCart);
router.get('/cart', cartController.getCart);
router.post('/api/cart/update', cartController.updateItem);
router.delete('/api/cart/item/:medicineId', cartController.removeItem);
// Add this route with your other cart routes
router.get('/api/cart/count', cartController.getCartCount);

// Checkout
router.get('/checkout', checkoutController.getCheckout);
router.post('/checkout', checkoutController.postCheckout);

router.get('/api/checkout-data', checkoutController.getCheckoutData);
router.get('/api/session-order-details', checkoutController.getSessionOrderDetails);

router.get('/order-details', checkoutController.getOrderDetails);
router.get('/payment', checkoutController.getPaymentPage);
router.post('/process-payment', checkoutController.processPayment);
router.get('/order-success', checkoutController.getOrderSuccess);

module.exports = router;
