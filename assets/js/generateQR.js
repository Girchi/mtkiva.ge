import QRCode from "qrcode";

const generateQR = (text) => {
  var opts = {
    errorCorrectionLevel: "H",
    type: "image/jpeg",
    quality: 1,
    margin: 0,
    color: {
      dark: "#000",
      light: "#ffffff00",
    },
  };
  let generatedval = QRCode.toDataURL(text, opts);
  return generatedval;
};

export default generateQR;
