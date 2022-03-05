const express = require('express')
const fs = require('fs');
var cors = require('cors')
require('dotenv').config()
const axios = require('axios');
const {v4: uuidv4} = require('uuid');

const app = express()
const port = 3000
const {Builder, By, Key, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const res = require('express/lib/response');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());
// app.options('*', cors()) // include before other routes

function verifyGoogleRecaptcha(captchaToken) {
    return new Promise((resolve, reject) => {
        const url = 'https://www.google.com/recaptcha/api/siteverify?secret=' + process.env.RECAPTCHA_SECRET + '&response=' + captchaToken;
        const data = {
            secret: process.env.RECAPTCHA_SECRET,
            response: captchaToken
        };
        axios({
            method: 'POST',
            url: url,
        }).then(res => res.data)
        .then(res => {
            console.log(res);
            if (res.success) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).catch(err => {
            reject(err);
        });
    });
}
app.get('/', (req, res) => {
    res.send('Hello, welcome to ACM CTF API services. Please don\'t hack this server directly.');
});

app.post('/screenshot', async (req, res) => {
    
    let htmlRequest = req.body.html|| "";
    let htmlName = `${require('md5')(htmlRequest)}-${uuidv4()}.html`;
    let gCaptcha = req.body['gcaptcha']||"";
    if (htmlRequest.length <= 0) {
        res.send("No html content");
        return;
    }

    // let captchResult = await verifyGoogleRecaptcha(gCaptcha);

    // if (!captchResult) {
    //     res.send("Invalid captcha");
    //     return;
    // }
    
    //military grade purification
    htmlRequest = htmlRequest.replace("script", "code");
    htmlRequest = htmlRequest.replace("embed", "code");
    htmlRequest = htmlRequest.replace("iframe", "code");
    htmlRequest = htmlRequest.replace("frame", "code");
    htmlRequest = htmlRequest.replace("object", "code");
    

    fs.writeFileSync(`public/${htmlName}`, htmlRequest, 'utf8');
    
    let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options().addArguments('--headless')).build();
    try {
        
        await driver.get(`localhost:3000/${htmlName}`);
        await driver.manage().addCookie({name:'flag', value:process.env.FLAG});
        await driver.get(`localhost:3000/${htmlName}`);
        driver.takeScreenshot().then(function (image, err) {
            const img = Buffer.from(image, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img); 
            //fs.writeFileSync(`history/${require('md5')(htmlRequest)}.png`, image, 'base64');
        });
    } finally {
        await driver.quit();
        fs.unlinkSync(`public/${htmlName}`);
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})