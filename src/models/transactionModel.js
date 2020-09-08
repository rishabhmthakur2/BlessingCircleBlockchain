const mongoose = require("mongoose");
const validator = require('validator');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
    },
    investmentAmount: {
        type: String,
        required: true,
        validate(value){
            if(value != '1000000000' && value != '6000000000' && value != '15000000000'){
                throw new Error('Invalid investment amount');
            }
        }
    },
    investorAddress: {
        type: String,
        required: true,
    }
},{
    timestamps: true
});

const Investment = mongoose.model("investments", transactionSchema);

module.exports = Investment;

