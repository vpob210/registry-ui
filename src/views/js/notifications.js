let isNotificationVisible = false; // Переменная состояния

function showNotification(message, type = 'info') {
    // Если уведомление уже активно, не показываем новое
    if (isNotificationVisible) return;

    isNotificationVisible = true; // Устанавливаем состояние как активное

    const notification = document.getElementById('notification');
    notification.innerHTML = message;

    // Устанавливаем тип уведомления
    notification.className = `notification notification-${type} show-notification`; // Показ уведомления

    // Показ уведомления
    notification.style.display = 'block'; // Показываем элемент

    // Скрываем уведомление через 4 секунды
    setTimeout(() => {
        notification.classList.remove('show-notification'); // Убираем класс показа
        notification.classList.add('hide-notification'); // Добавляем класс для исчезновения

        // Скрываем уведомление после завершения анимации
        setTimeout(() => {
            notification.style.display = 'none'; // Скрываем элемент
            notification.classList.remove('hide-notification'); // Убираем класс исчезновения
            isNotificationVisible = false; // Возвращаем состояние к неактивному
        }, 2000); // Время исчезновения
    }, 2000); // Время отображения уведомления
}