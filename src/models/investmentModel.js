const mongoose = require("mongoose");
const validator = require('validator');

const circleSchema = new mongoose.Schema({
    investmentAmount: {
        type: String,
        required: true,
        validate(value){
            if(value != '0.1' && value != '0.5' && value != '1'){
                throw new Error('Invalid investment amount');
            }
        }
    },
    participantCount: {
        type: Number,
        required: true,
        default: 0
    },
    participants: [{
        investor: {
            type: String,
            required: true,
        },
        position: {
            type: String,
            required: true,
            default: 1,
            validate(value){
                if (value < 1 && value >15){
                    throw new Error('Invalid participant entry ')
                }
            }
        }
    }]
},{
    timestamps: true
});

const Circle = mongoose.model("circles", circleSchema);

module.exports = Circle;

