const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const Supplier = require('../models/Supplier');
const { uploadProfile, uploadMedicine } = require('../middlewares/upload');

router.get('/dashboard', supplierController.getDashboard);
router.get('/form', supplierController.getForm);
router.post('/signup', uploadProfile.single('profilePhoto'), supplierController.signup);
router.post('/login', supplierController.login);
router.get('/profile', supplierController.getProfile);
router.get('/edit-profile', supplierController.editProfile);
router.post('/update-profile', uploadProfile.single('profilePhoto'), supplierController.updateProfile);
router.get('/profile-data', supplierController.getProfileData);

// Medicines
router.post('/api/add-medicine', uploadMedicine.single('image'), supplierController.postAddMedicine);
router.get('/api/medicines', supplierController.getMedicines);
router.delete('/api/medicines/:id', supplierController.deleteMedicine);

// Orders (only routes with existing handlers)
router.get('/api/orders', supplierController.getOrders);
router.get('/api/orders/:orderId', supplierController.getOrderDetails);
router.put('/api/orders/:orderId/status', supplierController.updateOrderStatus);

router.get('/orders/:orderId', (req, res) => {
    res.render('supplier_order_details', { title: 'Order Details' });
});

// Profile routes
router.get('/profile/:id', async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id).lean();
        if (!supplier) return res.status(404).send('supplier not found');
        res.render('supplier_profile', { supplier });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'Internal server error' });
    }
});

module.exports = router;