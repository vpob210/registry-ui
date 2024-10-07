const express = require('express');
const app = express();
const port = 3030;

app.use(express.json());
// Настройка статической раздачи HTML
app.use(express.static('src/views'));

// Инициализация массива для хранения клиентов
app.locals.clients = [];
// Подключение маршрутов
const imagesRouter = require('./routes/images');
app.use('/images', imagesRouter);

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
