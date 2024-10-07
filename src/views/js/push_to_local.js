function showpushAlert(imageName) {
    const title = "Подтверждение действия";
    const message = `Данное действие загрузит образ "${imageName}" в локальный репозиторий. Продолжить?`;

    // Вызываем openModal с заголовком, сообщением и функцией для подтверждения
    openModal(title, message, () => {
        // Закрываем текущее модальное окно
        closeModal();

        // Открываем модальное окно для загрузки
        showLoadingModal(imageName);

        // Открываем подключение к серверным событиям
        const eventSource = new EventSource('/images/events');

        // Отправляем запрос на сервер для выполнения docker pull
        fetch('/images/docker-pull', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageName }) // Передаем имя образа
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при выполнении запроса');
            }
            return response.json(); // Парсим ответ в JSON
        })
        .then(data => {
            // Закрываем модальное окно загрузки
            closeLoadingModal();
            // Открываем модальное окно для отображения результата
            showResultModal(data.output || 'Загрузка завершена успешно.'); // Проверяем наличие результата
        })
        .catch(error => {
            closeLoadingModal();
            console.error('Ошибка:', error);
            showResultModal(`Ошибка при загрузке: ${error.message}`); // Показываем ошибку
        });

        // Обработка событий от сервера
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.output) {
                // Выводим статус загрузки в модальном окне
                updateLoadingStatus(data.output);
            }
            if (data.error) {
                // Если есть ошибка, закрываем загрузку и показываем результат
                closeLoadingModal();
                showResultModal(`Ошибка: ${data.error}`);
                eventSource.close(); // Закрываем соединение
            }
        };

        eventSource.onerror = function() {
            console.error('Ошибка подключения к серверу событий.');
            eventSource.close(); // Закрываем соединение в случае ошибки
        };
    });
}

// Функция для обновления статуса загрузки в модальном окне
function updateLoadingStatus(output) {
    const loadingModal = document.getElementById('loading-modal');
    const loadingMessage = loadingModal.querySelector('p'); // Находим элемент с сообщением
    loadingMessage.innerText += `\n${output}`; // Добавляем новую информацию к сообщению
    // Прокручиваем окно вниз, чтобы показать последнее сообщение
    loadingModal.querySelector('.modal-content').scrollTop = loadingModal.querySelector('.modal-content').scrollHeight;
}

// Функция для показа модального окна загрузки
function showLoadingModal(imageName) {
    const loadingModal = document.getElementById('loading-modal');
    // Очищаем предыдущее содержимое
    const loadingMessage = loadingModal.querySelector('#loading-message'); 
    // Устанавливаем сообщение о загрузке
    loadingMessage.innerText = `Идет загрузка образа "${imageName}". Пожалуйста, подождите...`; 

    loadingModal.style.display = 'block'; // Открываем модальное окно
    // Прокручиваем окно вниз, чтобы показать последнее сообщение
    loadingModal.querySelector('.modal-content').scrollTop = loadingModal.querySelector('.modal-content').scrollHeight;
}

// Функция для закрытия модального окна загрузки
function closeLoadingModal() {
    const loadingModal = document.getElementById('loading-modal');
    loadingModal.style.display = 'none'; // Закрываем модальное окно
}

// Функция для показа модального окна с результатами
function showResultModal(output) {
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');

    resultMessage.innerText = output; // Устанавливаем сообщение результата
    resultModal.style.display = 'block'; // Открываем модальное окно
    // Прокручиваем окно вниз, чтобы показать последнее сообщение
    resultModal.querySelector('.modal-content').scrollTop = resultModal.querySelector('.modal-content').scrollHeight;
}

// Функция для закрытия модального окна с результатами
function closeResultModal() {
    const resultModal = document.getElementById('result-modal');
    resultModal.style.display = 'none'; // Закрываем модальное окно
}

// HTML код модального окна для результатов
const resultModalHTML = `
<div id="result-modal" class="modal">
    <div class="modal-content">
        <span class="close-button" onclick="closeResultModal()">&times;</span>
        <h2>Результат загрузки</h2>
        <p id="result-message"></p>
        <button class="close-button-style" onclick="closeResultModal()">Закрыть</button>
    </div>
</div>
`;

// HTML код модального окна для загрузки
const loadingModalHTML = `
<div id="loading-modal" class="modal">
    <div class="modal-content" style="max-height: 400px; overflow-y: auto;">
        <h2>Загрузка...</h2>
        <p id="loading-message">Пожалуйста, подождите, идет загрузка образа.</p>
    </div>
</div>
`;

// Добавляем модальные окна в тело документа
document.body.insertAdjacentHTML('beforeend', resultModalHTML);
document.body.insertAdjacentHTML('beforeend', loadingModalHTML);