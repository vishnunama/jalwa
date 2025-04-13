import connection from "../config/connectDB.js";

let timeNow = Date.now();

const dailyPage = async (req, res) => {
  return res.render("daily/statistical.ejs");
};

const listMeber = async (req, res) => {
  return res.render("daily/members.ejs");
};

const profileMember = async (req, res) => {
  return res.render("daily/profileMember.ejs");
};

const settingPage = async (req, res) => {
  return res.render("daily/settings.ejs");
};

const listRecharge = async (req, res) => {
  return res.render("daily/listRecharge.ejs");
};

const listWithdraw = async (req, res) => {
  return res.render("daily/listWithdraw.ejs");
};

const pageInfo = async (req, res) => {
  let phone = req.params.phone;
  return res.render("daily/profileMember.ejs", { phone });
};

const giftPage = async (req, res) => {
  let auth = req.cookies.auth;
  const [rows] = await connection.execute(
    "SELECT `phone` FROM `users` WHERE `token` = ? AND veri = 1",
    [auth],
  );
  let money = 0;
  let money2 = 0;
  if (rows.length != 0) {
    const [point_list] = await connection.execute(
      "SELECT `money`, `money_us` FROM `point_list` WHERE `phone` = ?",
      [rows[0].phone],
    );
    money = point_list[0].money;
    money2 = point_list[0].money_us;
  }
  return res.render("daily/giftPage.ejs", { money, money2 });
};

const support = async (req, res) => {
  return res.render("daily/support.ejs");
};

const settings = async (req, res) => {
  let auth = req.cookies.auth;
  let type = req.body.type;
  let value = req.body.value;

  const [rows] = await connection.execute(
    "SELECT `phone` FROM `users` WHERE `token` = ? AND veri = 1",
    [auth],
  );
  if (rows.length == 0) {
    return res.status(200).json({
      message: "Error",
      status: false,
    });
  }
  if (!type) {
    const [point_list] = await connection.execute(
      "SELECT `telegram` FROM `point_list` WHERE phone = ?",
      [rows[0].phone],
    );
    const [settings] = await connection.execute(
      "SELECT `telegram` FROM `admin_ac`",
    );
    let telegram = settings[0].telegram;
    let telegram2 = point_list[0].telegram;
    return res.status(200).json({
      message: "Get success",
      status: true,
      telegram: telegram,
      telegram2: telegram2,
    });
  } else {
    await connection.execute(
      "UPDATE `point_list` SET telegram = ? WHERE phone = ?",
      [value, rows[0].phone],
    );
    return res.status(200).json({
      message: "Successfully edited",
      status: true,
    });
  }
};

