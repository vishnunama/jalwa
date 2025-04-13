import axios from 'axios';

let data_30 = {
  language: 0,
  random: "62fa6a32f8cd437ab55acf67191d0726",
  signature: "6F374C0170AA1ABF9499B6A47F320E17",
  timestamp: 1738062542,
  typeId: 30,
};

let data_1 = {
  language: 0,
  random: "009b2cf9abc64dbd921cb9b150d9965d",
  signature: "C63502984DB9B477989292452CB254FF",
  timestamp: 1738062542,
  typeId: 1,
};

let data_2 = {
  language: 0,
  random: "d889988896fe419582a0c69165f16a8a",
  signature: "D2D5116B71647B086C5BA962DC733B0A",
  timestamp: 1738062542,
  typeId: 2,
};

let data_3 = {
  language: 0,
  random: "65b6dae307a94bd99ac54a3eadc6f64c",
  signature: "BA618D3A75B0A746167F500E23A9821E",
  timestamp: 1738062542,
  typeId: 3,
};

export const getWingoPeriodData = async (num) => {
  try {
    let { type } = num;
    type = parseInt(type); // Ensure type is a number

    let requestData;
    switch (type) {
      case 1:
        requestData = data_1;
        break;
      case 2:
        requestData = data_2;
        break;
      case 3:
        requestData = data_3;
        break;
      default:
        requestData = data_30; // Default to type 30
        break;
    }

    const response = await axios.request({
      method: "post",
      maxBodyLength: Infinity,
      url: "https://imgametransit.com/api/webapi/GetGameIssue",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://okwin.bio",
        "Access-Control-Allow-Credentials": "true",
      },
      data: JSON.stringify(requestData),
    });

    return ({
      status: true,
      message: "success",
      data: response.data,
    });
  } catch (e) {
    return ({
      status: false,
      message: "error",
      data: e.message,
    });
  }
};
