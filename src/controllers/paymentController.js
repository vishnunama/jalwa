import connection from "../config/connectDB.js";
import axios from "axios";
import moment from "moment";
import querystring from "querystring";
import crypto from "crypto";

import { generateClaimRewardID, getBonuses } from "../helpers/games.js";
import {
  REWARD_STATUS_TYPES_MAP,
  REWARD_TYPES_MAP,
} from "../constants/reward_types.js";
import AppError from "../errors/AppError.js";
import upay from "../helpers/upay.js";
import Joi from "joi";

let timeNow = Date.now();

export const PaymentStatusMap = {
  PENDING: 0,
  SUCCESS: 1,
  CANCELLED: 2,
};

const PaymentMethodsMap = {
  UPI_GATEWAY: "upi_gateway",
  UPI_MANUAL: "upi_manual",
  USDT_MANUAL: "usdt_manual",
  WOW_PAY: "wow_pay",
  RS_PAY: "rs_pay",
  CLOUD_PAY: "cloud_pay",
  USDT: "usdt",
  UPAY: "upay",
};

function generateRandom12Digit() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

const demoUserAutoRecharge = async (req, res, amount) => {
  try {
    let auth = req.cookies.auth;
    let money = parseInt(amount);
    let utr = parseInt(generateRandom12Digit());

    console.table({ auth, money, utr });

    const [isUsedUtr] = await connection.query(
      "SELECT * FROM recharge WHERE utr = ? ",
      [utr],
    );
    if (isUsedUtr.length) {
      return res.status(400).json({
        message: `UPI Ref No. or UTR is already used`,
        status: false,
        timeStamp: timeNow,
      });
    }

    const user = await getUserDataByAuthToken(auth);

    const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({
      phone: user.phone,
      status: PaymentStatusMap.PENDING,
      type: PaymentMethodsMap.UPI_GATEWAY,
    });

    if (pendingRechargeList.length !== 0) {
      const deleteRechargeQueries = pendingRechargeList.map((recharge) => {
        return rechargeTable.cancelById(recharge.id);
      });

      await Promise.all(deleteRechargeQueries);
    }

    const orderId = getRechargeOrderId();

    console.log(user);

    if (user?.isDemo) {
      const newRecharge = {
        orderId: orderId,
        transactionId: "NULL",
        utr: utr,
        phone: user.phone,
        userId: user.id_user,
        money: money,
        type: PaymentMethodsMap.UPI_MANUAL,
        status: 1,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: "NULL",
        time: timeNow,
      };

      const recharge = await rechargeTable.create(newRecharge);

      await addUserAccountBalance({
        money: money,
        phone: user.phone,
        invite: user.invite,
        rechargeId: recharge.id,
      });

      // return res.redirect("/wallet/rechargerecord");

      return res.status(200).json({
        message: "Deposit successfully!",
        recharge: recharge,
        payment_url: "/wallet/rechargerecord",
        status: true,
        timeStamp: timeNow,
      });
    } else {
      const newRecharge = {
        orderId: orderId,
        transactionId: "NULL",
        utr: utr,
        userId: user.id_user,
        phone: user.phone,
        money: money,
        type: PaymentMethodsMap.UPI_MANUAL,
        status: 0,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: "NULL",
        time: Date.now(),
      };

      const recharge = await rechargeTable.create(newRecharge);

      return res.status(200).json({
        message:
          "Payment Requested successfully Your Balance will update shortly!",
        recharge: recharge,
        status: true,
        timeStamp: timeNow,
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: Date.now(),
    });
  }
};

// UPI Manual Payment Integration --------------
const initiateManualUPIPayment = async (req, res) => {
  const query = req.query;

  const [bank_recharge_momo] = await connection.query(
    "SELECT * FROM bank_recharge WHERE type = 'momo'",
  );

  let bank_recharge_momo_data;

  if (bank_recharge_momo.length) {
    bank_recharge_momo_data = bank_recharge_momo[0];
  }

  const momo = {
    bank_name: bank_recharge_momo_data?.name_bank || "",
    username: bank_recharge_momo_data?.name_user || "",
    upi_id: bank_recharge_momo_data?.stk || "",
    usdt_wallet_address: bank_recharge_momo_data?.qr_code_image || "",
    upi_id_qr: bank_recharge_momo_data?.upi_id_qr || "",
  };

  return res.render("wallet/manual_payment.ejs", {
    Amount: query?.am,
    UpiId: momo.upi_id,
    upi_id_qr: momo?.upi_id_qr || "",
  });
};

const addManualUPIPaymentRequest = async (req, res) => {
  try {
    const data = req.body;
    let auth = req.cookies.auth;
    let money = parseInt(data.money);
    let utr = parseInt(data.utr);
    const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY_INR);

    if (!money || !(money >= minimumMoneyAllowed)) {
      return res.status(400).json({
        message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
        status: false,
        timeStamp: timeNow,
      });
    }

    if (!utr && utr?.length != 12) {
      return res.status(400).json({
        message: `UPI Ref No. or UTR is Required And it should be 12 digit long`,
        status: false,
        timeStamp: timeNow,
      });
    }

    const [isUsedUtr] = await connection.query(
      "SELECT * FROM recharge WHERE utr = ? ",
      [utr],
    );
    if (isUsedUtr.length) {
      return res.status(400).json({
        message: `UPI Ref No. or UTR is already used`,
        status: false,
        timeStamp: timeNow,
      });
    }

    const user = await getUserDataByAuthToken(auth);

    const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({
      phone: user.phone,
      status: PaymentStatusMap.PENDING,
      type: PaymentMethodsMap.UPI_GATEWAY,
    });

    if (pendingRechargeList.length !== 0) {
      const deleteRechargeQueries = pendingRechargeList.map((recharge) => {
        return rechargeTable.cancelById(recharge.id);
      });

      await Promise.all(deleteRechargeQueries);
    }

    const orderId = getRechargeOrderId();

    console.log(user);

    if (user?.isDemo) {
      const newRecharge = {
        orderId: orderId,
        transactionId: "NULL",
        utr: utr,
        phone: user.phone,
        userId: user.id_user,
        money: money,
        type: PaymentMethodsMap.UPI_MANUAL,
        status: 1,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: "NULL",
        time: rechargeTable.getCurrentTimeForTimeField(),
      };

      const recharge = await rechargeTable.create(newRecharge);

      await addUserAccountBalance({
        money: money,
        phone: user.phone,
        invite: user.invite,
      });

      return res.status(200).json({
        message: "Deposit successfully!",
        recharge: recharge,
        status: true,
        timeStamp: timeNow,
      });
    } else {
      const newRecharge = {
        orderId: orderId,
        transactionId: "NULL",
        utr: utr,
        phone: user.phone,
        userId: user?.id_user,
        money: money,
        type: PaymentMethodsMap.UPI_MANUAL,
        status: 0,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: "NULL",
        time: rechargeTable.getCurrentTimeForTimeField(),
      };

      const recharge = await rechargeTable.create(newRecharge);

      return res.status(200).json({
        message:
          "Payment Requested successfully Your Balance will update shortly!",
        recharge: recharge,
        status: true,
        timeStamp: timeNow,
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};
// --------------------------------------------

// USDT Manual Payment Integration ------------
const initiateManualUSDTPayment = async (req, res) => {
  const query = req.query;

  const [bank_recharge_momo] = await connection.query(
    "SELECT * FROM bank_recharge WHERE type = 'momo'",
  );

  let bank_recharge_momo_data;
  if (bank_recharge_momo.length) {
    bank_recharge_momo_data = bank_recharge_momo[0];
  }

  const momo = {
    bank_name: bank_recharge_momo_data?.name_bank || "",
    username: bank_recharge_momo_data?.name_user || "",
    upi_id: bank_recharge_momo_data?.stk || "",
    usdt_wallet_address: bank_recharge_momo_data?.qr_code_image || "",
    usdt_wallet_address_qr:
      bank_recharge_momo_data?.usdt_wallet_address_qr || "",
  };

  return res.render("wallet/usdt_manual_payment.ejs", {
    Amount: query?.am,
    UsdtWalletAddress: momo.usdt_wallet_address,
    usdt_wallet_address_qr: momo.usdt_wallet_address_qr,
  });
};

const addManualUSDTPaymentRequest = async (req, res) => {
  try {
    const data = req.body;
    let auth = req.cookies.auth;
    let money_usdt = parseInt(data.money);
    let money = money_usdt * 92;
    let utr = parseInt(data.utr);
    const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY_USDT);

    if (!money || !(money >= minimumMoneyAllowed)) {
      return res.status(400).json({
        message: `Money is Required and it should be USDT ${minimumMoneyAllowed.toFixed(2)} or above!`,
        status: false,
        timeStamp: timeNow,
      });
    }

    if (!utr) {
      return res.status(400).json({
        message: `Ref No. or UTR is Required`,
        status: false,
        timeStamp: timeNow,
      });
    }

    const user = await getUserDataByAuthToken(auth);

    const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({
      phone: user.phone,
      status: PaymentStatusMap.PENDING,
      type: PaymentMethodsMap.UPI_GATEWAY,
    });

    if (pendingRechargeList.length !== 0) {
      const deleteRechargeQueries = pendingRechargeList.map((recharge) => {
        return rechargeTable.cancelById(recharge.id);
      });

      await Promise.all(deleteRechargeQueries);
    }

    const orderId = getRechargeOrderId();

    if (user?.isDemo) {
      const newRecharge = {
        orderId: orderId,
        transactionId: "NULL",
        utr: utr,
        phone: user.phone,
        userId: user.id_user,
        money: money,
        type: PaymentMethodsMap.USDT_MANUAL,
        status: 0,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: "NULL",
        time: rechargeTable.getCurrentTimeForTimeField(),
      };

      const recharge = await rechargeTable.create(newRecharge);

      return res.status(200).json({
        message:
          "Payment Requested successfully Your Balance will update shortly!",
        recharge: recharge,
        status: true,
        timeStamp: timeNow,
      });
    } else {
      const newRecharge = {
        orderId: orderId,
        transactionId: "NULL",
        utr: utr,
        phone: user.phone,
        userId: user.id_user,
        money: money,
        type: PaymentMethodsMap.USDT_MANUAL,
        status: 0,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: "NULL",
        time: Date.now() + process.hrtime()[1] // Adds nanoseconds for uniqueness
      };

      console.log(Date.now() + process.hrtime()[1] )

      const recharge = await rechargeTable.create(newRecharge);

      return res.status(200).json({
        message:
          "Payment Requested successfully Your Balance will update shortly!",
        recharge: recharge,
        status: true,
        timeStamp: timeNow,
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};
// --------------------------------------------

// UPI Gateway Payment Integration ------------
const initiateUPIPayment = async (req, res) => {
  const type = PaymentMethodsMap.UPI_GATEWAY;
  let auth = req.cookies.auth;
  let money = parseInt(req.body.money);

  const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY_INR);

  if (!money || !(money >= minimumMoneyAllowed)) {
    return res.status(400).json({
      message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
      status: false,
      timeStamp: timeNow,
    });
  }

  try {
    const user = await getUserDataByAuthToken(auth);

    const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({
      phone: user.phone,
      status: PaymentStatusMap.PENDING,
      type: PaymentMethodsMap.UPI_GATEWAY,
    });

    if (pendingRechargeList.length !== 0) {
      const deleteRechargeQueries = pendingRechargeList.map((recharge) => {
        return rechargeTable.cancelById(recharge.id);
      });

      await Promise.all(deleteRechargeQueries);
    }

    const orderId = getRechargeOrderId();

    const ekqrResponse = await axios.post(
      "https://api.ekqr.in/api/create_order",
      {
        key: process.env.UPI_GATEWAY_PAYMENT_KEY,
        client_txn_id: orderId,
        amount: String(money),
        p_info: process.env.PAYMENT_INFO,
        customer_name: user.username,
        customer_email: process.env.PAYMENT_EMAIL,
        customer_mobile: user.phone,
        redirect_url: `${process.env.APP_BASE_URL}/wallet/verify/upi`,
        udf1: process.env.APP_NAME,
      },
    );

    const ekqrData = ekqrResponse?.data;

    if (ekqrData === undefined || ekqrData.status === false) {
      throw Error("Payment Service: Gateway error from ekqr!");
    }

    const newRecharge = {
      orderId: orderId,
      transactionId: "NULL",
      utr: 0,
      phone: user.phone,
      userId: user.id_user,
      money: money,
      type: type,
      status: 0,
      today: rechargeTable.getCurrentTimeForTodayField(),
      url: ekqrData.data.payment_url,
      time: rechargeTable.getCurrentTimeForTimeField(),
    };

    const recharge = await rechargeTable.create(newRecharge);

    console.log(ekqrData);

    return res.status(200).json({
      message: "Payment Initiated successfully",
      recharge: recharge,
      urls: {
        web_url: ekqrData.data?.payment_url,
        bhim_link: ekqrData.data?.upi_intent?.bhim_link || "",
        phonepe_link: ekqrData.data?.upi_intent?.phonepe_link || "",
        paytm_link: ekqrData.data?.upi_intent?.paytm_link || "",
        gpay_link: ekqrData.data?.upi_intent?.gpay_link || "",
      },
      status: true,
      timeStamp: timeNow,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};

const verifyUPIPayment = async (req, res) => {
  const type = PaymentMethodsMap.UPI_GATEWAY;
  let auth = req.cookies.auth;
  let orderId = req.query.client_txn_id;

  if (!auth || !orderId) {
    return res.status(400).json({
      message: `orderId is Required!`,
      status: false,
      timeStamp: timeNow,
    });
  }
  try {
    const user = await getUserDataByAuthToken(auth);

    const recharge = await rechargeTable.getRechargeByOrderId({ orderId });

    if (!recharge) {
      return res.status(400).json({
        message: `Unable to find recharge with this order id!`,
        status: false,
        timeStamp: timeNow,
      });
    }

    const ekqrResponse = await axios.post(
      "https://api.ekqr.in/api/check_order_status",
      {
        key: process.env.UPI_GATEWAY_PAYMENT_KEY,
        client_txn_id: orderId,
        txn_date: rechargeTable.getDMYDateOfTodayFiled(recharge.today),
      },
    );

    const ekqrData = ekqrResponse?.data;

    if (ekqrData === undefined || ekqrData.status === false) {
      throw Error("Gateway error from ekqr!");
    }

    if (ekqrData.data.status === "created") {
      return res.status(200).json({
        message: "Your payment request is just created",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (ekqrData.data.status === "scanning") {
      return res.status(200).json({
        message: "Waiting for confirmation",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (ekqrData.data.status === "success") {
      if (
        recharge.status === PaymentStatusMap.PENDING ||
        recharge.status === PaymentStatusMap.CANCELLED
      ) {
        await rechargeTable.setStatusToSuccessByIdAndOrderId({
          id: recharge.id,
          orderId: recharge.orderId,
        });

        await addUserAccountBalance({
          phone: user.phone,
          money: recharge.money,
          code: user.code,
          invite: user.invite,
          rechargeId: recharge.id,
        });
      }

      // return res.status(200).json({
      //     status: true,
      //     message: "Payment verified",
      //     timestamp: timeNow
      // })
      return res.redirect("/wallet/rechargerecord");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};
// --------------------------------------------

function generateOrderNumber(phone) {
  let randomNumber =
    Math.floor(Math.random() * (9999999999 - 1000000000 + 1)) + 1000000000;
  return "LG" + "xx" + phone + "xx" + randomNumber;
}

//Lg pau / WOW PAY Payment Integration --------------- Deprecated
const initiateWowPayPayment = async (req, res) => {
  const type = PaymentMethodsMap.WOW_PAY;
  let auth = req.cookies.auth;
  let money = parseInt(req.query.money);

  const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY_INR);

  if (!money || !(money >= minimumMoneyAllowed)) {
    return res.status(400).json({
      message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
      status: false,
      timeStamp: timeNow,
    });
  }

  try {
    const user = await getUserDataByAuthToken(auth);

    const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({
      phone: user.phone,
      status: PaymentStatusMap.PENDING,
      type: PaymentMethodsMap.UPI_GATEWAY,
    });

    if (pendingRechargeList.length !== 0) {
      const deleteRechargeQueries = pendingRechargeList.map((recharge) => {
        return rechargeTable.cancelById(recharge.id);
      });

      await Promise.all(deleteRechargeQueries);
    }

    // const orderId = generateOrderNumber(user.phone);
    const orderId = getRechargeOrderId();
    const date = new Date();

    if (user?.isDemo) {
      return await demoUserAutoRecharge(req, res, money);
    }

    const params = {
      app_id: process.env.WOWPAY_MERCHANT_ID,
      order_sn: orderId,
      trade_type: "INRUPI",
      money: Number(money) * 100,
      notify_url: `${process.env.APP_BASE_URL}/wallet/verify/wowpay`,
      remark: user.phone,
    };

    params.sign = lgpay.generateSign(params, process.env.WOWPAY_MERCHANT_KEY);

    console.log(params);

    const response = await axios({
      method: "post",
      url: "https://www.lg-pay.com/api/order/create",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: querystring.stringify(params),
    });

    console.log(response.data);

    if (response.data.msg === "ok" && response.data.status == 1) {
      const newRechargeParams = {
        orderId: orderId,
        transactionId: orderId,
        utr: 0,
        phone: user.phone,
        userId: user.id_user,
        money: Number(money),
        type: type,
        status: PaymentStatusMap.PENDING,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: response.data.data.pay_url,
        time: rechargeTable.getCurrentTimeForTimeField(),
      };

      await rechargeTable.create(newRechargeParams);

      return res.status(200).json({
        message: "Payment requested Successfully",
        payment_url: response.data.data.pay_url,
        status: true,
        timeStamp: timeNow,
      });
    }

    return res.status(400).json({
      message: "Payment request failed. Please try again Or Wrong Details.",
      status: false,
      timeStamp: timeNow,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};

// const verifyWowPayPayment = async (req, res) => {
//   try {
//       const type = PaymentMethodsMap.WOW_PAY
//       const data = req.body;

//       console.log(data)

//       if (!data.status) {
//           return res.status(400).json({
//                           message: "Payment Failed",
//                           status: false,
//                           timeStamp: timeNow,
//                       })
//         }

//         // Extract values from query parameters
//      // Validate required fields
//       if (!data.order_sn || !data.money ) {
//           return res.status(400).json({
//               message: "Invalid request parameters",
//               status: false,
//               timeStamp: timeNow,
//           });
//       }

//       // Extract phone number from out_trade_no
//           let phone = null;
//           if (data.order_sn.includes('xx')) {
//               const parts = data.order_sn.split('xx');
//               if (parts.length >= 3) {
//                   // Extract the part that is supposed to be the phone number
//                   const potentialPhone = parts[1];
//                   // Ensure it's a 10-digit number
//                   if (/^\d{10}$/.test(potentialPhone)) {
//                       phone = potentialPhone;
//                   }
//               }
//           }

//           // Validate phone number
//           if (!phone) {
//               return res.status(400).json({
//                   message: "Invalid phone number",
//                   status: false,
//                   timeStamp: timeNow,
//               });
//           }

//       const newRechargeParams = {
//           orderId: data.order_sn,
//           transactionId: 'NULL',
//           utr: null,
//           phone: phone,
//           money: Number(data.money) / 100,
//           type: type,
//           status: PaymentStatusMap.SUCCESS,
//           today: rechargeTable.getCurrentTimeForTodayField(),
//           url: 'NULL',
//           time: timeNow,
//       }

//       const [recharge] = await connection.query('SELECT * FROM recharge WHERE id_order = ?', newRechargeParams.orderId);

//       if (recharge.length != 0) {
//           return res.redirect("/wallet/rechargerecord")
//           // return res.status(200).json({status: false, message: "Duplicate order request", data: recharge})
//       }

//       const newRecharge = await rechargeTable.create(newRechargeParams)

//       let [user] =  await connection.query('SELECT `phone`, `code`,`name_user`,`invite` FROM users WHERE `phone` = ? ', [phone]);

//       await addUserAccountBalance({
//           phone: user[0].phone,
//           money: Number(data.money) / 100,
//           code: user[0].code,
//           invite: user[0].invite,
//       })

//       // return res.status(200).json(newRecharge)

//       return res.redirect("/wallet/rechargerecord")
//   } catch (error) {
//       console.log(error)
//       console.log({
//           status: false,
//           message: "Something went wrong!",
//           timestamp: timeNow
//       })
//       return res.status(500).json({
//           status: false,
//           message: "Something went wrong!",
//           timestamp: timeNow
//       })
//   }
// }

// -------------------------------------------- Deprecated

// RS PAY Payment integration ---------------
const RS_PAY_PAYMENT_STATE = {
  SUCCESS: 1,
  PROCESSING: 2,
  FAILED: 3,
  PARTIALLY_SUCCESS: 4,
};

const verifyWowPayPayment = async (req, res) => {
  try {
    // const type = PaymentMethodsMap.RS_PAY;
    let data = req.body;

    // 0|rkwin  | data {
    //   0|rkwin  |   order_sn: '2025011062492219549011',
    //   0|rkwin  |   money: '30000',
    //   0|rkwin  |   pay_time: '2025-01-10 23:38:12',
    //   0|rkwin  |   status: '1',
    //   0|rkwin  |   msg: '手动回调, 请人工确认交易真实性',
    //   0|rkwin  |   remark: '7324821534',
    //   0|rkwin  |   sign: 'D860AF272D1ABD9F3E2D0E963F5F99FB'
    //   0|rkwin  | }

    console.log("data", data);
    const merchantId = process.env.WOWPAY_MERCHANT_ID;
    const merchantOrderId = data?.order_sn;
    const orderId = data?.order_sn;
    const state = data?.status;
    const amount = data?.money / 100;
    const factAmount = data?.money / 100;
    const sign = data?.sign;

    if (
      !merchantId ||
      !merchantOrderId ||
      !orderId ||
      !state ||
      !amount ||
      !factAmount ||
      !sign
    ) {
      return res.status(400).send("Invalid Request!");
    }

    // if (merchantId !== process.env.WOWPAY_MERCHANT_KEY) {
    //   return res.status(401).send("failed");
    // }

    const recharge = await rechargeTable.getRechargeByOrderId({
      orderId: merchantOrderId,
    });

    if (!recharge) {
      console.log({
        message: `Not able to find Requested Recharge for lgpay verification!`,
        timeStamp: timeNow,
      });
      return res.status(400).send("failed");
    }

    if (recharge?.status == 1) {
      console.log("recharge", recharge);
      console.log("Rechnage already done");
      return res.redirect("/wallet/rechargerecord");
    }

    if (parseInt(state) === RS_PAY_PAYMENT_STATE.SUCCESS) {
      const user = await getUserDataByPhoneNumber(recharge.phone);

      await rechargeTable.setStatusToSuccessByIdAndOrderId({
        id: recharge.id,
        orderId: recharge.orderId,
        utr: 0,
      });

      await addUserAccountBalance({
        phone: user.phone,
        money: recharge.money,
        code: user.code,
        invite: user.invite,
        rechargeId: recharge.id,
      });

      return res.redirect("/wallet/rechargerecord");
      // return res.status(200).send("success");
    } else if (parseInt(state) === RS_PAY_PAYMENT_STATE.PROCESSING) {
      return res.status(200).send("processing");
    } else if (parseInt(state) === RS_PAY_PAYMENT_STATE.FAILED) {
      await rechargeTable.cancelById(recharge.id);
      return res.status(200).send("failed");
    } else if (parseInt(state) === RS_PAY_PAYMENT_STATE.PARTIALLY_SUCCESS) {
      await rechargeTable.cancelById(recharge.id);
      return res.status(200).send("partially success");
    }

    return res.status(200).send("failed");
  } catch (error) {
    console.log(error);
    return res.status(500).send("failed");
  }
};

const initiateUpayPayment = async (req, res) => {
  try {
    const type = PaymentMethodsMap.UPAY;
    const schema = Joi.object({
      am: Joi.number().required(),
    });

    const API_URL = process.env.UPAY_API_URL;
    const APP_ID = process.env.UPAY_APP_ID;
    const APP_SECRET = process.env.UPAY_APP_SECRET;

    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let auth = req.cookies.auth;

    const user = await getUserDataByAuthToken(auth);

    let phone = user.phone;

    const amount = Number(req.query.am);

    let data = {
      appId: APP_ID,
      merchantOrderNo: getRechargeOrderId(),
      chainType: "1",
      fiatAmount: String(amount),
      fiatCurrency: "USD",
      notifyUrl: `${process.env.APP_BASE_URL}/wallet/verify/upay`,
    };

    console.log(data);

    const signature = upay.generateSignature(data, APP_SECRET);

    const response = await axios({
      url: `${API_URL}/v1/api/open/order/apply`,
      method: "POST",
      data: {
        ...data,
        attach: phone,
        productName: "Gaming",
        redirectUrl: `${process.env.APP_BASE_URL}/wallet/rechargerecord`,
        signature,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(response.data);
    const main = response.data.data;

    const newRechargeParams = {
      orderId: main.merchantOrderNo,
      transactionId: main.orderNo,
      utr: 0,
      phone: phone,
      money: amount * Number(process.env.USDT_INR_EXCHANGE_RATE),
      type: type,
      status: PaymentStatusMap.PENDING,
      today: rechargeTable.getCurrentTimeForTodayField(),
      url: "",
      time: rechargeTable.getCurrentTimeForTimeField(),
    };

    await rechargeTable.create(newRechargeParams);

    return res.status(200).redirect(response.data.data.payUrl);
  } catch (error) {
    console.log(error);
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

const verifyUpayPayment = async (req, res) => {
  try {
    const type = PaymentMethodsMap.UPAY;
    let data = req.body;

    const appId = data?.appId;
    const orderNo = data?.orderNo;
    const merchantOrderNo = data?.merchantOrderNo;
    const chainType = data?.chainType;
    const crypto = data?.crypto;
    const actualCrypto = data?.actualCrypto;
    const poundage = data?.poundage;
    const actualPoundage = data?.actualPoundage;
    const status = Number(data?.status);
    const createdAt = data?.createdAt;
    const completedAt = data?.completedAt;
    const attach = data?.attach;
    const signature = data?.signature;

    if (
      !appId ||
      !orderNo ||
      !merchantOrderNo ||
      !chainType ||
      !crypto ||
      !actualCrypto ||
      !poundage ||
      !actualPoundage ||
      !status ||
      !createdAt ||
      !completedAt ||
      !attach ||
      !signature
    ) {
      return res.status(400).send("Invalid Request!");
    }

    if (merchantId !== process.env.RSPAY_MERCHANT_ID) {
      return res.status(401).send("failed");
    }

    const recharge = await rechargeTable.getRechargeByOrderId({
      orderId: merchantOrderNo,
    });

    const user = await getUserDataByPhoneNumber(recharge.phone);

    if (!user) {
      console.log({
        message: `Unable to find this user for upay verification!`,
        timeStamp: timeNow,
      });
      return res.status(400).send("failed");
    }

    if (!recharge) {
      console.log({
        message: `Not able to find Requested Recharge for upay verification!`,
        timeStamp: timeNow,
      });
      return res.status(400).send("failed");
    }

    if (status === 0) {
      await rechargeTable.setRechargeStatusById({
        id: recharge.id,
        status: PaymentStatusMap.PENDING,
      });
      return res.status(200).send("processing");
    }

    if (status === 1) {
      await rechargeTable.setStatusToSuccessByIdAndOrderId({
        id: recharge.id,
        orderId: recharge.orderId,
      });

      await addUserAccountBalance({
        phone: user.phone,
        money: recharge.money,
        code: user.code,
        invite: user.invite,
        rechargeId: recharge.id,
      });

      return res.status(200).send("success");
    }

    if (status === 2) {
      await rechargeTable.setRechargeStatusById({
        id: recharge.id,
        status: PaymentStatusMap.CANCELLED,
      });

      return res.status(200).send("failed");
    }

    if (status === 3) {
      await rechargeTable.setRechargeStatusById({
        id: recharge.id,
        status: PaymentStatusMap.CANCELLED,
      });

      return res.status(200).send("failed");
    }

    return res.status(200).send("failed");
  } catch (error) {
    console.log(error);
    return res.status(500).send("failed");
  }
};

const initiateRspayPayment = async (req, res) => {
  const type = PaymentMethodsMap.RS_PAY;
  let auth = req.cookies.auth;

  let amount = parseInt(req.query.money);

  const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY_INR);

  if (!amount || !(amount >= minimumMoneyAllowed)) {
    return res.status(400).json({
      message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
      status: false,
      timeStamp: timeNow,
    });
  }

  try {
    const user = await getUserDataByAuthToken(auth);

    let phone = user.phone;

    let merchantId = process.env.RSPAY_MERCHANT_ID;
    let merchantKey = process.env.RSPAY_MERCHANT_KEY;

    const orderId = getRechargeOrderId();

    if (user?.isDemo) {
      return await demoUserAutoRecharge(req, res, amount);
    }

    let params = {
      amount: amount.toFixed(2),
      ext: "test",
      merchantId: merchantId,
      merchantOrderId: orderId,
      notifyUrl: `${process.env.APP_BASE_URL}/wallet/verify/rspay`,
      redirectUrl: `${process.env.APP_BASE_URL}/wallet/rechargerecord`,
      paymentCurrency: "INR",
      type: 2,
      userName: phone,
    };
    params["sign"] = rspay.generateSign(params, merchantKey);

    const response = await axios({
      method: "POST",
      url: "https://api.rs-pay.cc/apii/in/createOrder",
      data: params,
      headers: {
        "content-type": "application/json",
      },
    });

    if (parseInt(response.data.status) === 200) {
      const data = response.data.data;

      const newRechargeParams = {
        orderId: data.merchantOrderId,
        transactionId: data.orderId,
        utr: 0,
        phone: phone,
        money: data.amount,
        type: type,
        status: PaymentStatusMap.PENDING,
        today: rechargeTable.getCurrentTimeForTodayField(),
        url: data.payUrl,
        time: rechargeTable.getCurrentTimeForTimeField(),
      };

      await rechargeTable.create(newRechargeParams);

      return res.status(200).json({
        message: "Payment requested Successfully",
        payment_url: data.payUrl,
        status: true,
        timeStamp: timeNow,
      });
    }

    console.log(response.data);
    return res
      .status(400)
      .send("Something went wrong! Please try again later.");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};

const verifyRspayPayment = async (req, res) => {
  try {
    // const type = PaymentMethodsMap.RS_PAY;
    let data = req.body;

    const merchantId = data?.merchantId;
    const merchantOrderId = data?.merchantOrderId;
    const orderId = data?.orderId;
    const state = data?.state;
    const amount = data?.amount;
    const factAmount = data?.factAmount;
    const ext = data?.ext;
    const utr = data?.utr;
    const sign = data?.sign;

    if (
      !merchantId ||
      !merchantOrderId ||
      !orderId ||
      !state ||
      !amount ||
      !factAmount ||
      !ext ||
      !utr ||
      !sign
    ) {
      return res.status(400).send("Invalid Request!");
    }

    if (merchantId !== process.env.RSPAY_MERCHANT_ID) {
      return res.status(401).send("failed");
    }

    const recharge = await rechargeTable.getRechargeByOrderId({
      orderId: merchantOrderId,
    });

    if (!recharge) {
      console.log({
        message: `Not able to find Requested Recharge for rspay verification!`,
        timeStamp: timeNow,
      });
      return res.status(400).send("failed");
    }

    if (recharge?.status == 1) {
      console.log("recharge", recharge);
      console.log("Rechnage already done");
      return res.redirect("/wallet/rechargerecord");
    }

    if (parseInt(state) === RS_PAY_PAYMENT_STATE.SUCCESS) {
      const user = await getUserDataByPhoneNumber(recharge.phone);

      await rechargeTable.setStatusToSuccessByIdAndOrderId({
        id: recharge.id,
        orderId: recharge.orderId,
        utr: utr,
      });

      await addUserAccountBalance({
        phone: user.phone,
        money: recharge.money,
        code: user.code,
        invite: user.invite,
        rechargeId: recharge.id,
      });

      return res.status(200).send("success");
    } else if (parseInt(state) === RS_PAY_PAYMENT_STATE.PROCESSING) {
      return res.status(200).send("processing");
    } else if (parseInt(state) === RS_PAY_PAYMENT_STATE.FAILED) {
      await rechargeTable.cancelById(recharge.id);
      return res.status(200).send("failed");
    } else if (parseInt(state) === RS_PAY_PAYMENT_STATE.PARTIALLY_SUCCESS) {
      await rechargeTable.cancelById(recharge.id);
      return res.status(200).send("partially success");
    }

    return res.status(200).send("failed");
  } catch (error) {
    console.log(error);
    return res.status(500).send("failed");
  }
};

// Browse Recharge Record ---------------------
const browseRechargeRecord = async (req, res) => {
  try {
    let auth = req.cookies.auth;

    if (!auth) {
      return res.status(200).json({
        message: "Unauthorized",
        status: false,
        timeStamp: timeNow,
      });
    }

    const [recharge] = await connection.query(
      `SELECT * FROM recharge 
       WHERE status = 0 
       AND (type = '${PaymentMethodsMap.UPI_MANUAL}' OR type = '${PaymentMethodsMap.USDT_MANUAL}')
       ORDER BY id DESC`, // Sorting in descending order
      []
    );

    return res.status(200).json({
      message: "Success",
      status: true,
      list: recharge,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
      timeStamp: timeNow,
    });
  }
};

// --------------------------------------------

//out money rs pay-------------

const initiateWithdrawalRspayOutPayment = async (req, res) => {
  // let auth = req.cookies.auth;

  let amount = parseInt(req.body.money);

  try {
    // const user = await getUserDataByAuthToken(auth);

    let merchantId = process.env.RSPAY_MERCHANT_ID;
    let merchantKey = process.env.RSPAY_MERCHANT_KEY;

    const orderId = getRechargeOrderId();

    //   {
    //     "accountName": "ttp",
    //     "accountNumber": "10093679317",
    //     "amount": 100,
    //     "ext": "payment",
    //     "ifscCode": "IDFB0042761",
    //     "merchantId": "MerchantTest01",
    //     "merchantOrderId": "1669885901065",
    //     "notifyUrl": "http://192.168.1.1/payment/callback",
    //     "sign": "330089de5c172dee96e21def150b9209ee2ef611737e3e57bd91d633ce07e4b7",
    //     "type": 1
    // }

    let params = {
      accountName: req.body.accountName,
      accountNumber: req.body.accountNumber,
      amount: amount.toFixed(2),
      ext: "payment",
      ifscCode: req.body.ifscCode,
      merchantId: merchantId,
      merchantOrderId: orderId,
      notifyUrl: `${process.env.APP_BASE_URL}/`,
      redirectUrl: `${process.env.APP_BASE_URL}/`,
      type: 1,
      paymentCurrency: "INR",
    };
    params["sign"] = rspay.generateSign(params, merchantKey);

    console.log("params", params);

    const response = await axios({
      method: "POST",
      url: "https://api.rs-pay.cc/apii/out/createOrder",
      data: params,
      headers: {
        "content-type": "application/json",
      },
    });

    if (parseInt(response.data.status) === 200) {
      const data = response.data.data;
      console.log(data);
      return res.status(200).json({
        message: "Payment requested Successfully",
        data: data,
        status: true,
        timeStamp: timeNow,
      });
    }

    console.log(response.data);
    return res
      .status(400)
      .send("Something went wrong! Please try again later.");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};
const initiateRspayOutPayment = async (req, res) => {
  // let auth = req.cookies.auth;

  let amount = parseInt(req.body.money);

  try {
    // const user = await getUserDataByAuthToken(auth);

    let merchantId = process.env.RSPAY_MERCHANT_ID;
    let merchantKey = process.env.RSPAY_MERCHANT_KEY;

    const orderId = getRechargeOrderId();

    //   {
    //     "accountName": "ttp",
    //     "accountNumber": "10093679317",
    //     "amount": 100,
    //     "ext": "payment",
    //     "ifscCode": "IDFB0042761",
    //     "merchantId": "MerchantTest01",
    //     "merchantOrderId": "1669885901065",
    //     "notifyUrl": "http://192.168.1.1/payment/callback",
    //     "sign": "330089de5c172dee96e21def150b9209ee2ef611737e3e57bd91d633ce07e4b7",
    //     "type": 1
    // }

    let params = {
      accountName: req.body.accountName,
      accountNumber: req.body.accountNumber,
      amount: amount.toFixed(2),
      ext: "payment",
      ifscCode: req.body.ifscCode,
      merchantId: merchantId,
      merchantOrderId: orderId,
      notifyUrl: `${process.env.APP_BASE_URL}/`,
      redirectUrl: `${process.env.APP_BASE_URL}/`,
      type: 1,
      paymentCurrency: "INR",
    };
    params["sign"] = rspay.generateSign(params, merchantKey);

    console.log("params", params);

    const response = await axios({
      method: "POST",
      url: "https://api.rs-pay.cc/apii/out/createOrder",
      data: params,
      headers: {
        "content-type": "application/json",
      },
    });

    if (parseInt(response.data.status) === 200) {
      const data = response.data.data;
      console.log(data);
      return res.status(200).json({
        message: "Payment requested Successfully",
        data: data,
        status: true,
        timeStamp: timeNow,
      });
    }

    console.log(response.data);
    return res
      .status(400)
      .send("Something went wrong! Please try again later.");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong!",
      timestamp: timeNow,
    });
  }
};

// Set Recharge Status ------------------------
const setRechargeStatus = async (req, res) => {
  try {
    let auth = req.cookies.auth;
    let data = {
      id: parseInt(req.body.id),
      status: parseInt(req.body.status),
    };

    if (!auth) {
      return res.status(401).json({
        message: "Unauthorized",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (!data.id || !data.status) {
      return res.status(400).json({
        message: "Invalid Request",
        status: false,
        timeStamp: timeNow,
      });
    }

    const recharge = await rechargeTable.getRechargeById({ id: data.id });

    if (recharge === null) {
      return res.status(400).json({
        message: "Recharge not found!",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (
      recharge.status === PaymentStatusMap.SUCCESS &&
      data.status === PaymentStatusMap.SUCCESS
    ) {
      return res.status(400).json({
        message: "Recharge already verified!",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (
      recharge.status === PaymentStatusMap.CANCELLED &&
      data.status === PaymentStatusMap.CANCELLED
    ) {
      return res.status(400).json({
        message: "Recharge already cancelled!",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (
      [
        PaymentStatusMap.SUCCESS,
        PaymentStatusMap.CANCELLED,
        PaymentStatusMap.PENDING,
      ].includes(data.status) === false
    ) {
      console.log([
        PaymentStatusMap.SUCCESS,
        PaymentStatusMap.CANCELLED,
        PaymentStatusMap.PENDING,
      ]);
      console.log(data.status);
      return res.status(400).json({
        message: "Invalid Status!",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (data.status === PaymentStatusMap.SUCCESS) {
      const user = await getUserDataByPhoneNumber(recharge.phone);

      addUserAccountBalance({
        phone: user.phone,
        money: recharge.money,
        code: user.code,
        invite: user.invite,
        rechargeId: recharge.id,
      });

      await connection.query("UPDATE recharge SET status = 1 WHERE id = ?", [
        data.id,
      ]);

      return res.status(200).json({
        message: "Recharge verified successfully!",
        status: true,
        timeStamp: timeNow,
      });
    } else if (data.status === PaymentStatusMap.CANCELLED) {
      await rechargeTable.setRechargeStatusById({
        id: data.id,
        status: PaymentStatusMap.CANCELLED,
      });
      return res.status(200).json({
        message: "Recharge cancelled successfully!",
        status: true,
        timeStamp: timeNow,
      });
    }

    await rechargeTable.setRechargeStatusById({
      id: data.id,
      status: PaymentStatusMap.PENDING,
    });
    return res.status(200).json({
      message: "Recharge set to waiting successfully!",
      status: true,
      timeStamp: timeNow,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
      timeStamp: timeNow,
    });
  }
};

// helpers ---------------
const getUserDataByAuthToken = async (authToken) => {
  let [users] = await connection.query(
    "SELECT `id_user`, `isDemo`, `phone`, `code`,`name_user`,`invite` FROM users WHERE `token` = ? ",
    [authToken],
  );
  const user = users?.[0];

  if (user === undefined || user === null) {
    throw Error("Unable to get user data!");
  }

  return {
    phone: user.phone,
    code: user.code,
    username: user.name_user,
    invite: user.invite,
    isDemo: user.isDemo,
    id_user: user.id_user,
  };
};

const getUserDataByPhoneNumber = async (phoneNumber) => {
  let [users] = await connection.query(
    "SELECT `phone`, `code`,`name_user`,`invite` FROM users WHERE `phone` = ? ",
    [phoneNumber],
  );
  const user = users?.[0];

  if (user === undefined || user === null) {
    throw Error("Unable to get user data!");
  }

  return {
    phone: user.phone,
    code: user.code,
    username: user.name_user,
    invite: user.invite,
  };
};

const getUserByInviteCode = async (invite) => {
  const [inviter] = await connection.query(
    "SELECT phone FROM users WHERE `code` = ?",
    [invite],
  );
  return inviter?.[0] || null;
};

const addUserMoney = async (phone, money) => {
  // update user money
  await connection.query(
    "UPDATE users SET money = money + ?, total_money = total_money + ? WHERE `phone` = ?",
    [money, money, phone],
  );
};

const addUserAccountBalance = async ({ money, phone, invite, rechargeId }) => {
  try {
    const totalRecharge = await rechargeTable.totalRechargeCount(
      PaymentStatusMap.SUCCESS,
      phone,
    );

    //Calculate recharge bonus
    // const bonus = totalRecharge === 1 ? getBonuses(money) : { selfBonus: (money / 100) * 5, uplineBonus: money >= 50000 ? (money / 100) * 5 : (money / 100) * 0 };

    // const user_money = money + bonus.selfBonus;
    // const inviter_money = bonus.uplineBonus;

    // let bonus = (money / 100) * 5;
    let bonus = 0;

    // if (totalRecharge === 0) {
    //   // Apply bonus based on the `money` range
    //   if (money >= 300 && money <= 999) {
    //     bonus += 28;
    //   } else if (money >= 1000 && money <= 1999) {
    //     bonus += 108;
    //   } else if (money >= 2000 && money <= 9999) {
    //     bonus += 488;
    //   } else if (money >= 10000 && money <= 11999) {
    //     bonus += 1388;
    //   } else if (money >= 12000 && money <= 23999) {
    //     bonus += 8888;
    //   }
    // }

    const user_money = money + bonus;

    const firstRechargeBonus =
      totalRecharge === 0 ? getBonuses(money).uplineBonus : 0;
    const dailyRechargeBonus = money >= 50000 ? bonus : 0;
    const totalInviterMoney = firstRechargeBonus + dailyRechargeBonus;

    await addUserMoney(phone, user_money);

    console.log(phone, money, rechargeId, totalRecharge);
    await rechargeTable.updateRemainingBet(
      phone,
      money,
      rechargeId,
      totalRecharge,
    );

    const rewardType =
      totalRecharge === 0
        ? REWARD_TYPES_MAP.FIRST_RECHARGE_BONUS
        : REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS;
    await addUserRewards(phone, bonus, rewardType);

    //update the inviter bonus

    const inviter = await getUserByInviteCode(invite);

    if (inviter) {
      if (firstRechargeBonus !== 0) {
        await addUserRewards(
          inviter.phone,
          firstRechargeBonus,
          REWARD_TYPES_MAP.FIRST_RECHARGE_AGENT_BONUS,
        );
      }

      if (dailyRechargeBonus !== 0) {
        await addUserRewards(
          inviter.phone,
          dailyRechargeBonus,
          REWARD_TYPES_MAP.DAILY_RECHARGE_AGENT_BONUS,
        );
      }

      if (totalInviterMoney !== 0) {
        await addUserMoney(inviter.phone, totalInviterMoney);
      }
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
};

const getRechargeOrderId = () => {
  const date = new Date();
  let id_time =
    date.getUTCFullYear() +
    "" +
    date.getUTCMonth() +
    1 +
    "" +
    date.getUTCDate();
  let id_order =
    Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) +
    10000000000000;

  return id_time + id_order;
};

const addUserRewards = async (phone, bonus, rewardType) => {
  const reward_id = generateClaimRewardID();
  let timeNow = Date.now();

  await connection.query(
    "INSERT INTO claimed_rewards (reward_id,phone, amount, type, time, status) VALUES (?,?,?,?,?,?)",
    [
      reward_id,
      phone,
      bonus,
      rewardType,
      timeNow,
      REWARD_STATUS_TYPES_MAP.SUCCESS,
    ],
  );
};

const rechargeTable = {
  getRecordByPhoneAndStatus: async ({ phone, status, type }) => {
    if (
      ![
        PaymentStatusMap.SUCCESS,
        PaymentStatusMap.CANCELLED,
        PaymentStatusMap.PENDING,
      ].includes(status)
    ) {
      throw Error("Invalid Payment Status!");
    }

    let recharge;

    if (type) {
      [recharge] = await connection.query(
        "SELECT * FROM recharge WHERE phone = ? AND status = ? AND type = ?",
        [phone, status, type],
      );
    } else {
      [recharge] = await connection.query(
        "SELECT * FROM recharge WHERE phone = ? AND status = ?",
        [phone, status],
      );
    }

    return recharge.map((item) => ({
      id: item.id,
      orderId: item.id_order,
      transactionId: item.transaction_id,
      utr: item.utr,
      phone: item.phone,
      money: item.money,
      type: item.type,
      status: item.status,
      today: item.today,
      url: item.url,
      time: item.time,
    }));
  },
  getRechargeByOrderId: async ({ orderId }) => {
    const [recharge] = await connection.query(
      "SELECT * FROM recharge WHERE id_order = ?",
      [orderId],
    );

    if (recharge.length === 0) {
      return null;
    }

    return recharge.map((item) => ({
      id: item.id,
      orderId: item.id_order,
      transactionId: item.transaction_id,
      utr: item.utr,
      phone: item.phone,
      money: item.money,
      type: item.type,
      status: item.status,
      today: item.today,
      url: item.url,
      time: item.time,
    }))?.[0];
  },
  getRechargeById: async ({ id }) => {
    const [recharge] = await connection.query(
      "SELECT * FROM recharge WHERE id = ? LIMIT 1",
      [id],
    );

    if (recharge.length === 0) {
      return null;
    }

    return recharge.map((item) => ({
      id: item.id,
      orderId: item.id_order,
      transactionId: item.transaction_id,
      utr: item.utr,
      phone: item.phone,
      money: item.money,
      type: item.type,
      status: item.status,
      today: item.today,
      url: item.url,
      time: item.time,
    }))?.[0];
  },
  totalRechargeCount: async (status, phone) => {
    const [totalRechargeRow] = await connection.query(
      "SELECT COUNT(*) as count FROM recharge WHERE phone = ? AND status = ?",
      [phone, status],
    );
    const totalRecharge = totalRechargeRow[0].count || 0;
    return totalRecharge;
  },
  updateRemainingBet: async (phone, money, rechargeId, totalRecharge) => {
    const [previousRecharge] = await connection.query(
      `SELECT remaining_bet FROM recharge WHERE phone = ? AND status = 1 ORDER BY time DESC LIMIT 2`,
      [phone],
    );

    console.log(previousRecharge[1])

    const previousRemainingBet = previousRecharge[1]?.remaining_bet || 0;

    const totalRemainingBet =
      totalRecharge === 0 ? money : previousRemainingBet + money;

    await connection.query(
      "UPDATE recharge SET remaining_bet = ? WHERE id = ?",
      [totalRemainingBet, rechargeId],
    );
  },
  cancelById: async (id) => {
    if (typeof id !== "number") {
      throw Error("Invalid Recharge 'id' expected a number!");
    }

    await connection.query("UPDATE recharge SET status = 2 WHERE id = ?", [id]);
  },
  setRechargeStatusById: async ({ id, status }) => {
    if (typeof id !== "number") {
      throw Error("Invalid Recharge 'id' expected a number!");
    }

    if (
      ![
        PaymentStatusMap.SUCCESS,
        PaymentStatusMap.CANCELLED,
        PaymentStatusMap.PENDING,
      ].includes(status)
    ) {
      throw Error("Invalid Payment Status!");
    }

    await connection.query("UPDATE recharge SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
  },
  setStatusToSuccessByIdAndOrderId: async ({ id, orderId, utr }) => {
    if (typeof id !== "number") {
      throw Error("Invalid Recharge 'id' expected a number!");
    }

    if (utr) {
      await connection.query(
        "UPDATE recharge SET status = 1, utr = ? WHERE id = ? AND id_order = ?",
        [utr, id, orderId],
      );
    } else {
      await connection.query(
        "UPDATE recharge SET status = 1 WHERE id = ? AND id_order = ?",
        [id, orderId],
      );
    }
  },
  getCurrentTimeForTimeField: () => {
    return moment().valueOf();
  },
  getCurrentTimeForTodayField: () => {
    return moment().format("YYYY-MM-DD h:mm:ss A");
  },
  getDMYDateOfTodayFiled: (today) => {
    return moment(today, "YYYY-MM-DD h:mm:ss A").format("DD-MM-YYYY");
  },
  create: async (newRecharge) => {
    if (newRecharge.url === undefined || newRecharge.url === null) {
      newRecharge.url = "0";
    }

    await connection.query(
      `INSERT INTO recharge SET id_order = ?, transaction_id = ?, phone = ?, money = ?, userId = ?, type = ?, status = ?, today = ?, url = ?, time = ?, utr = ?`,
      [
        newRecharge.orderId,
        newRecharge.transactionId,
        newRecharge.phone,
        newRecharge.money,
        newRecharge.userId,
        newRecharge.type,
        newRecharge.status,
        newRecharge.today,
        newRecharge.url,
        newRecharge.time,
        newRecharge?.utr,
      ],
    );

    const [recharge] = await connection.query(
      "SELECT * FROM recharge WHERE id_order = ?",
      [newRecharge.orderId],
    );

    if (recharge.length === 0) {
      throw Error("Unable to create recharge!");
    }

    return recharge[0];
  },
};

const lgpay = {
  generateSign: (params, key) => {
    const sortedKeys = Object.keys(params).sort();

    let stringA = "";
    sortedKeys.forEach((k) => {
      if (params[k] !== null && params[k] !== "") {
        stringA += `${k}=${params[k]}&`;
      }
    });

    stringA = stringA.slice(0, -1);
    stringA += `&key=${key}`;

    return crypto.createHash("md5").update(stringA).digest("hex").toUpperCase(); // Ensure MD5 and uppercase
  },
};

const rspay = {
  generateSign: (params, key) => {
    const sortedKeys = Object.keys(params).sort();

    let stringA = "";
    sortedKeys.forEach((k) => {
      if (params[k] !== null && params[k] !== "") {
        stringA += `${k}=${params[k]}&`;
      }
    });

    stringA = stringA.slice(0, -1);

    stringA += `&key=${key}`;

    return crypto.createHash("sha256").update(stringA).digest("hex");
  },
};

const cloudPay = {
  generateSign: (params, key) => {
    // Step 1: Sort the parameters by key
    const sortedKeys = Object.keys(params).sort();

    // Step 2: Concatenate parameters in "key=value&" format
    let stringA = "";
    sortedKeys.forEach((k) => {
      // Skip the 'sign' key and include only non-empty values
      if (k !== "sign" && params[k] !== null && params[k] !== "") {
        stringA += `${k}=${params[k]}&`;
      }
    });

    // Step 3: Remove the last '&' (trailing character)
    stringA = stringA.slice(0, -1);

    // Step 4: Add the merchant key at the end of the string
    stringA += `&key=${key}`;

    // Step 5: Generate the SHA256 hash and return the result in uppercase
    return crypto
      .createHash("sha256")
      .update(stringA)
      .digest("hex")
      .toUpperCase();
  },
};

const paymentController = {
  initiateUPIPayment,
  verifyUPIPayment,
  initiateWowPayPayment,
  verifyWowPayPayment,
  initiateManualUPIPayment,
  addManualUPIPaymentRequest,
  addManualUSDTPaymentRequest,
  initiateManualUSDTPayment,
  initiateRspayPayment,
  verifyRspayPayment,
  browseRechargeRecord,
  setRechargeStatus,
  initiateUpayPayment,
  verifyUpayPayment,
  initiateRspayOutPayment,
  initiateWithdrawalRspayOutPayment
};

export default paymentController;
