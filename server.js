const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

// ✅ DEFINE DEVICES ONCE (at the top)
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

// ✅ ROUTE
app.get("/preview", async (req, res) => {
  const { url, device } = req.query;

  if (!url || !device) {
    return res.status(400).send("Missing parameters");
  }

  const config = DEVICES[device];
  if (!config) {
    return res.status(400).send("Invalid device");
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(config.userAgent);
    await page.setViewport({
      width: config.width,
      height: config.height
    });

    await page.goto(
      url.startsWith("http") ? url : `https://${url}`,
      {
        waitUntil: "networkidle2",
        timeout: 30000
      }
    );

    const screenshot = await page.screenshot();

    await browser.close();

    res.set("Content-Type", "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading page");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
