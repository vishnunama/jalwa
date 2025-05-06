import connection from "../config/connectDB.js";
import jwt from 'jsonwebtoken';
import md5 from "md5";
import axios from 'axios';
import CryptoJS from 'crypto-js';

const SECRET_KEY = "8979d78b437948f18c14628ff1ad5f41";  // Replace with your actual Agent Key
const Domain_Name = "https://api.watchglbpay.com";  // Replace with the correct domain name

// Generate the MD5 signature as per instructions
const generateSignature = (params) => {
    // Filter out empty values, sign, and sign_type
    const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([key, value]) => value && key !== "sign" && key !== "sign_type")
    );

    // Sort parameters by ASCII order
    const sortedParams = Object.keys(filteredParams)
        .sort()
        .map(key => `${key}=${filteredParams[key]}`)
        .join('&');

    // Append the private key
    const stringToSign = `${sortedParams}&key=${SECRET_KEY}`;

    // Generate the MD5 hash and convert it to lowercase
    return md5(stringToSign).toLowerCase();
};

  const generateUniqueTransferId = () => {
    const date = new Date().toISOString().replace(/[-T:.Z]/g, "");  // Get a unique date-based string
    const random = Math.floor(Math.random() * 10000);  // Add a random number to ensure uniqueness
    return `${date}${random}`;
};

const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const watchpay_createOrder = async (req, res) => {
    const uniqueTransferId = generateUniqueTransferId();
    const params = {
        version: "1.0",
        mch_id: "222887002",
        notify_url: "https://rupeeclub.in/wallet/verify/wowpay",
        page_url: "https://rupeeclub.in",
        mch_order_no: uniqueTransferId, 
        pay_type: req.body.pay_type,
        trade_amount: req.body.trade_amount,
        order_date: getCurrentDateTime(),  //
        goods_name: req.body.goods_name,
        mch_return_msg: "test",
        sign_type: "MD5"
    };
    // Generate the sign using the generateSignature function
    params.sign = generateSignature(params);

    
    const body = new URLSearchParams(params).toString();
    console.log(body,"body")

    try {
        const response = await axios.post(`${Domain_Name}/pay/web`, body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
   
        console.log("Response Data:", response.data);  // Log the full response
   
        if (response.data.respCode === "SUCCESS") {
            const responseData = response.data;
            return res.status(200).json({status: true, msg: responseData.respCode, data: responseData});
        } else {
            console.log("Payment request failed", response.data); // Log failed response
            return res.status(400).json({ error: 'Payment request failed', details: response.data });
        }
    } catch (error) {
        console.error('Error while processing payment request:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
};



const watchpayController = {
    watchpay_createOrder,
  };

  export default watchpayController;

