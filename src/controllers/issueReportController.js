import connection from "../config/connectDB.js";

let timeNow = Date.now();

const adminPage = async (req, res) => {
  return res.render("manage/index.ejs");
};

const issueResolved = async (req, res) => {
  return res.render("manage/Issue/issueResolved.ejs");
};

const issuePending = async (req, res) => {
  return res.render("manage/Issue/issuePending.ejs");
};

const middlewareAdminController = async (req, res, next) => {
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
      if (rows[0].level == 1) {
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

//aman
const createDepositIssueReport = async (req, res) => {
  try {
    let auth = req.cookies.auth;
    if (!auth) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: new Date().toISOString(),
      });
    }

    const [users] = await connection.query(
      "SELECT * FROM users WHERE token = ?",
      [auth],
    );

    const user = users[0];

    const [alreadyIssueHave] = await connection.query(
      "SELECT * FROM issue_reports WHERE orderNumber = ? AND phone_number = ? AND report_status = ?",
      [req.body.orderNumber, user.phone, "open"],
    );

    if (alreadyIssueHave.length > 0) {
      return res.status(400).json({
        message: "Already issue open",
        status: false,
        timeStamp: new Date().toISOString(),
      });
  }


      // Get file paths for the uploaded images
      const file_path = req.files?.file_path ? `/uploads/${req.files.file_path[0].filename}` : null;


        // problemType: deposit_problem
				// utrNumber: 427490753600
				// receiverUpiId: 427490753609@ybl
				// textarea: sdf
				// file_path: (binary)
				// problem_type: deposit_problem
				// description: sdf
				// orderNumber: 2025012299503053838956
				// utrNumber: 427490753600
				// orderAmount: 200
				// receiverUpiId: 427490753609@ybl

      // Insert new record with updated data and file paths
      await connection.query(
        `INSERT INTO issue_reports (problem_type, description, file_path, user_name, phone_number, orderAmount, orderNumber, utrNumber, receiverUpiId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.body.problemType, req.body.textarea, file_path, user.name_user, user.phone, parseFloat(req.body.orderAmount), req.body.orderNumber, req.body.utrNumber, req.body.receiverUpiId]
      );


      return res.status(200).json({
        message: "Issue Reported Successfully",
        status: true,
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
    });
  }
};
const createWithdrawalIssueReport = async (req, res) => {
  try {
    let auth = req.cookies.auth;
    if (!auth) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: new Date().toISOString(),
      });
    }

    const [users] = await connection.query(
      "SELECT * FROM users WHERE token = ?",
      [auth],
    );

    const user = users[0];

    const [alreadyIssueHave] = await connection.query(
      "SELECT * FROM issue_reports WHERE orderNumber = ? AND phone_number = ? AND report_status = ?",
      [req.body.orderNumber, user.phone, "open"],
    );

    if (alreadyIssueHave.length > 0) {
      return res.status(400).json({
        message: "Already issue open",
        status: false,
        timeStamp: new Date().toISOString(),
      });
  }


      // Get file paths for the uploaded images
      const file_path = req.files?.file_path ? `/uploads/${req.files.file_path[0].filename}` : null;


        // problemType: deposit_problem
				// utrNumber: 427490753600
				// receiverUpiId: 427490753609@ybl
				// textarea: sdf
				// file_path: (binary)
				// problem_type: deposit_problem
				// description: sdf
				// orderNumber: 2025012299503053838956
				// utrNumber: 427490753600
				// orderAmount: 200
				// receiverUpiId: 427490753609@ybl

      // Insert new record with updated data and file paths
      await connection.query(
        `INSERT INTO issue_reports (problem_type, description, file_path, user_name, phone_number, orderAmount, orderNumber)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.body.problemType, req.body.textarea, file_path, user.name_user, user.phone, parseFloat(req.body.orderAmount), req.body.orderNumber]
      );


      return res.status(200).json({
        message: "Issue Reported Successfully",
        status: true,
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
    });
  }
};