// xác nhận admin
const middlewareDailyController = async (req, res, next) => {
  // xác nhận token
  const auth = req.cookies.auth;
  if (!auth) {
    return res.redirect("/login");
  }
  const [rows] = await connection.execute(
    "SELECT `token`,`level`, `status` FROM `users` WHERE `token` = ? AND veri = 1",
    [auth],
  );
  if (!rows) {
    return res.redirect("/login");
  }
  try {
    if (auth == rows[0].token && rows[0].status == 1) {
      if (rows[0].level == 2) {
        next();
      } else {
        return res.redirect("/home");
      }
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    return res.redirect("/login");
  }
};

const statistical = async (req, res) => {
  const auth = req.cookies.auth;

  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  let userInfo = user[0];
  // cấp dưới trực tiếp all
  const [f1s] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
    [userInfo.code],
  );

  // cấp dưới trực tiếp hôm nay
  let f1_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_time = f1s[i].time; // Mã giới thiệu f1
    let check = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check) {
      f1_today += 1;
    }
  }

  // tất cả cấp dưới hôm nay
  let f_all_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const f1_time = f1s[i].time; // time f1
    let check_f1 = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check_f1) f_all_today += 1;
    // tổng f1 mời đc hôm nay
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code; // Mã giới thiệu f2
      const f2_time = f2s[i].time; // time f2
      let check_f2 = timerJoin(f2_time) == timerJoin() ? true : false;
      if (check_f2) f_all_today += 1;
      // tổng f2 mời đc hôm nay
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code; // Mã giới thiệu f3
        const f3_time = f3s[i].time; // time f3
        let check_f3 = timerJoin(f3_time) == timerJoin() ? true : false;
        if (check_f3) f_all_today += 1;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        // tổng f3 mời đc hôm nay
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code; // Mã giới thiệu f4
          const f4_time = f4s[i].time; // time f4
          let check_f4 = timerJoin(f4_time) == timerJoin() ? true : false;
          if (check_f4) f_all_today += 1;
          // tổng f3 mời đc hôm nay
        }
      }
    }
  }

  // Tổng số f2
  let f2 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    f2 += f2s.length;
  }

  // Tổng số f3
  let f3 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      if (f3s.length > 0) f3 += f3s.length;
    }
  }

  // Tổng số f4
  let f4 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        if (f4s.length > 0) f4 += f4s.length;
      }
    }
  }
    // Tổng số f5
    let f5 = 0;
    for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code; // Mã giới thiệu f1
      const [f2s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f1_code],
      );
      for (let i = 0; i < f2s.length; i++) {
        const f2_code = f2s[i].code;
        const [f3s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f2_code],
        );
        for (let i = 0; i < f3s.length; i++) {
          const f3_code = f3s[i].code;
          const [f4s] = await connection.query(
            "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
            [f3_code],
          );
          for (let i = 0; i < f4s.length; i++) {
            const f4_code = f4s[i].code;
            const [f5s] = await connection.query(
              "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
              [f4_code],
            );
            if (f5s.length > 0) f5 += f5s.length;
          }
        }
      }
    }

    // Tổng số 6
    let f6 = 0;
    for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code; // Mã giới thiệu f1
      const [f2s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f1_code],
      );
      for (let i = 0; i < f2s.length; i++) {
        const f2_code = f2s[i].code;
        const [f3s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f2_code],
        );
        for (let i = 0; i < f3s.length; i++) {
          const f3_code = f3s[i].code;
          const [f4s] = await connection.query(
            "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
            [f3_code],
          );
          for (let i = 0; i < f4s.length; i++) {
            const f4_code = f4s[i].code;
            const [f5s] = await connection.query(
              "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
              [f4_code],
            );
            for (let i = 0; i < f5s.length; i++) {
              const f6_code = f5s[i].code;
              const [f6s] = await connection.query(
                "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
                [f6_code],
              );
              if (f6s.length > 0) f6 += f6s.length;
            }
          }
        }
      }
    }


  // const [recharge] = await connection.query('SELECT SUM(`money`) as total FROM recharge WHERE phone = ? AND status = 1 ', [phone]);
  // const [withdraw] = await connection.query('SELECT SUM(`money`) as total FROM withdraw WHERE phone = ? AND status = 1 ', [phone]);
  // const [bank_user] = await connection.query('SELECT * FROM user_bank WHERE phone = ? ', [phone]);
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: user,
    f1: f1s.length,
    f2: f2,
    f3: f3,
    f4: f4,
    f5: f5,
    f6: f6,
  });
};

function formateT(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}

function timerJoin(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;
  let ampm = date.getHours() < 12 ? "AM" : "PM";

  let minutes = formateT(date.getMinutes());
  let seconds = formateT(date.getSeconds());

  return (
    years +
    "-" +
    months +
    "-" +
    days +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds +
    " " +
    ampm
  );
}

