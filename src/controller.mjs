const fs = require('fs');
const {
    app_file_data,
    User_model_file_data ,
    user_controller_file_data,
    user_routefile_data,
    userAuth_data,
    database_file_data,
    dotenv_file_data,
    sendEmail_file_data
} = require ('./fileData.js');

const { spawn } = require('node:child_process')

const app_structure = ()=>{

    fs.mkdirSync('models');
    fs.mkdirSync('controllers');
    fs.mkdirSync('routes');
    fs.mkdirSync('middleware');
    fs.mkdirSync('utils');
    fs.mkdirSync('config');

    fs.writeFileSync('app.js', app_file_data);
    fs.writeFileSync('models/User.js', User_model_file_data);
    fs.writeFileSync('controllers/user.controller.js', user_controller_file_data);
    fs.writeFileSync('routes/user.route.js', user_routefile_data);
    fs.writeFileSync('middleware/auth.js', userAuth_data);
    fs.writeFileSync('middleware/sendEmail.js', sendEmail_file_data);
    fs.writeFileSync('config/database.js', database_file_data);
    fs.writeFileSync('config/config.env', dotenv_file_data);

    // Installing dependencies
    const command1 = spawn('npm init -y', {shell: true});
    const command2 = spawn('npm install express bcrypt dotenv mongoose nodemailer jsonwebtoken cookie-parser cors', {shell: true});

    // Console loading animation
    const loading = ['|', '/', '-', '\\', '|', '/', '-', '\\', '|'];
    let x = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${loading[x++]} Please Wait, Processing...`);
        x &= 3;
    }, 100);

    // output from the commands
    command1.stdout.on('data', output => {
        console.log("Output: ", output.toString())
    })
    command2.stdout.on('data', output => {
        clearInterval(interval);
        console.log("Output: ", output.toString())

        console.log("\x1b[32m", "Success, Please run your app using 'node app.js' command");
    })    
}

module.exports = {
    app_structure
};