function openModal(title, message, onConfirmCallback) {
    document.getElementById('modal-title').textContent = title; // Устанавливаем заголовок
    document.getElementById('modal-message').textContent = message; // Устанавливаем сообщение
    document.getElementById('confirmation-modal').style.display = 'block'; // Показываем модалку

    // Сохраняем функцию, которая будет вызвана при подтверждении
    window.confirmAction = function() {
        if (onConfirmCallback) {
            onConfirmCallback(); // Вызываем переданную функцию
        }
        closeModal(); // Закрываем модалку
    };
}

// Функция для закрытия модалки
function closeModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
}

// Пример использования openModal
// openModal('Заголовок', 'Сообщение', () => alert('Action confirmed!'));

// модалка для удаления
function openDeleteModal(name, digest) {
    const modalTitle = document.getElementById('delete-modal-title');
    const modalMessage = document.getElementById('delete-modal-message');
    const digestContent = document.getElementById('delete-modal-digest-content');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');

    // Устанавливаем текст модалки удаления
    modalTitle.textContent = `Удаление образа: ${name}`;
    modalMessage.textContent = `Вы уверены, что хотите удалить этот образ?`;
    digestContent.textContent = digest; // Устанавливаем дайджест для отображения

    // Показываем модальное окно удаления
    document.getElementById('delete-modal').style.display = 'block';

    // Добавляем обработчик на кнопку "Удалить"
    confirmDeleteButton.onclick = async () => {
        await deleteImage(name, digest); // Вызываем функцию удаления
        closeDeleteModal(); // Закрываем модалку
        fetchImages(); // Обновляем список образов
    };

    // Обработка клика по кнопке "Отмена"
    document.getElementById('cancel-delete-button').onclick = () => {
        closeDeleteModal(); // Закрываем модалку
    };
}

// Функция для закрытия модалки удаления
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none'; // Закрываем модалку
}

async function deleteImage(name, digest) {
    try {
        const response = await fetch('/images/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, digest }) // Отправляем данные в теле запроса
        });

        // Проверка успешности удаления
        if (!response.ok) {
            const errorMessage = await response.text(); // Получаем текст ошибки
            throw new Error(`Не удалось удалить образ: ${response.status} ${response.statusText}. ${errorMessage}`);
        }

        console.log('Образ успешно удалён');
    } catch (error) {
        console.error('Ошибка при удалении образа:', error.message);
        alert(`Ошибка удаления образа: ${error.message}`);
    }
}