const userInfo = async (req, res) => {
  try{
    let auth = req.cookies.auth;
  let phone = req.params.phone;
  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user?.length == 0 || auths?.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  if (auths[0]?.phone != userInfo.ctv) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  // cấp dưới trực tiếp all
  const [f1s] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
    [userInfo.code],
  );

  // cấp dưới trực tiếp hôm nay
  let f1_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_time = f1s[i].time; // Mã giới thiệu f1
    let check = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check) {
      f1_today += 1;
    }
  }

  // tất cả cấp dưới hôm nay
  let f_all_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const f1_time = f1s[i].time; // time f1
    let check_f1 = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check_f1) f_all_today += 1;
    // tổng f1 mời đc hôm nay
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code; // Mã giới thiệu f2
      const f2_time = f2s[i].time; // time f2
      let check_f2 = timerJoin(f2_time) == timerJoin() ? true : false;
      if (check_f2) f_all_today += 1;
      // tổng f2 mời đc hôm nay
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code; // Mã giới thiệu f3
        const f3_time = f3s[i].time; // time f3
        let check_f3 = timerJoin(f3_time) == timerJoin() ? true : false;
        if (check_f3) f_all_today += 1;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        // tổng f3 mời đc hôm nay
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code; // Mã giới thiệu f4
          const f4_time = f4s[i].time; // time f4
          let check_f4 = timerJoin(f4_time) == timerJoin() ? true : false;
          if (check_f4) f_all_today += 1;
          // tổng f3 mời đc hôm nay
          const [f5s] = await connection.query(
            "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
            [f4_code],
          );
          for (let i = 0; i < f5s.length; i++) {
            const f5_code = f5s[i].code; // Mã giới thiệu f4
            const f5_time = f5s[i].time; // time f4
            let check_f5 = timerJoin(f5_time) == timerJoin() ? true : false;
            if (check_f5) f_all_today += 1;
            // tổng f3 mời đc hôm nay
            const [f6s] = await connection.query(
              "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
              [f4_code],
            );
            for (let i = 0; i < f6s.length; i++) {
              const f6_code = f5s[i].code; // Mã giới thiệu f4
              const f6_time = f5s[i].time; // time f4
              let check_f6 = timerJoin(f6_time) == timerJoin() ? true : false;
              if (check_f6) f_all_today += 1;
              // tổng f3 mời đc hôm nay
              // const [f6s] = await connection.query(
              //   "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
              //   [f4_code],
              // );
            }
          }
        }
      }
    }
  }

  // Tổng số f2
  let f2 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    f2 += f2s.length;
  }

  // Tổng số f3
  let f3 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      if (f3s.length > 0) f3 += f3s.length;
    }
  }

  // Tổng số f4
  let f4 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        if (f4s.length > 0) f4 += f4s.length;
      }
    }
  }

  // Tổng số f5
  let f5 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code;
          const [f5s] = await connection.query(
            "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
            [f4_code],
          );
          if (f5s.length > 0) f5 += f5s.length;
        }
      }
    }
  }

  // Tổng số 6
  let f6 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code;
          const [f5s] = await connection.query(
            "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
            [f4_code],
          );
          for (let i = 0; i < f5s.length; i++) {
            const f5_code = f5s[i].code;
            const [f6s] = await connection.query(
              "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
              [f5_code],
            );
            if (f6s.length > 0) f6 += f6s.length;
          }
        }
      }
    }
  }

  const [recharge] = await connection.query(
    "SELECT SUM(`money`) as total FROM recharge WHERE phone = ? AND status = 1 ",
    [phone],
  );
  const [withdraw] = await connection.query(
    "SELECT SUM(`money`) as total FROM withdraw WHERE phone = ? AND status = 1 ",
    [phone],
  );
  const [bank_user] = await connection.query(
    "SELECT * FROM user_bank WHERE phone = ? ",
    [phone],
  );

  let today = timerJoin().split(" ")[0];



  const [totalSalary] = await connection.query(

    "SELECT SUM(`amount`) as total FROM salary WHERE phone = ?",

    [phone],

  );

  const [totalTodaySalary] = await connection.query(

    "SELECT SUM(`amount`) as total FROM salary WHERE phone = ? AND time = ?",

    [phone, today],

  );

  const [totalGiftCode] = await connection.query(

    "SELECT SUM(`money`) as total FROM redenvelopes_used WHERE phone_used = ?",

    [phone],

  );

  const [totalTodayGiftCode] = await connection.query(

    "SELECT SUM(`money`) as total FROM redenvelopes_used WHERE phone_used = ? AND time = ?",

    [phone, today],

  );



  return res.status(200).json({
    message: "Success",
    status: true,
    datas: userInfo,
    total_r: recharge,
    total_w: withdraw,
    f1: f1s.length,
    f2: f2,
    f3: f3,
    f4: f4,
    f5: f5,
    f6: f6,
    bank_user: bank_user,
    total_salary: totalSalary[0].total,
    today_salary: totalTodaySalary[0].total,
    total_gift_code: totalGiftCode[0].total,
    today_gift_code: totalTodayGiftCode[0].total,
  });

  }catch(e){
    console.log(e)
  }
}


async function fetch6LeveMember(userInfo) {
  try {
    const resultUsers = [];

    const [f1s] = await connection.query(
      "SELECT `phone`, `code`, `invite`, `time` FROM users WHERE `invite` = ?",
      [userInfo.code]
    );
    f1s.forEach(user => user.u_level = 1);
    resultUsers.push(f1s);

    for (const f1 of f1s) {
      const [f2s] = await connection.query(
        "SELECT `phone`, `code`, `invite` FROM users WHERE `invite` = ?",
        [f1.code]
      );
      f2s.forEach(user => user.u_level = 2);
      resultUsers.push(f2s);

      for (const f2 of f2s) {
        const [f3s] = await connection.query(
          "SELECT `phone`, `code`, `invite` FROM users WHERE `invite` = ?",
          [f2.code]
        );
        f3s.forEach(user => user.u_level = 3);
        resultUsers.push(f3s);

        for (const f3 of f3s) {
          const [f4s] = await connection.query(
            "SELECT `phone`, `code`, `invite` FROM users WHERE `invite` = ?",
            [f3.code]
          );
          f4s.forEach(user => user.u_level = 4);
          resultUsers.push(f4s);

          for (const f4 of f4s) {
            const [f5s] = await connection.query(
              "SELECT `phone`, `code`, `invite` FROM users WHERE `invite` = ?",
              [f4.code]
            );
            f5s.forEach(user => user.u_level = 5);
            resultUsers.push(f5s);

            for (const f5 of f5s) {
              const [f6s] = await connection.query(
                "SELECT `phone`, `code`, `invite` FROM users WHERE `invite` = ?",
                [f5.code]
              );
              f6s.forEach(user => user.u_level = 6);
              resultUsers.push(f6s);
            }
          }
        }
      }
    }

    const allUsers = resultUsers.flat();
    const userCode = allUsers.map(user => user.code).filter(Boolean);

    if (userCode.length === 0) {
      return [];
    }

    const [list_mem] = await connection.query(
      "SELECT * FROM users WHERE code IN (?) AND status = 1 AND veri = 1",
      [userCode]
    );

    // Merge u_level information with full user data
    const codeTou_levelMap = {};
    allUsers.forEach(user => {
      codeTou_levelMap[user.code] = user.u_level;
    });

    const listWithu_level = list_mem.map(user => ({
      ...user,
      u_level: codeTou_levelMap[user.code] || null,
    }));

    return listWithu_level;
  } catch (error) {
    console.error("Error in fetch6LeveMember:", error);
    return [];
  }
}




