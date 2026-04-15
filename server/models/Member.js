const mongoose = require('mongoose');

const memberSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter member's name"],
        },
        phone: {
            type: String,
            unique: true,
            default: null,
            trim: true
        },
        email: {
            type: String,
            required: false,
            default: null,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            default: null,
        },
        joinDate: {
            type: Date,
            default: null,
        },
        minimumContribution: {
            type: Number,
            default: 0,
            min: [0, 'Minimum contribution must be >= 0'],
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: true,
        }
    }, { timestamps: true }
)

module.exports = mongoose.model('Member', memberSchema);
