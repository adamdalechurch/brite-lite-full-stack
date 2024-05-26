const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    pegs: [
        {
            uuid: String,
            position: {
                x: Number,
                y: Number,
                z: Number,
            },
            color: String,
        }
    ]
});

const State = mongoose.model('State', stateSchema);

module.exports = State;