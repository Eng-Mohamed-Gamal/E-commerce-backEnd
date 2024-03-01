

import  Coupon  from '../../../DB/Models/coupon.model.js';
import CouponUsers  from '../../../DB/Models/coupon-users.model.js';

import User from '../../../DB/Models/user.model.js';
import { couponValidation } from '../../utils/coupon-validation.js';
//=============================== add coupon API ===============================//
export const addCoupon = async (req, res ,next) => {
    // destructuring the request body
    const { couponCode  , couponAmount , fromDate, toDate , isFixed, isPercentage , Users } = req.body;
    // destructuring the request authUser
    const { _id:addedBy} = req.authUser;  // const addedBy = req.authUser._id;

    // couponCode check
    const coupon = await Coupon.findOne({couponCode});
    if(coupon) return next({message: 'Coupon already exists', cause: 409});

    if(isFixed == isPercentage) return next({message: 'Coupon can be either fixed or percentage', cause: 400});

    if(isPercentage && couponAmount > 100) return next({message: 'Percentage should be less than 100', cause: 400});

    const couponObject = {
        couponCode,
        couponAmount,
        fromDate,
        toDate,
        isFixed,
        isPercentage,
        addedBy
    }

    const newCoupon = await Coupon.create(couponObject);

    // Users check
    let userIdsArr = []
    for (const user of Users) {
        userIdsArr.push(user.userId);
    }
    // [1,2,3,4 , 10]  => 1,2,3,4,5,6 => 1234
    const isUsersExist = await User.find({
        _id:{
            $in:userIdsArr
        }
    });

    if(isUsersExist.length !== Users.length) return next({message: `User not found`, cause: 404});

    const couponUsers = await CouponUsers.create(
        Users.map(ele => ({couponId:newCoupon._id, userId:ele.userId, maxUsage:ele.maxUsage}))
    )
    res.status(201).json({messag:'Coupon added successfully', newCoupon , couponUsers});
    
}


export const applyCoupon = async (req, res, next) => {
    const { couponCode } = req.body;
    const { _id:userId } = req.authUser;

    const couponCheck  = await couponValidation(couponCode, userId);


    if(couponCheck.status) return next({message: couponCheck.message, cause: couponCheck.status});
    res.status(200).json({message: 'Coupon applied successfully'});
    
}

