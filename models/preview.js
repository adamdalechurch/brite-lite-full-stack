const mongoose = require('mongoose');

const previewSchema = new mongoose.Schema({
    base64Image: String,
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State'
    }
});

module.exports = mongoose.model('Preview', previewSchema);
