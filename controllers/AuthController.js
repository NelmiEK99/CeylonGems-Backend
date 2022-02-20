const Admin = require("../models/admin")
const User = require("../models/user")
const bcrypt = require("bcrypt")
const { ackResponse, errorResponse, successResponse } = require("../shared/responses")
const passwordComplexity = require("joi-password-complexity");
const Joi = require('joi');

// const validateLoginInput = require("../../validation/login");
exports.adminSignIn = function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    Admin.findOne({ email:email }).then(admin => {
        if(admin){
            const cmp = bcrypt.compareSync(password, admin.password);
            if(cmp){
                successResponse(res, 'Admin Login successful', admin);
            }
            else{
                errorResponse(res, null, 'Invalid Password', null);
            }
            
        }else{
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

//user auth controller | signin

exports.userSignIn = function (req, res) {
    const { error } = signinValidate(req.body);
    if (error)
			return res.status(400).send({ message: error.details[0].message });

    var email = req.body.email;
    var password = req.body.password;

    User.findOne({ email:email }).then(user => {
        if(user){
            const cmp = bcrypt.compareSync(password, user.password);
            if(cmp){
                successResponse(res, 'User Login successful', user);
            }
            else{
                errorResponse(res, null, 'Invalid Password', null);
            }
            
        }else{
            errorResponse(res, 404, 'User not found', null);
        }
    }).catch(err => {
        errorResponse(res, null, null, err);
    });
}
//signUp validation

//user auth controller | signup 

const validate = (data) => {
	const schema = Joi.object({
		firstName: Joi.string().required().label("First Name"),
		lastName: Joi.string().required().label("Last Name"),
        nic: Joi.string().required().label("NIC"),
        phoneNumber: Joi.string().required().label("Phone Number"),
		email: Joi.string().email().required().label("Email"),
		password: passwordComplexity().required().label("Password"),
	});
	return schema.validate(data);
};

//user auth controller | signup 

exports.userSignUp=function(req, res){

const { error } = validate(req.body);

if (error){
 return errorResponse(res, 404,error.details[0], null);
}

const {firstName, lastName, nic, phoneNumber,email,password } = req.body;
 
  User.findOne({ email}).then(user => {
      if (user) {
        return res.status(400).json({ email: "Email or NIC already exists" });
      }else{
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
