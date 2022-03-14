const Admin = require("../models/admin")
const User = require("../models/user")
const bcrypt = require("bcrypt")
const sendEmail = require("../shared/sendEmail");
const crypto = require("crypto");
const { ackResponse, errorResponse, successResponse } = require("../shared/responses")
const jwt = require('jsonwebtoken')
const accessTokenSecret = 'youraccesstokensecret'

exports.adminSignIn = function (req, res) {
  var { email, password } = req.body


    Admin.findOne({ email: email }).then(admin => {
      if (admin) {
        const cmp = bcrypt.compareSync(password, admin.password);
        if (cmp) {
          const token = jwt.sign({ email: admin.email, nic: admin.nic }, accessTokenSecret, { expiresIn: "5min" })
          // localStorage.setItem('token', token)
          console.log(token)
          const adminData = {
            name: admin.firstName + ' ' + admin.lastName,
            email: admin.email,
            token: token,
            nic: admin.nic
          }
          successResponse(res, 'Admin Login successful', adminData);

        }
        else {
          errorResponse(res, null, 'Invalid Password', null);
        }
      } else {
        errorResponse(res, 404, 'Admin not found', null);
      }
    }).catch(err => {
      errorResponse(res, null, null, err);
    });
  
}
//signIn Validation part

const signinValidate = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};


//Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, 'CeylonRuby123', {
    expiresIn: '30d',
  })
}
//user auth controller | signin
exports.userSignIn = function (req, res) {
  var { email, password } = req.body

  User.findOne({ email: email }).then(user => {
    if (user) {
      const cmp = bcrypt.compareSync(password, user.password);
      if (cmp) {
        successResponse(res, 'User Login successful', user);
      }
      else {
        errorResponse(res, null, 'Invalid Password', null);
      }
    } else {
      errorResponse(res, 404, 'User not found', null);
    }
  }).catch(err => {
    errorResponse(res, null, null, err);
  });
}
//signUp validation

//user auth controller | signup 

// exports.userSignUp = async(req,res) =>{
// const {firstName, lastName, nic, phoneNumber,email,password } = req.body;

//user auth controller | signup 

//         successResponse(res, 'User Sign Up successful', user);
//     }catch(error){
//         errorResponse(res, null, null, err);
//     }

// }

//user auth controller | signup 2
exports.userSignUp = function (req, res) {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const { firstName, lastName, nic, phoneNumber, email, password } = req.body;

  User.findOne({ email } || { nic }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email or NIC already exists" });
    } else {
      const newUser = new User({
        firstName,
        lastName,
        nic,
        phoneNumber,
        email,
        password
      });
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
};

//  User Forgot Password Initialization
exports.forgotPassword = async (req, res, next) => {
  // Send Email to email provided but first check if user exists
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new errorResponse("No email could not be sent", 404));
    }

    // Reset Token Gen and add to database hashed (private) version of token
    const resetToken = user.getResetPasswordToken();

    await user.save();

    // Create reset url to email to provided email
    const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

    // HTML Message
    const message = `
        <h1>You have requested a password reset</h1>
        <p>Please make a put request to the following link:</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({ success: true, data: "Email Sent" });
    } catch (err) {
      console.log(err);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return next(new errorResponse("Email could not be sent", 500));
    }
  } catch (err) {
    next(err);
  }
}
exports.resetPassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new errorResponse("Invalid Reset Token", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: "Password Updated Success",
      token: user.getSignedJwtToken(),
    });
  } catch (err) {
    next(err);
  }
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({ sucess: true, token });
};

//start here!!!!!!!!!!!!!!!!!!!!
// Get register user details
exports.registerUser = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Content must not be empty",
    });
  } else {
    var nic = req.body.nic;

    User.findOneAndUpdate(
      { nic: nic },
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        nic: req.body.nic,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        gender: req.body.gender,
      }
    )
      .then((user) => {
        if (user) {
          res.send(user);
        } else {
          return res.status(404).send({
            message: "User not found !",
          });
        }
      })
      .catch((err) => {
        return res.status(500).send({
          message: "Error in updating the User data"+err,
        });
      });
    // User.findOneAndUpdate( req.body.nic, {
    //   status : req.body.status,
    //   firstName : req.body.firstName,
    //   lastName : req.body.lastName,
    //   nic : req.body.nic,
    //   phoneNumber : req.body.phoneNumber,
    //   address : req.body.address,
    //   gender : req.body.gender
    // })
    // .then(user => {
    //   if(!user){
    //     return res.status(404).send({
    //       message: "User is not found !"
    //     })
    //   }
    //   else{
    //     res.send(user);
    //   }
    // })
    // .catch(err => {
    //   return res.status(500).send({
    //     message : "Error in updating the User data"
    //   })
    // })
  }
};
  //   const resetPasswordToken = crypto
  //     .createHash("sha256")
  //     .update(req.params.resetToken)
  //     .digest("hex");

  //   try {
  //     const user = await User.findOne({
  //       resetPasswordToken,
  //       resetPasswordExpire: { $gt: Date.now() },
  //     });

  //     if (!user) {
  //       return next(new errorResponse("Invalid Reset Token", 400));
  //     }

  //     user.password = req.body.password;
  //     user.resetPasswordToken = undefined;
  //     user.resetPasswordExpire = undefined;

  //     await user.save();

  //     res.status(201).json({
  //       success: true,
  //       data: "Password Updated Success",
  //       token: user.getSignedJwtToken(),
  //     });
  //   } catch (err) {
  //     next(err);
  //   }

  //   const sendToken = (user, statusCode, res) => {
  //   const token = user.getSignedJwtToken();
  //   res.status(statusCode).json({ sucess: true, token });
  // };

// };
  