const infoCtv = async (req, res) => {
  const auth = req.cookies.auth;

  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Phone Error",
      status: false,
    });
  }
  let userInfo = user[0];
  let phone = userInfo.phone;
  // cấp dưới trực tiếp all
  const [f1s] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
    [userInfo.code],
  );

  // cấp dưới trực tiếp hôm nay
  let f1_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_time = f1s[i].time; // Mã giới thiệu f1
    let check = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check) {
      f1_today += 1;
    }
  }

  // tất cả cấp dưới hôm nay
  let f_all_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const f1_time = f1s[i].time; // time f1
    let check_f1 = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check_f1) f_all_today += 1;
    // tổng f1 mời đc hôm nay
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code; // Mã giới thiệu f2
      const f2_time = f2s[i].time; // time f2
      let check_f2 = timerJoin(f2_time) == timerJoin() ? true : false;
      if (check_f2) f_all_today += 1;
      // tổng f2 mời đc hôm nay
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code; // Mã giới thiệu f3
        const f3_time = f3s[i].time; // time f3
        let check_f3 = timerJoin(f3_time) == timerJoin() ? true : false;
        if (check_f3) f_all_today += 1;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        // tổng f3 mời đc hôm nay
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code; // Mã giới thiệu f4
          const f4_time = f4s[i].time; // time f4
          let check_f4 = timerJoin(f4_time) == timerJoin() ? true : false;
          if (check_f4) f_all_today += 1;
          // tổng f3 mời đc hôm nay
          const [f5s] = await connection.query(
            "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
            [f4_code],
          );
          // tổng f3 mời đc hôm nay
          for (let i = 0; i < f5s.length; i++) {
            const f5_code = f5s[i].code; // Mã giới thiệu f4
            const f5_time = f5s[i].time; // time f4
            let check_f5 = timerJoin(f5_time) == timerJoin() ? true : false;
            if (check_f5) f_all_today += 1;
            // tổng f3 mời đc hôm nay
            const [f6s] = await connection.query(
              "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
              [f5_code],
            );
            for (let i = 0; i < f6s.length; i++) {
              const f6_code = f6s[i].code; // Mã giới thiệu f4
              const f6_time = f6s[i].time; // time f4
              let check_f6 = timerJoin(f6_time) == timerJoin() ? true : false;
              if (check_f6) f_all_today += 1;
              // tổng f3 mời đc hôm nay
              // const [f7s] = await connection.query(
              //   "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
              //   [f4_code],
              // );
            }
          }
        }
      }
    }
  }

  // Tổng số f2
  let f2 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    f2 += f2s.length;
  }

  // Tổng số f3
  let f3 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      if (f3s.length > 0) f3 += f3s.length;
    }
  }

  // Tổng số f4
  let f4 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        if (f4s.length > 0) f4 += f4s.length;
      }
    }
  }

    // Tổng số f5
    let f5 = 0;
    for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code; // Mã giới thiệu f1
      const [f2s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f1_code],
      );
      for (let i = 0; i < f2s.length; i++) {
        const f2_code = f2s[i].code;
        const [f3s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f2_code],
        );
        for (let i = 0; i < f3s.length; i++) {
          const f3_code = f3s[i].code;
          const [f4s] = await connection.query(
            "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
            [f3_code],
          );
          for (let i = 0; i < f4s.length; i++) {
            const f4_code = f4s[i].code;
            const [f5s] = await connection.query(
              "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
              [f4_code],
            );
            if (f5s.length > 0) f5 += f5s.length;
          }
        }
      }
    }

    const resultUsers = [];
    // Tổng số 6
    let f6 = 0;
    for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code; // Mã giới thiệu f1
      const [f2s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f1_code],
      );
      resultUsers.push(f2s);
      for (let i = 0; i < f2s.length; i++) {
        const f2_code = f2s[i].code;
        const [f3s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f2_code],
        );
        resultUsers.push(f3s);
        for (let i = 0; i < f3s.length; i++) {
          const f3_code = f3s[i].code;
          const [f4s] = await connection.query(
            "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
            [f3_code],
          );
          resultUsers.push(f4s);
          for (let i = 0; i < f4s.length; i++) {
            const f4_code = f4s[i].code;
            const [f5s] = await connection.query(
              "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
              [f4_code],
            );
            resultUsers.push(f5s);
            for (let i = 0; i < f5s.length; i++) {
              const f5_code = f5s[i].code;
              const [f6s] = await connection.query(
                "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
                [f5_code],
              );
              resultUsers.push(f6s);
              if (f6s.length > 0) f6 += f6s.length;
            }
          }
        }
      }
    }

    const list_mem = await fetch6LeveMember(userInfo);

  const [list_mem_baned] = await connection.query(
    "SELECT * FROM users WHERE ctv = ? AND status = 2 AND veri = 1 ",
    [phone],
  );
  let total_recharge = 0;
  let total_withdraw = 0;
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [recharge] = await connection.query(
      "SELECT SUM(money) as money FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw] = await connection.query(
      "SELECT SUM(money) as money FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    if (recharge[0].money) {
      total_recharge += Number(recharge[0].money);
    }
    if (withdraw[0].money) {
      total_withdraw += Number(withdraw[0].money);
    }
  }

  let total_recharge_today = 0;
  let total_withdraw_today = 0;
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [recharge_today] = await connection.query(
      "SELECT `userId`, `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw_today] = await connection.query(
      "SELECT `userId`, `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    for (let i = 0; i < recharge_today.length; i++) {
      let today = timerJoin().split(" ")[0];
      let time = timerJoin(recharge_today[i].time).split(" ")[0];
      if (time == today) {
        total_recharge_today += recharge_today[i].money;
      }
    }
    for (let i = 0; i < withdraw_today.length; i++) {
      let today = timerJoin().split(" ")[0];
      let time = timerJoin(withdraw_today[i].time).split(" ")[0];
      if (time == today) {
        total_withdraw_today += withdraw_today[i].money;
      }
    }
  }

  let win = 0;
  let loss = 0;
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [wins] = await connection.query(
      "SELECT `money`, `time` FROM minutes_1 WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [losses] = await connection.query(
      "SELECT `money`, `time` FROM minutes_1 WHERE phone = ? AND status = 2 ",
      [phone],
    );
    for (let i = 0; i < wins.length; i++) {
      let today = timerJoin().split(" ")[0];
      let time = timerJoin(wins[i].time).split(" ")[0];
      if (time == today) {
        win += wins[i].money;
      }
    }
    for (let i = 0; i < losses.length; i++) {
      let today = timerJoin().split(" ")[0];
      let time = timerJoin(losses[i].time).split(" ")[0];
      if (time == today) {
        loss += losses[i].money;
      }
    }
  }
  let list_mems = [];
  const [list_mem_today] = await connection.query(
    "SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ",
    [phone],
  );
  for (let i = 0; i < list_mem.length; i++) {
    let today = timerJoin().split(" ")[0];
    let time = timerJoin(list_mem[i].time).split(" ")[0];
    if (time == today) {
      const [phone_invites] = await connection.query(
        "SELECT `phone` FROM users WHERE code = ? ",
        [list_mem[i].invite],
      );
      let phone_invite = phone_invites[0].phone;
      let data = {
        ...list_mem[i],
        phone_invite: phone_invite,
      };
      list_mems.push(data);
    }
  }

  const [point_list] = await connection.query(
    "SELECT * FROM point_list WHERE phone = ? ",
    [phone],
  );
  let moneyCTV = point_list[0].money;

  let list_recharge_news = [];
  let list_withdraw_news = [];
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    let r_level = list_mem[i].u_level
    let w_level = list_mem[i].u_level
    const [recharge_today] = await connection.query(
      "SELECT `userId`, `id`, `status`, `type`,`phone`, `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw_today] = await connection.query(
      "SELECT `userId`, `id`, `status`,`phone`, `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    for (let i = 0; i < recharge_today.length; i++) {
      let today = timerJoin().split(" ")[0];
      let time = timerJoin(recharge_today[i].time).split(" ")[0];
      if (time == today) {
        list_recharge_news.push({
          ...recharge_today[i],
          r_level,
        });
      }
    }
    for (let i = 0; i < withdraw_today.length; i++) {
      let today = timerJoin().split(" ")[0];
      let time = timerJoin(withdraw_today[i].time).split(" ")[0];
      if (time == today) {
        list_withdraw_news.push({
          ...withdraw_today[i],
          w_level,
        });
      }
    }
  }

  const [redenvelopes_used] = await connection.query(
    "SELECT * FROM redenvelopes_used WHERE phone = ? ",
    [phone],
  );
  let redenvelopes_used_today = [];
  for (let i = 0; i < redenvelopes_used.length; i++) {
    let today = timerJoin().split(" ")[0];
    let time = timerJoin(redenvelopes_used[i].time).split(" ")[0];
    if (time == today) {
      redenvelopes_used_today.push(redenvelopes_used[i]);
    }
  }

  const [financial_details] = await connection.query(
    "SELECT * FROM financial_details WHERE phone = ? ",
    [phone],
  );
  let financial_details_today = [];
  for (let i = 0; i < financial_details.length; i++) {
    let today = timerJoin().split(" ")[0];
    let time = timerJoin(financial_details[i].time).split(" ")[0];
    if (time == today) {
      financial_details_today.push(financial_details[i]);
    }
  }

  return res.status(200).json({
    message: "Success",
    status: true,
    datas: user,
    f1: f1s.length,
    f2: f2,
    f3: f3,
    f4: f4,
    f5: f5,
    f6: f6,
    list_mems: list_mems,
    total_recharge: total_recharge,
    total_withdraw: total_withdraw,
    total_recharge_today: total_recharge_today,
    total_withdraw_today: total_withdraw_today,
    list_mem_baned: list_mem_baned.length,
    win: win,
    loss: loss,
    list_recharge_news: list_recharge_news,
    list_withdraw_news: list_withdraw_news,
    moneyCTV: moneyCTV,
    redenvelopes_used: redenvelopes_used_today,
    financial_details_today: financial_details_today,
  });
};

