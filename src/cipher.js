const CryptoJS = require("crypto-js");
export function cipher(text) {
    return CryptoJS.MD5(text + "dygzs2014").toString();
}