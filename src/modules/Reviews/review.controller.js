import orderModel from "../../../DB/Models/order.model.js";
import productModel from "../../../DB/Models/product.model.js";
import reviewModel from "../../../DB/Models/review.model.js";

export const addReview = async (req, res, next) => {
  const { _id: user } = req.authUser;
  const { productId } = req.query;
  const { reviewRate, reviewComment } = req.body;
  // check if user authorized to add review on this product
  const check = await orderModel.findOne({
    user,
    "orderItems.product": productId,
    orderStatus: "Delivered",
  });

  if (!check)
    return next({
      message: "You Cannot Review Prouduct You Didnot Buy",
      cause: 403,
    });

  const newReview = await reviewModel.create({
    userId: user,
    productId,
    reviewRate,
    reviewComment,
  });
  if (!newReview) return next({ message: "Create Fail" });
  // update the Product rate
  const product = await productModel.findById(productId);
  const reviews = await reviewModel.find({ productId });
  let totalReviews = 0;
  for (const review of reviews) {
    totalReviews += review.reviewRate;
  }
  product.rate = Number(totalReviews / reviews.length).toFixed(2);
  await product.save();

  return res
    .status(201)
    .json({ message: "Review Created", newReview, product });
};

export const getReviewsForProduct = async (req, res, next) => {
  const { productId } = req.query;
  const reviews = await reviewModel.find({ productId });

  return res
    .status(20)
    .json({
      message: "Review Deleted",
      reviews: reviews.length ? reviews : "NO Reviews On This Product",
    });
};
export const deleteReview = async (req, res, next) => {
  const { _id: user } = req.authUser;
  const { productId } = req.query;

  const deletedReview = await reviewModel.findOneAndDelete({
    userId: user,
    productId,
  });
  if (!deletedReview) return next({ message: "Delete Fail" });

  // update the Product rate
  const product = await productModel.findById(productId);
  const reviews = await reviewModel.find({ productId });
  let totalReviews = 0;
  for (const review of reviews) {
    totalReviews -= review.reviewRate;
  }
  product.rate = Number(totalReviews / reviews.length).toFixed(2);
  return res
    .status(20)
    .json({ message: "Review Deleted", deletedReview, product });
};