const infoCtv2 = async (req, res) => {
  const auth = req.cookies.auth;
  const timeDate = req.body.timeDate;

  function formateT(params) {
    let result = params < 10 ? "0" + params : params;
    return result;
  }

  function timerJoin(params = "", addHours = 0) {
    let date = "";
    if (params) {
      date = new Date(Number(params));
    } else {
      date = new Date();
    }

    date.setHours(date.getHours() + addHours);

    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());

    let hours = date.getHours() % 12;
    hours = hours === 0 ? 12 : hours;
    let ampm = date.getHours() < 12 ? "AM" : "PM";

    let minutes = formateT(date.getMinutes());
    let seconds = formateT(date.getSeconds());

    return (
      years +
      "-" +
      months +
      "-" +
      days +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds +
      " " +
      ampm
    );
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Phone Error",
      status: false,
    });
  }
  let userInfo = user[0];

  let phone = userInfo.phone;
  // const [list_mem] = await connection.query(
  //   "SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ",
  //   [phone],
  // );

  const list_mem = await fetch6LeveMember(userInfo);

  let list_mems = [];
  const [list_mem_today] = await connection.query(
    "SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ",
    [phone],
  );

  for (let i = 0; i < list_mem.length; i++) {
    let today = timeDate;
    let time = timerJoin(list_mem[i].time).split(" ")[0];
    if (time == today) {
      const [phone_invites] = await connection.query(
        "SELECT `phone` FROM users WHERE code = ? ",
        [list_mem[i].invite],
      );
      let phone_invite = phone_invites[0].phone;
      let data = {
        ...list_mem[i],
        phone_invite: phone_invite,
      };
      list_mems.push(data);
    }
  }

  let list_recharge_news = [];
  let list_withdraw_news = [];
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    let r_level = list_mem[i].u_level
    let w_level = list_mem[i].u_level
    const [recharge_today] = await connection.query(
      "SELECT `userId`, `id`, `status`, `type`,`phone`, `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw_today] = await connection.query(
      "SELECT  `userId`,  `id`, `status`,`phone`, `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    for (let i = 0; i < recharge_today.length; i++) {
      let today = timeDate;
      let time = timerJoin(recharge_today[i].time).split(" ")[0];
      if (time == today) {
        list_recharge_news.push({
          ...recharge_today[i],
          r_level,
        });
      }
    }
    for (let i = 0; i < withdraw_today.length; i++) {
      let today = timeDate;
      let time = timerJoin(withdraw_today[i].time).split(" ")[0];
      if (time == today) {
        list_withdraw_news.push({
          ...withdraw_today[i],
          w_level,
        });
      }
    }
  }

  const [redenvelopes_used] = await connection.query(
    "SELECT * FROM redenvelopes_used WHERE phone = ? ",
    [phone],
  );
  let redenvelopes_used_today = [];
  for (let i = 0; i < redenvelopes_used.length; i++) {
    let today = timeDate;
    let time = timerJoin(redenvelopes_used[i].time).split(" ")[0];
    if (time == today) {
      redenvelopes_used_today.push(redenvelopes_used[i]);
    }
  }
  const [financial_details] = await connection.query(
    "SELECT * FROM financial_details WHERE phone = ? ",
    [phone],
  );
  let financial_details_today = [];
  for (let i = 0; i < financial_details.length; i++) {
    let today = timeDate;
    let time = timerJoin(financial_details[i].time).split(" ")[0];
    if (time == today) {
      financial_details_today.push(financial_details[i]);
    }
  }

  return res.status(200).json({
    message: "Success",
    status: true,
    datas: user,
    list_mems: list_mems,
    list_recharge_news: list_recharge_news,
    list_withdraw_news: list_withdraw_news,
    redenvelopes_used: redenvelopes_used_today,
    financial_details_today: financial_details_today,
  });
};

