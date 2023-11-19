const util = require("util");
const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __basedir + "/assets/uploads/");
    },
    filename: (req, file, cb) => {
        const extArray = file.mimetype.split("/");
        const extension = extArray[extArray.length - 1];
        const newFileName = `FileUpload-${Date.now()}.${extension}`;
        cb(null, newFileName);
    },
});
const uploadFile = multer({ storage: storage }).single("singlefile");
const uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;