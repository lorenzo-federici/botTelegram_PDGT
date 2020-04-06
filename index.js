require('dotenv').config();
process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const axios       = require('axios')

const TKN_BOT = '1087756157:AAE0e2dgll0JliyCL8esAWQWFxgsyTMF8aE';
const URL     = 'https://progetto-pdgt-federici.herokuapp.com'

let where_i_am = "Start";  //FLAG status
let TKN_Log    = ""
let ID_USER    = ""
let header     = {}
let updateOPT  = {}
let isAdmin    = false

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
const opts_view_station_user = {
    "reply_markup": {
        "inline_keyboard": [
            [{
                "text": "View All station"
                ,"callback_data": "all"            
            }], 
            [{
                "text": "View by name "
                ,"callback_data": "name"            
            }], 
            [{
                "text": "View by region "
                ,"callback_data": "region"            
            }], 
            [{
                "text": "View by province "
                ,"callback_data": "province"            
            }]
        ]
    }
}
const opts_view_station_admin = {
    "reply_markup": {
        "inline_keyboard": [
            [{
                "text": "View by name "
                ,"callback_data": "name"            
            }], 
            [{
                "text": "View by region "
                ,"callback_data": "region"            
            }], 
            [{
                "text": "View by province "
                ,"callback_data": "province"            
            }]
        ]
    }
}
//user 
const opts_keyboard_user = {
    "reply_markup": {
        "keyboard": [
            ["🚂View stations", "📍View nearest station"], 
            ["🔚Logout", "❌👤Delete me"]
        ]
    }
}
//admin
const opts_keyboard_admin = {
    "reply_markup": {
        "keyboard": [
            ["🚂View stations", "📍View nearest station"],
            ["➕Add station", "📝Modify station", "❌Delete station"],
            ["🔍View User", "🔚Logout"]
        ]
    }
}
const opts_location = {
    "parse_mode": "Markdown",
    "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [[{
            text: "My location",
            request_location: true
        }], ["Cancel"]]
    }
};
//-----------------------------------------------------------


bot.onText(/\/start/, (msg, match) => {
    if(where_i_am == 'Start'){
        let txt = 'Welcome, to use my power register or Login: ';
        bot.sendMessage(msg.chat.id, txt, opts_start);
    }else{
        let txt = 'You are allredy in.\nChoose what you want';
        bot.sendMessage(msg.chat.id, txt, opts_keyboard);
    }
});

bot.onText(/\/options/, (msg, match) => {
    if(where_i_am != 'Start'){
        where_i_am = 'Inside'
        let txt = 'Choose what you want'
        if(isAdmin)
            bot.sendMessage(msg.chat.id, txt, opts_keyboard_admin)
        else
            bot.sendMessage(msg.chat.id, txt, opts_keyboard_user)
    }else{
        let txt = 'You must register or Login: ';
        bot.sendMessage(msg.chat.id, txt, opts_start);
    }
});

bot.on('callback_query', function onCallbackQuery(example){
    const action = example.data // This is responsible for checking the content of callback_data
    const msg = example.message
    
    if (action == 'Login' && where_i_am == 'Start'){
        //console.log('Login')
        where_i_am = action;
        bot.sendMessage(msg.chat.id, "Tell me your email and password")
    }else if (action == 'Signup' && where_i_am == 'Start'){
        //console.log('Signup')
        where_i_am = action;
        bot.sendMessage(msg.chat.id, "Tell me your email and password so I'll register")
    }else if (action == 'all' && where_i_am == 'Inside'){
        // GET_ALL_STATIONS-------------------------------------------------------
        axios.get(URL + '/stations/view/all')
        .then((response) => {
            getStation(msg.chat.id, response.data.count, response.data.stations)
        }).catch( (error) =>  {
            console.log(error);
        })
        //-----------------------------------------------------------------------
    }else if (action == 'name' && where_i_am == 'Inside'){
        where_i_am = action;

        let txt = "Tell me the station's Name: "
        bot.sendMessage(msg.chat.id, txt)
    }else if ((action == 'region' || action == 'province') && where_i_am == 'Inside'){
        where_i_am = action;

        let txt = "Tell me the "+ action +" where you want to search for the station: "
        bot.sendMessage(msg.chat.id, txt)
    }
});

