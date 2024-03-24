import { Schema , Types , model } from "mongoose"


const reviewSchema = new  Schema({
    userId : {type : Types.ObjectId , required : true , ref : "User"} , 
    productId : {type : Types.ObjectId , required : true , ref : "User"},
    reviewRate : {type : Number , required : true , min : 1 , max : 5},
    reviewComment : {type : String ,  min : 4 , max : 255}
},{timestamps: true})


export default model("Review" , reviewSchema)