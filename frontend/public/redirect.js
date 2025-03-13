// Simple redirect script
(function() {
  // Map of static HTML paths to Next.js paths
  const redirectMap = {
    '/index.html': '/',
    '/login.html': '/auth/login',
    '/dashboard/index.html': '/dashboard'
  };

  // Get the current path
  const currentPath = window.location.pathname;

  // Check if we need to redirect
  if (redirectMap[currentPath]) {
    window.location.href = redirectMap[currentPath];
  }
  
  // Handle HTML extensions generally
  if (currentPath.endsWith('.html') && !redirectMap[currentPath]) {
    const newPath = currentPath.replace('.html', '');
    window.location.href = newPath;
  }
})();