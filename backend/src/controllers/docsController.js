const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('../utils/logger');

/**
 * Controller for API documentation
 */
const docsController = {
  /**
   * Get OpenAPI documentation as JSON
   * @route GET /api/docs/openapi.json
   */
  getOpenApiJson(req, res, next) {
    try {
      const openApiYamlPath = path.join(__dirname, '../docs/openapi.yaml');
      const openApiYaml = fs.readFileSync(openApiYamlPath, 'utf8');
      const openApiJson = yaml.load(openApiYaml);
      
      res.json(openApiJson);
    } catch (error) {
      logger.error('Error serving OpenAPI JSON:', error);
      next(error);
    }
  },
  
  /**
   * Get OpenAPI documentation as YAML
   * @route GET /api/docs/openapi.yaml
   */
  getOpenApiYaml(req, res, next) {
    try {
      const openApiYamlPath = path.join(__dirname, '../docs/openapi.yaml');
      const openApiYaml = fs.readFileSync(openApiYamlPath, 'utf8');
      
      res.setHeader('Content-Type', 'text/yaml');
      res.send(openApiYaml);
    } catch (error) {
      logger.error('Error serving OpenAPI YAML:', error);
      next(error);
    }
  },
  
  /**
   * Render Swagger UI documentation
   * @route GET /api/docs
   */
  renderSwaggerDocs(req, res, next) {
    try {
      // Render HTML with Swagger UI
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Landing Pad DXP API Documentation</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
          <style>
            body {
              margin: 0;
              padding: 0;
            }
            .topbar {
              display: none;
            }
            .custom-header {
              background-color: #1E293B;
              color: white;
              padding: 15px 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .custom-header h1 {
              margin: 0;
              font-size: 1.5rem;
            }
            .custom-header a {
              color: white;
              text-decoration: none;
              font-size: 0.9rem;
            }
          </style>
        </head>
        <body>
          <div class="custom-header">
            <h1>Landing Pad DXP API Documentation</h1>
            <a href="/dashboard">Return to Dashboard</a>
          </div>

          <div id="swagger-ui"></div>

          <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
          <script>
            window.onload = function() {
              const ui = SwaggerUIBundle({
                url: "/api/docs/openapi.json",
                dom_id: "#swagger-ui",
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                withCredentials: true,
                persistAuthorization: true,
              });
              window.ui = ui;
            };
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      logger.error('Error rendering Swagger UI:', error);
      next(error);
    }
  }
};

module.exports = docsController;