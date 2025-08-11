const { getPrices, currencySources } = require('./currencys');

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

let userIds = new Set();

try {
  const data = fs.readFileSync('users.json');
  userIds = new Set(JSON.parse(data));
} catch (e) {
  console.log('users.json не знайдено, створюю новий список');
}


// price chack function
let lastPrices = {}; // Stores last known prices per coin

async function checkPrice() {
    try {
        const prices = await getPrices();

        for (const { symbol } of currencySources) {
            const currentPrice = prices[symbol];
            console.log(`Актуальна ціна ${symbol}: $${currentPrice}`);

            if (lastPrices[symbol] !== undefined) {
                const diff = ((currentPrice - lastPrices[symbol]) / lastPrices[symbol]) * 100;
                console.log(`Зміна ${symbol}: ${diff.toFixed(2)}%`);

                if (Math.abs(diff) >= 0.5) {
                    for (let id of userIds) {
                        bot.sendMessage(id, `${symbol} ${diff.toFixed(2)}%: $${currentPrice}`)
                            .catch(err => {
                                if (err.response?.statusCode === 400 && err.response.body.description.includes('chat not found')) {
                                    console.error(`❌ Не вдалося надіслати повідомлення до chatId=${id}: користувач не підписаний або chatId неправильний`);
                                } else {
                                    console.error(`❌ Помилка надсилання повідомлення chatId=${id}:`, err.message);
                                }
                            });
                    }
                }
            }

            lastPrices[symbol] = currentPrice;
        }
    } catch (err) {
        console.error('Помилка при отриманні ціни:', err);
    }
}
// chack the price interval 
setInterval(checkPrice, 300 * 10000);
//setInterval(checkPrice, 3000);

bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  if (!userIds.has(id)) {
    userIds.add(id);
    fs.writeFileSync('users.json', JSON.stringify([...userIds]));
    console.log(`Добавлен новый пользователь: ${id}`);
  }
  bot.sendMessage(id, '✅ Ти підписаний на оновлення BTC i TON!');
  
});

