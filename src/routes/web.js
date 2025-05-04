import express from "express";
import accountController from "../controllers/accountController.js";
import homeController from "../controllers/homeController.js";
import winGoController from "../controllers/winGoController.js";
import userController from "../controllers/userController.js";
import middlewareController from "../controllers/middlewareController.js";
import adminController from "../controllers/adminController.js";
import dailyController from "../controllers/dailyController.js";
import k5Controller from "../controllers/k5Controller.js";
import k3Controller from "../controllers/k3Controller.js";
import paymentController from "../controllers/paymentController.js";
import jiliGamesController, {
  GAME_CATEGORIES_MAP,
} from "../controllers/jiliGamesController.js";
import withdrawalController from "../controllers/withdrawalController.js";
import trxWingoController from "../controllers/trxWingoController.js";
import gameController from "../controllers/gameController.js";
import promotionController from "../controllers/promotionController.js";
import jdbController from "../controllers/jdbController.js";
import vipController from "../controllers/vipController.js";
import rateLimit from "express-rate-limit";
import watchpayController from "../controllers/watchpayController.js";

import jilliGameController from "../controllers/JilliGameController.js";
import spribeController from "../controllers/SpribeController.js";
import upload from "./upload.js";
import issueReportController from "../controllers/issueReportController.js";
import ccpaymentController from '../controllers/ccpaymentController.js';


let router = express.Router();

