const express = require("express");
const app = express();
require('dotenv').config();

var key = process.env.key;

const parseIp = (req) =>
    req.headers['x-forwarded-for']?.split(',').shift()
    || req.socket?.remoteAddress;

app.get("/", (req, res) => res.send("Express on Vercel"));

//fetch ip data from ip-api.com
async function getLocal(ip, next) {
    try {
        let response = await fetch(`http://ip-api.com/json/${ip}`);
        if (!response.ok) {
            next(response.status);
        }

        return await response.json();

    } catch (error) {
        console.error(error.message);
        next(error)
    }
}

//fetch weather conditions
async function getWeather(lat, lon, next, api_key) {
    try {
        let response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=hourly,daily,alerts&units=imperial&appid=${api_key}`);
        if (!response.ok) {
            next(response.status);
        }
        return await response.json();

    } catch (error) {
        console.error(error.message);
        next(error)
    }
}

app.get("/api/hello", async (req, res, next) => {
    const ip = parseIp(req);

    let name = req.query.visitor_name ? req.query.visitor_name : "Guest";

    if (name.indexOf('\'') >= 0 || name.indexOf('"') >= 0) {
       name = name.replace(/^["'](.+(?=["']$))["']$/, '$1');
    }

    let { city, lat, lon } = await getLocal(ip, next);

    let { current } = await getWeather(lat, lon, next, key);
    let temperature = Math.round((current.temp - 30) / 2)


    res.json({
        "client_ip": ip,
        "location": city,
        "greeting": `Hello, ${name}!, the temperature is ${temperature} degrees Celcius in ${city}`
    });
})

//error handling
app.use((err, req, res, next) => {
    res.status(500)
    res.render('error', { error: err })
})

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;