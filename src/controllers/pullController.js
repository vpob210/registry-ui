const { exec } = require('child_process');
const eventsController = require('./eventsController');

const registryUrl = process.env.REGISTRY_HOST || 'http://localhost:5000/v2'; // URL локального Docker Registry
const sanitizedRegistryUrl = registryUrl.replace(/^https?:\/\//, '').replace(/\/v2\/?$/, '');

// Контроллер для выполнения docker pull
exports.pullImage = (req, res) => {
    const { imageName } = req.body;
    const externalRegistryUrl = process.env.REGISTRY_URL; // Внешний реестр, если указан

    // Логирование входящего запроса
    console.log('Получен запрос на docker pull с данными:', req.body);
    
    // Проверка наличия имени образа
    if (!imageName) {
        return res.status(400).json({ error: 'Имя образа обязательно.' });
    }

    // Если указан внешний реестр, добавляем его к имени образа
    const fullImageName = externalRegistryUrl 
        ? `${externalRegistryUrl}/${imageName}` 
        : imageName;

    // Выполнение команды docker pull
    const child = exec(`docker pull ${fullImageName}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка: ${error.message}`);
            return res.status(500).json({ output: stderr || error.message });
        }
        if (stderr) {
            console.error(`Стандартная ошибка: ${stderr}`);
            return res.status(500).json({ output: stderr });
        }

        console.log(`Результат: ${stdout}`);

        // Разделяем имя образа и тег, если тег указан
        const [imageBaseName, imageTag] = imageName.split(':');
        const tag = imageTag || 'latest'; // Используем тег "latest", если тег не указан

        // Формируем полное имя образа для тегирования в локальном реестре
        const taggedImage = `${sanitizedRegistryUrl}/${imageBaseName}:${tag}`;

        // Выполняем тегирование
        const tagCommand = `docker tag ${fullImageName} ${taggedImage}`;
        exec(tagCommand, (tagError, tagStdout, tagStderr) => {
            if (tagError) {
                console.error(`Ошибка при тегировании: ${tagError.message}`);
                return res.status(500).json({ output: tagStderr || tagError.message });
            }

            console.log(`Образ успешно тегирован: ${taggedImage}`);

            // Проверяем, нужно ли выполнять логин
            if (process.env.REGISTRY_USERNAME && process.env.REGISTRY_PASSWORD) {
                // Выполняем логин в Docker Registry
                const loginCommand = `echo ${process.env.REGISTRY_PASSWORD} | docker login ${sanitizedRegistryUrl} --username ${process.env.REGISTRY_USERNAME} --password-stdin`;
                
                exec(loginCommand, (loginError, loginStdout, loginStderr) => {
                    if (loginError) {
                        console.error(`Ошибка при логине: ${loginError.message}`);
                        return res.status(500).json({ output: loginStderr || loginError.message });
                    }

                    console.log(`Успешно выполнили логин в репозиторий: ${sanitizedRegistryUrl}`);

                    // Выполняем пуш образа в локальный реестр
                    const pushCommand = `docker push ${taggedImage}`;
                    exec(pushCommand, (pushError, pushStdout, pushStderr) => {
                        if (pushError) {
                            console.error(`Ошибка при пуше: ${pushError.message}`);
                            return res.status(500).json({ output: pushStderr || pushError.message });
                        }
                        console.log(`Образ успешно загружен в локальный репозиторий: ${taggedImage}`);

                        // После успешного пуша, удаляем оригинальный образ
                        const removeCommand = `docker rmi ${fullImageName}`;
                        exec(removeCommand, (removeError, removeStdout, removeStderr) => {
                            if (removeError) {
                                console.error(`Ошибка при удалении образа: ${removeError.message}`);
                                return res.status(500).json({ output: removeStderr || removeError.message });
                            }

                            console.log(`Оригинальный образ ${fullImageName} успешно удален`);
                            return res.status(200).json({
                                output: `Образ ${taggedImage} успешно загружен в локальный репозиторий и оригинальный образ ${imageName} удален.`,
                            });
                        });
                    });
                });
            } else {
                // Если логин не нужен, просто пушим образ
                const pushCommand = `docker push ${taggedImage}`;
                exec(pushCommand, (pushError, pushStdout, pushStderr) => {
                    if (pushError) {
                        console.error(`Ошибка при пуше: ${pushError.message}`);
                        return res.status(500).json({ output: pushStderr || pushError.message });
                    }
                    console.log(`Образ успешно загружен в локальный репозиторий: ${taggedImage}`);

                    // После успешного пуша, удаляем оригинальный образ
                    const removeCommand = `docker rmi ${fullImageName}`;
                    exec(removeCommand, (removeError, removeStdout, removeStderr) => {
                        if (removeError) {
                            console.error(`Ошибка при удалении образа: ${removeError.message}`);
                            return res.status(500).json({ output: removeStderr || removeError.message });
                        }

                        console.log(`Оригинальный образ ${fullImageName} успешно удален`);
                        return res.status(200).json({
                            output: `Образ ${taggedImage} успешно загружен в локальный репозиторий и оригинальный образ ${imageName} удален.`,
                        });
                    });
                });
            }
        });
    });

    // Отправка обновлений статуса
    child.stdout.on('data', (data) => {
        console.log(`Статус: ${data}`);
        // Отправляем каждую строку результата всем клиентам
        eventsController.sendDataToClients({ output: data });
    });

    child.stderr.on('data', (data) => {
        console.error(`Стандартная ошибка: ${data}`);
        eventsController.sendDataToClients({ error: data });
    });
};