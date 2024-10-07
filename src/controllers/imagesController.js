const axios = require('axios');
const https = require('https');

// Настройки для подключения к Docker Registry
const registryUrl = process.env.REGISTRY_HOST || 'http://localhost:5000/v2'; // URL локального Docker Registry
const username = process.env.REGISTRY_USERNAME || null; // Имя пользователя для авторизации
const password = process.env.REGISTRY_PASSWORD || null; // Пароль для авторизации
const isHttps = registryUrl.startsWith('https'); // Проверяем, используется ли HTTPS

// Создаем агент для работы с самоподписными сертификатами (для запросов через HTTPS)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Создаем объект с опциями для запроса, включая авторизацию (если есть)
const getRequestOptions = () => {
    const options = {
        httpsAgent: isHttps ? httpsAgent : undefined, // Если HTTPS, используем агент для игнорирования самоподписных сертификатов
        auth: username && password ? { username, password } : undefined, // Добавляем базовую авторизацию, если указаны переменные
    };
    return options;
};

// Контроллер для получения списка образов
exports.getImages = async (req, res) => {
    try {
        const response = await axios.get(`${registryUrl}/_catalog`, getRequestOptions());
        const repositories = response.data.repositories;
        const imagesData = [];

        for (const image of repositories) {
            const tagsResponse = await axios.get(`${registryUrl}/${image}/tags/list`, getRequestOptions());
            const tags = tagsResponse.data.tags;

            for (const tag of tags) {
                const manifestResponse = await axios.get(`${registryUrl}/${image}/manifests/${tag}`, {
                    ...getRequestOptions(),
                    headers: { Accept: 'application/vnd.docker.distribution.manifest.v2+json' },
                });

                // Отладочная информация для проверки структуры
                // console.log('Manifest Response:', manifestResponse.data);

                // Извлечение размеров слоев
                const layersSize = manifestResponse.data.layers.reduce((total, layer) => total + (layer.size || 0), 0);
                
                // Получение информации о конфигурации
                const configDigest = manifestResponse.data.config.digest;
                const configResponse = await axios.get(`${registryUrl}/${image}/blobs/${configDigest}`, getRequestOptions());

                // Попробуем получить дату создания из конфигурации
                const created = configResponse.data.created || 'N/A';
                
                // Добавляем docker-content-digest в данные образа
                const contentDigest = manifestResponse.headers['docker-content-digest'];

                imagesData.push({
                    name: image,
                    tag,
                    size: layersSize + (configResponse.data.size || 0), // Используем общий размер слоев и конфигурации
                    date: created,
                    digest: contentDigest, // Добавляем docker-content-digest
                });
            }
        }

        // Отправляем собранные данные в виде JSON
        res.json(imagesData);
    } catch (error) {
        console.error(error); // Вывод ошибки в консоль
        res.status(500).json({ error: 'Ошибка при получении списка образов' });
    }
};

// Контроллер для получения тегов для конкретного образа
exports.getTags = async (req, res) => {
    const imageName = req.params.image;
    try {
        const response = await axios.get(`${registryUrl}/${imageName}/tags/list`, getRequestOptions());
        res.json(response.data);
    } catch (error) {
        console.error(error); // Вывод ошибки в консоль
        res.status(500).json({ error: 'Ошибка при получении тегов для образа' });
    }
};