const createBonus = async (req, res) => {
  const randomString = (length) => {
    var result = "";
    var characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  function formateT(params) {
    let result = params < 10 ? "0" + params : params;
    return result;
  }

  function timerJoin(params = "", addHours = 0) {
    let date = "";
    if (params) {
      date = new Date(Number(params));
    } else {
      date = new Date();
    }

    date.setHours(date.getHours() + addHours);

    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());

    let hours = date.getHours() % 12;
    hours = hours === 0 ? 12 : hours;
    let ampm = date.getHours() < 12 ? "AM" : "PM";

    let minutes = formateT(date.getMinutes());
    let seconds = formateT(date.getSeconds());

    return (
      years +
      "-" +
      months +
      "-" +
      days +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds +
      " " +
      ampm
    );
  }
  const d = new Date();
  const time = d.getTime();
  let auth = req.cookies.auth;
  let money = req.body.money;

  if (!money || !auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];
  const [point_list] = await connection.query(
    "SELECT * FROM point_list WHERE phone = ? ",
    [userInfo.phone],
  );
  if (point_list.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let ctv = point_list[0];

  if (ctv.money - money >= 0) {
    let id_redenvelops = randomString(24);
    await connection.execute(
      "UPDATE `point_list` SET money = money - ? WHERE phone = ?",
      [money, ctv.phone],
    );
    let sql = `INSERT INTO redenvelopes SET id_redenvelope = ?, phone = ?, money = ?, used = ?, amount = ?, status = ?, time = ?`;
    await connection.query(sql, [
      id_redenvelops,
      userInfo.phone,
      money,
      1,
      1,
      0,
      time,
    ]);
    const [point_list] = await connection.query(
      "SELECT `money` FROM point_list WHERE phone = ? ",
      [userInfo.phone],
    );
    return res.status(200).json({
      message: "Successful gift creation",
      status: true,
      id: id_redenvelops,
      money: point_list[0].money,
    });
  } else {
    return res.status(200).json({
      message: "The balance is not enough to create gifts",
      status: false,
    });
  }
};

const listRedenvelops = async (req, res) => {
  let auth = req.cookies.auth;
  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];
  let [redenvelopes] = await connection.query(
    "SELECT * FROM redenvelopes WHERE phone = ? ORDER BY id DESC",
    [userInfo.phone],
  );
  return res.status(200).json({
    message: "Successful change",
    status: true,
    redenvelopes: redenvelopes,
  });
};


