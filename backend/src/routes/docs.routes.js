const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');

// API Documentation routes
router.get('/', docsController.renderSwaggerDocs);
router.get('/openapi.json', docsController.getOpenApiJson);
router.get('/openapi.yaml', docsController.getOpenApiYaml);

module.exports = router;