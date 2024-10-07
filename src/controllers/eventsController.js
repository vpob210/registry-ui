// Массив для хранения клиентов, которые подписаны на события
let clients = [];

// Функция для отправки сообщений клиентам
const sendEvent = (data) => {
    clients.forEach(client => client(data));
};

// Контроллер для обработки событий
exports.streamEvents = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Добавляем клиента в список
    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    clients.push(send);

    // Очищаем клиента из списка при закрытии соединения
    req.on('close', () => {
        clients = clients.filter(client => client !== send);
    });
};

// Функция для отправки данных из других контроллеров
exports.sendDataToClients = sendEvent;