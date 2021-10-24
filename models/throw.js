const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    handshake: Schema.Types.Mixed,
});

module.exports = mongoose.model('throws', userSchema);
