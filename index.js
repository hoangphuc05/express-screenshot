const express = require('express')
const fs = require('fs');
var cors = require('cors')
require('dotenv').config()
const axios = require('axios');

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
    console.log(req.body.html);
    let htmlRequest = req.body.html|| "";
    let gCaptcha = req.body['gcaptcha']||"";
    if (htmlRequest.length <= 0) {
        res.send("No html content");
        return;
    }

    let captchResult = await verifyGoogleRecaptcha(gCaptcha);

    if (!captchResult) {
        res.send("Invalid captcha");
        return;
    }
    fs.writeFileSync(`public/${require('md5')(htmlRequest)}.html`, htmlRequest, 'utf8');
    
    let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options().addArguments('--headless')).build();
    try {
        
        await driver.get(`localhost:3000/${require('md5')(htmlRequest)}.html`);
        await driver.manage().addCookie({name:'session', value:'123'});
        await driver.get(`localhost:3000/${require('md5')(htmlRequest)}.html`);
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
        fs.unlinkSync(`public/${require('md5')(htmlRequest)}.html`);
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})