const createIssueReport = async (req, res) => {
  try {
    let auth = req.cookies.auth;

    if (!auth) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: new Date().toISOString(),
      });
    }

    const { problem_type, description } = req.body;

    // Ensure the required fields are present
    if (!problem_type || !description) {
        return res.status(400).json({ error: 'Problem type and description are required.' });
    }


    const [users] = await connection.query(
      "SELECT * FROM users WHERE token = ?",
      [auth],
    );

    const user = users[0];

    const [alreadyIssueHave] = await connection.query(
      "SELECT * FROM issue_reports WHERE phone_number = ? AND report_status = ?",
      [user.phone, "open"],
    );

    if (alreadyIssueHave.length > 0) {
      return res.status(400).json({
        message: "Already issue open",
        status: false,
        timeStamp: new Date().toISOString(),
      });
  }


      // Get file paths for the uploaded images
      const file_path = req.files?.file_path ? `/uploads/${req.files.file_path[0].filename}` : null;


      // Insert new record with updated data and file paths
      await connection.query(
        `INSERT INTO issue_reports (problem_type, description, file_path, user_name, phone_number)
                   VALUES (?, ?, ?, ?, ?)`,
        [problem_type, description, file_path, user.name_user, user.phone]
      );

      return res.status(200).json({
        message: "Issue Reported Successfully",
        status: true,
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
    });
  }
};

const getMyIssueReport = async (req, res) => {
  try {
    let auth = req.cookies.auth;

    if (!auth) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: new Date().toISOString(),
      });
    }

    const [users] = await connection.query(
      "SELECT * FROM users WHERE token = ?",
      [auth],
    );
    const user = users[0];

    const [issueReported] = await connection.query(
      "SELECT * FROM issue_reports WHERE phone_number = ?",
      [user.phone],
    );

      return res.status(200).json({
        message: "Issue fetch Successfully",
        status: true,
        data: issueReported
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
    });
  }
};

const getAllOpenIssue = async (req, res) => {
  try {
    let { typeid, pageno, limit, search, language } = req.body;

    // Fallback for default pagination
    pageno = pageno || 1;
    limit = limit || 30;

    // Calculating offset for pagination
    const offset = (pageno - 1) * limit;

    // SQL query to fetch issues based on the type
    let query = "SELECT * FROM issue_reports WHERE report_status = ? LIMIT ? OFFSET ?";
    let queryParams = [typeid, limit, offset];

    // Add search filtering if search query is provided
    if (search) {
      query = "SELECT * FROM issue_reports WHERE report_status = ? AND phone_number LIKE ? LIMIT ? OFFSET ?";
      queryParams = [typeid, `%${search}%`, limit, offset];
    }

    // Ensure that the limit and offset are passed as integers
    queryParams[1] = parseInt(queryParams[1]);
    queryParams[2] = parseInt(queryParams[2]);

    const [issueReported] = await connection.query(query, queryParams);

    // Query to get the total number of records (for pagination)
    const [totalCountResult] = await connection.query("SELECT COUNT(*) AS total FROM issue_reports WHERE report_status = ?", [typeid]);
    const totalCount = totalCountResult[0].total;
    const pageTotal = Math.ceil(totalCount / limit);

    return res.status(200).json({
      message: "Issues fetched successfully",
      status: true,
      datas: issueReported,
      page_total: pageTotal,
      total_count: totalCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
    });
  }
};
const closeIssue = async (req, res) => {
  try {
    const { issueId, resolution } = req.body;

    // Ensure the required fields are present
    if (!resolution || !issueId) {
      return res.status(400).json({ error: 'issueId and resolution are required.' });
    }

    // Correct SQL query syntax for updating the issue report
    await connection.query(
      `UPDATE issue_reports
      SET report_status = 'closed', report_answer = ?
      WHERE id = ?`,
      [resolution, issueId]
    );

    return res.status(200).json({
      message: "Issue resolution successfully updated.",
      status: true,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
    });
  }
};



const issueReportController = {
  createDepositIssueReport,
  createWithdrawalIssueReport,
  adminPage,
  createIssueReport,
  getMyIssueReport,
  issuePending,
  issueResolved,
  getAllOpenIssue,
  middlewareAdminController,
  closeIssue,
};

export default issueReportController;
