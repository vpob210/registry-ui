// Получение списка образов
async function fetchImages() {
    const response = await fetch('/images');
    const data = await response.json();
    const imagesDiv = document.getElementById('images');
    imagesDiv.innerHTML = '';

    // Проверка наличия образов
    if (data.length > 0) {
        const imageTiles = {};
        
        // Группируем образы по их названиям
        data.forEach(({ name, tag, size, date, digest }) => {
            if (!imageTiles[name]) {
                imageTiles[name] = []; // Создаем массив для хранения тегов образа
            }
            imageTiles[name].push({ tag, size, date, digest }); // Добавляем тег в массив
        });

        // Создаем плитки для каждого образа
        for (const name in imageTiles) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-tile';

            imageDiv.innerHTML = `
                <div style="display: inline-flex; align-items: center;">
                    <span style="font-size: 1.2rem; margin-right: 5px;"><h4>${name}</h4></span>
                    <button onclick="copyToClipboard('${name}'); event.stopPropagation();" class="copy-button">
                        <svg class="copy-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                        </svg>
                    </button>
                </div>
            `;

            imagesDiv.appendChild(imageDiv);

            // Создаем элемент для списка тегов
            const tagsList = document.createElement('ul');
            tagsList.className = 'tags-list'; // Скрытый список тегов
            imageDiv.appendChild(tagsList);

            // Добавляем теговые плитки
            imageTiles[name].forEach(({ tag, size, date, digest }) => {
                const tagItem = document.createElement('li');
                tagItem.className = 'tag-tile'; // Добавляем новый класс для тегов
                tagItem.innerHTML = `<div style="display: inline-flex; align-items: center;">
                <span style="margin-right: 5px;"><h4>${name}:${tag}</h4></span>
                <button onclick="copyToClipboard('${name}:${tag}'); event.stopPropagation();" class="copy-button" style="margin-left: 5px;">
                    <svg class="copy-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                    </svg>
                </button>
            </div>
            <p>Размер: ${formatBytes(size)}</p>
            <p>Дата загрузки: ${new Date(date).toLocaleString()}</p>
            <button onclick="openDeleteModal('${name}', '${digest}'); event.stopPropagation();" class="show-full-digest" style="cursor: pointer;">Показать дайджест</button>
        `;
                tagsList.appendChild(tagItem);

                // Остановка всплытия события при клике на тег
                tagItem.addEventListener('click', (event) => {
                    event.stopPropagation(); // Не закрываем плитку
                });
            });

            // Обработка клика по плитке образа
            imageDiv.addEventListener('click', () => {
                tagsList.classList.toggle('active'); // Переключаем видимость списка тегов
            });
        }
    } else {
        imagesDiv.innerHTML = '<p>Нет доступных образов.</p>';
    }
}

// Функция для фильтрации образов
function filterImages() {
    const input = document.getElementById('filter-input').value.toLowerCase();
    const imageTiles = document.querySelectorAll('.image-tile');
    imageTiles.forEach(tile => {
        const title = tile.querySelector('span').innerText.toLowerCase(); // Измените h2 на span
        tile.style.display = title.includes(input) ? 'block' : 'none';
    });
}

// Функция для отображения вкладки "Образы"
function showImages() {
    document.getElementById('search-form').style.display = 'none'; // Скрываем форму поиска
    document.getElementById('images').style.display = 'block'; // Показываем образы
    document.getElementById('search-results').style.display = 'none'; // Скрываем результаты поиска
    fetchImages(); // Загружаем образы
}

// Функция для отображения вкладки "Поиск"
function showSearch() {
    document.getElementById('search-form').style.display = 'block'; // Показываем форму поиска
    document.getElementById('images').style.display = 'none'; // Скрываем образы
    document.getElementById('search-results').style.display = 'none'; // Скрываем результаты поиска
}

// Функция для форматирования байт в читаемый формат
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Инициализация функции загрузки образов
fetchImages();