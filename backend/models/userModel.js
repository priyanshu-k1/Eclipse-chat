const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    eclipseId: {
        type: String,
        unique: true
    },
    displayName: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });


userSchema.pre('save', function (next) {
    if (!this.eclipseId) {
        this.eclipseId = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
