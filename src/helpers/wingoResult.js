import axios from 'axios';

let data_30 = {
  language: 0,
  pageNo: 1,
  pageSize: 10,
  random: "7c9c21132a0641a0994c3e62a7eaac77",
  signature: "FDE6326926F31EE4FBD6954D8FACB66F",
  timestamp: 1738062542,
  typeId: 30,
};

let data_1 = {
  language: 0,
  pageNo: 1,
  pageSize: 10,
  random: "93a5dac23cf94d4e8f4baa9ef577de7b",
  signature: "73CF2DAEEC5A92E72E55371F84F8EB9E",
  timestamp: 1738062542,
  typeId: 1,
};

let data_2 = {
  language: 0,
  pageNo: 1,
  pageSize: 10,
  random: "f2d67692e47e405881ad328013a427df",
  signature: "6B81298EE7C29AB53487282762C36761",
  timestamp: 1738062542,
  typeId: 2,
};

let data_3 = {
  language: 0,
  pageNo: 1,
  pageSize: 10,
  random: "80781403957b49e683c303579c5d2b75",
  signature: "DC5BE185E6948630B61D6874968D9647",
  timestamp: 1738062542,
  typeId: 3,
};

export const getWingoResultData = async (num) => {
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
      url: "https://imgametransit.com/api/webapi/GetNoaverageEmerdList",
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
