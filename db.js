const mongoose = require("mongoose")
const Db = process.env.MONGODB_URL;
const cnmg = () => mongoose.connect(Db, {
    useNewUrlParser: true,

}).then(() => {
    console.log("success");
}).catch((err) => {
    console.log(err);
})


module.exports = cnmg;