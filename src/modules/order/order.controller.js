


import { couponValidation } from "../../utils/coupon-validation.js";
import { checkProductAvailability } from "../Cart/utils/check-product-in-db.js";
import Order from '../../../DB/Models/order.model.js';
import CouponUsers from "../../../DB/Models/coupon-users.model.js";
import Product from "../../../DB/Models/product.model.js";
import Cart from "../../../DB/Models/cart.model.js";
import { DateTime } from "luxon";
import { qrCodeGeneration } from "../../utils/qr-code.js";

//================================= add   order  ==================================== //
export const createOrder = async (req, res ,next) => {
    //destructure the request body
    const {
        product,  // product id
        quantity,
        couponCode,
        paymentMethod,
        phoneNumbers,
        address,
        city,
        postalCode,
        country
    } = req.body

    const  {_id:user} = req.authUser

    // coupon code check
    let coupon = null;
    if(couponCode){
        const isCouponValid = await couponValidation(couponCode, user);
        if(isCouponValid.status) return next({message: isCouponValid.message, cause: isCouponValid.status});
        coupon = isCouponValid;
    }

    // product check
    const isProductAvailable = await checkProductAvailability(product, quantity);
    if(!isProductAvailable) return next({message: 'Product is not available', cause: 400});

    let orderItems = [{
        title: isProductAvailable.title,
        quantity,
        price: isProductAvailable.appliedPrice,
        product: isProductAvailable._id
    }]


    //prices
    let shippingPrice = orderItems[0].price * quantity;
    let totalPrice = shippingPrice;


    if(coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))  return next({message: 'You cannot use this coupon', cause: 400});
    
    if(coupon?.isFixed){
        totalPrice = shippingPrice - coupon.couponAmount;
    }else if(coupon?.isPercentage){
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }
    


    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';

    // create order
    const order = new Order({
        user,
        orderItems,
        shippingAddress: {address, city, postalCode, country},
        phoneNumbers,
        shippingPrice,
        coupon: coupon?._id,
        totalPrice,
        paymentMethod,
        orderStatus
    });

    await order.save();

    isProductAvailable.stock -= quantity;
    await isProductAvailable.save();

    if(coupon){
        await CouponUsers.updateOne({couponId:coupon._id, userId:user}, {$inc: {usageCount: 1}});
    }


    // generate QR code
    const orderQR =await qrCodeGeneration([{orderId: order._id, user: order.user, totalPrice: order.totalPrice, orderStatus: order.orderStatus}]);
    res.status(201).json({message: 'Order created successfully', orderQR});

}



export const convertFromcartToOrder = async (req, res, next) => {
     //destructure the request body
     const {
        couponCode,
        paymentMethod,
        phoneNumbers,
        address,
        city,
        postalCode,
        country
    } = req.body

    const  {_id:user} = req.authUser
    // cart items
    const userCart=  await Cart.findOne({userId : user}) ;
    if(!userCart) return next({message: 'Cart not found', cause: 404});

    // coupon code check
    let coupon = null;
    if(couponCode){
        const isCouponValid = await couponValidation(couponCode, user);
        if(isCouponValid.status) return next({message: isCouponValid.message, cause: isCouponValid.status});
        coupon = isCouponValid;

    }

    // product check


    let orderItems = userCart.products.map(cartItem => {
        return {
            title: cartItem.title,
            quantity: cartItem.quantity,
            price: cartItem.basePrice,
            product: cartItem.productId
        }
    });


    //prices
    let shippingPrice = userCart.subTotal;
    let totalPrice = shippingPrice;

    if(coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))  return next({message: 'You cannot use this coupon', cause: 400});
    
    if(coupon?.isFixed){
        totalPrice = shippingPrice - coupon.couponAmount;
    }else if(coupon?.isPercentage){
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }

    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';

    // create order
    const order = new Order({
        user,
        orderItems,
        shippingAddress: {address, city, postalCode, country},
        phoneNumbers,
        shippingPrice,
        coupon: coupon?._id,
        totalPrice,
        paymentMethod,
        orderStatus
    });

    await order.save();

    await Cart.findByIdAndDelete(userCart._id);

     for (const item of order.orderItems) {
           await Product.updateOne({_id: item.product}, {$inc: {stock: -item.quantity}})
     }

    if(coupon){
        await CouponUsers.updateOne({couponId:coupon._id, userId:user}, {$inc: {usageCount: 1}});
    }

    res.status(201).json({message: 'Order created successfully', order});

}


// ======================= order delivery =======================//
export const delieverOrder = async (req, res, next) => {
    const {orderId}= req.params;

    const updateOrder = await Order.findOneAndUpdate({
        _id: orderId,
        orderStatus: {$in: ['Paid','Placed']} 
    },{
        orderStatus: 'Delivered',
        deliveredAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        deliveredBy: req.authUser._id,
        isDelivered: true
    },{
        new: true
    })

   if(!updateOrder) return next({message: 'Order not found or cannot be delivered', cause: 404});

    res.status(200).json({message: 'Order delivered successfully', order: updateOrder});
}