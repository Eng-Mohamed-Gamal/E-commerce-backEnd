
import userModel from "../../../DB/Models/user.model.js";



/*==================================updateUser============================================== */
export const updateUser = async (req, res, next) => {
  const { email, phoneNumbers, username, addresses, age, role } = req.body;
  // email check
  if (email) {
    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist)
      return next(new Error("Email Is Already Exist", { cause: 400 }));
  }
  // updateUser
  const updatedUser = await userModel.findByIdAndUpdate(
    req.authUser._id,
    {
      email,
      phoneNumbers,
      username,
      addresses,
      age,
      role,
    },
    { new: true }
  );

  if (!updatedUser) return next(new Error("update Fail", { cause: 500 }));
  return res.status(200).json({ message: "Done", updatedUser });
};

/*==================================deleteUser============================================== */

export const deleteUser = async (req, res, next) => {
  const { _id } = req.authUser;
  // deleteUser soft Delete
  const deletedUser = await userModel.findOneAndUpdate(
    { _id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!deletedUser) return next(new Error("Delete Fail", { cause: 500 }));
  return res.status(200).json({ message: "Done", deletedUser });
};

/*==================================getUser============================================== */

export const getUser = async (req, res, next) => {
  const { _id } = req.authUser;
  // getUser
  const user = await userModel.findById(_id);
  return res.status(200).json({ message: "Done", user });
};

/*==================================getUsers============================================== */

export const getUsers = async (req, res, next) => {
  const users = await userModel.find();

  return res.status(200).json({ message: "Done", users });
};



