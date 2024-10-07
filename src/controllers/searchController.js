const { exec } = require('child_process');

exports.searchImages = (req, res) => {

    const searchQuery = req.body.query; // Получаем строку поиска из тела запроса
    const command = `docker search ${searchQuery}`; // Формируем команду

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка: ${error.message}`);
            return res.status(500).send({ error: 'Ошибка выполнения команды' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send({ error: 'Ошибка выполнения команды' });
        }

        // Извлекаем результаты из stdout
        const results = stdout.split('\n').slice(1, -1); // Убираем заголовок и пустую строку

        const imageResults = results.map(line => {
            // Разделяем строку по пробелам, при этом учитываем, что описание может содержать пробелы
            const parts = line.split(/\s{2,}/); // Разделяем по двум или более пробелам
            if (parts.length >= 4) { // Убедимся, что у нас есть все необходимые данные
                const name = parts[0]; // Имя образа
                const stars = parts[parts.length - 2]; // Звезды (второй с конца элемент)
                const official = parts[parts.length - 1] ? '[OK]' : ''; // Статус

                // Объединяем все, кроме имени, звезд и статуса
                const description = parts.slice(1, parts.length - 2).join(' ').trim();

                return {
                    name,
                    description,
                    stars: stars.trim(), // Убираем лишние пробелы
                    official,
                };
            }
            return null; // Если строка не подходит, возвращаем null
        }).filter(Boolean); // Убираем null значения // Убираем null значения
        // console.log('Результаты для клиента:', imageResults);
        res.json(imageResults); // Отправляем результаты в формате JSON
    });
};