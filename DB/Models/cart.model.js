import { Schema, Types, model } from "mongoose";

const cartSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },
    products: [
      {
        productId: { type: Types.ObjectId, required: true },
        quantity: { type: Number, required: true },
        title: { type: String, required: true },
        basePrice: {
          type: Number,
          required: true,
          default: 0,
        },
        finalPrice: {
          //basePrice * quantity
          type: Number,
          required: true,
        },
      },
    ],
    subTotal : {type : Number , required : true , default : 0}
  },
  { timestamps: true }
);




const Cart = model("Cart" , cartSchema)


export default Cart ;