const listMember = async (req, res) => {
  let auth = req.cookies.auth;
  let { pageno, limit } = req.body;

  let [checkInfo] = await connection.execute(
    "SELECT * FROM users WHERE token = ?",
    [auth],
  );

  if (checkInfo.length == 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  let userInfo = checkInfo[0];

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  const [users] = await connection.query(
    `SELECT id_user, phone, money, total_money, status, time FROM users WHERE veri = 1 AND level = 0 AND ctv = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [userInfo.phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM users WHERE veri = 1 AND level = 0 AND ctv = ? `,
    [userInfo.phone],
  );
  // const users = await fetch6LeveMember(userInfo);
  // const total_users = await fetch6LeveMember(userInfo);
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: users,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const listRechargeP = async (req, res) => {
  let auth = req.cookies.auth;
  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];

  const [list_mem] = await connection.query(
    "SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ",
    [userInfo.phone],
  );
  let list_recharge_news = [];
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [recharge_today] = await connection.query(
      "SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC LIMIT 100",
      [phone],
    );
    for (let i = 0; i < recharge_today.length; i++) {
      list_recharge_news.push(recharge_today[i]);
    }
  }
  return res.status(200).json({
    message: "Failed",
    status: true,
    list_recharge_news: list_recharge_news,
    timeStamp: timeNow,
  });
};

