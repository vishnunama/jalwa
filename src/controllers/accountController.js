import axios from "axios";
import connection from "../config/connectDB.js";
import jwt from "jsonwebtoken";
import md5 from "md5";
import moment from "moment";
import Joi from "joi";
import bcrypt from "bcrypt";
import _ from "lodash";
import { verifyOtpLess } from "../helpers/verifyOtpLess.js";
import { sendOtpLess } from "../helpers/sendOtpLess.js";

const timeNow = Date.now();
const saltRounds = parseInt(process.env.SALT_ROUNDS || 5);

const loginPage = async (req, res) => {
  return res.render("account/login.ejs");
};

const registerPage = async (req, res) => {
  return res.render("account/register.ejs");
};

const forgotPage = async (req, res) => {
  return res.render("account/forgot.ejs");
};

const forgotResetPage = async (req, res) => {
  return res.render("account/forgot_reset.ejs");
};

const keFuMenu = async (req, res) => {
  let auth = req.cookies.auth;

  const [users] = await connection.query(
    "SELECT `level`, `ctv` FROM users WHERE token = ?",
    [auth],
  );

  let telegram = "";
  if (users.length == 0) {
    let [settings] = await connection.query(
      "SELECT `telegram`, `cskh` FROM admin_ac",
    );
    telegram = settings[0].telegram;
  } else {
    if (users[0].level != 0) {
      var [settings] = await connection.query("SELECT * FROM admin_ac");
    } else {
      var [check] = await connection.query(
        "SELECT `telegram` FROM point_list WHERE phone = ?",
        [users[0].ctv],
      );
      if (check.length == 0) {
        var [settings] = await connection.query("SELECT * FROM admin_ac");
      } else {
        var [settings] = await connection.query(
          "SELECT `telegram` FROM point_list WHERE phone = ?",
          [users[0].ctv],
        );
      }
    }
    telegram = settings[0].telegram;
  }

  return res.render("keFuMenu.ejs", { telegram });
};
const memberQuery = async (req, res) => {
  let auth = req.cookies.auth;

  return res.render("memberQuery.ejs", { auth });
};
const memberDepositQuery = async (req, res) => {
  let auth = req.cookies.auth;

  return res.render("memberDepositQuery.ejs", { auth });
};
const memberWithdrawalQuery = async (req, res) => {
  let auth = req.cookies.auth;

  return res.render("memberWithdrawalQuery.ejs", { auth });
};
const myIssueReport = async (req, res) => {
  return res.render("myIssueReport.ejs");
};

const randomNumber = (min, max) => {
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
}

