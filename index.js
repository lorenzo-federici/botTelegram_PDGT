require('dotenv').config();
process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const axios       = require('axios')

const TKN_BOT = '1087756157:AAE0e2dgll0JliyCL8esAWQWFxgsyTMF8aE';
const URL     = 'https://progetto-pdgt-federici.herokuapp.com'

let where_i_am = "Start";  //FLAG status
let TKN_Log   = ""

const bot = new TelegramBot(TKN_BOT, {polling: true});

// OPTS------------------------------------------------------
const opts_start = {
    "reply_markup": {
        "inline_keyboard": [
            [{
                "text": "Login"
                ,"callback_data": "Login"            
            }, 
            {
                "text": "Signup"
                ,"callback_data": "Signup"            
            }]
        ]
    }
}
const opts_after_signup = {
    "reply_markup": {
        "inline_keyboard": [
            [{
                "text": "Login"
                ,"callback_data": "Login"            
            }]
        ]
    }
}
const opts_keyboard = {
    "reply_markup": {
        "keyboard": [
            ["🚂View stations", "📍View station position"], ["➕Add station"]
        ]
    }
}
//-----------------------------------------------------------

bot.onText(/\/start/, (msg, match) => {
    where_i_am = "Start"
    let txt = 'Welcome, to use my power register or Login: ';
    bot.sendMessage(msg.chat.id, txt, opts_start);
});

bot.onText(/\/options/, (msg, match) => {
    const chatId = msg.chat.id;
    if(where_i_am == 'Inside'){
        let txt = 'Choose what to do:'
        bot.sendMessage(msg.chat.id, txt, opts_keyboard)
    }else{
        let txt = 'You must register or Login: ';
        bot.sendMessage(msg.chat.id, txt, opts_start);
    }
});

bot.on('callback_query', function onCallbackQuery(example){
    const action = example.data // This is responsible for checking the content of callback_data
    const msg = example.message
    
    if (action == 'Login' && where_i_am == 'Start'){
        console.log('Login')
        where_i_am = action;
        bot.sendMessage(msg.chat.id, "Tell me your email and password")
    }
    else if (action == 'Signup' && where_i_am == 'Start'){
        console.log('Signup')
        where_i_am = action;
        bot.sendMessage(msg.chat.id, "Tell me your email and password so I'll register")
    }
});

bot.on('message', (msg) => {
    if (where_i_am == 'Login'){
        // LOGIN-----------------------------------------------------------------
        let userInfo = msg.text.toString().split(" ")
        axios.post(URL + '/users/login', {
            email: userInfo[0].toLowerCase(),
            password: userInfo[1]
        })
        .then((response) => {
            where_i_am = "Inside"
            TKN_Log = response.data.token
            let txt1 = 'TOP you\'re in :)'
            let txt2 = '\n\nChoose what to do: '
            bot.sendMessage(msg.chat.id, txt1+txt2, opts_keyboard)
            //console.log(tokenLog)
        },(error) => {
            where_i_am = "Start"
            let txt1 = 'Authentication failed try again:\n';
            let txt2 = 'You must write your email and password divided by a space'
            bot.sendMessage(msg.chat.id, txt1+txt2, opts_start)
        });
        //------------------------------------------------------------------------
    }else if (where_i_am == 'Signup'){
        where_i_am = 'Start'
        // SIGNUP-----------------------------------------------------------------
        let userInfo = msg.text.toString().split(" ")
        axios.post(URL + '/users/signup', {
            email: userInfo[0].toLowerCase(),
            password: userInfo[1]
        })
        .then((response) => {
            let txt = 'Registered successfully now try to log in';
            bot.sendMessage(msg.chat.id, txt, opts_after_signup)
        },(error) => {
            let txt1 = 'Authentication failed try again:\n';
            let txt2 = 'You must write your email and password divided by a space'
            bot.sendMessage(msg.chat.id, txt1+txt2, opts_start)
        });
        //------------------------------------------------------------------------
    }else if (where_i_am == 'Inside' && msg.text.toString().includes("🚂View")){
        // GET_ALL_STATIONS-------------------------------------------------------
        axios.get(URL + '/stations')
        .then((response) => {
            console.log(response.data.product);

            let stations = ""
            for(let i = 0; i < response.data.count; i++){
                stations = stations + (i+1) + ") " +
                           response.data.product[i].Regione + 
                           " - " + 
                           response.data.product[i].Nome + " \n"
            }
            let txt = "Here are all the " + response.data.count + " stations: \n\n" + stations
            bot.sendMessage(msg.chat.id, txt)
        });
        //-----------------------------------------------------------------------
    }else if (where_i_am == 'Inside' && msg.text.toString().includes("📍View")){
        // PROOF GET_ONE_STATION--------------------------------------------------
        let id_st = "5e6f9fbfa509220612ef49fc"
        axios.get(URL + '/stations/'+id_st)
        .then((response) => {
            let txt = "Here is the point of " + response.data.station.Nome + "'s station:"
            bot.sendMessage(msg.chat.id, txt);
            bot.sendLocation(msg.chat.id, 
                            response.data.station.Latitudine,
                            response.data.station.Longitudine);
        });
        //------------------------------------------------------------------------
    }
});