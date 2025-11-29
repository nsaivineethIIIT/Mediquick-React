const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storageChat = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/uploads/chat');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploadChat = multer({ storage: storageChat });

router.post('/send', chatController.postSend);
router.post('/send-file', uploadChat.single('file'), chatController.postSendFile);
router.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../public/uploads/chat', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});
router.get('/:appointmentId', chatController.getChat);

module.exports = router;