const listWithdrawP = async (req, res) => {
  let auth = req.cookies.auth;
  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];

  const [list_mem] = await connection.query(
    "SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ",
    [userInfo.phone],
  );
  let list_withdraw_news = [];
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [withdraw_today] = await connection.query(
      "SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC LIMIT 100",
      [phone],
    );
    for (let i = 0; i < withdraw_today.length; i++) {
      list_withdraw_news.push(withdraw_today[i]);
    }
  }
  return res.status(200).json({
    message: "Failed",
    status: true,
    list_withdraw_news: list_withdraw_news,
    timeStamp: timeNow,
  });
};

const listRechargeMem = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  if (auths[0].phone != userInfo.ctv) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [recharge] = await connection.query(
    `SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM recharge WHERE phone = ?`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: recharge,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const listWithdrawMem = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  if (auths[0].phone != userInfo.ctv) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [withdraw] = await connection.query(
    `SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM withdraw WHERE phone = ?`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: withdraw,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const listRedenvelope = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  if (auths[0].phone != userInfo.ctv) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [redenvelopes_used] = await connection.query(
    `SELECT * FROM redenvelopes_used WHERE phone_used = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM redenvelopes_used WHERE phone_used = ?`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: redenvelopes_used,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const listBet = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  if (auths[0].phone != userInfo.ctv) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [listBet] = await connection.query(
    `SELECT * FROM minutes_1 WHERE phone = ? AND status != 0 ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM minutes_1 WHERE phone = ? AND status != 0`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: listBet,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const buffMoney = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.body.username;
  let select = req.body.select;
  let money = req.body.money;

  if (!phone || !select || !money) {
    return res.status(200).json({
      message: "Fail",
      status: false,
    });
  }

  const [users] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (users.length == 0) {
    return res.status(200).json({
      message: "Account does not exist",
      status: false,
    });
  }
  let userInfo = users[0];
  let authInfo = auths[0];

  const [point_list] = await connection.query(
    "SELECT `money_us` FROM point_list WHERE phone = ? ",
    [authInfo.phone],
  );

  let check = point_list[0].money_us;

  if (select == "1") {
    if (check - money >= 0) {
      const d = new Date();
      const time = d.getTime();
      await connection.query(
        "UPDATE users SET money = money + ? WHERE phone = ? ",
        [money, userInfo.phone],
      );
      await connection.query(
        "UPDATE point_list SET money_us = money_us - ? WHERE phone = ? ",
        [money, authInfo.phone],
      );
      let sql =
        "INSERT INTO financial_details SET phone = ?, phone_used = ?, money = ?, type = ?, time = ?";
      await connection.query(sql, [
        authInfo.phone,
        userInfo.phone,
        money,
        "1",
        time,
      ]);

      const [moneyN] = await connection.query(
        "SELECT `money_us` FROM point_list WHERE phone = ? ",
        [authInfo.phone],
      );
      return res.status(200).json({
        message: "Success",
        status: true,
        money: moneyN[0].money_us,
      });
    } else {
      return res.status(200).json({
        message: "Insufficient balance",
        status: false,
      });
    }
  } else {
    const d = new Date();
    const time = d.getTime();
    await connection.query(
      "UPDATE users SET money = money - ? WHERE phone = ? ",
      [money, userInfo.phone],
    );
    await connection.query(
      "UPDATE point_list SET money = money + ? WHERE phone = ? ",
      [money, authInfo.phone],
    );
    let sql =
      "INSERT INTO financial_details SET phone = ?, phone_used = ?, money = ?, type = ?, time = ?";
    await connection.query(sql, [
      authInfo.phone,
      userInfo.phone,
      money,
      "2",
      time,
    ]);
    return res.status(200).json({
      message: "Success",
      status: true,
    });
  }
};

const dailyController = {
  buffMoney,
  dailyPage,
  middlewareDailyController,
  userInfo,
  statistical,
  listMeber,
  profileMember,
  infoCtv,
  infoCtv2,
  settingPage,
  giftPage,
  support,
  settings,
  createBonus,
  listRedenvelops,
  listMember,
  listRecharge,
  listWithdraw,
  listRechargeP,
  listWithdrawP,
  pageInfo,
  listRechargeMem,
  listWithdrawMem,
  listRedenvelope,
  listBet,
};

export default dailyController;
