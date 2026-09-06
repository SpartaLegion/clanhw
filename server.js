const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Раздаем статические файлы из текущей папки (где лежит index.html)
app.use(express.static(__dirname));

// Список пользователей онлайн
let onlineMembers = new Map(); // socket.id -> username

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    // Когда пользователь представился ником
    socket.on('join-clan', (username) => {
        onlineMembers.set(socket.id, username);
        updateMembersList();
    });

    // Получение сообщения чата и рассылка всем
    socket.on('chat-message', (data) => {
        const username = onlineMembers.get(socket.id) || 'Аноним';
        io.emit('chat-message', {
            user: username,
            text: data.text
        });
    });

    // Отключение пользователя
    socket.on('disconnect', () => {
        console.log('Пользователь отключился:', socket.id);
        onlineMembers.delete(socket.id);
        updateMembersList();
    });
});

function updateMembersList() {
    // Отправляем всем актуальный список уникальных ников
    const membersArray = Array.from(onlineMembers.values());
    io.emit('update-members', membersArray);
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер клана запущен! Откройте в браузере: http://localhost:${PORT}`);
});