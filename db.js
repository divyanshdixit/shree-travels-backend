const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DB_URL).then((conn) => {
    console.log('Connected Successfully...')
}).catch(err => {
    console.log('Error in connection', err.message)
})