const tgApi = require('node-telegram-bot-api');
require('dotenv').config();
const fs = require('fs');
const emailjs = require('@emailjs/nodejs');

emailjs.init(process.env.PUBLIC_KEY)

const bot = new tgApi(process.env.TG_TOKEN, {polling: true});

bot.setMyCommands([
    {command: '/start', description: 'menu'},
    {command: '/apply', description: 'to submit an application'},
    {command: '/contacts', description: 'our contacts'},
    {command: '/website', description: 'our website'},
])

const buttons = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: '✅ Оставить заявку | Submit your application ✅', callback_data: '/apply'}],
            [{text:'📞 Наши контакты | Our contacts 📞', callback_data: '/contacts'}],
            [{text:'🌎 Перейти на сайт | Visit our website 🌎', callback_data: '/website'}],
            [{text:'📅 Часы работы | Schedule 📅', callback_data: '/schedule'}],
        ],
    })
}

const imageStream = fs.createReadStream('./assests/schedule.jpg');

let flag = false;

const stickerLink = 'https://tlgrm.eu/_/stickers/c2b/583/c2b583cc-71f2-3f42-935b-9a9c7ac16fc5/3.webp';

const params = {
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY,
}

const parseMode = {
    parse_mode: 'HTML'
}

//// gpt 

// Handle errors and restart polling on conflict error
bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
      console.error('Polling conflict error. Restarting polling...');
      setTimeout(() => {
        bot.stopPolling();
        bot.startPolling();
      }, 1000); // Wait 1 second before restarting polling
    } else {
      console.error('Polling error:', error);
    }
  });

///

const start = () => {

    bot.on('message', async(msg) => {
        const message = msg.text;
        const chatId = msg.chat.id; 
        const username = msg.from.username;

        if (message === '/start'){
            await bot.sendMessage(chatId, 'Добрый день! Shalom! \n\nВыберите действие: | Choose an action:', buttons)
            return;
        }

        if (flag){
            flag = false;

            try {
                if (message.startsWith('/') || message.length > 100) {
                    throw new Error('Неправильный формат. Введите данные еще раз:')
                }

                await emailjs.send(process.env.SERVICE_ID, process.env.TEMPLATE_ID, {username, message}, params)
                
                await bot.sendMessage(chatId, `Спасибо, <b>заявка оформлена!</b> Ожидайте звонка. \n\nYour application was <b>successfully sent!</b> Wait for a call.`, parseMode)
                await bot.sendSticker(chatId, stickerLink)

                setTimeout(async() => {
                    await bot.sendMessage(chatId, 'Что-нибудь еще? Something else? \n\nВыберите действие: | Choose an action:', buttons)
                }, 3000)

            } catch (error) {
                console.log(error.message);
                await bot.sendMessage(chatId, error.message);
                flag = true;
            } finally {
                return;
            }
        }

        if (message === '/apply'){
            flag = true;
            bot.sendMessage(chatId, 'Введите одним сообщением ваши <b>Имя*</b> и <b>телефон/email*</b> и мы свяжемся c вами: \n\nEnter in a single message your <b>Name*</b> and <b>phone number/email*</b> and we will contact you: ', parseMode);
            return;
        }

        if (message === '/contacts'){
            bot.sendContact(chatId, process.env.PHONE_NUMBER, process.env.NAME + '_Repairer');
            return;
        }

        if (message === '/website'){
            bot.sendMessage(chatId, 'Наш вебсайт: \n ' + process.env.WEBSITE_URL);
            return;
        }

        if (message === '/schedule'){
            bot.sendPhoto(chatId, imageStream, {caption: '<i>Расписание | Schedule</i>', ...parseMode}, {
                contentType: 'text/plain',
            });
            return;
        }

        await bot.sendMessage(chatId, `Не понял вас! Выберите команду:\n\nI don't get it! Choose another command:`, buttons);

    })

////////

    bot.on('callback_query', async(msg) => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/apply'){
            flag = true;
            await bot.sendMessage(chatId, 'Введите одним сообщением ваши <b>Имя*</b> и <b>телефон/email*</b> и мы свяжемся c вами: \n\nEnter in a single message your <b>Name*</b> and <b>phone number/email*</b> and we will contact you: ', parseMode);
            return;
        }

        if (data === '/contacts'){
            await bot.sendContact(chatId, process.env.PHONE_NUMBER, process.env.NAME + 'Repairer');
            return;
        }

        if (data === '/website'){
            await bot.sendMessage(chatId, 'Наш вебсайт: \n https://prof-master.business.site/');
            return;
        }

        if (data === '/schedule'){
            await bot.sendPhoto(chatId, imageStream, {caption: '<i>Расписание | Schedule</i>', ...parseMode});
            return;
        }
    })
}

start();