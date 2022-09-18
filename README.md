# Lazy-dev

### A library to set up your basic app requirement and make all files and folder required for nodejs development.

</br>

As many developers need to set up basic folders/files and some common functions, so to enhance their productivity this library helps to build basic app in few seconds.

</br>

Folder structure created by lazy-dev:
```bash
 
    ├── app.js
    ├── config
    │   ├── config.env
    │   └── database.js
    ├── controllers           
    │   └── user.controller.js  
    ├── models
    │   └── User.js
    ├── routes
    │   └── user.route.js
    ├── middleware
    │   ├── auth.js
    │   └── sendEmail.js
    ├── utils
    └── ...
```

| File  | content |
| ------------- | ------------- |
| app.js  | It is a main file to start server and connect to database and initialize all the middleware and routes.|
| config/config.env  | This file contains all the environment variables.  |
| config/database.js  | This file connects the app with database.  |
| controllers/user.controller.js  | All the logics of APIs were implemented here like: Register, login, logout, delete profile etc.  |
| models/User.js  | Contains the user schema and some functions like matchPassword, genrateToken etc.  |
| routes/user.route.js  | Contains all the end points of APIs.  |
| middleware/auth.js  | Contains logic for the authentication.  |
| middleware/endEmail.js  | Contains function to send email using nodemailer.  |

</br>

Set up your environment variables in config/config.env

</br>

Installation
```bash
npm install lazy-dev
```