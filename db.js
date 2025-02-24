import mongoose from 'mongoose';
const Db = process.env.MONGODB_URL;
const cnmg = () => mongoose.connect(Db, {
    

}).then(() => {
    console.log("success");
}).catch((err) => {
    console.log(err);
})


export default cnmg;