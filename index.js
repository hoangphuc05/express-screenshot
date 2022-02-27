const express = require('express')
const fs = require('fs');
const app = express()
const port = 3000
const {Builder, By, Key, until} = require('selenium-webdriver');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    (async function example() {
        let driver = await new Builder().forBrowser('firefox').build();
        try {
            const html_content = `
                <html>
                    <head></head>
                    <body>
                        <div>
                            Hello World =)
                        </div>
                    </body>
                </html>
            `
            await driver.get('data:text/html;charset=utf-8,' + html_content);
            // await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);
            // await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
            driver.takeScreenshot().then(function (image, err) {

                require('fs').writeFileSync("img.png", image, 'base64');
            });
        } finally {
            // await driver.quit();
        }
    })();
  res.send('Hello World!')
});

app.post('/screenshot', async (req, res) => {
    console.log(req.body.html);
    let htmlRequest = req.body.html?? "";
    if (htmlRequest.length <= 0) {
        res.send("No html content");
        return;
    }
    fs.writeFileSync(`public/${require('md5')(htmlRequest)}.html`, htmlRequest, 'utf8');
    // res.send('Hello World!');
    let driver = await new Builder().forBrowser('firefox').build();
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
            fs.writeFileSync("img.png", image, 'base64');
        });
    } finally {
        await driver.quit();
        fs.unlinkSync(`public/${require('md5')(htmlRequest)}.html`);
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})