// Import commands.js using ES2015 syntax:
import './commands'

// Hide fetch/XHR requests in the command log
const app = window.top;
if (\!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}