const initWebRouter = (app) => {
  // page account
  router.post("/jili/auth", jiliGamesController.auth);
  router.post("/jili/bet", jiliGamesController.bet);
  router.post("/jili/cancelBet", jiliGamesController.cancelBet);
  router.post("/jili/sessionBet", jiliGamesController.sessionBet);
  router.post("/jili/cancelSessionBet", jiliGamesController.cancelSessionBet);
  router.get("/jili/game_list", jiliGamesController.gameList);
  router.get(
    "/jili/game_link",
    middlewareController,
    jiliGamesController.getGameLink,
  );
  router.get(
    "/jili/slots",
    middlewareController,
    jiliGamesController.gameSlotsPage(GAME_CATEGORIES_MAP.SLOT),
  );
  router.get(
    "/jili/fishing",
    middlewareController,
    jiliGamesController.gameCategoriesPage(GAME_CATEGORIES_MAP.FISHING),
  );
  router.get(
    "/jili/lobby",
    middlewareController,
    jiliGamesController.gameCategoriesPage(GAME_CATEGORIES_MAP.LOBBY),
  );
  router.get(
    "/jili/casino",
    middlewareController,
    jiliGamesController.gameCategoriesPage(GAME_CATEGORIES_MAP.CASINO),
  );
  router.get(
    "/jili/poker",
    middlewareController,
    jiliGamesController.gameCategoriesPage(GAME_CATEGORIES_MAP.POKER),
  );

  router.get(
    "/jdb/launch",
    middlewareController,
    jdbController.generateGameLink,
  );
  router.post("/home", jdbController.mainFunction);

  router.get("/slotjili", middlewareController, homeController.slotjiliPage);
  router.get(
    "/slotSpribe",
    middlewareController,
    homeController.slotspribePage,
  );
  router.get(
    "/jdb/slots",
    middlewareController,
    jdbController.gameSlotsPage(3),
  );
  router.get(
    "/jdb/fishing",
    middlewareController,
    jdbController.gameCategoriesPage(4),
  );
  router.get(
    "/jdb/casino",
    middlewareController,
    jdbController.gameCategoriesPage(2),
  );
  router.get(
    "/jdb/poker",
    middlewareController,
    jdbController.gameCategoriesPage(5),
  );
  router.get(
    "/jdb/original",
    middlewareController,
    jdbController.gameCategoriesPage(6),
  );
  router.get(
    "/jdb/popular",
    middlewareController,
    jdbController.gameCategoriesPage(1),
  );
  router.get("/jdb/quick", jdbController.gameQuickPopularList);

  router.get("/keFuMenu", accountController.keFuMenu);
  router.get("/memberQuery", accountController.memberQuery);
  router.get("/memberDepositQuery", accountController.memberDepositQuery);
  router.get("/memberWithdrawalQuery", accountController.memberWithdrawalQuery);
  router.get("/myIssueReport", accountController.myIssueReport);
  router.get("/login", accountController.loginPage);
  router.get("/register", accountController.registerPage);
  router.get("/forgot", accountController.forgotPage);
  router.get("/forgot_reset", accountController.forgotResetPage);
  router.post("/api/send_otp", accountController.sendOtpCode);
  router.post("/api/sent/otp/verify", accountController.verifyCode);
  router.post("/api/sent/otp/verify/reset", accountController.verifyCodePass);
  router.post(
    "/api/reset_password",
    accountController.resetPasswordByOtpAndPhone,
  );

  // page home
  router.get("/", (req, res) => {
    return res.redirect("/home");
  });
  router.get("/home", homeController.homePage);
  router.get("/support", homeController.supportPage);
  router.get("/checkIn", middlewareController, homeController.checkInPage);
  router.get("/activity", middlewareController, homeController.activityPage);
  router.get("/dailytask", middlewareController, homeController.dailytaskPage);
  router.get(
    "/invitation_rules",
    middlewareController,
    homeController.invitationRulesPage,
  );
  router.get("/invibonus", middlewareController, homeController.invibonusPage);
  router.get(
    "/invibonus/record",
    middlewareController,
    homeController.invitationRecord,
  );
  router.get(
    "/dailytask/record",
    middlewareController,
    homeController.rechargeAwardCollectionRecord,
  );
  router.get(
    "/attendance/record",
    middlewareController,
    homeController.attendanceRecordPage,
  );
  router.get(
    "/attendance/rules",
    middlewareController,
    homeController.attendanceRulesPage,
  );
  router.get("/rebate", middlewareController, homeController.rebatePage);
  router.get("/jackpot", middlewareController, homeController.jackpotPage);
  router.get("/vip", middlewareController, homeController.vipPage);
  router.get("/checkDes", middlewareController, homeController.checkDes);
  router.get("/checkRecord", middlewareController, homeController.checkRecord);
  router.get(
    "/attendance",
    middlewareController,
    homeController.attendancePage,
  );
  router.get(
    "/first_deposit_bonus",
    middlewareController,
    homeController.firstDepositBonusPage,
  );
  router.get(
    "/aviator_betting_reward",
    middlewareController,
    homeController.aviatorBettingRewardPage,
  );
  router.get(
    "/social_video_award",
    middlewareController,
    homeController.socialVideoAwardPagePage,
  );
  router.get(
    "/world_no_one",
    middlewareController,
    homeController.worldNumberOnedPagePage,
  );
  router.get(
    "/wingo_one_min",
    middlewareController,
    homeController.wingoOneMinPagePage,
  );
  router.get(
    "/slots_games",
    middlewareController,
    homeController.slotGamesPagePage,
  );
  router.get(
    "/partner_reward",
    middlewareController,
    homeController.partnerRewarPagePage,
  );
  router.get(
    "/100_k",
    middlewareController,
    homeController.hundredKPagePage,
  );
  router.get(
    "/jackpot/rules",
    middlewareController,
    homeController.jackpotRulesPage,
  );
  router.get(
    "/jackpot/wining_star",
    middlewareController,
    homeController.jackpotWiningStarPage,
  );
  router.get("/wallet/transfer", middlewareController, homeController.transfer);
  router.get(
    "/game_history",
    middlewareController,
    homeController.gameHistoryPage,
  );

  router.get("/promotion", middlewareController, homeController.promotionPage);
  router.get(
    "/promotion/subordinates",
    middlewareController,
    homeController.subordinatesPage,
  );

  router.get(
    "/promotion1",
    middlewareController,
    homeController.promotion1Page,
  );
  router.get(
    "/promotion/myTeam",
    middlewareController,
    homeController.promotionmyTeamPage,
  );
  router.get(
    "/promotion/promotionDes",
    middlewareController,
    homeController.promotionDesPage,
  );
  router.get(
    "/promotion/comhistory",
    middlewareController,
    homeController.comhistoryPage,
  );
  router.get(
    "/promotion/tutorial",
    middlewareController,
    homeController.tutorialPage,
  );
  router.get(
    "/promotion/bonusrecord",
    middlewareController,
    homeController.bonusRecordPage,
  );
  router.get(
    "/promotion/rebateRadio",
    middlewareController,
    homeController.promotionRebateRatioPage,
  );

  // promotion controller
  router.get(
    "/api/subordinates/summary",
    middlewareController,
    promotionController.subordinatesDataAPI,
  );

  router.get(
    "/api/subordinates",
    middlewareController,
    promotionController.subordinatesAPI,
  );
  router.get(
    "/api/subordinates/details",
    middlewareController,
    promotionController.subordinatesDataByTimeAPI,
  );
  router.get(
    "/api/activity/invitation_bonus",
    middlewareController,
    promotionController.getInvitationBonus,
  );
  router.post(
    "/api/activity/invitation_bonus/claim",
    middlewareController,
    promotionController.claimInvitationBonus,
  );
  router.get(
    "/api/activity/invitation/record",
    middlewareController,
    promotionController.getInvitedMembers,
  );
  router.get(
    "/api/activity/daily_recharge_bonus",
    middlewareController,
    promotionController.getDailyRechargeReword,
  );
  router.post(
    "/api/activity/daily_recharge_bonus/claim",
    middlewareController,
    promotionController.claimDailyRechargeReword,
  );
  // router.post("/api/activity/daily_recharge/record", middlewareController, promotionController.claimDailyRechargeReword)
  router.get(
    "/api/activity/daily_recharge_bonus/record",
    middlewareController,
    promotionController.dailyRechargeRewordRecord,
  );
  router.get(
    "/api/activity/first_recharge_bonus",
    middlewareController,
    promotionController.getFirstRechargeRewords,
  );
  router.post(
    "/api/activity/first_recharge_bonus/claim",
    middlewareController,
    promotionController.claimFirstRechargeReword,
  );
  router.get(
    "/api/activity/attendance_bonus",
    middlewareController,
    promotionController.getAttendanceBonus,
  );
  router.post(
    "/api/activity/attendance_bonus/claim",
    middlewareController,
    promotionController.claimAttendanceBonus,
  );
  router.get(
    "/api/activity/attendance/record",
    middlewareController,
    promotionController.getAttendanceBonusRecord,
  );
  router.get(
    "/api/GetCommissionDetails",
    middlewareController,
    promotionController.GetCommissionDetails,
  );

  router.get(
    "/api/vip/info",
    middlewareController,
    vipController.getMyVIPLevelInfo,
  );
  router.get(
    "/api/vip/history",
    middlewareController,
    vipController.getVIPHistory,
  );

  router.get("/wallet", middlewareController, homeController.walletPage);
  router.get(
    "/wallet/recharge",
    middlewareController,
    homeController.rechargePage,
  );
  router.get(
    "/wallet/withdrawal",
    middlewareController,
    homeController.withdrawalPage,
  );
  router.get(
    "/wallet/rechargerecord",
    middlewareController,
    homeController.rechargerecordPage,
  );
  router.get(
    "/wallet/withdrawalrecord",
    middlewareController,
    homeController.withdrawalrecordPage,
  );
  router.get(
    "/wallet/addBank",
    middlewareController,
    withdrawalController.addBankCardPage,
  );
  router.get(
    "/wallet/selectBank",
    middlewareController,
    withdrawalController.selectBankPage,
  );
  router.get(
    "/wallet/addAddress",
    middlewareController,
    withdrawalController.addUSDTAddressPage,
  );
  router.get(
    "/api/admin/withdraw/usdt_address",
    middlewareController,
    withdrawalController.adminGetUSDTAddressInfo,
  ); // register

  router.get(
    "/api/admin/withdraw/update_usdt_address",
    middlewareController,
    withdrawalController.adminUpdateUSDTAddress,
  ); // register
  router.get(
    "/wallet/transactionhistory",
    middlewareController,
    homeController.transactionhistoryPage,
  );

  router.get(
    "/wallet/paynow/manual_upi",
    middlewareController,
    paymentController.initiateManualUPIPayment,
  );
  router.get(
    "/wallet/paynow/manual_usdt",
    middlewareController,
    paymentController.initiateManualUSDTPayment,
  );
  router.post(
    "/wallet/paynow/manual_upi_request",
    middlewareController,
    paymentController.addManualUPIPaymentRequest,
  );
  router.post(
    "/wallet/paynow/manual_usdt_request",
    middlewareController,
    paymentController.addManualUSDTPaymentRequest,
  );
  //-----------lg pay---------------
  router.post(
    "/wallet/paynow/wowpay",
    middlewareController,
    paymentController.initiateWowPayPayment,
  );
  router.post("/wallet/verify/wowpay", paymentController.verifyWowPayPayment);
  router.get("/wallet/verify/wowpay", paymentController.verifyWowPayPayment);
  //-----------cloud pay---------------
  // router.post(
  //   "/wallet/paynow/cloudpay",
  //   middlewareController,
  //   paymentController.initiateCloudPayPayment,
  // );
  // router.post(
  //   "/wallet/verify/cloudpay",
  //   paymentController.verifyCloudPayPayment,
  // );
  // router.get(
  //   "/wallet/verify/cloudpay",
  //   paymentController.verifyCloudPayPayment,
  // );
  //-----------rs pay---------------
  router.post(
    "/wallet/paynow/rspay",
    middlewareController,
    paymentController.initiateRspayPayment,
  );
  router.post(
    "/admin/wallet/payout/rspay",
    adminController.middlewareAdminController,
    paymentController.initiateRspayOutPayment,
  );
  router.post(
    "/admin/wallet/payout/rspay/withdrawal",
    adminController.middlewareAdminController,
    paymentController.initiateWithdrawalRspayOutPayment,
  );
  router.post("/wallet/verify/rspay", paymentController.verifyRspayPayment);
  router.get("/wallet/verify/rspay", paymentController.verifyRspayPayment);
  router.post(
    "/wallet/paynow/upi",
    middlewareController,
    paymentController.initiateUPIPayment,
  );
  router.get(
    "/wallet/verify/upi",
    middlewareController,
    paymentController.verifyUPIPayment,
  );
  // router.get(
  //   "/wallet/paynow/rspay",
  //   middlewareController,
  //   paymentController.initiateRspayPayment,
  // );
  // router.post("/wallet/verify/rspay", paymentController.verifyRspayPayment);

  router.get(
    "/wallet/paynow/upay",
    middlewareController,
    paymentController.initiateUpayPayment,
  );
  router.post("/wallet/verify/upay", paymentController.verifyUpayPayment);

  router.get(
    "/game/statistics",
    middlewareController,
    gameController.gameStatistics,
  );
  router.get(
    "/mian/game_statistics",
    middlewareController,
    gameController.gameStatisticsPage,
  );

  router.get("/mian", middlewareController, homeController.mianPage);
  router.get("/settings", middlewareController, homeController.settingsPage);
  router.get(
    "/admin/manager/rspay/withdraw",
    middlewareController,
    homeController.rsPayWithdrawalPage,
  );
  router.get(
    "/admin/manager/rspay/withdraw/history",
    middlewareController,
    homeController.rsPayWithdrawalHistoryPage,
  );
  router.get(
    "/settings/change_avatar",
    middlewareController,
    homeController.changeAvatarPage,
  );

  router.get(
    "/recordsalary",
    middlewareController,
    homeController.recordsalary,
  );
  router.get(
    "/getrecord",
    middlewareController,
    homeController.getSalaryRecord,
  );
  router.get("/about", middlewareController, homeController.aboutPage);
  router.get("/guide", middlewareController, homeController.guidePage);
  router.get("/feedback", middlewareController, homeController.feedbackPage);
  router.get(
    "/notification",
    middlewareController,
    homeController.notificationPage,
  );
  router.get(
    "/login_notification",
    middlewareController,
    homeController.loginNotificationPage,
  );
  router.get(
    "/redenvelopes",
    middlewareController,
    homeController.redenvelopes,
  );
  router.get("/mian/forgot", middlewareController, homeController.forgot);
  router.get("/newtutorial", homeController.newtutorial);
  router.get(
    "/about/privacyPolicy",
    middlewareController,
    homeController.privacyPolicy,
  );
  router.get(
    "/about/riskAgreement",
    middlewareController,
    homeController.riskAgreement,
  );

  router.get("/myProfile", middlewareController, homeController.myProfilePage);

  // BET wingo
  router.get("/wingo", middlewareController, winGoController.winGoPage);
  // router.get("/win", middlewareController, winGoController.winGoPage)
  // router.get("/win/3", middlewareController, winGoController.winGoPage3)
  // router.get("/win/5", middlewareController, winGoController.winGoPage5)
  // router.get("/win/10", middlewareController, winGoController.winGoPage10)

  // BET trx wingo
  router.get(
    "/trx_wingo",
    middlewareController,
    trxWingoController.trxWingoPage,
  );
  // router.get("/trx_wingo/3", middlewareController, trxWingoController.trxWingoPage3)
  // router.get("/trx_wingo/5", middlewareController, trxWingoController.trxWingoPage3)
  // router.get("/trx_wingo/10", middlewareController, trxWingoController.trxWingoPage10)
  router.get(
    "/trx_block",
    middlewareController,
    trxWingoController.trxWingoBlockPage,
  );

  // BET K5D
  router.get("/5d", middlewareController, k5Controller.K5DPage);
  router.post(
    "/api/webapi/action/5d/join",
    middlewareController,
    k5Controller.betK5D,
  ); // register
  router.post(
    "/api/webapi/5d/GetNoaverageEmerdList",
    middlewareController,
    k5Controller.listOrderOld,
  ); // register
  router.post(
    "/api/webapi/5d/GetMyEmerdList",
    middlewareController,
    k5Controller.GetMyEmerdList,
  ); // register

  // BET K3
  router.get("/k3", middlewareController, k3Controller.K3Page);

  router.post(
    "/api/webapi/action/k3/join",
    middlewareController,
    k3Controller.betK3,
  ); // register
  router.post(
    "/api/webapi/k3/GetNoaverageEmerdList",
    middlewareController,
    k3Controller.listOrderOld,
  ); // register
  router.post(
    "/api/webapi/k3/GetMyEmerdList",
    middlewareController,
    k3Controller.GetMyEmerdList,
  ); // register

  // login | register
  router.post("/api/webapi/login", accountController.login); // login
  router.post("/api/webapi/register", accountController.register); // register
  router.get("/aviator", middlewareController, userController.aviator);
  router.get(
    "/api/webapi/GetUserInfo",
    middlewareController,
    userController.userInfo,
  ); // get info account
  router.put(
    "/api/webapi/change/userInfo",
    middlewareController,
    userController.changeUser,
  ); // get info account
  router.put(
    "/api/webapi/change/pass",
    middlewareController,
    accountController.resetPasswordByPassword,
  ); // get info account
  router.patch(
    "/api/webapi/change/avatar",
    middlewareController,
    accountController.updateAvatarAPI,
  ); // get info account
  router.patch(
    "/api/webapi/change/username",
    middlewareController,
    accountController.updateUsernameAPI,
  ); // get info account

  // bet wingo
  router.post(
    "/api/webapi/action/join",
    middlewareController,
    winGoController.betWinGo,
  ); // register
  router.post(
    "/api/webapi/GetNoaverageEmerdList",
    middlewareController,
    winGoController.listOrderOld,
  ); // register
  router.post(
    "/api/webapi/GetMyEmerdList",
    middlewareController,
    winGoController.GetMyEmerdList,
  ); // register

  // bet TRX wingo
  router.post(
    "/api/webapi/trx_wingo/action/join",
    middlewareController,
    trxWingoController.betTrxWingo,
  ); // register
  router.post(
    "/api/webapi/trx_wingo/GetNoaverageEmerdList",
    middlewareController,
    trxWingoController.listOrderOld,
  ); // register
  router.post(
    "/api/webapi/trx_wingo/GetMyEmerdList",
    middlewareController,
    trxWingoController.GetMyEmerdList,
  ); // register

  // promotion
  router.post(
    "/api/webapi/promotion",
    middlewareController,
    userController.promotion,
  ); // register
  router.post(
    "/api/webapi/checkIn",
    middlewareController,
    userController.checkInHandling,
  ); // register
  router.post(
    "/api/webapi/check/Info",
    middlewareController,
    userController.infoUserBank,
  ); // register
  router.post(
    "/api/webapi/addBank",
    middlewareController,
    userController.addBank,
  ); // register
  router.post(
    "/api/webapi/otp",
    middlewareController,
    userController.verifyCode,
  ); // register
  router.post(
    "/api/webapi/use/redenvelope",
    middlewareController,
    userController.useRedenvelope,
  ); // register

  // wallet
  router.post(
    "/api/webapi/recharge",
    middlewareController,
    userController.recharge,
  );
  router.post(
    "/api/webapi/cancel_recharge",
    middlewareController,
    userController.cancelRecharge,
  ); // register
  router.post("/wowpay/create", middlewareController, userController.wowpay);
  router.post(
    "/api/webapi/confirm_recharge",
    middlewareController,
    userController.confirmRecharge,
  );
  router.get(
    "/api/webapi/myTeam",
    middlewareController,
    userController.listMyTeam,
  ); // register
  router.get(
    "/api/webapi/recharge/list",
    middlewareController,
    userController.listRecharge,
  ); // register
  router.get(
    "/api/webapi/withdraw/transactionRecord",
    middlewareController,
    userController.listTransaction,
  ); // register
  router.get(
    "/api/webapi/withdraw/",
    middlewareController,
    userController.listWithdraw,
  ); // register
  router.post(
    "/api/webapi/withdrawal",
    middlewareController,
    userController.withdrawal3,
  ); // register
  // --

  const withdrawalRateLimiter = rateLimit({
    windowMs: 5 * 1000, // 15 minutes
    max: 1, // Limit each IP to 5 withdrawal requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: function (req, res /*, next */) {
      res.status(429).json({
        message:
          "Too many withdrawal requests created from this IP, please try again after 5 second",
        status: false,
        timeStamp: new Date().toISOString(),
      });
    },
  });

  router.post(
    "/api/webapi/withdraw/create",
    withdrawalRateLimiter,
    middlewareController,
    withdrawalController.createWithdrawalRequest,
  ); // register
  router.post(
    "/api/webapi/withdraw/add_bank_card",
    middlewareController,
    withdrawalController.addBankCard,
  ); // register
  router.post(
    "/api/webapi/withdraw/add_usdt_address",
    middlewareController,
    withdrawalController.addUSDTAddress,
  ); // register
  router.get(
    "/api/webapi/withdraw/bank_card",
    middlewareController,
    withdrawalController.getBankCardInfo,
  ); // register
  router.get(
    "/api/webapi/withdraw/usdt_address",
    middlewareController,
    withdrawalController.getUSDTAddressInfo,
  ); // register
  router.get(
    "/api/webapi/withdraw/history",
    middlewareController,
    withdrawalController.listWithdrawalHistory,
  ); // register
  router.get(
    "/api/webapi/withdraw/pending",
    middlewareController,
    withdrawalController.listWithdrawalRequests,
  ); // register
  router.post(
    "/api/webapi/admin/withdraw/status",
    adminController.middlewareAdminController,
    withdrawalController.approveOrDenyWithdrawalRequest,
  ); // register
  // router.post("/api/webapi/recharge/check", middlewareController, userController.recharge2) // register
  // router.post("/api/webapi/callback_bank", middlewareController, userController.callback_bank) // register
  // router.post("/api/webapi/recharge/update", middlewareController, userController.updateRecharge) // update recharge
  router.post(
    "/api/webapi/transfer",
    middlewareController,
    userController.transfer,
  ); // register
  router.get(
    "/api/webapi/transfer_history",
    middlewareController,
    userController.transferHistory,
  ); //
  router.get(
    "/api/webapi/confirm_recharge_usdt",
    middlewareController,
    userController.confirmUSDTRecharge,
  ); //
  router.post(
    "/api/webapi/confirm_recharge_usdt",
    middlewareController,
    userController.confirmUSDTRecharge,
  ); //
  router.post(
    "/api/webapi/search",
    middlewareController,
    userController.search,
  ); // register

  // daily
  router.get(
    "/manager/index",
    dailyController.middlewareDailyController,
    dailyController.dailyPage,
  );
  router.get(
    "/manager/listRecharge",
    dailyController.middlewareDailyController,
    dailyController.listRecharge,
  );
  router.get(
    "/manager/listWithdraw",
    dailyController.middlewareDailyController,
    dailyController.listWithdraw,
  );
  router.get(
    "/manager/members",
    dailyController.middlewareDailyController,
    dailyController.listMeber,
  );
  router.get(
    "/manager/profileMember",
    dailyController.middlewareDailyController,
    dailyController.profileMember,
  );
  router.get(
    "/manager/settings",
    dailyController.middlewareDailyController,
    dailyController.settingPage,
  );
  router.get(
    "/manager/gifts",
    dailyController.middlewareDailyController,
    dailyController.giftPage,
  );
  router.get(
    "/manager/support",
    dailyController.middlewareDailyController,
    dailyController.support,
  );
  router.get(
    "/manager/member/info/:phone",
    dailyController.middlewareDailyController,
    dailyController.pageInfo,
  );

  router.post(
    "/manager/member/info/:phone",
    dailyController.middlewareDailyController,
    dailyController.userInfo,
  );
  router.post(
    "/manager/member/listRecharge/:phone",
    dailyController.middlewareDailyController,
    dailyController.listRechargeMem,
  );
  router.post(
    "/manager/member/listWithdraw/:phone",
    dailyController.middlewareDailyController,
    dailyController.listWithdrawMem,
  );
  router.post(
    "/manager/member/redenvelope/:phone",
    dailyController.middlewareDailyController,
    dailyController.listRedenvelope,
  );
  router.post(
    "/manager/member/bet/:phone",
    dailyController.middlewareDailyController,
    dailyController.listBet,
  );

  router.post(
    "/admin/member/apibet/:phone",
    adminController.middlewareAdminController,
    adminController.apiListBet,
  );

  router.post(
    "/manager/settings/list",
    dailyController.middlewareDailyController,
    dailyController.settings,
  );
  router.post(
    "/manager/createBonus",
    dailyController.middlewareDailyController,
    dailyController.createBonus,
  );
  router.post(
    "/manager/listRedenvelops",
    dailyController.middlewareDailyController,
    dailyController.listRedenvelops,
  );

  router.post(
    "/manager/listRecharge",
    dailyController.middlewareDailyController,
    dailyController.listRechargeP,
  );
  router.post(
    "/manager/listWithdraw",
    dailyController.middlewareDailyController,
    dailyController.listWithdrawP,
  );

  router.post(
    "/api/webapi/statistical",
    dailyController.middlewareDailyController,
    dailyController.statistical,
  );
  router.post(
    "/manager/infoCtv",
    dailyController.middlewareDailyController,
    dailyController.infoCtv,
  ); // get info account
  router.post(
    "/manager/infoCtv/select",
    dailyController.middlewareDailyController,
    dailyController.infoCtv2,
  ); // get info account
  router.post(
    "/api/webapi/manager/listMember",
    dailyController.middlewareDailyController,
    dailyController.listMember,
  ); // get info account

  router.post(
    "/api/webapi/manager/buff",
    dailyController.middlewareDailyController,
    dailyController.buffMoney,
  ); // get info account

  // admin


  router.get(
    "/admin/manager/index",
    adminController.middlewareAdminController,
    adminController.adminPage,
  ); // get info account
  router.get('/admin/manager/demo', adminController.middlewareAdminController, adminController.demoPage); // get info account
  router.get(
    "/admin/manager/index/3",
    adminController.middlewareAdminController,
    adminController.adminPage3,
  ); // get info account
  router.get(
    "/admin/manager/index/5",
    adminController.middlewareAdminController,
    adminController.adminPage5,
  ); // get info account
  router.get(
    "/admin/manager/index/10",
    adminController.middlewareAdminController,
    adminController.adminPage10,
  ); // get info account

  router.get(
    "/admin/manager/5d",
    adminController.middlewareAdminController,
    adminController.adminPage5d,
  ); // get info account
  router.get(
    "/admin/manager/k3",
    adminController.middlewareAdminController,
    adminController.adminPageK3,
  ); // get info account

  router.get(
    "/admin/manager/members",
    adminController.middlewareAdminController,
    adminController.membersPage,
  ); // get info account
  router.get(
    "/admin/manager/createBonus",
    adminController.middlewareAdminController,
    adminController.giftPage,
  ); // get info account
  router.get(
    "/admin/manager/ctv",
    adminController.middlewareAdminController,
    adminController.ctvPage,
  ); // get info account
  router.get(
    "/admin/manager/ctv/profile/:phone",
    adminController.middlewareAdminController,
    adminController.ctvProfilePage,
  ); // get info account

  router.get(
    "/admin/manager/settings",
    adminController.middlewareAdminController,
    adminController.settings,
  ); // get info account
  router.get(
    "/admin/manager/listRedenvelops",
    adminController.middlewareAdminController,
    adminController.listRedenvelops,
  ); // get info account
  router.post(
    "/admin/manager/infoCtv",
    adminController.middlewareAdminController,
    adminController.infoCtv,
  ); // get info account
  router.post(
    "/admin/manager/infoCtv/select",
    adminController.middlewareAdminController,
    adminController.infoCtv2,
  ); // get info account
  //aman
  // Define your router and apply multer middleware to handle file uploads
  router.post(
    "/admin/manager/settings/bank",
    upload.fields([{ name: "upi_id_qr" }, { name: "usdt_wallet_address_qr" }]), // Add fields for file uploads
    adminController.middlewareAdminController,
    adminController.settingBank,
  );
  // router.post(
  //   "/admin/manager/settings/bank",
  //   adminController.middlewareAdminController,
  //   adminController.settingBank,
  // ); // get info account
  router.post(
    "/admin/manager/settings/cskh",
    adminController.middlewareAdminController,
    adminController.settingCskh,
  ); // get info account
  router.post(
    "/admin/manager/settings/buff",
    adminController.middlewareAdminController,
    adminController.settingbuff,
  ); // get info account
  router.post(
    "/admin/manager/create/ctv",
    adminController.middlewareAdminController,
    adminController.register,
  ); // get info account
  router.post(
    "/admin/manager/settings/get",
    adminController.middlewareAdminController,
    adminController.settingGet,
  ); // get info account
  router.post(
    "/admin/manager/createBonus",
    adminController.middlewareAdminController,
    adminController.createBonus,
  ); // get info account

  router.post(
    "/admin/member/listRecharge/:phone",
    adminController.middlewareAdminController,
    adminController.listRechargeMem,
  );
  router.post(
    "/admin/member/listWithdraw/:phone",
    adminController.middlewareAdminController,
    adminController.listWithdrawMem,
  );
  router.post(
    "/admin/member/redenvelope/:phone",
    adminController.middlewareAdminController,
    adminController.listRedenvelope,
  );
  router.post(
    "/admin/member/bet/:phone",
    adminController.middlewareAdminController,
    adminController.listBet,
  );

  router.get(
    "/admin/manager/recharge",
    adminController.middlewareAdminController,
    adminController.rechargePage,
  ); // get info account
  router.get(
    "/admin/manager/withdraw",
    adminController.middlewareAdminController,
    adminController.withdraw,
  ); // get info account
  // router.get('/admin/manager/level', adminController.middlewareAdminController, adminController.level); // get info account
  router.get(
    "/admin/manager/levelSetting",
    adminController.middlewareAdminController,
    adminController.levelSetting,
  );
  router.get(
    "/admin/manager/CreatedSalaryRecord",
    adminController.middlewareAdminController,
    adminController.CreatedSalaryRecord,
  );
  router.get(
    "/admin/manager/DailySalaryEligibility",
    adminController.middlewareAdminController,
    adminController.DailySalaryEligibility,
  );
  router.get(
    "/admin/manager/rechargeRecord",
    adminController.middlewareAdminController,
    adminController.rechargeRecord,
  ); // get info account
  router.get(
    "/admin/manager/withdrawRecord",
    adminController.middlewareAdminController,
    adminController.withdrawRecord,
  ); // get info account
  router.get(
    "/admin/manager/statistical",
    adminController.middlewareAdminController,
    adminController.statistical,
  ); // get info account
  router.get(
    "/admin/member/info/:id",
    adminController.middlewareAdminController,
    adminController.infoMember,
  );
  router.get(
    "/api/webapi/admin/getLevelInfo",
    adminController.middlewareAdminController,
    adminController.getLevelInfo,
  );
  router.get(
    "/api/webapi/admin/getSalary",
    adminController.middlewareAdminController,
    adminController.getSalary,
  );

  router.get(
    "/api/webapi/admin/listCheckSalaryEligibility",
    adminController.middlewareAdminController,
    adminController.listCheckSalaryEligibility,
  );

  router.post(
    "/api/webapi/admin/updateLevel",
    adminController.middlewareAdminController,
    adminController.updateLevel,
  ); // get info account
  router.post(
    "/api/webapi/admin/CreatedSalary",
    adminController.middlewareAdminController,
    adminController.CreatedSalary,
  ); // get info account
  router.post(
    "/api/webapi/admin/listMember",
    adminController.middlewareAdminController,
    adminController.listMember,
  ); // get info account
  router.post(
    "/api/webapi/admin/listctv",
    adminController.middlewareAdminController,
    adminController.listCTV,
  ); // get info account
  router.post(
    "/api/webapi/admin/withdraw",
    adminController.middlewareAdminController,
    adminController.handlWithdraw,
  ); // get info account
  router.post(
    "/api/webapi/admin/recharge",
    adminController.middlewareAdminController,
    adminController.recharge,
  ); // get info account
  router.post(
    "/api/webapi/admin/rechargeDuyet",
    adminController.middlewareAdminController,
    adminController.rechargeDuyet,
  ); // get info account
  router.post(
    "/api/webapi/admin/member/info",
    adminController.middlewareAdminController,
    adminController.userInfo,
  ); // get info account
  router.get(
    "/api/webapi/admin/wallet",
    adminController.middlewareAdminController,
    adminController.walletData,
  );
  router.post(
    "/api/webapi/admin/wallet2",
    adminController.middlewareAdminController,
    adminController.walletData2,
  );
  router.post(
    "/api/webapi/admin/agentWallet",
    adminController.middlewareAdminController,
    adminController.agentWalletData,
  );
  router.get(
    "/admin/manager/dashboard",
    adminController.middlewareAdminController,
    adminController.Dashboard,
  ); // get info account
  router.get(
    "/admin/manager/dashboard2",
    adminController.middlewareAdminController,
    adminController.Dashboard2,
  ); // get info account
  router.get(
    "/admin/manager/agent/dashboard",
    adminController.middlewareAdminController,
    adminController.AgentDashboard,
  ); // get info account
  router.post(
    "/api/webapi/admin/statistical",
    adminController.middlewareAdminController,
    adminController.statistical2,
  ); // get info account
  router.get(
    "/api/webapi/admin/recharge/pending",
    adminController.middlewareAdminController,
    paymentController.browseRechargeRecord,
  ); // get info account
  router.post(
    "/api/webapi/admin/recharge/status",
    adminController.middlewareAdminController,
    paymentController.setRechargeStatus,
  ); // get info account

  router.post(
    "/api/webapi/admin/banned",
    adminController.middlewareAdminController,
    adminController.banned,
  ); // get info account
  router.post(
    "/api/webapi/admin/makesubagent",
    adminController.middlewareAdminController,
    adminController.makesubagent,
  ); // get info account

  router.post(
    "/api/webapi/admin/totalJoin",
    adminController.middlewareAdminController,
    adminController.totalJoin,
  ); // get info account
  router.post(
    "/api/webapi/admin/change",
    adminController.middlewareAdminController,
    adminController.changeAdmin,
  ); // get info account
  router.post(
    "/api/webapi/admin/profileUser",
    adminController.middlewareAdminController,
    adminController.profileUser,
  ); // get info account

  // admin 5d
  router.post(
    "/api/webapi/admin/5d/listOrders",
    adminController.middlewareAdminController,
    adminController.listOrderOld,
  ); // get info account
  router.post(
    "/api/webapi/admin/k3/listOrders",
    adminController.middlewareAdminController,
    adminController.listOrderOldK3,
  ); // get info account
  router.post(
    "/api/webapi/admin/5d/editResult",
    adminController.middlewareAdminController,
    adminController.editResult,
  ); // get info account
  router.post(
    "/api/webapi/admin/k3/editResult",
    adminController.middlewareAdminController,
    adminController.editResult2,
  ); // get info account

  router.post(
    "/api/webapi/admin/k3/editResult",
    adminController.middlewareAdminController,
    adminController.editResult2,
  ); // get info account
  return app.use("/", router);
};

