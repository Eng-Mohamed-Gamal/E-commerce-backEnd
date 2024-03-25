import { couponValidation } from "../../utils/coupon-validation.js";
import { checkProductAvailbility } from "../Cart/utils/enhance.js";
import Order from "../../../DB/Models/order.model.js";
import CouponUsers from "../../../DB/Models/coupon-users.model.js";
import Product from "../../../DB/Models/product.model.js";
import Cart from "../../../DB/Models/cart.model.js";
import { DateTime } from "luxon";

import {
  createCheckoutSession,
  createPaymentIntent,
  confirmPaymentIntent,
  createStripeCoupon,
  refundPaymentIntent,
} from "../../payment-handler/stripe.js";
import { nanoid } from "nanoid";
import createInvoice from "../../utils/pdf-kit.js";
import sendEmailService from "../../services/send-email.service.js";

//================================= add order  ==================================== //
export const createOrder = async (req, res, next) => {
  //destructure the request body
  const {
    product, // product id
    quantity,
    couponCode,
    paymentMethod,
    phoneNumbers,
    address,
    city,
    postalCode,
    country,
  } = req.body;

  const { _id: user } = req.authUser;

  // coupon code check
  let coupon = null;
  if (couponCode) {
    const isCouponValid = await couponValidation(couponCode, user);
    if (isCouponValid.status)
      return next({
        message: isCouponValid.message,
        cause: isCouponValid.status,
      });
    coupon = isCouponValid;
  }

  // product check
  const isProductAvailable = await checkProductAvailbility(product, quantity);
  if (!isProductAvailable)
    return next({ message: "Product is not available", cause: 400 });

  let orderItems = [
    {
      title: isProductAvailable.title,
      quantity,
      price: isProductAvailable.appliedPrice,
      product: isProductAvailable._id,
    },
  ];

  //prices
  let shippingPrice = orderItems[0].price * quantity;
  let totalPrice = shippingPrice;

  if (coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))
    return next({ message: "You cannot use this coupon", cause: 400 });

  if (coupon?.isFixed) {
    totalPrice = shippingPrice - coupon.couponAmount;
  } else if (coupon?.isPercentage) {
    totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount) / 100;
  }

  // order status + paymentmethod
  let orderStatus;
  if (paymentMethod === "Cash") orderStatus = "Placed";

  // create order
  const order = new Order({
    user,
    orderItems,
    shippingAddress: { address, city, postalCode, country },
    phoneNumbers,
    shippingPrice,
    coupon: coupon?._id,
    totalPrice,
    paymentMethod,
    orderStatus,
  });

  await order.save();

  isProductAvailable.stock -= quantity;
  await isProductAvailable.save();

  if (coupon) {
    await CouponUsers.updateOne(
      { couponId: coupon._id, userId: user },
      { $inc: { usageCount: 1 } }
    );
  }



  const orderCode = `${req.authUser.username}${nanoid(3)}`;

  const orderInvoice = {
    orderCode,
    date: order.createdAt,
    items: order.orderItems,
    subTotal: order.shippingPrice,
    paidAmount: order.totalPrice, 
    couponId: coupon?._id,
    coupon: coupon?.couponAmount,
    shipping: {
      name: req.authUser.username,
      address: order.shippingAddress.address,
      city: order.shippingAddress.city,
      state: "Cairo",
      country: order.shippingAddress.country,
    },
  };


  await createInvoice(orderInvoice , `${orderCode}.pdf`)

//   const sendEmail = await sendEmailService({
//     to: req.authUser.email,
//     subject: 'Order Confirmation',
//     message: '<h1>Check your Invoice Confirmation below</h1>',
//     attachments: [{path: `./Files/${orderCode}.pdf`}]
// })

  return res.status(201).json({ message: "Order created successfully", });
};

export const convertFromcartToOrder = async (req, res, next) => {
  //destructure the request body
  const {
    couponCode,
    paymentMethod,
    phoneNumbers,
    address,
    city,
    postalCode,
    country,
  } = req.body;

  const { _id: user } = req.authUser;
  // cart items
  const userCart = await Cart.findOne({ userId: user });
  if (!userCart) return next({ message: "Cart not found", cause: 404 });

  // coupon code check
  let coupon = null;
  if (couponCode) {
    const isCouponValid = await couponValidation(couponCode, user);
    if (isCouponValid.status)
      return next({
        message: isCouponValid.message,
        cause: isCouponValid.status,
      });
    coupon = isCouponValid;
  }

  // product check

  let orderItems = userCart.products.map((cartItem) => {
    return {
      title: cartItem.title,
      quantity: cartItem.quantity,
      price: cartItem.basePrice,
      product: cartItem.productId,
    };
  });

  //prices
  let shippingPrice = userCart.subTotal;
  let totalPrice = shippingPrice;

  if (coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))
    return next({ message: "You cannot use this coupon", cause: 400 });

  if (coupon?.isFixed) {
    totalPrice = shippingPrice - coupon.couponAmount;
  } else if (coupon?.isPercentage) {
    totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount) / 100;
  }

  // order status + paymentmethod
  let orderStatus;
  if (paymentMethod === "Cash") orderStatus = "Placed";

  // create order
  const order = new Order({
    user,
    orderItems,
    shippingAddress: { address, city, postalCode, country },
    phoneNumbers,
    shippingPrice,
    coupon: coupon?._id,
    totalPrice,
    paymentMethod,
    orderStatus,
  });

  await order.save();

  await Cart.findByIdAndDelete(userCart._id);

  for (const item of order.orderItems) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: -item.quantity } }
    );
  }

  if (coupon) {
    await CouponUsers.updateOne(
      { couponId: coupon._id, userId: user },
      { $inc: { usageCount: 1 } }
    );
  }

  res.status(201).json({ message: "Order created successfully", order });
};

