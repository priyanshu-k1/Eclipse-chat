const mongoose = require('mongoose');

const MessageSchema= new mongoose.Schema({
   
},
{timestamps:true});

const message=mongoose.model('MessageSchema',MessageSchema);

module.exports = message;