//jillie game routes
// router.get('/getAllJillieGames', jilliGameController.getAllJillieGames);
// router.post('/playJillieGame', middlewareController, jilliGameController.playJillieGame);
// router.post('/api/callback/auth', jilliGameController.jillieAuth);
// router.post('/api/callback/bet', jilliGameController.jillieBet);
// router.post('/api/callback/cancelBet', jilliGameController.jillieCancelBet);
// router.post('/api/callback/sessionBet', jilliGameController.jillieSessionBet);
// router.post('/api/callback/cancelSessionBet', jilliGameController.jillieCancelSessionBet);
// router.post('/getSinglePlyerBetRecord',middlewareController, jilliGameController.getSinglePlyerBetRecord);

//jillie game routes
router.get("/getAllJillieGames", jilliGameController.getAllJillieGames);
router.post(
  "/playJillieGame",
  middlewareController,
  jilliGameController.playJillieGame,
);
router.post("/api/callback/jili/auth", jilliGameController.jillieAuth);
router.post("/api/callback/jili/bet", jilliGameController.jillieBet);
router.post(
  "/api/callback/jili/cancelBet",
  jilliGameController.jillieCancelBet,
);
router.post(
  "/api/callback/jili/sessionBet",
  jilliGameController.jillieSessionBet,
);
router.post(
  "/api/callback/jili/cancelSessionBet",
  jilliGameController.jillieCancelSessionBet,
);
router.post(
  "/getSinglePlyerBetRecord",
  middlewareController,
  jilliGameController.getSinglePlyerBetRecord,
);

