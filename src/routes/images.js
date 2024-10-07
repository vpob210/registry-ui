const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/imagesController');
const searchController = require('../controllers/searchController');
const pullController = require('../controllers/pullController');
const eventsController = require('../controllers/eventsController');
const deleteController = require('../controllers/deleteController');
// Эндпоинт для получения списка образов
router.get('/', imagesController.getImages);

// Эндпоинт для получения тегов для конкретного образа
router.get('/:image/tags', imagesController.getTags);
// Новый маршрут для поиска образов
router.post('/docker-search', searchController.searchImages);
// Новый маршрут для выполнения docker pull
router.post('/docker-pull', pullController.pullImage);
router.get('/events', eventsController.streamEvents);
// Маршрут для удаления образа по имени и дайджесту
router.delete('/delete', deleteController.deleteImage);
// Убедитесь, что массив клиентов инициализирован
router.use((req, res, next) => {
    if (!req.app.locals.clients) {
        req.app.locals.clients = [];
    }
    next();
});
module.exports = router;