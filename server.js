const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const getPayString = require('./utils/payString');

require('dotenv').config();

const app = express();
const port = process.env.PORT;
const merchantId = process.env.MERCHANT_ID;
const saltKey = process.env.SALT_KEY;

// use middleware:
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: false
}));

// payment api:

app.post('/payment', async(req, res) => {
    try{
        const {name, email, address, amount, mobile, merchantUserId, merchantTrxnId} = req.body;
        const data = {
            merchantId,
            merchantTransactionId: merchantTrxnId,
            merchantUserId,
            name,
            amount,
            email,
            redirectUrl: `https://shreetravels.netlify.app/response?id=${merchantTrxnId}`,
            // redirectUrl: `http://localhost:3000/response?id=${merchantTrxnId}`,
            redirectMode: 'REDIRECT',
            mobileNumber: mobile,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        }
        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const string = payloadMain + '/pg/v1/pay' + saltKey;
        const checksum = getPayString(string);
        const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
        // const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"
       
        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
            },
            data: {
            request: payloadMain
            }
            };
            let response = await axios.request(options);
        res.status(200).json({result: response.data})
    }catch(err){
        res.status(500).json({message: 'Something went wrong', error:err.message, succes: false})
    }
})

// check for payment status and redirect accordingly:
app.get("/status/:id", async (req, res) => {
    // try{
    console.log('status')
    const merchantTransactionId = req.params.id
    console.log('merchantTransactionId', merchantTransactionId, saltKey);
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
    const checksum = getPayString(string);
    console.log('checksum', checksum);

    // CHECK PAYMENT STATUS
    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        // url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };
    const result = await axios.request(options);
    console.log('resultssssss', result.success, result.code, result.message)
    // if (result.data.success === true) {
    //     // return res.status(200).json({message: 'Payment is successful!', result:result.data})

    //     // const url = `https://shreetravels.netlify.app/success`
    //     const url = `http://localhost:3000/success`
    //     return res.redirect(url)
    // } else {
    //     // const url = `https://shreetravels.netlify.app/failure`
    //     const url = `http://localhost:3000/failure`
    //     // return res.status(400).json({message: 'Payment is declined!', result:result.data})
    //     return res.redirect(url)
    // }
// }catch(err){
//     const url = `http://localhost:3000/failure`
//     // const url = `https://shreetravels.netlify.app/failure`
//     return res.redirect(url)

// }

})

// run server
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})