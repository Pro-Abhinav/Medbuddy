const { text } = require("body-parser");
var mongoose = require("mongoose");

var hospSchema = new mongoose.Schema({
    name: String,
    type: String,
    speciality: String,
    address: {
        street: String,
        city: String,
        state: String,
        zip: Number
    },
    contact: {
        email: String, 
        phone: [Number]
    },
    handler:{
        id:{
           type:mongoose.Schema.Types.ObjectId,
           ref:"User"
        },
        username:String
    },
    about: String
});

module.exports = mongoose.model("Hospital", hospSchema);