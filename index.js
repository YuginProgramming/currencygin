require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

let lastPriceBTC = null;
let lastPriceTON = null;
let userIds = new Set();

try {
  const data = fs.readFileSync('users.json');
  userIds = new Set(JSON.parse(data));
} catch (e) {
  console.log('users.json не знайдено, створюю новий список');
}

// Получение цены BTC с сайта Coindesk
const getBTCPrice = async () => {
  const res = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  return parseFloat(res.data.price);
};

const getTONPrice = async () => {
  const res = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT');
  return parseFloat(res.data.price);
};

// price chack function
const checkPrice = async () => {
  try {
    // BTC Price Check
    const currentPriceBTC = await getBTCPrice();
    console.log(`Актуальна ціна BTC: $${currentPriceBTC}`);

    if (lastPriceBTC !== null) {
      const diffBTC = ((currentPriceBTC - lastPriceBTC) / lastPriceBTC) * 100;
      console.log(`Зміна BTC: ${diffBTC.toFixed(2)}%`);

      if (Math.abs(diffBTC) >= 0) {
        for (let id of userIds) {
          bot.sendMessage(id, `BTC ${diffBTC.toFixed(2)}%: $${currentPriceBTC}`)
            .catch(err => {
              if (err.response && err.response.statusCode === 400 && err.response.body.description.includes('chat not found')) {
                console.error(`❌ Не вдалося надіслати повідомлення до chatId=${id}: користувач не підписаний або chatId неправильний`);
              } else {
                console.error(`❌ Помилка надсилання повідомлення chatId=${id}:`, err.message);
              }
            });
        }
      }
      lastPriceBTC = currentPriceBTC;
    } else {
      lastPriceBTC = currentPriceBTC;
    }

    // TON Price Check
    const currentPriceTON = await getTONPrice();
    console.log(`Актуальна ціна TON: $${currentPriceTON}`);

    if (lastPriceTON !== null) {
      const diffTON = ((currentPriceTON - lastPriceTON) / lastPriceTON) * 100;
      console.log(`Зміна TON: ${diffTON.toFixed(2)}%`);

      if (Math.abs(diffTON) >= 0) {
        for (let id of userIds) {
          bot.sendMessage(id, `💰 TON ${diffTON.toFixed(2)}%: $${currentPriceTON}`)
            .catch(err => {
              if (err.response && err.response.statusCode === 400 && err.response.body.description.includes('chat not found')) {
                console.error(`❌ Не вдалося надіслати повідомлення до chatId=${id}: користувач не підписаний або chatId неправильний`);
              } else {
                console.error(`❌ Помилка надсилання повідомлення chatId=${id}:`, err.message);
              }
            });
        }
      }
      lastPriceTON = currentPriceTON;
    } else {
      lastPriceTON = currentPriceTON;
    }

  } catch (err) {
    console.error('Помилка при отриманні ціни:', err);
  }
};

// chack the price interval 
setInterval(checkPrice, 300 * 10000);

// Команда /start — сохраняет chat.id пользователя
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  if (!userIds.has(id)) {
    userIds.add(id);
    fs.writeFileSync('users.json', JSON.stringify([...userIds]));
    console.log(`Добавлен новый пользователь: ${id}`);
  }
  bot.sendMessage(id, '✅ Ти підписаний на оновлення BTC i TON!');
  
});

