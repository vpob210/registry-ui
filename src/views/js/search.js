let searchResults = []; // Храним результаты поиска здес
function validateImageName(imageName) {
    const regex = /^([a-z0-9]+(?:[._-][a-z0-9]+)*)\/?([a-z0-9]+(?:[._-][a-z0-9]+)*)?(:[a-zA-Z0-9._-]+)?$/;
    return regex.test(imageName);
}

// Функция для поиска образа
async function searchImage() {
    const searchQuery = document.getElementById('search-input').value; // Получаем значение из поля ввода
    const searchResultsDiv = document.getElementById('search-results');
    searchResultsDiv.innerHTML = ''; // Очищаем предыдущие результаты
    // Проверка введенного имени образа
    if (!validateImageName(searchQuery)) {
        showNotification('Недопустимый формат имени образа.', 'error'); // Показываем ошибку
        searchResultsDiv.innerHTML = '<p>Недопустимый формат имени образа.</p>';
        return;
    }
    try {
        const response = await fetch('/images/docker-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: searchQuery }), // Отправляем запрос в теле
        });
        if (!response.ok) {
            throw new Error('Ошибка при выполнении запроса');
        }

        const data = await response.json(); // Получаем результаты поиска
        searchResults = data; // Сохраняем результаты для дальнейшей сортировки
        // Проверяем, есть ли результаты
        if (searchResults.length > 0) {
            displayResults(searchResults);
        } else {
            searchResultsDiv.innerHTML = '<p>Образы не найдены.</p>';
        }
    } catch (error) {
        console.error(error);
        searchResultsDiv.innerHTML = '<p>Ошибка при поиске образов.</p>';
    }

    document.getElementById('search-results').style.display = 'block'; // Показываем результаты поиска
}


// Функция для отображения результатов
function displayResults(results) {
    const searchResultsDiv = document.getElementById('search-results');
    searchResultsDiv.innerHTML = ''; // Очищаем предыдущие результаты
    results.forEach(image => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'searched-image-tile';
        resultDiv.innerHTML = `
        <div style="display: inline-flex; align-items: center;">
        <span style="font-size: 1rem; margin-right: 5px;"><h4>${image.name}</h4></span>
        <button onclick="copyToClipboard('${image.name}')" class="copy-button">
            <svg class="copy-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
            </svg>
        </button>
    </div>
    <p>${image.description}</p>
    <p>Stars: ${image.stars}</p>
    <p>Official: <span style="color: ${image.official === '[OK]' ? 'green' : 'red'};">
        ${image.official === '[OK]' ? 'true' : 'false'}
    </span></p>
    <div style="position: relative; display: inline-block;">
        <button 
            onclick="showpushAlert('${image.name}')"
            class="push-button" 
            style="display: block; margin: 10px auto; background: transparent; border: none; cursor: pointer;">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01"/>
            </svg>
        </button>
        <span class="custom-tooltip">Пуш в локальный репозиторий</span>
    </div>
    `;
    // Добавляем обработчики событий для показа и скрытия подсказки
    const pushButton = resultDiv.querySelector('.push-button');
    const tooltip = resultDiv.querySelector('.custom-tooltip');
    
    pushButton.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
    });
    pushButton.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });

        searchResultsDiv.appendChild(resultDiv);
    });
    // Принудительное обновление после отрисовки
    setTimeout(() => {
        searchResultsDiv.style.display = 'flex'; // Возвращаем flex
        searchResultsDiv.style.flexWrap = 'wrap'; // Убедимся, что flex-wrap активен
    }, 50);
}

// Функция для копирования текста в буфер обмена
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Имя образа скопировано: ' + text, 'info');
        }).catch(err => {
            console.error('Ошибка при копировании текста: ', err);
            showNotification('Ошибка при копировании текста', 'error');
        });
    } else {
        // Альтернативный метод для копирования, если API недоступен
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Имя образа скопировано: ' + text, 'info');
        } catch (err) {
            console.error('Ошибка при копировании текста (альтернативный метод): ', err);
            showNotification('Ошибка при копировании текста', 'error');
        }
        document.body.removeChild(textArea); // Удаляем временный textarea
    }
}

// Функция для сортировки результатов
function sortResults(criteria) {
    const starsChecked = document.getElementById('sort-stars').checked;
    const officialChecked = document.getElementById('sort-official').checked;
    let sortedResults = [...searchResults]; // Создаем копию оригинальных результатов для сортировки
    if (starsChecked) {
        sortedResults.sort((a, b) => parseInt(b.stars) - parseInt(a.stars)); // Сортировка по звездам
    }

    if (officialChecked) {
        sortedResults.sort((a, b) => {
            if (a.official === '[OK]' && b.official !== '[OK]') return -1; // [OK] выше
            if (a.official !== '[OK]' && b.official === '[OK]') return 1; // [OK] выше
            return 0; // Оба равны по статусу
        });
    }
    displayResults(sortedResults); // Отображаем отсортированные результаты
}