// ======================= order delivery =======================//
export const delieverOrder = async (req, res, next) => {
  const { orderId } = req.params;

  const updateOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      orderStatus: { $in: ["Paid", "Placed"] },
    },
    {
      orderStatus: "Delivered",
      deliveredAt: DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss"),
      deliveredBy: req.authUser._id,
      isDelivered: true,
    },
    {
      new: true,
    }
  );

  if (!updateOrder)
    return next({
      message: "Order not found or cannot be delivered",
      cause: 404,
    });

  res
    .status(200)
    .json({ message: "Order delivered successfully", order: updateOrder });
};

// ======================= order payment with stipe =======================//
export const payWithStripe = async (req, res, next) => {
  const { orderId } = req.params;
  const { _id: userId } = req.authUser;

  // get order details from our database
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    orderStatus: "Pending",
  });
  if (!order)
    return next({ message: "Order not found or cannot be paid", cause: 404 });

  const paymentObject = {
    customer_email: req.authUser.email,
    metadata: { orderId: order._id.toString() },
    discounts: [],
    line_items: order.orderItems.map((item) => {
      return {
        price_data: {
          currency: "EGP",
          product_data: {
            name: item.title,
          },
          unit_amount: item.price * 100, // in cents
        },
        quantity: item.quantity,
      };
    }),
  };
  // coupon check
  if (order.coupon) {
    const stripeCoupon = await createStripeCoupon({ couponId: order.coupon });
    if (stripeCoupon.status)
      return next({ message: stripeCoupon.message, cause: 400 });

    paymentObject.discounts.push({
      coupon: stripeCoupon.id,
    });
  }

  const checkoutSession = await createCheckoutSession(paymentObject);
  const paymentIntent = await createPaymentIntent({
    amount: order.totalPrice,
    currency: "EGP",
  });

  order.payment_intent = paymentIntent.id;
  await order.save();

  res.status(200).json({ checkoutSession, paymentIntent });
};

//====================== apply webhook locally to confirm the  order =======================//
export const stripeWebhookLocal = async (req, res, next) => {
  const orderId = req.body.data.object.metadata.orderId;
  const confirmedOrder = await Order.findById(orderId);
  if (!confirmedOrder) return next({ message: "Order not found", cause: 404 });
  try {
    await confirmPaymentIntent({
      paymentIntentId: confirmedOrder.payment_intent,
    });
  } catch (err) {
    console.log(err);
  }

  confirmedOrder.isPaid = true;
  confirmedOrder.paidAt = DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss");
  confirmedOrder.orderStatus = "Paid";

  await confirmedOrder.save();

  res.status(200).json({ message: "webhook received" });
};

//====================== refund  order =======================//
export const refundOrder = async (req, res, next) => {
  const { orderId } = req.params;

  const findOrder = await Order.findOne({ _id: orderId, orderStatus: "Paid" });
  if (!findOrder)
    return next({
      message: "Order not found or cannot be refunded",
      cause: 404,
    });

  // refund the payment intent
  const refund = await refundPaymentIntent({
    paymentIntentId: findOrder.payment_intent,
  });

  findOrder.orderStatus = "Refunded";
  await findOrder.save();

  res
    .status(200)
    .json({ message: "Order refunded successfully", order: refund });
};

export const cancelOrder = async (req, res, next) => {
  const { orderId } = req.query;
  // order Check
  const order = await Order.findById(orderId);
  if (!order) return next({ message: "Order Is Not Exist", cause: 404 });
  const checker = DateTime.now() - order.createdAt;
  const millSecondsInDay = 24 * 60 * 60 * 1000;
  if (checker >= millSecondsInDay)
    return next({
      message: "You Cannot Cancel Order After 1 Day From Ordering",
      cause: 409,
    });
  order.orderStatus = "Cancelled";
  await order.save();
  return res.status(200).json({ message: "Order Cancelled Done", order });
};
