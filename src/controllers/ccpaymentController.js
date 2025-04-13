import connection from "../config/connectDB.js";
import axios from "axios";
import moment from "moment";
import crypto from "crypto";
import {
  REWARD_STATUS_TYPES_MAP,
  REWARD_TYPES_MAP,
} from "../constants/reward_types.js";
import AppError from "../errors/AppError.js";
import { generateClaimRewardID, getBonuses } from "../helpers/games.js";


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
  USDT: "usdt",
  UPAY: "upay",
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
  getRecordByPhoneAndStatus: async ({ phone, status, type,remark }) => {
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
    if (!status || !phone)
      throw new AppError("Invalid Status or Phone", 400);

    const [totalRechargeRow] = await connection.query(
      "SELECT COUNT(*) as count FROM recharge WHERE phone = ? AND status = ?",
      [phone, status],
    );
    const totalRecharge = totalRechargeRow[0].count || 0;
    return totalRecharge;
  },
  updateRemainingBet: async (phone, money, rechargeId, totalRecharge) => {

    const [previousRecharge] = await connection.query(
      `SELECT remaining_bet FROM recharge WHERE phone = ? AND status = 1 ORDER BY time_remaining_bet DESC LIMIT 2`,
      [phone],
    );

    const previousRemainingBet = previousRecharge?.[1]?.remaining_bet || 0;

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
  setRechargeStatusById: async ({ id, status,remark }) => {
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

    await connection.query("UPDATE recharge SET status = ? ,remark=? WHERE id = ?", [
      status,
      remark,
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
    return moment().format("YYYY-DD-MM h:mm:ss A");
  },
  getDMYDateOfTodayFiled: (today) => {
    return moment(today, "YYYY-DD-MM h:mm:ss A").format("DD-MM-YYYY");
  },
  create: async (newRecharge) => {
    if (newRecharge.url === undefined || newRecharge.url === null) {
      newRecharge.url = "0";
    }

  if(newRecharge.isDemo==1){
        await connection.query(
      `INSERT INTO recharge SET id_order = ?, transaction_id = ?, phone = ?, money = ?, type = ?, status = ?, today = ?, url = ?, time = ?, time_remaining_bet = ?, utr = ?`,
      [
        newRecharge.orderId,
        newRecharge.transactionId,
        newRecharge.phone,
        newRecharge.money,
        newRecharge.type,
        1,
        newRecharge.today,
        0,
        newRecharge.time,
        newRecharge.time,
       0,
      ],
    );

    await connection.query(
      "UPDATE users SET money = money + ? WHERE phone = ? ",
      [newRecharge.money, newRecharge.phone],
    );

  }else{
        await connection.query(
      `INSERT INTO recharge SET id_order = ?, transaction_id = ?, phone = ?, money = ?, type = ?, status = ?, today = ?, url = ?, time = ?, time_remaining_bet = ?, utr = ?`,
      [
        newRecharge.orderId,
        newRecharge.transactionId,
        newRecharge.phone,
        newRecharge.money,
        newRecharge.type,
        newRecharge.status,
        newRecharge.today,
        newRecharge.url,
        newRecharge.time,
        newRecharge.time,
        newRecharge?.utr,
      ],
    );
  }

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

// helpers ---------------
const getUserDataByAuthToken = async (authToken) => {
  let [users] = await connection.query(
    "SELECT `isDemo`, `phone`, `code`,`name_user`,`invite` FROM users WHERE `token` = ? ",
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


// Ensure `appId` and `appSecret` are defined securely, e.g., from environment variables or a config file.
const appId = "Pjwpnw4NnzQxQYMy"; // Replace with your actual appId
const appSecret = "abf15bd9368bfaef4fe416db9d435a6d"; // Replace with your actual appSecret

// Fetch coin list from CCPayment API
const fetchCoinList = async () => {
    try {


        const path = "https://ccpayment.com/ccpayment/v2/getCoinList";
        const timestamp = Math.floor(Date.now() / 1000);
        let signText = appId + timestamp;


        // Generate HMAC-SHA256 signature
        const sign = crypto
            .createHmac("sha256", appSecret)
            .update(signText)
            .digest("hex");

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Appid": appId,
                "Sign": sign,
                "Timestamp": timestamp.toString(),
            },
            url: path,
        };

        console.log(options)

        // Send request to the API
        const response = await axios(options);
        return response.data; // Return the coin list data
    } catch (error) {
      console.log(error)
        console.error("Error fetching coin list:", error.message);
        throw new Error("Failed to fetch coin list");
    }
};
// Route to get coin details by symbol
const fetchCoinDetails = async (req, res) => {
    const { symbol } = req.body;

    if (!symbol) {
        return res.status(400).send('Symbol is required');
    }

    try {
        // Fetch the list of coins
        const coinList = await fetchCoinList();
        console.log(coinList, "coinList")
        if (!coinList || coinList.code !== 10000) {
            return res.status(500).send('Error fetching coin list');
        }

        // Find the coin with the given symbol
        const coin = coinList.data.coins.find(coin => coin.symbol === symbol);

        if (!coin) {
            return res.status(404).send('Coin not found');
        }

        // Return the coin details
        res.json(coin);
    } catch (error) {
        console.error("Error handling /getCoinDetails route:", error.message);
        return res.status(500).send('Internal server error');
    }
};

const generateOrderId = () => {
    const timestamp = Date.now(); // Current timestamp
    const randomPart = Math.floor(Math.random() * 100000); // Random 5-digit number
    return `order${timestamp}${randomPart}`;
};

const createDeposit = async (req, res) => {
    const { money } = req.body;
    console.log(money, "money")
    const userToken = req.userToken;
    // console.log(userToken)
    const [user] = await connection.query('SELECT `phone`, `isDemo`, `id_user` FROM users WHERE token = ? LIMIT 1 ', [userToken]);

    let userInfo = user[0];

console.log(userInfo,"userInfo")
    const chain = "TRX";
    const coinId = 1280;
    const price = String(money)
    const orderId = generateOrderId();
    const generateCheckoutURL = true;
    const returnUrl = "https://rk-win.com/wallet/rechargerecord";
    const userid = String(userInfo.id_user);


    // Validate request body
    // if (!coinId || !price || !orderId || !chain || !userid) {
    //     return res.status(400).send('coinId, price, orderId, chain, and userid are required');
    // }

    try {
        // Fetch coin details to validate the provided `coinId`
        const coinList = await fetchCoinList();
        if (!coinList || coinList.code !== 10000) {
            return res.status(500).send('Error fetching coin list');
        }
        console.log(coinList.data.coins)
        const coin = coinList.data.coins.find(coin => coin.coinId === coinId);
        console.log(coin)
        if (!coin) {
            return res.status(404).send('Invalid coinId provided');
        }
        // Create request payload
        const args = JSON.stringify({
            coinId,
            price,
            orderId,
            chain,
            generateCheckoutURL,
            returnUrl,
        });

        const timestamp = Math.floor(Date.now() / 1000);
        const signText = appId + timestamp + args;
        // Generate signature for request
        const sign = crypto
            .createHmac('sha256', appSecret)
            .update(signText)
            .digest('hex');

        // Request options
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Appid': appId,
                'Sign': sign,
                'Timestamp': timestamp.toString(),
            },
            data: args,
            url: 'https://ccpayment.com/ccpayment/v2/createAppOrderDepositAddress',
        };
        // Make API call to CCPayment
        const response = await axios(options);
        const jsonResponse = response.data;
        if (jsonResponse.code === 10000) {
            const { address, amount, memo, checkoutUrl, confirmsNeeded } = jsonResponse.data;

            console.log(userInfo)

            const newRecharge = {
              orderId: orderId,
              transactionId: "NULL",
              utr: 0,
              phone: userInfo.phone,
              money: Number(money) * 93,
              isDemo: userInfo.isDemo,
              type: "USDT",
              status: 0,
              today: rechargeTable.getCurrentTimeForTodayField(),
              url: "NULL",
              time: rechargeTable.getCurrentTimeForTimeField(),
            };

            const recharge = await rechargeTable.create(newRecharge);


            // Insert the deposit data into the ccdeposit table
            const query = `
            INSERT INTO ccdeposit
            (userid, coinid, price, orderid, chain, deposit_address, amount, memo, checkout_url, confirms_needed, status, created_at, updated_at)
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `;

            const values = [userid, coinId, price, orderId, chain, address, amount, memo, checkoutUrl, confirmsNeeded];

            // Execute the query
            await connection.query(query, values);
            console.log(jsonResponse.data, "jsonResponse")
            // Return success message to the client
            res.status(200).json({
                message: 'Deposit address created and saved successfully',
                data: jsonResponse.data,
            });
        } else {
            // Handle CCPayment API errors
            res.status(400).send(`Error: ${jsonResponse.msg}`);
        }
    } catch (error) {
        console.error('Error processing deposit:', error.message);
        res.status(500).send('Internal server error');
    }

};

function verifySignature(content, signature, app_id, app_secret, timestamp) {
    const signText = `${app_id}${timestamp}${content}`;
    const serverSign = crypto.createHmac('sha256', app_secret).update(signText).digest('hex');

    console.log(serverSign);
    console.log(signature);
    return serverSign === signature;
}


const getOrderInfo = async (orderId) => {
    // Check if orderId is provided
    if (!orderId) {
        throw new Error('orderId is required');
    }

    const args = JSON.stringify({ "orderId": orderId });
    const timestamp = Math.floor(Date.now() / 1000);
    const signText = appId + timestamp + args;

    // Generate the sign using HMAC SHA-256
    const sign = crypto
        .createHmac('sha256', appSecret)
        .update(signText)
        .digest('hex');

    try {
        const response = await axios({
            method: 'POST',
            url: 'https://ccpayment.com/ccpayment/v2/getAppOrderInfo',
            headers: {
                'Content-Type': 'application/json',
                'Appid': appId,
                'Sign': sign,
                'Timestamp': timestamp.toString(),
            },
            data: args
        });

        // Return the parsed response data
        return response.data;
    } catch (error) {
        console.error('Error fetching order info:', error.message);
        throw new Error('Failed to fetch order info');
    }
};

const getUSDTtoINR = async () => {
    try {

        let [setting] = await connection.query(`SELECT name_bank FROM bank_recharge`)
        // Fetch the current price of USDT to INR from CoinGecko
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr');
        const priceInINR = setting[0]?.name_bank || response.data.tether.inr;

        console.log(priceInINR)
        return priceInINR;
    } catch (error) {
        console.error('Error fetching USDT to INR price:', error.message);
        return null; // Return null if the API call fails
    }
};

// const ccpaymentNotify = async (req, res) => {
//     console.log("first");
//     const timestamp = req.header('Timestamp');
//     const sign = req.header('Sign');
//     const content = Object.keys(req.body).length === 0 ? "" : JSON.stringify(req.body);
//     console.log(req.body);
//     console.log("content", content)
//     // Verify the signature
//     if (verifySignature(content, sign, appId, appSecret, timestamp)) {
//         const { type, msg } = req.body;
//         console.log(type, msg, "type, msg")
//         console.log("first1");
//         if (type === 'ApiDeposit') {
//             const { recordId, orderId, coinId, coinSymbol, status } = msg;

//             try {
//                 // Fetch the userId from the `ccdeposit` table
//                 console.log("first2");
//                 const depositQuery = 'SELECT userid FROM ccdeposit WHERE orderid = ? LIMIT 1';
//                 const [depositResult] = await connection.query(depositQuery, [orderId]);

//                 if (depositResult.length > 0) {
//                     const userId = depositResult[0].userid;
//                     console.log("first3");
//                     const [userRows] = await connection.query('SELECT * FROM users WHERE id_user = ?', [userId]);

//                     if (!userRows.length) {
//                         console.log("first4");
//                         return res.status(404).json({
//                             errorCode: 4,
//                             message: 'Token expired or invalid',
//                         });
//                     }

//                     const user = userRows[0];

//                     // Fetch order details
//                     const orderInfo = await getOrderInfo(orderId);
//                     console.log("first5");
//                     if (orderInfo && orderInfo.data && orderInfo.data.paidList.length > 0) {
//                         const payments = orderInfo.data.paidList;
//                         console.log("first6");
//                         // Process each payment
//                         for (const payment of payments) {
//                             if (payment.status === 'Success') {
//                                 console.log("first7");
//                                 const amount = parseFloat(payment.amount);
//                                 const coinSymbolLower = coinSymbol.toLowerCase(); // Ensure proper column case
//                                 // Update user's credits
//                                 const updateUserWallet = `
//                                     UPDATE users
//                                     SET ${coinSymbolLower} = ${coinSymbolLower} + ?
//                                     WHERE uid = ?
//                                 `;
//                                 // await connection.query(updateCreditsQuery, [amount, userId]);
//                                 console.log(amount, "amount")

//                                 console.log("first8");
//                                 const currentUsdtPrice = await getUSDTtoINR();
//                                 if (currentUsdtPrice === null) {
//                                     return res.status(500).json({
//                                         errorCode: 5,
//                                         message: 'Unable to fetch current USDT to INR price',
//                                     });
//                                 }


//                                 let [isData] =  await connection.query(`Select * from ccdeposit WHERE status = ? WHERE orderid = ?'`, ['Success', orderId]);

//                                 if(data.length > 0){

//                                 }

//                                 console.log(currentUsdtPrice, "currentUsdtPrice");
//                                 console.log("first10");
//                                 const oldUserBalance = Number(user.money);
//                                 const amountInUsdt = Number(amount);
//                                 const updatedBalance = oldUserBalance + (amountInUsdt * currentUsdtPrice)
//                                 console.log(updatedBalance, "updatedBalance")
//                                 const depositAmountInUsdtToInr = (amountInUsdt * currentUsdtPrice)

//                                 const oldActualDepositUserBalance = Number(user.actual_total_deposit_amount);
//                                 const updatedBalance2 = oldActualDepositUserBalance + (amountInUsdt * currentUsdtPrice)

//                                 // await connection.query('UPDATE users SET money = ?,actual_total_deposit_amount = ? WHERE id_user = ?', [updatedBalance,updatedBalance2, userId]);

//                                 // console.log(`Updated ${coinSymbolLower} for user ${userId} by ${amount}`);
//                                 console.log("added money in account")
//                                 // Update deposit status
//                                 console.log(orderId, "orderId")
//                                 const updateDepositQuery = 'UPDATE ccdeposit SET status = ?, currentUsdtPrice = ? WHERE orderid = ?';
//                                 let [data] =  await connection.query(updateDepositQuery, ['Success',currentUsdtPrice, orderId]);

//                                 let [rechange_data] =  await connection.query("UPDATE recharge SET status = 1 WHERE id_order = ?", [
//                                   orderId,
//                                 ]);


//                                 addUserAccountBalance({
//                                     money: depositAmountInUsdtToInr,
//                                     phone: user.phone,
//                                     invite: user.invite,
//                                     // rechargeId: rechange_data[0].id,
//                                 })



//                             } else if (payment.status === 'Processing') {
//                                 console.log("first11");
//                                 console.log("Processing")
//                                 console.log(`Payment processing for order ${orderId}`);
//                                 const updateDepositQuery = 'UPDATE ccdeposit SET status = ?,currentUsdtPrice = ?  WHERE orderid = ?';
//                                 await connection.query(updateDepositQuery, ['Processing',currentUsdtPrice, orderId]);
//                             } else if (payment.status === 'Failed') {
//                                 console.log("first12");
//                                 console.log("failed")
//                                 console.log(`Payment failed for order ${orderId}`);
//                                 const updateDepositQuery = 'UPDATE ccdeposit SET status = ?,currentUsdtPrice = ?  WHERE orderid = ?';
//                                 await connection.query(updateDepositQuery, ['Failed',currentUsdtPrice, orderId]);
//                             } else {
//                                 console.log("first13");
//                                 console.log(`Unhandled payment status: ${payment.status}`);
//                             }
//                         }
//                     } else {
//                         console.log("first14");
//                         console.log('No payments found for this order');
//                     }
//                 } else {
//                     console.log("first15");
//                     console.log(`No matching deposit found for order ID: ${orderId}`);
//                 }

//                 res.status(200).send('success');
//             } catch (error) {
//                 console.log("first16");
//                 console.error('Error handling notification:', error.message);
//                 res.status(500).send('Internal server error');
//             }
//         } else {
//             console.log("first17");
//             res.status(200).json({msg: 'success'});
//         }
//     } else {
//         console.log("first18");
//         res.status(401).send('Invalid signature');
//     }
// };

console.log("ccpayment")

// const ccpaymentNotify = async (req, res) => {
//   console.log("Received payment notification");

//   const timestamp = req.header('Timestamp');
//   const sign = req.header('Sign');
//   const content = Object.keys(req.body).length === 0 ? "" : JSON.stringify(req.body);

//   console.log("Request Body:", req.body);

//   // Verify the signature
//   if (!verifySignature(content, sign, appId, appSecret, timestamp)) {
//       console.log("Invalid Signature");
//       return res.status(401).send('Invalid signature');
//   }

//   const { type, msg } = req.body;
//   console.log("Notification Type:", type, "Message:", msg);

//   if (type !== 'ApiDeposit') {
//       return res.status(200).json({ msg: 'success' });
//   }

//   const { recordId, orderId, coinId, coinSymbol, status } = req.body;

//   try {
//       console.log("Fetching user for orderId:", orderId);

//       const depositQuery = 'SELECT userid FROM ccdeposit WHERE orderid = ? LIMIT 1';
//       const [depositResult] = await connection.query(depositQuery, [orderId]);

//       if (depositResult.length === 0) {
//           console.log(`No matching deposit found for order ID: ${orderId}`);
//           return res.status(404).json({ errorCode: 4, message: 'Deposit record not found' });
//       }

//       const userId = depositResult[0].userid;
//       console.log("User ID found:", userId);

//       const [userRows] = await connection.query('SELECT * FROM users WHERE id_user = ?', [userId]);

//       if (userRows.length === 0) {
//           console.log("User not found for ID:", userId);
//           return res.status(404).json({ errorCode: 4, message: 'User not found' });
//       }

//       const user = userRows[0];

//       console.log("Fetching order details...");
//       // const orderInfo = await getOrderInfo(orderId);

//       // if (!orderInfo?.data?.paidList?.length) {
//       //     console.log("No payments found for this order");
//       //     return res.status(200).json({ message: 'No payments found' });
//       // }

//       console.log("Processing payments...");
//       // for (const payment of orderInfo.data.paidList) {
//           // if (payment.status !== 'Success') {
//           //     console.log(`Payment status is ${payment.status} for order ${orderId}`);
//           //     await connection.query(
//           //         'UPDATE ccdeposit SET status = ?, currentUsdtPrice = ? WHERE orderid = ?',
//           //         [payment.status, 0, orderId]
//           //     );
//           //     // continue;
//           // }

//           console.log("Processing successful payment...");
//           const amount = parseFloat(100);
//           const coinSymbolLower = coinSymbol.toLowerCase();

//           // Get USDT to INR conversion rate
//           const currentUsdtPrice = await getUSDTtoINR();
//           if (!currentUsdtPrice) {
//               return res.status(500).json({
//                   errorCode: 5,
//                   message: 'Unable to fetch current USDT to INR price',
//               });
//           }

//           // Ensure deposit is not already processed
//           const [isData] = await connection.query(
//               'SELECT * FROM ccdeposit WHERE status = ? AND orderid = ?',
//               ['Success', orderId]
//           );

//           if (isData.length > 0) {
//               console.log(`Deposit for orderId ${orderId} already processed.`);
//               return res.status(200).json({ message: 'Deposit already processed' });
//           }

//           // Calculate new balance
//           const depositAmountInUsdtToInr = amount * currentUsdtPrice;
//           const updatedBalance = Number(user.money) + depositAmountInUsdtToInr;
//           const updatedDepositBalance = Number(user.actual_total_deposit_amount) + depositAmountInUsdtToInr;

//           // Update user balance
//           await connection.query(
//               'UPDATE users SET money = ?, actual_total_deposit_amount = ? WHERE id_user = ?',
//               [updatedBalance, updatedDepositBalance, userId]
//           );

//           console.log(`Added ${depositAmountInUsdtToInr} INR to user ${userId}`);

//           // Update deposit status
//           await connection.query(
//               'UPDATE ccdeposit SET status = ?, currentUsdtPrice = ? WHERE orderid = ?',
//               ['Success', currentUsdtPrice, orderId]
//           );

//           // Update recharge status
//             await connection.query(
//               'UPDATE recharge SET status = ? WHERE id_order = ?',
//               [1, orderId]
//           );

//           let [rechageId] = await connection.query(`SELECT * from recharge where id_order = ?`, [orderId])


//           console.log(rechageId[0])

//           // Add to user account balance tracking
//           await addUserAccountBalance({
//               money: depositAmountInUsdtToInr,
//               phone: user.phone,
//               invite: user.invite,
//               rechageId: rechageId[0].id
//           });

//           console.log(`Deposit processed successfully for orderId: ${orderId}`);
//       // }

//       res.status(200).send('success');
//   } catch (error) {
//       console.error('Error handling payment notification:', error.message);
//       res.status(500).send('Internal server error');
//   }
// };

const ccpaymentNotify = async (req, res) => {
  console.log("Received payment notification");

  const timestamp = req.header('Timestamp');
  const sign = req.header('Sign');
  const content = Object.keys(req.body).length === 0 ? "" : JSON.stringify(req.body);

  console.log("Request Body:", req.body);

  // Verify the signature
  if (!verifySignature(content, sign, appId, appSecret, timestamp)) {
      console.log("Invalid Signature");
      return res.status(401).send('Invalid signature');
  }

  const { type, msg } = req.body;
  console.log("Notification Type:", type, "Message:", msg);

  if (type !== 'ApiDeposit') {
      return res.status(200).json({ msg: 'success' });
  }

  const { recordId, orderId, coinId, coinSymbol, status } = msg;

  try {
      console.log("Fetching user for orderId:", orderId);

      const depositQuery = 'SELECT userid FROM ccdeposit WHERE orderid = ? LIMIT 1';
      const [depositResult] = await connection.query(depositQuery, [orderId]);

      if (depositResult.length === 0) {
          console.log(`No matching deposit found for order ID: ${orderId}`);
          return res.status(404).json({ errorCode: 4, message: 'Deposit record not found' });
      }

      const userId = depositResult[0].userid;
      console.log("User ID found:", userId);

      const [userRows] = await connection.query('SELECT * FROM users WHERE id_user = ?', [userId]);

      if (userRows.length === 0) {
          console.log("User not found for ID:", userId);
          return res.status(404).json({ errorCode: 4, message: 'User not found' });
      }

      const user = userRows[0];

      console.log("Fetching order details...");
      const orderInfo = await getOrderInfo(orderId);

      if (!orderInfo?.data?.paidList?.length) {
          console.log("No payments found for this order");
          return res.status(200).json({ message: 'No payments found' });
      }

      console.log("Processing payments...");
      for (const payment of orderInfo.data.paidList) {
          if (payment.status !== 'Success') {
              console.log(`Payment status is ${payment.status} for order ${orderId}`);
              await connection.query(
                  'UPDATE ccdeposit SET status = ?, currentUsdtPrice = ? WHERE orderid = ?',
                  [payment.status, 0, orderId]
              );
              continue;
          }

          console.log("Processing successful payment...");
          const amount = parseFloat(payment.amount);
          const coinSymbolLower = coinSymbol.toLowerCase();

          // Get USDT to INR conversion rate
          const currentUsdtPrice = await getUSDTtoINR();
          if (!currentUsdtPrice) {
              return res.status(500).json({
                  errorCode: 5,
                  message: 'Unable to fetch current USDT to INR price',
              });
          }

          // Ensure deposit is not already processed
          const [isData] = await connection.query(
              'SELECT * FROM ccdeposit WHERE status = ? AND orderid = ?',
              ['Success', orderId]
          );

          if (isData.length > 0) {
              console.log(`Deposit for orderId ${orderId} already processed.`);
              return res.status(200).json({ message: 'Deposit already processed' });
          }

          // Calculate new balance
          const depositAmountInUsdtToInr = amount * currentUsdtPrice;
          const updatedBalance = Number(user.money) + depositAmountInUsdtToInr;
          const updatedDepositBalance = Number(user.actual_total_deposit_amount) + depositAmountInUsdtToInr;

          // Update user balance
          // await connection.query(
          //     'UPDATE users SET money = ?, actual_total_deposit_amount = ? WHERE id_user = ?',
          //     [updatedBalance, updatedDepositBalance, userId]
          // );

          console.log(`Added ${depositAmountInUsdtToInr} INR to user ${userId}`);

          // Update deposit status
          await connection.query(
              'UPDATE ccdeposit SET status = ?, currentUsdtPrice = ? WHERE orderid = ?',
              ['Success', currentUsdtPrice, orderId]
          );

           // Update recharge status
           await connection.query(
            'UPDATE recharge SET status = ? WHERE id_order = ?',
                [1, orderId]
            );

            let [rechargeId] = await connection.query(`SELECT * from recharge where id_order = ?`, [orderId])


          // Add to user account balance tracking
          await addUserAccountBalance({
              phone: user.phone,
              money: depositAmountInUsdtToInr,
              code: user.code,
              invite: user.invite,
              rechargeId: rechargeId[0].id
          });

          console.log(`Deposit processed successfully for orderId: ${orderId}`);
      }

      res.status(200).send('success');
  } catch (error) {
      console.error('Error handling payment notification:', error.message);
      res.status(500).send('Internal server error');
  }
};

// const ccpaymentNotify = async (req, res) => {
//     console.log("first");
//     const timestamp = req.header('Timestamp');
//     const sign = req.header('Sign');
//     const content = Object.keys(req.body).length === 0 ? "" : JSON.stringify(req.body);
//     console.log(req.body);
//     console.log("content", content)
//     // Verify the signature
//     let type = 'ApiDeposit'
//     if (type) {
//         if (type === 'ApiDeposit') {
//             const { recordId, orderId, coinId, coinSymbol, status } = req.body;

//             try {
//                 // Fetch the userId from the `ccdeposit` table
//                 console.log("first2");
//                 const depositQuery = 'SELECT userid FROM ccdeposit WHERE orderid = ? LIMIT 1';
//                 const [depositResult] = await connection.query(depositQuery, [orderId]);

//                 if (depositResult.length > 0) {
//                     const userId = depositResult[0].userid;
//                     console.log("first3");
//                     const [userRows] = await connection.query('SELECT * FROM users WHERE id_user = ?', [userId]);

//                     if (!userRows.length) {
//                         console.log("first4");
//                         return res.status(404).json({
//                             errorCode: 4,
//                             message: 'Token expired or invalid',
//                         });
//                     }

//                     const user = userRows[0];

//                     let payment = {
//                         status: "Success",
//                         amount: 100
//                     }

//                     if (payment.status === 'Success') {
//                         console.log("first7");
//                         const amount = parseFloat(payment.amount);
//                         // const coinSymbolLower = coinSymbol.toLowerCase(); // Ensure proper column case
//                         // // Update user's credits
//                         // const updateUserWallet = `
//                         //     UPDATE users
//                         //     SET ${coinSymbolLower} = ${coinSymbolLower} + ?
//                         //     WHERE uid = ?
//                         // `;
//                         // await connection.query(updateCreditsQuery, [amount, userId]);
//                         console.log(amount, "amount")

//                         console.log("first8");
//                         const currentUsdtPrice = await getUSDTtoINR();
//                         if (currentUsdtPrice === null) {
//                             return res.status(500).json({
//                                 errorCode: 5,
//                                 message: 'Unable to fetch current USDT to INR price',
//                             });
//                             console.log("first9");
//                         }

//                         console.log(currentUsdtPrice, "currentUsdtPrice");
//                         console.log("first10");
//                         const oldUserBalance = Number(user.money);
//                         const amountInUsdt = Number(amount);
//                         const updatedBalance = oldUserBalance + (amountInUsdt * currentUsdtPrice)
//                         console.log(updatedBalance, "updatedBalance")
//                         const depositAmountInUsdtToInr = (amountInUsdt * currentUsdtPrice)

//                         const oldActualDepositUserBalance = Number(user.actual_total_deposit_amount);
//                         const updatedBalance2 = oldActualDepositUserBalance + (amountInUsdt * currentUsdtPrice)

//                         // await connection.query('UPDATE users SET money = ?,actual_total_deposit_amount = ? WHERE id_user = ?', [updatedBalance,updatedBalance2, userId]);

//                         // console.log(`Updated ${coinSymbolLower} for user ${userId} by ${amount}`);
//                         console.log("added money in account")
//                         // Update deposit status
//                         console.log(orderId, "orderId")
//                         const updateDepositQuery = 'UPDATE ccdeposit SET status = ?,currentUsdtPrice = ? WHERE orderid = ?';
//                         await connection.query(updateDepositQuery, ['Success',currentUsdtPrice, orderId]);

//                         const [ccdeposit] = await connection.query(
//                             `SELECT * FROM ccdeposit WHERE status = "Success" AND userid = ?`,
//                             [user.id_user]
//                           );

//                           let rechargeLength = ccdeposit.length; // Correct way to get array length
//                           console.log("rechargeLength", rechargeLength)

//                         addUserAccountBalance({
//                             money: depositAmountInUsdtToInr,
//                             phone: user.phone,
//                             invite: user.invite,
//                             rechargeLength: rechargeLength
//                         })

//                     } else if (payment.status === 'Processing') {
//                         console.log("first11");
//                         console.log("Processing")
//                         console.log(`Payment processing for order ${orderId}`);
//                         const updateDepositQuery = 'UPDATE ccdeposit SET status = ?,currentUsdtPrice = ?  WHERE orderid = ?';
//                         await connection.query(updateDepositQuery, ['Processing',currentUsdtPrice, orderId]);
//                     } else if (payment.status === 'Failed') {
//                         console.log("first12");
//                         console.log("failed")
//                         console.log(`Payment failed for order ${orderId}`);
//                         const updateDepositQuery = 'UPDATE ccdeposit SET status = ?,currentUsdtPrice = ?  WHERE orderid = ?';
//                         await connection.query(updateDepositQuery, ['Failed',currentUsdtPrice, orderId]);
//                     } else {
//                         console.log("first13");
//                         console.log(`Unhandled payment status: ${payment.status}`);
//                     }
//                 } else {
//                     console.log("first15");
//                     console.log(`No matching deposit found for order ID: ${orderId}`);
//                 }

//                 res.status(200).send('success');
//             } catch (error) {
//                 console.log("first16");
//                 console.error('Error handling notification:', error.message);
//                 res.status(500).send('Internal server error');
//             }
//         } else {
//             console.log("first17");
//             res.status(200).json({msg: 'success'});
//         }
//     } else {
//         console.log("first18");
//         res.status(401).send('Invalid signature');
//     }
// };

const ccpaymentController = {
  fetchCoinDetails,
    createDeposit,
    ccpaymentNotify
};

export default ccpaymentController;
