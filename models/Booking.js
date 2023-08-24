const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

    item: {type: mongoose.Schema.Types.ObjectId, required: true, ref:'Item'},
    user: {type: mongoose.Schema.Types.ObjectId, required: true},
    from: {type:Date, required:true},
    to: {type: Date, required:true},
    address: {type: String, required: true},
    name: {type: String, required: true},
    cardNumber: {type:String, required:true},
    cvv: {type:Number, required:true},
    price: {type:Number, required:true},
    

    
});

const BookingModel = mongoose.model('Booking', bookingSchema)
module.exports = BookingModel;
