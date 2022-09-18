// app.js data
const app_file_data =
`
const express = require("express")
const app = express();
const path = require('path')

if(process.env.NODE_ENV !=="production"){
    require("dotenv").config({path: "./config/config.env"});
}

// Database connection
const { connectDatabase } = require("./config/database");
// connectDatabase();       //Uncomment this line to connect to database, before it, you need to add MONGO_URI in .env file

const cookieParser = require("cookie-parser");

const cors = require('cors');
app.use(cors());

// Using Middleware
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// import routes
const user = require("./routes/user.route.js");

app.get('/', (req, res)=>{
    res.send("<h2>Server is running at port 5000</h2><h3>The base url is http://localhost:5000/api/v1</h2><h3>And you can find the routes at routes folder.</h3>")
})
  

// using routes
app.use("/api/v1", user);

//  for frontend
// app.use(express.static(path.join(__dirname, "../frontend/build")));

// app.get("*", (req,res)=>{
//     res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
// });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Server is running on port: http://localhost:"+PORT);
});
`

const User_model_file_data = 
`const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
})

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateToken = function () {
    return jwt.sign({_id:this._id}, process.env.JWT_SECRET);   //JWT_SECRET is in .env file
}


userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

module.exports = User = mongoose.model('User', userSchema);
`

const Post_model_file_data = 
`const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    avatar: {
        type: String
    },
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    comments: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            text: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Post = mongoose.model('Post', PostSchema);
`

const user_controller_file_data =
`
const User = require("../models/User");
const crypto = require("crypto"); 
const {sendEmail} = require("../middleware/sendEmail");

exports.register = async(req,res)=>{

    try {

        const {name, email, password} = req.body;

        let user = await User.findOne({email});

        if(user){
            return res.status(400).json({
                message: "User already exists",
                success: false
            })
        }

        user = await User.create({
            name,
            email,
            password 
        });

        const token = await user.generateToken();

        const options = {
            expiresIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        res.status(200)
        .cookie("token", token, options)
        .json({
            message: "User Successfully registered",
            user,
            success: true,
        })
        
    } catch (error) {
        res.status(500).json({
            message: error,
            success: false
        })
    }
}


exports.login = async(req,res)=>{
    try {

        const {email, password} = req.body;

        const user = await  User.findOne({email}).select("+password");

        if(!user){
            return res.status(400).json({
                message: "User does not exist",
                success: false
            })
        }

        const isMatch = await user.matchPassword(password);

        if(!isMatch){
            return res.status(400).json({
                message: "Incorrect password",
                success: false
            })
        }

        const token = await user.generateToken();

        const options = {
            expiresIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        res.status(200)
        .cookie("token", token, options)
        .json({
            message: "Login successful",
            user,
            success: true,
        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
}

exports.logout = async(req,res)=>{
    try {
        
        res.status(200).cookie("token", null, {expires:new Date(Date.now()), httpOnly:true}).json({
            message: "Logout successful",
            success: true
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
}

exports.updatePassword = async(req,res)=>{
    
    try {
        const user = await User.findById(req.user._id).select("+password");

        const {oldPassword, newPassword} = req.body;

        if(!oldPassword || !newPassword){  
            return res.status(400).json({
                message: "Please provide both old and new password",
                success: false
            })
        }

        const isMatch = await user.matchPassword(oldPassword);

        if(!isMatch){
            return res.status(400).json({
                message: "Incorrect password",
                success: false
            })
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            message: "Password successfully updated",
            success: true
        })
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
}

exports.updateProfile = async(req,res)=>{
    try {

        const user = await User.findById(req.user._id);

        const {name, email, avatar} = req.body;

        if(name){
            user.name = name;
        }
        if(email){
            user.email = email;
        }

        await user.save();

        res.status(200).json({
            message: "Profile successfully updated",
            success: true
        })        

    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
}


exports.deleteMyProfile = async(req,res)=>{
    try {

        const user = await User.findById(req.user._id);

        await user.remove();

        // logout User after deleting profile
        res.cookie("token", null, {expires:new Date(Date.now()), httpOnly:true});

        res.status(200).json({
            message: "Profile successfully deleted",
            success: true
        })
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
}


exports.myProfile = async(req,res)=>{
    try {

        const user = await User.findById(req.user._id);

        res.status(200).json({
            message: "User profile",
            user,
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
}


exports.getAllUsers = async(req,res)=>{
    try {
        
        const users = await User.find({name: {$regex: req.query.name, $options:"i"}});

        res.status(200).json({
            message: "All users",
            users,
        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    } 
}


exports.forgotPassword = async(req,res)=>{
    try{
        const user = await User.findOne({email:req.body.email});
        if(!user){
            return res.status(404).json({
                message: "User not found",
                success: false
            })
        }

        const resetPasswordToken = user.getResetPasswordToken();
        await user.save();

        const resetUrl = req.protocol + "://" + req.get("host") + "/password/reset/" + resetPasswordToken;
        const message = "You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: " +resetUrl;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password reset token",
                message
            });
            res.status(200).json({
                message: "Email sent to "+ user.email,
                success: true
            })
        }
        catch(error){
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            res.status(500).json({
                message: error.message,
                success: false
            })
        }
    }
    catch(error){
        res.status(500).json({
            message: error.message,
        })
    }
}

exports.resetPassword = async(req,res)=>{
    try {

        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()},
        })

        if(!user){
            return res.status(401).json({
                message: "Invalid or expired token",
                success: false
            })
        }
        if(req.body.password ===undefined){
            return res.status(400).json({
                message: "Password is required",
                success: false
            })
        }

        user.password = req.body.password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            message: "Password successfully updated",
            success: true
        })
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
        
}
`

