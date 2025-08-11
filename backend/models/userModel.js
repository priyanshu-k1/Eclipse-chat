const mongoose = require('mongoose');

const userSchema= new mongoose.Schema({
    username:{
        require:true,
        type:String
    },
    email:{
        require:true,
        type:String,
        unique:true
    },
    password:{
        require:true,
        type:String
    }
},
{timestamps:true});

const User=mongoose.model('user',userSchema);

module.exports = User;

