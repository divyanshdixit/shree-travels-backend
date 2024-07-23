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
            redirectUrl: `http://localhost:8000/status/?id=${merchantTrxnId}`,
            redirectMode: 'POST',
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
        // const response = await fetch(prod_URL, {
        //     method: 'POST',
        //     headers: {
        //         accept: 'application/json',
        //         'Content-Type': 'application/json',
        //         'X-VERIFY': checksum
        //     },
        //     body: payloadMain
        // });
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
        console.log(err);
        res.status(500).json({message: 'Something went wrong', error:err.message, succes: false})
    }
})

// check for payment status and redirect accordingly:
app.post("/status", async (req, res) => {
    console.log('status')
    const merchantTransactionId = req.query.id
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
    const checksum = getPayString(string);
    console.log('checksum', checksum);

    // CHECK PAYMENT TATUS

    // const response = await fetch(`https://api-preprod.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`, {
    //     method: 'GET',
    //     headers: {
    //         accept: 'application/json',
    //         'Content-Type': 'application/json',
    //         'X-VERIFY': checksum,
    //         'X-MERCHANT-ID': `${merchantId}`
    //     },
    // });
    // const result = await response.json();
    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };
    const result = await axios.request(options);
    console.log('result', result)
    if (result.data.success === true) {
        return res.status(200).json({message: 'Payment is successful!', result:result.data})

        const url = `http://localhost:3000/success`
        return res.redirect(result, url)
    } else {
        const url = `http://localhost:3000/failure`
        // return res.status(400).json({message: 'Payment is declined!', result:result.data})
        return res.redirect(result, url)
    }

})

// run server
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})