const userAuth_data =
`
const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.isAuthenticated = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({
                message: "Please login first",
                success: false
            })
        }
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded._id);
        next();
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }
}
`

// Routes files data
const user_routefile_data = 
`
const express = require('express');
const {register,
    login,
    logout,
    updatePassword,
    updateProfile,
    deleteMyProfile,
    myProfile,
    forgotPassword,
    resetPassword,

} = require('../controllers/user.controller.js');


const {isAuthenticated} = require('../middleware/auth');
const router = express.Router();


router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/update/password').put(isAuthenticated, updatePassword);
router.route('/update/profile').put(isAuthenticated, updateProfile);
router.route('/delete/me').delete(isAuthenticated, deleteMyProfile);
router.route('/me').get(isAuthenticated, myProfile);
router.route('/forgot/password').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);

module.exports = router;
`


// config file data

const database_file_data = 
`
const mongoose = require('mongoose');

exports.connectDatabase = () => {
    mongoose.connect(process.env.MONGO_URI).then(() => {  //MONGO_URI is in .env file
        console.log("DataBase connected");
    })
    .catch(err => {
        console.log(err);
    });
}
`

const dotenv_file_data = 
`
PORT = 5000
MONGO_URI = "mongodb://localhost:27017/your_database_name"
JWT_SECRET = "your_jwt_secret"
SMTP_HOST = "smtp.mailtrap.io"
SMTP_PORT = 2525
SMTP_EMAIL = "your_email"
SMTP_PASSWORD = "your_password"
SMTP_FROM_EMAIL = "your_email"
SMTP_FROM_NAME = "your_name"
`

const sendEmail_file_data = 
`
const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {

    var transport = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "1c592814feb8f6",
          pass: "0e0a76919323c9"
        }
    });

    var mailOptions = {
        // from: "Your Name <your_email>",
        // to: ,
        // subject: ,
        // text:    
    }

    await transport.sendMail(mailOptions);
}
`

module.exports = {
    app_file_data,
    User_model_file_data,
    Post_model_file_data,
    user_controller_file_data,
    userAuth_data,
    user_routefile_data,
    database_file_data,
    dotenv_file_data,
    sendEmail_file_data
}