const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/api/create', orderController.create);

module.exports = router;