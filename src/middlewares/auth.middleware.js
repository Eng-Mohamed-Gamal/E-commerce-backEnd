import jwt from "jsonwebtoken";
import User from "../../DB/Models/user.model.js";
export const auth = (accessRoles) => {
  return async (req, res, next) => {
    const { accesstoken } = req.headers;
    const decodedData = jwt.verify(accesstoken, process.env.JWT_SECRET_LOGIN);
    try {
      if (!accesstoken)
        return next(new Error("please login first", { cause: 400 }));
      if (!decodedData || !decodedData.id)
        return next(new Error("invalid token payload", { cause: 400 }));
      // user check
      const findUser = await User.findById(decodedData.id);
      if (!findUser)
        return next(new Error("please signUp first", { cause: 404 }));
      // auhtorization
      if (!accessRoles.includes(findUser.role))
        return next(new Error("unauthorized", { cause: 401 }));
      req.authUser = findUser;
      next();
    } catch (error) {
        console.log(error);
      if (error == "TokenExpiredError: jwt expired") {
        const findUser = await User.findOne({ token: accesstoken });
        if (!findUser) return next({ message: "Wrong token", cause: 400 });
        // generate login token
        const token = jwt.sign(
          { email, id: findUser._id, loggedIn: true },
          process.env.JWT_SECRET_LOGIN,
          { expiresIn: "5d" }
        );
        findUser.token = token
        await findUser.save()
      }
    }
  };
};
