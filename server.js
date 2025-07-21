const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let users = {}; // { id: ws }
let accounts = {}; // { login: { password, nick, ws, id } }

wss.on('connection', function connection(ws) {
    let userLogin = null;

    ws.on('message', function incoming(message) {
        let data = {};
        try { data = JSON.parse(message); } catch {}

        // Регистрация
        if (data.type === 'register') {
            if (accounts[data.login]) {
                ws.send(JSON.stringify({ system: true, error: true, text: 'Аккаунт уже существует!' }));
            } else if (!data.login || !data.password || !data.nick) {
                ws.send(JSON.stringify({ system: true, error: true, text: 'Заполните все поля!' }));
            } else {
                accounts[data.login] = { password: data.password, nick: data.nick, ws: null, id: data.login };
                ws.send(JSON.stringify({ system: true, text: 'Регистрация успешна! Теперь войдите.' }));
            }
            return;
        }

        // Вход
        if (data.type === 'login') {
            if (!accounts[data.login] || accounts[data.login].password !== data.password) {
                ws.send(JSON.stringify({ system: true, error: true, text: 'Неверный логин или пароль!' }));
            } else {
                userLogin = data.login;
                accounts[userLogin].ws = ws;
                users[userLogin] = ws;
                ws.send(JSON.stringify({ system: true, text: `Вы вошли как ${accounts[userLogin].nick} (ID: ${userLogin})`, nick: accounts[userLogin].nick, id: userLogin }));
            }
            return;
        }

        // Сообщения
        if (data.type === 'msg' && users[data.to]) {
            users[data.to].send(JSON.stringify({
                from: userLogin,
                nick: accounts[userLogin].nick,
                text: data.text
            }));
            ws.send(JSON.stringify({
                system: true,
                text: `Сообщение отправлено пользователю ${data.to}`
            }));
        }
        if (data.type === 'msg' && !users[data.to]) {
            ws.send(JSON.stringify({
                system: true,
                text: `Пользователь с ID ${data.to} не найден в сети`
            }));
        }
    });

    ws.on('close', function() {
        if (userLogin) {
            accounts[userLogin].ws = null;
            delete users[userLogin];
        }
    });
});

console.log(`KChat сервер с аккаунтами запущен на ws://localhost:${PORT}`);
