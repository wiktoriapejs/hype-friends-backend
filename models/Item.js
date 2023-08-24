const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  owner: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
  photos: [String],
  title: String,
  description: String,
  category: [String],
  brand: String,
  price: Number,
  discount: Number,
});

const ItemModel = mongoose.model('Item', itemSchema);

module.exports = ItemModel;