bot.on('message', (msg) => {

    if (where_i_am == 'Login'){
        isAdmin = false
        // LOGIN-----------------------------------------------------------------
        let userInfo = msg.text.toString().split(" ")
        axios.post(URL + '/users/login', {
            email:    userInfo[0].toLowerCase(),
            password: userInfo[1]
        })
        .then((response) => {
            where_i_am = "Inside"
            TKN_Log = response.data.token
            ID_USER = response.data._id
            
            if(userInfo[0].toLowerCase().includes("admin@sts.it"))
                isAdmin = true
            
            let txt1 = 'TOP you\'re in :)'
            let txt2 = '\n\nChoose what you want: '
            //bot.sendMessage(msg.chat.id, txt1+txt2, opts_keyboard)
            if(isAdmin)
                bot.sendMessage(msg.chat.id, txt1+txt2, opts_keyboard_admin)
            else
                bot.sendMessage(msg.chat.id, txt1+txt2, opts_keyboard_user)
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
            //let txt1 = 'Authentication failed try again:\n';
            let txt2 = '\n\nYou must write your email and password divided by a space'
            bot.sendMessage(msg.chat.id, error.response.data.message+txt2, opts_start)
        });
        //------------------------------------------------------------------------
    }else if (where_i_am == 'Inside'){

        if(msg.text.toString().includes("🚂View")){
            let txt = 'Choose what you want:';
            if(isAdmin)
                bot.sendMessage(msg.chat.id, txt, opts_view_station_admin);
            else
                bot.sendMessage(msg.chat.id, txt, opts_view_station_user);
        }else if(msg.text.toString().includes("📍View")){ 
            bot.sendMessage(msg.chat.id, "Share me your position ", opts_location) 
            where_i_am = "location"
        }else if(msg.text.toString().includes("➕Add")){
            let txt1 = "Tell me all station's information you want to add, you will have to write me: "
            let txt2 = "\nNAME\nMUNICIPALITY\nPROVINCE\nREGION\nLONGITUDE\nLATITUDE\nID_OpenStreetMap (if you know it)\n\n"
            let txt3 = "You must write all infos divided by a space."
            bot.sendMessage(msg.chat.id, txt1+txt2+txt3)
            where_i_am = "➕Add";
        }else if(msg.text.toString().includes("📝Modify")){
            where_i_am = "ask_update";
    
            let txt1 = "Tell me all OPTION's information you want to update, you will have to write me: "
            let txt2 = "\nName\nMunicipality\nProvince\nRegion\nLongitude\nLatitude\nID_OpenStreetMap\n\n"
            let txt3 = "You must write all infos divided by a space."
            bot.sendMessage(msg.chat.id, txt1+txt2+txt3)
        }else if(msg.text.toString().includes("❌Delete")){
            where_i_am = "❌Delete";

            let txt = "Tell me the station's id to be eliminated"
            bot.sendMessage(msg.chat.id, txt)
        }else if (msg.text.toString().includes("🔚Logout")){
            TKN_Log = "";
            where_i_am = "Start";
            let txt = 'See you soon';
            bot.sendMessage(msg.chat.id, txt);
        }else if(msg.text.toString().includes("❌👤Delete")){
            let header = { headers: { 'Authorization': "bearer " + TKN_Log} }
            // GET_DELETE_STATION-----------------------------------------------------
            axios.delete(URL + '/users/'+ID_USER, header)
            .then((response) => {
                where_i_am = "Start"
                bot.sendMessage(msg.chat.id, response.data.message)
            }).catch((error) => {
                if(error.response.data.message.toString().includes("token_error")){
                    where_i_am = "Start"
                    let txt = 'Session expired';
                    bot.sendMessage(msg.chat.id, txt, opts_after_signup);
                }else{
                    where_i_am = "Inside"
                    bot.sendMessage(msg.chat.id, error.response.data.message, opts_keyboard_admin);
                }

            })
            //------------------------------------------------------------------------  
        }else if(msg.text.toString().includes("🔍View User")){
            let header = { headers: { 'Authorization': "bearer " + TKN_Log} }
            axios.get(URL + '/users/', header)
            .then((response) => {
                getUser(msg.chat.id, response.data.count, response.data.user)
            });
        }

    }else if (where_i_am == 'name'|| where_i_am == 'region' || where_i_am == 'province'){
        // GET_STATIONS-------------------------------------------------------
        axios.get(URL + '/stations/view/'+where_i_am+'?prm='+msg.text.toString())
        .then((response) => {
            getStation(msg.chat.id, response.data.count, response.data.stations)
        }).catch((error) => {
            if(error.response.data.message.toString().includes("token_error")){
                where_i_am = "Start"
                let txt = 'Session expired';
                bot.sendMessage(msg.chat.id, txt, opts_after_signup);
            }else{
                let txt = msg.text.toString() + 'error retry';
                if(isAdmin)
                    bot.sendMessage(msg.chat.id, txt, opts_keyboard_admin)
                else
                    bot.sendMessage(msg.chat.id, txt, opts_keyboard_user)
            }

        })
        //-----------------------------------------------------------------------
        where_i_am = 'Inside'
    }else if(where_i_am == '➕Add'){
        where_i_am = "Inside";
        // ADD_STATION-------------------------------------------------------------
        let stationInfo = msg.text.toString().split(" ")

        header = { headers: { 'Authorization': "bearer " + TKN_Log} }
        let req    = {  Nome: stationInfo[0],
                    Comune: stationInfo[1],
                    Provincia: stationInfo[2],
                    Regione: stationInfo[3],
                    Longitudine: parseFloat(stationInfo[4]),
                    Latitudine: parseFloat(stationInfo[5])
        }
        //idopenmap it's unnecessary
        if(stationInfo.length == 7){
            req.ID_OpenStreetMap = parseInt(stationInfo[6])
        }

        axios.post(URL + '/stations/', req, header)
        .then((response) => {
            let station     = response.data.addedStation
            let station_txt = "REGION: " + station.Regione + "\n" +
                              "PROVINCE: " + station.Provincia + "\n" +
                              "MUNICIPALITY: " +  station.Comune + "\n" +
                              "NAME: " + station.Nome + "\n" +
                              "with ID: " + station._id
            let txt = "Here is the new station: \n"
            bot.sendMessage(msg.chat.id, txt + station_txt)
            bot.sendLocation(msg.chat.id, station.Latitudine, station.Longitudine);
        }) .catch( (error) =>  {
            if(error.response.data.message.toString().includes("token_error")){
                let txt = 'Session expired';
                bot.sendMessage(msg.chat.id, txt, opts_after_signup);
                where_i_am = "Start"
            }else{
                let txt = 'Request error retry';
                bot.sendMessage(msg.chat.id, txt, opts_keyboard_admin);
            }
        })
        //------------------------------------------------------------------------
    }else if (where_i_am == '❌Delete'){
        where_i_am = "Inside"
        // PROOF GET_DELETE_STATION--------------------------------------------------
        let header = { headers: { 'Authorization': "bearer " + TKN_Log} }
        
        axios.delete(URL + '/stations/'+msg.text.toString(), header)
        .then((response) => {
            bot.sendMessage(msg.chat.id, response.data.message)
        }).catch((error) => {
            if(error.response.data.message.toString().includes("token_error")){
                where_i_am = "Start"
                let txt = 'Session expired';
                bot.sendMessage(msg.chat.id, txt, opts_after_signup);
            }else{
                let txt = 'ID error retry';
                bot.sendMessage(msg.chat.id, txt, opts_keyboard_admin);
            }

        })
        //------------------------------------------------------------------------
    }else if (where_i_am == 'ask_update'){
        // Prepare the request
        where_i_am = "📝Modify"
        let stationInfo = msg.text.toString().split(" ")
        let txt2 = "ID\n"
        
        for(let i = 0; i<stationInfo.length; i++){
            updateOPT[i] = stationInfo[i]
            txt2 = txt2 + stationInfo[i] + "\n"
        }
        
        let txt = "Now Tell me the station's id to be update\n"
        let txt1 = "and all STATIONS's information, you will have to write me: \n\n"
        let txt3 = "\nYou must write all infos divided by a space."
        bot.sendMessage(msg.chat.id, txt+txt1+txt2+txt3)
    }else if (where_i_am == '📝Modify'){
        where_i_am = "Inside";
        let stationInfo = msg.text.toString().split(" ")
        
        header = { headers: { 'Authorization': "bearer " + TKN_Log} }

        let req = {}
        req.id = stationInfo[0]
        
        //stationInfo[0] is the ID
        for(let i = 1; i<stationInfo.length; i++){
            req[updateOPT[i-1]] = stationInfo[i]
        }

        //console.log(req)

        axios.patch(URL + '/stations/' + stationInfo[0], req, header)
        .then((response) => {
            //console.log(response.data)
            bot.sendMessage(msg.chat.id, response.data.message)
        })
        .catch( (error) =>  {
            if(error.response.data.message.toString().includes("token_error")){
                where_i_am = "Start"
                let txt = 'Session expired';
                bot.sendMessage(msg.chat.id, txt, opts_after_signup);
            }else{
                let txt = 'Request error retry';
                bot.sendMessage(msg.chat.id, txt, opts_keyboard_admin);
            }
        })
    }else if (where_i_am == 'Start'){
        let user_msg = msg.text.toString()
        let cond =  (user_msg.includes("🚂View") ||
                    user_msg.includes("📍View") ||
                    user_msg.includes("➕Add") ||
                    user_msg.includes("📝Modify") ||
                    user_msg.includes("❌Delete") ||
                    user_msg.includes("🔚Logout") ||
                    user_msg.includes("❌👤Delete") ||
                    user_msg.includes("🔍View User"))
        if (cond){
            let txt = 'You must register or Login: ';
            bot.sendMessage(msg.chat.id, txt, opts_start);
        }
    }
   
});

