const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.']
    },
    contact: {
        type: Number,
        required: [true, 'Contact is required.']
    },
    query: {
        type: String
    }
});

const ContactModel = mongoose.model('contact', ContactSchema);
module.exports = ContactModel;