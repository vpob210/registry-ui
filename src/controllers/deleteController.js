const https = require('https');
const { exec } = require('child_process');

// Получаем переменные окружения
const registryHost = process.env.REGISTRY_HOST || 'http://localhost:5000/v2';
const registryUsername = process.env.REGISTRY_USERNAME || null;
const registryPassword = process.env.REGISTRY_PASSWORD || null;
const registryContainerName = process.env.REGISTRY_CONTAINER_NAME || null; // Имя контейнера для garbage-collect
const useHttps = registryHost.startsWith('https');

// Создаём агент для игнорирования самоподписанных сертификатов (аналогично curl -k)
const agent = useHttps ? new https.Agent({ rejectUnauthorized: false }) : null;

exports.deleteImage = async (req, res) => {
    const { name, digest } = req.params; // Извлекаем данные из параметров запроса

    // Логируем параметры запроса
    console.log(`Запрос на удаление образа: ${name}, digest: ${digest}`);

    try {
        // URL для удаления манифеста образа
        const registryUrl = `${registryHost}/${name}/manifests/${digest}`;

        // Опции для запроса
        const options = {
            method: 'DELETE',
            headers: {
                'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
            },
            agent // Добавляем агент, если используем HTTPS
        };

        // Если указаны username и password, добавляем basic аутентификацию
        if (registryUsername && registryPassword) {
            const basicAuth = Buffer.from(`${registryUsername}:${registryPassword}`).toString('base64');
            options.headers['Authorization'] = `Basic ${basicAuth}`;
        }

        // Отправляем запрос на удаление образа
        const response = await fetch(registryUrl, options);

        if (response.ok) {
            console.log(`Образ ${name} успешно удалён из реестра.`);

            // Если указано имя контейнера, запускаем garbage-collect
            if (registryContainerName) {
                console.log(`Запуск garbage-collect для контейнера: ${registryContainerName}...`);

                // Команда для garbage collection
                const gcCommand = `docker exec ${registryContainerName} registry garbage-collect /etc/docker/registry/config.yml`;

                // Выполнение команды garbage-collect с помощью exec
                exec(gcCommand, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Ошибка при выполнении garbage-collect: ${err.message}`);
                        return res.status(500).json({ message: `Ошибка выполнения garbage-collect: ${err.message}` });
                    }

                    console.log(`Garbage-collect выполнен успешно:\n${stdout}`);
                    if (stderr) {
                        console.error(`Ошибки во время выполнения garbage-collect:\n${stderr}`);
                    }

                    // Возвращаем успешный ответ с информацией об удалении и сборке мусора
                    return res.status(200).json({ message: 'Образ успешно удалён и garbage-collect выполнен' });
                });
            } else {
                console.log('Имя контейнера не указано. Garbage-collect не выполнен.');
                return res.status(200).json({ message: 'Образ успешно удалён, но garbage-collect не выполнен' });
            }
        } else {
            throw new Error(`Не удалось удалить образ из реестра: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Ошибка при удалении образа: ${error.message}`);
        res.status(500).json({ message: `Ошибка удаления образа: ${error.message}` });
    }
};