function getStation(idchat, n_stations, stations){
    let stations_txt = ""
    let txt          = ""
    if (n_stations > 1){
    
        if(isAdmin){
            for(let i = 0; i < n_stations; i++){
                stations_txt =  stations_txt + (i+1) + ") " +
                                stations[i].Regione + 
                                ": " + stations[i].Nome + " \n" +
                                "ID:   "+stations[i]._id+ " \n\n"
            }
        }else{
            for(let i = 0; i < n_stations; i++){
                stations_txt =  stations_txt + (i+1) + ") " +
                                stations[i].Regione + 
                                ": " + stations[i].Nome + " \n\n"
            }
        }
        txt = "Here are all the " + n_stations + " stations: \n\n" + stations_txt
        bot.sendMessage(idchat, txt)
    }else if(n_stations == 1){
        txt = "Here is the point of " + stations[0].Nome + "'s station"
        if(isAdmin){
            txt = txt + "\n\nWith ID:"+stations[0]._id
        }
        bot.sendMessage(idchat, txt);
        bot.sendLocation(idchat, stations[0].Latitudine, stations[0].Longitudine);
    }else if(n_stations == 0){
        let txt = "No station found"
        bot.sendMessage(idchat, txt);
    }
}

function getUser(idchat, n_users, users){
    let users_txt = ""
    if (n_users >= 1){
        for(let i = 0; i < n_users; i++){
            users_txt = users_txt + (i+1) + ") " +
                        users[i].email + " \n\n"
        }
        let txt = "Here are all the " + n_users + " users: \n\n" + users_txt
        bot.sendMessage(idchat, txt)
    }else{
        let txt = "No user found"
        bot.sendMessage(idchat, txt);
    }
}

// Get Location-----------------------------------------
bot.on('location', (msg) => {
    let latitude = msg.location.latitude
    let longitude = msg.location.longitude

    let urlview = URL+'/stations/near/?lat='+latitude+'&long='+longitude
    console.log(urlview)
    axios.get(urlview)
    .then((response) =>{
        let txt = response.data.Nome + "'s station is the one closest to you.\nDistance: " + response.data.Distanza
        bot.sendMessage(msg.chat.id, txt);
        bot.sendLocation(msg.chat.id, response.data.Latitudine, response.data.Longitudine)
        where_i_am = 'Inside'
    })
    .catch( (error) =>  {
        console.log(error);
        bot.sendMessage(msg.chat.id, "Request erorr retry")
        where_i_am = 'Inside'
    })
    
});
//------------------------------------------------------



