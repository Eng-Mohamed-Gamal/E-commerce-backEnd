import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../../../DB/Models/user.model.js";
import sendEmailService from "../../services/send-email.service.js";

// ========================================= SignUp API ================================//
/**
 * destructuring the required data from the request body
 * check if the user already exists in the database using the email
 * if exists return error email is already exists
 * password hashing
 * create new document in the database
 * return the response
 */
export const signUp = async (req, res, next) => {
  // 1- destructure the required data from the request body
  const { username, email, password, age, role, phoneNumbers, addresses } =
    req.body;

  // 2- check if the user already exists in the database using the email
  const isEmailDuplicated = await User.findOne({ email });
  if (isEmailDuplicated) {
    return next(
      new Error("Email already exists,Please try another email", { cause: 409 })
    );
  }
  // 3- send confirmation email to the user
  const usertoken = jwt.sign({ email }, process.env.JWT_SECRET_VERFICATION, {
    expiresIn: "2m",
  });

  const isEmailSent = await sendEmailService({
    to: email,
    subject: "Email Verification",
    message: `
        <h2>please clich on this link to verfiy your email</h2>
        <a href="${req.protocol}://${req.headers.host}/auth/verify-email?token=${usertoken}">Verify Email</a>
        `,
  });
  // 4- check if email is sent successfully
  if (!isEmailSent) {
    return next(
      new Error("Email is not sent, please try again later", { cause: 500 })
    );
  }
  // 5- password hashing
  const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS);

  // 6- create new document in the database
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    age,
    role,
    phoneNumbers,
    addresses,
  });

  // 7- return the response
  res.status(201).json({
    success: true,
    message:
      "User created successfully, please check your email to verify your account",
    data: newUser,
  });
};

// ========================================= Verify Email API ================================//
/**
 * destructuring token from the request query
 * verify the token
 * get uset by email , isEmailVerified = false
 * if not return error user not found
 * if found
 * update isEmailVerified = true
 * return the response
 */
export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;
  const decodedData = jwt.verify(token, process.env.JWT_SECRET_VERFICATION);
  // get uset by email , isEmailVerified = false
  const user = await User.findOneAndUpdate(
    {
      email: decodedData.email,
      isEmailVerified: false,
    },
    { isEmailVerified: true },
    { new: true }
  );
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  res.status(200).json({
    success: true,
    message: "Email verified successfully, please try to login",
  });
};

// ========================================= SignIn API ================================//

/**
 * destructuring the required data from the request body
 * get user by email and check if isEmailVerified = true
 * if not return error invalid login credentails
 * if found
 * check password
 * if not return error invalid login credentails
 * if found
 * generate login token
 * updated isLoggedIn = true  in database
 * return the response
 */

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  // get user by email
  const user = await User.findOne({ email, isEmailVerified: true });
  if (!user) {
    return next(new Error("Invalid login credentails", { cause: 404 }));
  }
  // check password
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return next(new Error("Invalid login credentails", { cause: 404 }));
  }

  // generate login token
  const token = jwt.sign(
    { email, id: user._id, loggedIn: true },
    process.env.JWT_SECRET_LOGIN,
    { expiresIn: "1d" }
  );

  // updated isLoggedIn = true  in database

  user.isLoggedIn = true;
  user.token = token;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      token,
    },
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next({ message: "User Is Not Exist", cause: 404 });
  const forgetPassCode = generateUniqueString("123456asdfgh", 5);
  const hashCode = bcrypt.hashSync(forgetPassCode, +process.env.SALT_ROUNDS);
  const token = jwt.sign(
    { email, forgetPassCode: hashCode },
    process.env.JWT_SECRET_FORGET,
    { expiresIn: "1h" }
  );
  const resetPasswordLink = `${req.protocol}/${req.headers.host}/auth/resetPassword/${token}`;
  const isEmailSent = sendEmailService({
    to: email,
    subject: "Reset Password",
    message: `<h1> click the below link to reset your password </h1> 
    <a href=${resetPasswordLink}>Reset Password</a>
    `,
  });
  if (!isEmailSent)
    return next({
      message: "Email is not sent, please try again later",
      cause: 400,
    });

  user.forgetPassCode = hashCode;
  await user.save();

  return res.status(200).json({ message: "Done" });
};

export const resetPassword = async (req, res, next) => {
  const { newPassword } = req.body;
  const { token } = req.params;

  const decodedData = jwt.verify(token, process.env.JWT_SECRET_FORGET);

  const user = await User.findOne({
    email: decodedData.email,
    forgetPassCode: decodedData.forgetPassCode,
  });
  if (!user)
    return next({ message: "Reset Password Done Try To Login", cause: 404 });

  const hashedPassword = bcrypt.hashSync(newPassword, process.env.SALT_ROUNDS);

  user.forgetPassCode = null;
  user.password = hashedPassword;
  await user.save();

  return res.status(200).json({ message: "Done" });
};

export const updatePassword = async (req, res, next) => {
  const { password, newPAssword } = req.body;
  const { authUser } = req;
  const checkPassword = bcrypt.compareSync(password, authUser.password);
  if (!checkPassword) return next({ message: "Wrong Password", cause: 400 });
  const hashedPassword = bcrypt.hashSync(newPAssword, +process.env.SALT_ROUNDS);
  authUser.password = hashedPassword;
  await authUser.save();
  return res.status(200).json({ message: "Update Password Done" });
};

export const logout = async (req, res, next) => {
  // destruct data from user
  const { _id } = req.authUser;
  const { userId } = req.params;
  if (_id != userId) {
    return res.status(400).json({ msg: "You cannot logout this profile" });
  }
  // update user data
  const updateUser = await User.findByIdAndUpdate(_id, {
    isLoggedIn: false,
  });
  // check if user logout
  if (!updateUser) {
    return res.status(404).json({
      msg: "Logout failed",
    });
  }
  // send response
  res.status(200).json({
    msg: "User logged out successfully",
  });
};