const login = async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().length(10).required(),
    pwd: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  console.log(req.body)

  let { username, pwd } = req.body;

  try {
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE phone = ?",
      [username],
    );

    if (_.isEmpty(rows)) {
      return res.status(200).json({
        message: "Incorrect Username or Password",
        status: false,
      });
    }

    const validPassword = await bcrypt.compare(pwd, rows[0].password);

    if (!validPassword) {
      return res.status(400).json({
        status: false,
        message: "Invalid password",
      });
    }

    if (rows[0].status !== 1) {
      return res.status(200).json({
        message: "Account has been locked",
        status: false,
      });
    }

    const { password, money, ip, veri, ip_address, status, time, ...others } =
      rows[0];
    const accessToken = jwt.sign(
      {
        user: { ...others },
        timeNow: timeNow,
      },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "1d" },
    );


    await connection.execute(
      "UPDATE `users` SET `token` = ? WHERE `phone` = ? ",
      [md5(accessToken), username],
    );
    return res.status(200).json({
      message: "Login Successfully!",
      status: true,
      token: accessToken,
      value: md5(accessToken),
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

const register = async (req, res) => {
  try {

    let { username, pwd, invitecode } = req.body;

    if (!username || !pwd || !invitecode) {
      return res.status(200).json({
          message: 'ERROR!!!',
          status: false
      });
  }

  let id_user = 100000

    const [result] = await connection.query(
      "SELECT MAX(id_user) AS lastId FROM users"
    );

    if (result[0].lastId) {
      id_user = Number(result[0].lastId) + 1;
    }

    let otp = utils.generateUniqueNumberCodeByDigit(6);
    let name_user = "Member" + utils.generateUniqueNumberCodeByDigit(5);
    let code = utils.generateUniqueNumberCodeByDigit(5) + id_user;
    let bonus_money = process.env.BONUS_MONEY_ON_REGISTER;

    let ip = utils.getIpAddress(req);
    let time = moment().valueOf();

    const [check_u] = await connection.query(
      "SELECT * FROM users WHERE phone = ?",
      [username],
    );
    const [check_i] = await connection.query(
      "SELECT * FROM users WHERE code = ? ",
      [invitecode],
    );
    const [check_ip] = await connection.query(
      "SELECT * FROM users WHERE ip_address = ? ",
      [ip],
    );

    if (check_u.length == 1 && check_u[0].veri == 1) {
      return res.status(200).json({
          message: 'Registered phone number',
          status: false
      });
    }

    if (check_i.length === 0) {
      return res.status(200).json({
        message: "Referrer code does not exist",
        status: false,
      });
    }

    if (check_ip.length > 3) {
      return res.status(200).json({
        message: "Registered IP address",
        status: false,
      });
    }

    let ctv = check_i[0].level == 2 ? check_i[0].phone : check_i[0].ctv;
    const hashedPassword = await bcrypt.hash(pwd, saltRounds);
    const sql =
      "INSERT INTO users SET id_user = ?,phone = ?,name_user = ?, password = ?, plain_password = ?, money = ?,bonus_money = ?,code = ?,invite = ?,ctv = ?,veri = ?,otp = ?,ip_address = ?,status = ?,time = ?";
    await connection.execute(sql, [
      id_user,
      username,
      name_user,
      hashedPassword,
      pwd,
      0,
      bonus_money,
      code,
      invitecode,
      ctv,
      1,
      otp,
      ip,
      1,
      time,
    ]);
    await connection.execute("INSERT INTO point_list SET phone = ?", [
      username,
    ]);


    let [check_code] = await connection.query(
      "SELECT * FROM users WHERE invite = ?",
      [invitecode]
    );

    if (check_code.length > 0) { // Ensure invite code exists
      let levels = [2, 5, 8, 11, 14, 17]; // Maximum level is 6

      let user_level = 0;

      for (let i = 0; i < levels.length; i++) {
        if (check_code.length < levels[i]) {
          break;
        }
        user_level = i + 1;
      }

      // Ensure level does not exceed 6
      if (user_level > 6) {
        user_level = 6;
      }

      // Update the user's level
      await connection.execute(
        "UPDATE users SET user_level = ? WHERE code = ?",
        [user_level, invitecode]
      );
    }


    let sql4 = "INSERT INTO turn_over SET phone = ?, code = ?, invite = ?";
    await connection.query(sql4, [username, code, invitecode]);

    const [rows] = await connection.query(
      "SELECT * FROM users WHERE phone = ?",
      [username],
    );
    const others = rows[0];

    const accessToken = jwt.sign(
      {
        user: {
          ...others,
          password: undefined,
          money: undefined,
          ip: undefined,
          veri: undefined,
          ip_address: undefined,
          status: undefined,
          time: undefined,
        },
        timeNow: timeNow,
      },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "1d" },
    );

    await connection.execute(
      "UPDATE `users` SET `token` = ? WHERE `phone` = ? ",
      [md5(accessToken), username],
    );

    return res.status(200).json({
      message: "Registered successfully",
      status: true,
      token: accessToken,
      value: md5(accessToken),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

//--opt wala
// const register = async (req, res) => {
//   try {

//     let { username, pwd, invitecode, otp, requestId } = req.body;

//     if (!username || !pwd || !invitecode || !otp || !requestId) {
//       return res.status(200).json({
//           message: 'ERROR!!!',
//           status: false
//       });
//   }

//     let id_user = utils.generateUniqueNumberCodeByDigit(7);

//     while (true) {
//       const [rows] = await connection.query(
//         "SELECT `id_user` FROM users WHERE `id_user` = ?",
//         [id_user],
//       );

//       if (_.isEmpty(rows)) {
//         break;
//       }

//       id_user = utils.generateUniqueNumberCodeByDigit(7);
//     }

//     // let otp = utils.generateUniqueNumberCodeByDigit(6);
//     let name_user = "Member" + utils.generateUniqueNumberCodeByDigit(5);
//     let code = utils.generateUniqueNumberCodeByDigit(5) + id_user;
//     let bonus_money = process.env.BONUS_MONEY_ON_REGISTER;

//     let ip = utils.getIpAddress(req);
//     let time = moment().valueOf();

//     const [check_u] = await connection.query(
//       "SELECT * FROM users WHERE phone = ?",
//       [username],
//     );
//     const [check_i] = await connection.query(
//       "SELECT * FROM users WHERE code = ? ",
//       [invitecode],
//     );
//     const [check_ip] = await connection.query(
//       "SELECT * FROM users WHERE ip_address = ? ",
//       [ip],
//     );

//     if (check_u.length == 1 && check_u[0].veri == 1) {
//       return res.status(200).json({
//           message: 'Registered phone number',
//           status: false
//       });
//     }

//     if (check_i.length === 0) {
//       return res.status(200).json({
//         message: "Referrer code does not exist",
//         status: false,
//       });
//     }

//     if (check_ip.length > 3) {
//       return res.status(200).json({
//         message: "Registered IP address",
//         status: false,
//       });
//     }


//      //added by aman
//      let check_otp = await verifyOtpLess(requestId, otp)

//      if(!check_otp.isOTPVerified){
//          return res.status(200).json({
//              message: check_otp.description,
//              status: false
//          });
//      }

//     let ctv = check_i[0].level == 2 ? check_i[0].phone : check_i[0].ctv;
//     const hashedPassword = await bcrypt.hash(pwd, saltRounds);
//     // const sql =
//     //   "INSERT INTO users SET id_user = ?,phone = ?,name_user = ?,password = ?,plain_password = ?, money = ?,bonus_money = ?,code = ?,invite = ?,ctv = ?,veri = ?,otp = ?,ip_address = ?,status = ?,time = ?";
//     // await connection.execute(sql, [
//     //   id_user,
//     //   username,
//     //   name_user,
//     //   hashedPassword,
//     //   pwd,
//     //   0,
//     //   bonus_money,
//     //   code,
//     //   invitecode,
//     //   ctv,
//     //   1,
//     //   otp,
//     //   ip,
//     //   1,
//     //   time,
//     // ]);
//     // await connection.execute("INSERT INTO point_list SET phone = ?", [
//     //   username,
//     // ]);


//     if(check_otp.isOTPVerified){
//       const sql = `
//       Update users SET id_user = ?,phone = ?,name_user = ?,password = ?,plain_password = ?, money = ?,bonus_money = ?,code = ?,invite = ?,ctv = ?,veri = ?,otp = ?,ip_address = ?,status = ?,time = ?
//       WHERE phone = ?
//   `;
//   await connection.execute(sql, [id_user,
//       username,
//       name_user,
//       hashedPassword,
//       pwd,
//       0,
//       bonus_money,
//       code,
//       invitecode,
//       ctv,
//       1,
//       otp,
//       ip,
//       1,
//       time,
//       username]);
//   }
//   else{
//       const sql = `
//       INSERT INTO users SET id_user = ?,phone = ?,name_user = ?,password = ?,plain_password = ?, money = ?,bonus_money = ?,code = ?,invite = ?,ctv = ?,veri = ?,otp = ?,ip_address = ?,status = ?,time = ?"
//   `;
//   await connection.execute(sql, [id_user,
//       username,
//       name_user,
//       hashedPassword,
//       pwd,
//       0,
//       bonus_money,
//       code,
//       invitecode,
//       ctv,
//       1,
//       otp,
//       ip,
//       1,
//       time,]);
//   }


//     let [check_code] = await connection.query(
//       "SELECT * FROM users WHERE invite = ? ",
//       [invitecode],
//     );

//     if (check_i.name_user !== "Admin") {
//       let levels = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44];

//       for (let i = 0; i < levels.length; i++) {
//         if (check_code.length < levels[i]) {
//           break;
//         }
//         await connection.execute(
//           "UPDATE users SET user_level = ? WHERE code = ?",
//           [i + 1, invitecode],
//         );
//       }
//     }

//     let sql4 = "INSERT INTO turn_over SET phone = ?, code = ?, invite = ?";
//     await connection.query(sql4, [username, code, invitecode]);

//     const [rows] = await connection.query(
//       "SELECT * FROM users WHERE phone = ?",
//       [username],
//     );
//     const others = rows[0];

//     const accessToken = jwt.sign(
//       {
//         user: {
//           ...others,
//           password: undefined,
//           money: undefined,
//           ip: undefined,
//           veri: undefined,
//           ip_address: undefined,
//           status: undefined,
//           time: undefined,
//         },
//         timeNow: timeNow,
//       },
//       process.env.JWT_ACCESS_TOKEN,
//       { expiresIn: "1d" },
//     );

//     await connection.execute(
//       "UPDATE `users` SET `token` = ? WHERE `phone` = ? ",
//       [md5(accessToken), username],
//     );

//     return res.status(200).json({
//       message: "Registered successfully",
//       status: true,
//       token: accessToken,
//       value: md5(accessToken),
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//     });
//   }
// };

const sendOtpCode = async (req, res) => {
  try {
    const schema = Joi.object({
      phone: Joi.string().length(10).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message, status: false });
    }

    let { phone } = req.body;
    let now = new Date().getTime();
    let timeEnd = moment().add(1, "minute").valueOf();
    let otp = utils.generateUniqueNumberCodeByDigit(6);

    const [rows] = await connection.query(
      "SELECT * FROM users WHERE `phone` = ? AND veri = 1",
      [phone],
    );

    if (_.isEmpty(rows)) {
      return res.status(200).json({
        message: "Otp sent successfully",
        status: false,
      });
    }

    if (rows[0].time_otp - now <= 0) {
      const response = await axios({
        method: "GET",
        url: `https://www.fast2sms.com/dev/bulkV2`,
        params: {
          authorization: process.env.FAST2SMS_API,
          route: "q",
          message: `Your verification code is ${otp}`,
          flash: 0,
          numbers: phone,
        },
      });

      if (response.data.return) {
        await connection.execute(
          "UPDATE users SET otp = ?, time_otp = ? WHERE phone = ? ",
          [otp, timeEnd, phone],
        );
        return res.status(200).json({
          message: "Otp sent successfully",
          status: true,
          timeStamp: now,
          timeEnd: timeEnd,
        });
      }

      return res.status(400).json({
        message: "Unable to send OTP code",
        status: false,
      });
    } else {
      return res.status(200).json({
        message: "You can send otp code again after 1 minute",
        status: false,
        timeEnd: rows[0].time_otp,
        timeStamp: now,
      });
    }
  } catch (error) {
    console.log(error);
    console.log(error.response.data);
    return res
      .status(500)
      .json({ message: "Internal Server Error", status: false });
  }
};


//aman
const verifyCode = async (req, res) => {
  let phone = req.body.phone;
  let now = new Date().getTime();
  let timeEnd = now + 1000 * (60 * 2 + 0) + 500; // 2 minutes and 500ms from now
  let otp = randomNumber(100000, 999999);

  if (phone.length < 9 || phone.length > 10 || !isNumber(phone)) {
      return res.status(200).json({
          message: 'phone error',
          status: false
      });
  }

  const [rows] = await connection.query('SELECT * FROM users WHERE `phone` = ?', [phone]);
  if (rows.length == 0) {
      try {
          let response =  await sendOTP(phone, otp);

          await connection.execute("INSERT INTO users SET phone = ?, otp = ?, veri = 0, time_otp = ? ", [phone, otp, timeEnd]);
          return res.status(200).json({
              message: 'Sms sent successfully',
              status: true,
              timeStamp: now,
              timeEnd: timeEnd,
              requestId: response.requestId
          });
      } catch (error) {
          return res.status(500).json({
              message: 'Failed to send SMS',
              status: false
          });
      }
  } else {
      let user = rows[0];
      if (user) {
          try {
             let response = await sendOTP(phone, otp);

              await connection.execute("UPDATE users SET otp = ?, time_otp = ? WHERE phone = ? ", [otp, timeEnd, phone]);
              return res.status(200).json({
                  message: 'Sms resent successfully',
                  status: true,
                  timeStamp: now,
                  timeEnd: timeEnd,
                  requestId: response.requestId
              });
          } catch (error) {
              return res.status(500).json({
                  message: 'Failed to send SMS',
                  status: false
              });
          }
      } else {
          return res.status(200).json({
              message: 'Send SMS regularly',
              status: false,
              timeStamp: now,
          });
      }
  }
};

const sendOTP = async (phone, otp) => {
  try {
      // Attempt to send OTP via Fast2SMS
     let isOtpSend = await sendOtpLess(phone);
       console.log('OTP via OtpLess', isOtpSend);
      if(isOtpSend.errorCode === '7102'){
          console.error("OTP Not Send Some thing worng")
          return false
      }else{
          return isOtpSend; // Indicate success
      }
  } catch (e) {
      console.error(e.message);
  }
};

const verifyCodePass = async (req, res) => {
  let phone = req.body.phone;
  let now = new Date().getTime();
  let timeEnd = now + 1000 * (60 * 2 + 0) + 500; // 2 minutes and 500ms from now
  let otp = randomNumber(100000, 999999);

  if (phone.length < 9 || phone.length > 10 || !isNumber(phone)) {
      return res.status(200).json({
          message: 'phone error',
          status: false
      });
  }

  const [rows] = await connection.query('SELECT * FROM users WHERE `phone` = ? AND veri = 1', [phone]);
  if (rows.length == 0) {
      return res.status(200).json({
          message: 'Account does not exist',
          status: false,
          timeStamp: now,
      });
  } else {
      let user = rows[0];
      if (user) {
          try {
              let response =  await sendOTP(phone, otp);

              await connection.execute("UPDATE users SET otp = ?, time_otp = ? WHERE phone = ? ", [otp, timeEnd, phone]);
              return res.status(200).json({
                  message: 'Sms Sent successfully',
                  status: true,
                  timeStamp: now,
                  timeEnd: timeEnd,
                  requestId: response.requestId
              });
          } catch (error) {
              return res.status(500).json({
                  message: 'Failed to send SMS',
                  status: false
              });
          }
      } else {
          return res.status(200).json({
              message: 'Send SMS regularly',
              status: false,
              timeStamp: now,
          });
      }
  }
};


const resetPasswordByOtpAndPhone = async (req, res) => {
  try {
    const schema = Joi.object({
      phone: Joi.string().length(10).required(),
      otp: Joi.number().integer().required(),
      password: Joi.string().min(6).required(),
      requestId: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message, status: false });
    }

    let { phone, otp, password: newPassword, requestId } = req.body;

    const [rows] = await connection.query(
      "SELECT `otp`, `time_otp` FROM users WHERE `phone` = ? AND veri = 1",
      [phone],
    );

    if (_.isEmpty(rows)) {
      return res.status(400).json({
        message: "Account does not exist",
        status: false,
        timeStamp: new Date().getTime(),
      });
    }

    let user = rows[0];
    let now = new Date().getTime();

    if (user.time_otp - now > 0) {
       //added by aman
     let check_otp = await verifyOtpLess(requestId, otp)

     if(!check_otp.isOTPVerified){
         return res.status(200).json({
             message: check_otp.description,
             status: false,
             timeStamp: now,
         });
     }

      if (check_otp.isOTPVerified) {
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await connection.execute(
          "UPDATE users SET password = ?, plain_password = ? WHERE phone = ? ",
          [hashedPassword, newPassword, phone],
        );
        return res.status(200).json({
          message: "Change password successfully",
          status: true,
          timeStamp: now,
        });
      }

      return res.status(400).json({
        message: "OTP code is incorrect",
        status: false,
        timeStamp: now,
      });
    }

    return res.status(400).json({
      message: "OTP code has expired",
      status: false,
      timeStamp: now,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

const resetPasswordByPassword = async (req, res) => {
  try {
    let auth = req.cookies.auth;
    const schema = Joi.object({
      password: Joi.string().min(6).required(),
      newPassWord: Joi.string().min(6).required(),
      RePassWord: Joi.string().min(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      console.log(error);
      return res
        .status(200)
        .json({ message: error.details[0].message, status: false });
    }

    let { password, newPassWord, RePassWord } = req.body;

    console.log(password);
    console.log(newPassWord);
    console.log(RePassWord);

    if (newPassWord !== RePassWord) {
      return res.status(200).json({
        message: "Password does not match",
        status: false,
      });
    }

    const [users] = await connection.query(
      "SELECT * FROM users WHERE token = ?",
      [auth],
    );
    const user = users[0];

    if (_.isEmpty(users)) {
      return res.status(200).json({
        message: "Account does not exist",
        status: false,
        timeStamp: new Date().getTime(),
      });
    }

    // let user = rows[0];
    let now = new Date().getTime();

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(200).json({
        message: "Incorrect password",
        status: false,
        timeStamp: now,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassWord, saltRounds);
    await connection.execute(
      "UPDATE users SET password = ?, plain_password = ? WHERE phone = ? ",
      [hashedPassword, newPassWord, user.phone],
    );

    return res.status(200).json({
      message: "Change password successfully",
      status: true,
      timeStamp: now,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

const updateUsernameAPI = async (req, res) => {
  try {
    const schema = Joi.object({
      nickname: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        status: false,
      });
    }

    let auth = req.cookies.auth;
    let nickname = _.trim(req.body?.nickname || "");

    const [rows] = await connection.query(
      "SELECT * FROM users WHERE token = ?",
      [auth],
    );
    if (_.isEmpty(rows)) {
      return res.status(400).json({
        message: "Account does not exist",
        status: false,
      });
    }

    await connection.execute("UPDATE users SET name_user = ? WHERE token = ?", [
      nickname,
      auth,
    ]);

    return res.status(200).json({
      message: "Nickname updated successfully",
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

const updateAvatarAPI = async (req, res) => {
  try {
    const schema = Joi.object({
      avatar: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        status: false,
      });
    }

    let auth = req.cookies.auth;
    let avatar = _.trim(req.body?.avatar || "");

    const [rows] = await connection.query(
      "SELECT * FROM users WHERE token = ?",
      [auth],
    );
    if (_.isEmpty(rows)) {
      return res.status(400).json({
        message: "Account does not exist",
        status: false,
      });
    }

    await connection.execute("UPDATE users SET avatar = ? WHERE token = ?", [
      avatar,
      auth,
    ]);
    return res.status(200).json({
      message: "Change avatar successfully",
      status: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", status: false });
  }
};

const utils = {
  generateUniqueNumberCodeByDigit(digit) {
    const timestamp = new Date().getTime().toString();
    const randomNum = _.random(1e12).toString();
    const combined = timestamp + randomNum;
    return _.padStart(combined.slice(-digit), digit, "0");
  },
  getIpAddress(req) {
    let ipAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    if (ipAddress.substr(0, 7) == "::ffff:") {
      ipAddress = ipAddress.substr(7);
    }
    return ipAddress;
  },
};

const accountController = {
  login,
  register,
  loginPage,
  registerPage,
  forgotPage,
  keFuMenu,
  memberQuery,
  memberDepositQuery,
  memberWithdrawalQuery,
  myIssueReport,
  sendOtpCode,
  resetPasswordByOtpAndPhone,
  forgotResetPage,
  updateUsernameAPI,
  updateAvatarAPI,
  resetPasswordByPassword,
  verifyCode,
  verifyCodePass
};

export default accountController;
