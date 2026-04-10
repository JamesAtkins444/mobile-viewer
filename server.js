const express = require("express");
const { chromium } = require("playwright");

const app = express();

// Device configs
const DEVICES = {
  iphone14: {
    name: "iPhone 14",
    width: 390,
    height: 844,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"
  },
  pixel7: {
    name: "Pixel 7",
    width: 412,
    height: 915,
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7)"
  },
  ipad: {
    name: "iPad",
    width: 768,
    height: 1024,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)"
  }
};

app.use(express.static("public"));

app.get("/preview", async (req, res) => {
  const { url, device } = req.query;

  if (!url || !device) {
    return res.status(400).send("Missing parameters");
  }

  const config = DEVICES[device];
  if (!config) {
    return res.status(400).send("Invalid device");
  }

  let browser;

  try {
    browser = await chromium.launch({
      args: ["--no-sandbox"]
    });

    const context = await browser.newContext({
      viewport: {
        width: config.width,
        height: config.height
      },
      userAgent: config.userAgent
    });

    const page = await context.newPage();

    await page.goto(
      url.startsWith("http") ? url : `https://${url}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60000
      }
    );

    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 60
    });

    await browser.close();

    res.set("Content-Type", "image/jpeg");
    res.send(screenshot);

  } catch (err) {
    console.error("PLAYWRIGHT ERROR:", err);
    if (browser) await browser.close();
    res.status(500).send("Error loading page");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
