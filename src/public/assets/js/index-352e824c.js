import {
  O as C,
  y as O,
  x as L,
  v as l,
  a3 as A,
  a0 as M,
  P as c,
  V as r,
  Y as o,
  W as b,
  X as D,
  a1 as p,
  ae as u,
  T as m,
  _ as d,
  a4 as R,
  R as B,
} from "./vendor-b2024301.js";
import {
  l as G,
  S as N,
  g as T,
  A as U,
  j as V,
  p as $,
  _ as j,
} from "./index-fbf0707b.js";
const E = { class: "settingPanel__container-items" },
  J = ["onClick"],
  W = { class: "settingPanel__container-items__title" },
  z = ["src"],
  F = { class: "settingPanel__container-items-right" },
  H = C({
    __name: "index",
    props: { type: { type: String, default: "default" } },
    setup(_) {
      const k = _,
        { t: e } = O(),
        h = L(),
        g = G(),
        y = N(),
        n = l(() => g.userInfo),
        I = l(() => y.getIsCanAppDownload),
        w = l(() =>
          k.type !== "default"
            ? [
                {
                  icon: "languageIcon",
                  title: e("switchLanguages"),
                  link: "Language",
                  isopen: "1",
                },
                {
                  icon: "notificationCenter",
                  title: e("noti"),
                  link: "Notification",
                  isopen: "1",
                },
                {
                  icon: "serviceCenter",
                  title: e("wholeTimeService"),
                  link: "CustomerService",
                  isopen: "1",
                },
                {
                  icon: "guide",
                  title: e("guide"),
                  link: "Guide",
                  isopen: "1",
                },
                {
                  icon: "about",
                  title: e("about"),
                  link: "About",
                  isopen: "1",
                },
                I.value && {
                  icon: "down",
                  title: e("downloadAPP"),
                  link: "",
                  isopen: 1,
                },
              ].filter(Boolean)
            : [
                {
                  icon: "notifyIcon",
                  title: e("notifications"),
                  link: "Messages",
                  isopen: "1",
                },
                {
                  icon: "inviteIcon",
                  title: e("invitationBonus"),
                  link: "InvitationBonus",
                  isopen: n.value.isTaskState,
                  haspermission: 15,
                },
                {
                  icon: "giftIcon",
                  title: e("giftExchange"),
                  link: "RedeemGift",
                  isopen: "1",
                },
                {
                  icon: "cps",
                  title: e("cpsTip6"),
                  link: "MyCps",
                  isopen: n.value.isOpenChampion,
                },
                {
                  icon: "orderIcon",
                  title: e("productOrder"),
                  link: "PointMall-MyOrders",
                  isopen: n.value.isOpenPointMall,
                },
                {
                  icon: "laundryIcon",
                  title: e("laundryAmount"),
                  link: "Laundry",
                  isopen: n.value.isOpenWashCode,
                },
                {
                  icon: "mylottery",
                  title: e("MyLottery"),
                  link: "PointMall-MyLottery",
                  isopen: n.value.isOpenPointMall,
                },
                {
                  icon: "statsIcon",
                  title: e("gameStatistics"),
                  link: "GameStats",
                  isopen: "1",
                  haspermission: 17,
                },
                {
                  icon: "superIcon",
                  title: e("superjackpot"),
                  link: "SuperJackpot",
                  isopen: n.value.isOpenJackpotReward,
                },
                {
                  icon: "languageIcon",
                  title: e("switchLanguages"),
                  link: "Language",
                  isopen: "1",
                },
              ],
        );
      async function S() {
        const t = await U(V());
        if (t) {
          let s = navigator.userAgent.toLowerCase(),
            a = "";
          s.indexOf("windows") != -1 || s.indexOf("android") != -1
            ? (a = t.data.androidUrl)
            : s.indexOf("iphone") != -1 ||
                s.indexOf("mac") != -1 ||
                s.indexOf("ipad") != -1
              ? (a = t.data.iosUrl)
              : (a = t.data.androidUrl),
            $(a);
        }
      }
      function x(t) {
        if (t.icon == "down") return S();
        h.push({ name: t.link });
      }
      return (t, s) => {
        const a = A("van-icon"),
          P = M("haspermission");
        return (
          c(),
          r(
            "div",
            { class: B(["settingPanel__container", [`panel-${_.type}`]]) },
            [
              o("div", E, [
                (c(!0),
                r(
                  b,
                  null,
                  D(w.value, (i) => {
                    var f, v;
                    return p(
                      (c(),
                      r(
                        "div",
                        {
                          key: i.title,
                          onClick: (X) => x(i),
                          class: "settingPanel__container-items__item ar-1px-b",
                        },
                        [
                          o("div", W, [
                            o(
                              "img",
                              { src: m(T)("main", `${i.icon}`) },
                              null,
                              8,
                              z,
                            ),
                            o("span", null, d(i.title), 1),
                          ]),
                          o("div", F, [
                            p(
                              o(
                                "h5",
                                null,
                                d((f = n.value) == null ? void 0 : f.unRead),
                                513,
                              ),
                              [
                                [
                                  u,
                                  i.icon === "notifyIcon" &&
                                    ((v = n.value) == null
                                      ? void 0
                                      : v.unRead) > 0,
                                ],
                              ],
                            ),
                            p(o("span", null, d(m(g).getLanguageName), 513), [
                              [u, i.icon === "languageIcon"],
                            ]),
                            R(a, { name: "arrow", color: "#011341" }),
                          ]),
                        ],
                        8,
                        J,
                      )),
                      [
                        [u, i.isopen == "1"],
                        [P, i.haspermission],
                      ],
                    );
                  }),
                  128,
                )),
              ]),
            ],
            2,
          )
        );
      };
    },
  });
const K = j(H, [["__scopeId", "data-v-0341cbde"]]);
export { K as S };
