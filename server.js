const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const getPayString = require("./utils/payString");
const ContactRoutes = require("./routes/contact");
require("./db");

require("dotenv").config();

const app = express();
const port = process.env.PORT;
const merchantId = process.env.MERCHANT_ID;
const saltKey = process.env.SALT_KEY;

// use middleware:
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cors());

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// routing enabled api :

app.use("/api", ContactRoutes);

// payment api:

app.post("/payment", async (req, res) => {
  try {
    const {
      name,
      email,
      amount,
      remarks,
      currency,
      merchantUserId,
      merchantTrxnId,
    } = req.body;
    const data = {
      merchantId,
      merchantTransactionId: merchantTrxnId,
      merchantUserId,
      name,
      amount,
      email,
      currency,
      remarks,
      redirectUrl: `https://shree-travels-backend.onrender.com/status/${merchantTrxnId}?name=${name}&email=${email}&currency=${currency}&remarks=${remarks}`,
      // redirectUrl: `http://localhost:8000/status/${merchantTrxnId}?name=${name}&email=${email}&currency=${currency}&remarks=${remarks}`,
      redirectMode: "REDIRECT",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const string = payloadMain + "/pg/v1/pay" + saltKey;
    const checksum = getPayString(string);
    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
    // const prod_URL = "https://api-preprod.phonepe.com/apis/hermes/pg/v1/pay";

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };
    let response = await axios.request(options);
    res.status(200).json({ result: response.data });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
      code: err.code,
      succes: false,
    });
  }
});

// check for payment status and redirect accordingly:
app.get("/status/:id", async (req, res) => {
  const searchParams = req.query;
  const {name, email, currency, remarks} = searchParams;
  const merchantTransactionId = req.params.id;
  const string =
    `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
  const checksum = getPayString(string);

  // CHECK PAYMENT STATUS
  const options = {
    method: "GET",
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": `${merchantId}`,
    },
  };
  const result = await axios.request(options);

  let successDataString = "";
  let failDataString = "";

  if (result.data.data.paymentInstrument === null) {
    failDataString = `&amount=${
      result.data.data.amount / 100
    } ${currency}&merchantTransactionId=${
      result.data.data.merchantTransactionId
    }&transactionId=${result.data.data.transactionId}&responseCode=${
      result.data.data.state
    }&email=${email}&name=${name}&remarks=${remarks}&redirect=true`;
  } else {
    successDataString = `&amount=${
      result.data.data.amount / 100
    } ${currency}&merchantTransactionId=${
      result.data.data.merchantTransactionId
    }&transactionId=${result.data.data.transactionId}&type=${
      result.data.data.paymentInstrument.type
    }&responseCode=${result.data.data.responseCode}&email=${email}&name=${name}&remarks=${remarks}&redirect=true`;
  }

  if (result.data.success === true) {
    const url = `https://shreetravels.netlify.app/success?${successDataString}`;
    // const url = `http://localhost:3000/success?${successDataString}`;
    return res.redirect(url);
  } else {
    const url = `https://shreetravels.netlify.app/failure?${failDataString}`;
    // const url = `http://localhost:3000/failure?${failDataString}`;
    return res.redirect(url);
  }
});

// run server
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
