const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

// The route should be simple and handled by the parent router
// This route now correctly handles requests to /patient/medicines/:id
router.get('/:id', medicineController.getDetail);
router.get('/search', medicineController.getMedicinesSearch);
module.exports = router;