//jillie game history
router.get(
  "/jillie/history",
  middlewareController,
  jilliGameController.jillieSinglePlayerHistoryPage,
);

//spribe api
//spribe api game
router.post('/playSpribeGame', middlewareController, spribeController.spribeLaunchGame);
router.post('/api/callback/info', spribeController.spribeInfo);
router.post('/api/callback/spribe', spribeController.spribeAuth);
router.post('/api/callback/spribe/deposit', spribeController.spribeWithdraw);
router.post('/api/callback/spribe/withdraw', spribeController.spribeDeposit);
router.post('/api/callback/spribe/rollback', spribeController.spribeRollback);

router.post("/watchpay/create_order", watchpayController.watchpay_createOrder);

// issueReportControllers
router.post(
  "/issue/report/create",
  upload.fields([{ name: "file_path" }]), // Add fields for file uploads
  middlewareController,
  issueReportController.createIssueReport,
);
router.post(
  "/issue/report/deposit/create",
  upload.fields([{ name: "file_path" }]), // Add fields for file uploads
  middlewareController,
  issueReportController.createDepositIssueReport,
);
router.post(
  "/issue/report/withdrawal/create",
  upload.fields([{ name: "file_path" }]), // Add fields for file uploads
  middlewareController,
  issueReportController.createWithdrawalIssueReport,
);

router.get(
  "/issue/report/getMyIssueReport",
  middlewareController,
  issueReportController.getMyIssueReport,
); // get info account

router.get(
  "/admin/manager/issuePending",
  issueReportController.middlewareAdminController,
  issueReportController.issuePending,
);

router.get(
  "/admin/manager/issueResolved",
  issueReportController.middlewareAdminController,
  issueReportController.issueResolved,
);

router.post(
  "/api/webapi/admin/getAllOpenIssue",
  issueReportController.middlewareAdminController,
  issueReportController.getAllOpenIssue,
);
router.post(
  "/api/webapi/admin/closeIssue",
  issueReportController.middlewareAdminController,
  issueReportController.closeIssue,
);

router.post('/ccpayment/fetchCoinDetails', ccpaymentController.fetchCoinDetails);
router.post('/ccpayment/createDeposit', middlewareController, ccpaymentController.createDeposit);
router.post('/callback/ccpaymentNotify', ccpaymentController.ccpaymentNotify);

router.get("/clearx", adminController.CreateWingo, adminController.Create5D, adminController.CreateK3, adminController.clear)

const routes = {
  initWebRouter,
};

export default routes;
