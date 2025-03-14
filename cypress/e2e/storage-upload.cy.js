describe('Storage and Upload Functionality', () => {
  beforeEach(() => {
    // Mock the upload endpoint
    cy.intercept('POST', '/api/storage/upload', {
      statusCode: 200,
      body: {
        success: true,
        file: {
          id: 'file-123',
          name: 'test-file.txt',
          url: 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/uploads/user-123/test-file.txt',
          size: 1024,
          type: 'text/plain'
        }
      }
    }).as('fileUpload');
    
    // Mock the image upload endpoint
    cy.intercept('POST', '/api/images/upload', {
      statusCode: 200,
      body: {
        success: true,
        image: {
          id: 'img-456',
          name: 'test-image.jpg',
          url: 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/uploads/user-123/images/test-image.jpg',
          size: 102400,
          type: 'image/jpeg'
        }
      }
    }).as('imageUpload');
    
    // Mock the storage health check endpoint
    cy.intercept('GET', '/api/storage/health', {
      statusCode: 200,
      body: {
        healthy: true,
        s3Enabled: true
      }
    }).as('storageHealth');
    
    // Mock the storage signed URL endpoint
    cy.intercept('POST', '/api/storage/signed-url', {
      statusCode: 200,
      body: {
        url: 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/uploads/user-123/signed-file.pdf?X-Amz-Algorithm=...',
        fields: {
          key: 'uploads/user-123/signed-file.pdf',
          bucket: 'landingpad-dxp-dev'
        }
      }
    }).as('signedUrl');
    
    // Log in before each test
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'fake-token');
    });
    cy.visit('/dashboard');
  });

  describe('Basic File Uploads', () => {
    it('should upload a text file successfully', () => {
      // Visit page with upload functionality
      cy.visit('/dashboard/settings');
      
      // Attach a file to the file input
      cy.get('input[type="file"]').attachFile({
        filePath: 'example.json',
        fileName: 'test-file.txt',
        mimeType: 'text/plain'
      });
      
      // Verify the upload API was called
      cy.wait('@fileUpload');
      
      // Verify success message
      cy.contains('File uploaded successfully').should('be.visible');
      
      // Verify the file link appears
      cy.contains('test-file.txt').should('be.visible');
    });
    
    it('should upload an image file successfully', () => {
      // Visit profile settings page
      cy.visit('/dashboard/settings');
      
      // Attach an image to the profile picture upload
      cy.get('input[type="file"][accept="image/*"]').attachFile({
        filePath: 'example.json', // using this as mock image
        fileName: 'profile-pic.jpg',
        mimeType: 'image/jpeg'
      });
      
      // Verify the image upload API was called
      cy.wait('@imageUpload');
      
      // Verify success message
      cy.contains('Profile picture updated').should('be.visible');
      
      // Verify the image appears
      cy.get('img[alt="Profile picture"]').should('have.attr', 'src').and('include', 'test-image.jpg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle large file uploads', () => {
      // Mock large file upload with delay
      cy.intercept('POST', '/api/storage/upload', {
        statusCode: 200,
        delayMs: 3000, // 3 second delay to simulate large file
        body: {
          success: true,
          file: {
            id: 'large-file-123',
            name: 'large-file.pdf',
            url: 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/uploads/user-123/large-file.pdf',
            size: 10485760, // 10MB
            type: 'application/pdf'
          }
        }
      }).as('largeFileUpload');
      
      // Visit page with upload functionality
      cy.visit('/dashboard/settings');
      
      // Attach a "large" file to the file input
      cy.get('input[type="file"]').attachFile({
        filePath: 'example.json',
        fileName: 'large-file.pdf',
        mimeType: 'application/pdf'
      });
      
      // Verify loading indicator appears
      cy.contains('Uploading...').should('be.visible');
      
      // Verify the upload API was called
      cy.wait('@largeFileUpload');
      
      // Verify success message
      cy.contains('File uploaded successfully').should('be.visible');
    });
    
    it('should handle upload failure', () => {
      // Mock upload failure
      cy.intercept('POST', '/api/storage/upload', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Internal server error'
        }
      }).as('failedUpload');
      
      // Visit page with upload functionality
      cy.visit('/dashboard/settings');
      
      // Attach a file to the file input
      cy.get('input[type="file"]').attachFile({
        filePath: 'example.json',
        fileName: 'failed-file.txt',
        mimeType: 'text/plain'
      });
      
      // Verify the upload API was called
      cy.wait('@failedUpload');
      
      // Verify error message
      cy.contains('Upload failed').should('be.visible');
    });
    
    it('should handle slow connection uploads', () => {
      // Mock very slow upload
      cy.intercept('POST', '/api/storage/upload', {
        statusCode: 200,
        delayMs: 5000, // 5 second delay to simulate slow connection
        body: {
          success: true,
          file: {
            id: 'slow-file-123',
            name: 'slow-upload.txt',
            url: 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/uploads/user-123/slow-upload.txt',
            size: 1024,
            type: 'text/plain'
          }
        }
      }).as('slowUpload');
      
      // Visit page with upload functionality
      cy.visit('/dashboard/settings');
      
      // Attach a file to the file input
      cy.get('input[type="file"]').attachFile({
        filePath: 'example.json',
        fileName: 'slow-upload.txt',
        mimeType: 'text/plain'
      });
      
      // Verify loading indicator appears and stays
      cy.contains('Uploading...').should('be.visible');
      cy.wait(3000); // Wait 3 seconds
      cy.contains('Uploading...').should('be.visible'); // Still visible after 3s
      
      // Verify the upload API was called
      cy.wait('@slowUpload');
      
      // Verify success message
      cy.contains('File uploaded successfully').should('be.visible');
    });
    
    it('should handle file type restrictions', () => {
      // Visit page with upload functionality
      cy.visit('/dashboard/settings');
      
      // Try to upload a disallowed file type
      cy.get('input[type="file"][accept="image/*"]').attachFile({
        filePath: 'example.json',
        fileName: 'script.js',
        mimeType: 'text/javascript'
      }, { force: true }); // Force to bypass browser validation
      
      // Verify client-side validation message
      cy.contains('File type not allowed').should('be.visible');
      
      // Verify no API call was made
      cy.get('@imageUpload.all').should('have.length', 0);
    });
    
    it('should handle file size limits', () => {
      // Visit page with upload functionality
      cy.visit('/dashboard/settings');
      
      // Mock a very large file (by name only, not actually large)
      cy.get('input[type="file"]').attachFile({
        filePath: 'example.json',
        fileName: 'too-large.jpg',
        mimeType: 'image/jpeg'
      });
      
      // Mock client validating the size and show error
      cy.window().then((win) => {
        // Simulate client-side validation for file too large
        const event = new CustomEvent('validation:error', { 
          detail: { message: 'File size exceeds the 5MB limit' } 
        });
        win.document.dispatchEvent(event);
      });
      
      // Verify error message
      cy.contains('File size exceeds the 5MB limit').should('be.visible');
    });
  });

  describe('S3 Specific Functionality', () => {
    it('should generate and use signed URLs for direct uploads', () => {
      // Mock the form submission to S3
      cy.intercept('POST', 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/*', {
        statusCode: 204
      }).as('s3Upload');
      
      // Visit page with signed URL upload functionality
      cy.visit('/dashboard/settings');
      
      // Trigger the signed URL generation
      cy.contains('button', 'Upload Large File').click();
      
      // Verify signed URL was requested
      cy.wait('@signedUrl');
      
      // Attach file to the now-configured upload form
      cy.get('input[type="file"][data-signed-upload="true"]').attachFile({
        filePath: 'example.json',
        fileName: 'direct-upload.pdf',
        mimeType: 'application/pdf'
      });
      
      // Verify S3 upload occurred
      cy.wait('@s3Upload');
      
      // Verify success message
      cy.contains('File uploaded directly to S3').should('be.visible');
    });
    
    it('should check S3 connectivity', () => {
      // Visit storage settings page
      cy.visit('/dashboard/settings');
      
      // Trigger storage health check
      cy.contains('button', 'Check Storage Connection').click();
      
      // Verify health check API was called
      cy.wait('@storageHealth');
      
      // Verify status message
      cy.contains('S3 Storage is connected and healthy').should('be.visible');
    });
    
    it('should handle S3 connectivity issues', () => {
      // Mock storage health check failure
      cy.intercept('GET', '/api/storage/health', {
        statusCode: 200,
        body: {
          healthy: false,
          s3Enabled: true,
          message: 'S3 bucket not accessible'
        }
      }).as('storageHealthFailure');
      
      // Visit storage settings page
      cy.visit('/dashboard/settings');
      
      // Trigger storage health check
      cy.contains('button', 'Check Storage Connection').click();
      
      // Verify health check API was called
      cy.wait('@storageHealthFailure');
      
      // Verify error message
      cy.contains('S3 bucket not accessible').should('be.visible');
    });
    
    it('should fallback to local storage when S3 is disabled', () => {
      // Mock storage health with S3 disabled
      cy.intercept('GET', '/api/storage/health', {
        statusCode: 200,
        body: {
          healthy: true,
          s3Enabled: false,
          message: 'Using local storage'
        }
      }).as('localStorageHealth');
      
      // Mock the upload to return a local path instead of S3 URL
      cy.intercept('POST', '/api/storage/upload', {
        statusCode: 200,
        body: {
          success: true,
          file: {
            id: 'local-file-123',
            name: 'local-file.txt',
            url: '/uploads/user-123/local-file.txt',
            size: 1024,
            type: 'text/plain'
          }
        }
      }).as('localFileUpload');
      
      // Visit storage settings page
      cy.visit('/dashboard/settings');
      
      // Trigger storage health check
      cy.contains('button', 'Check Storage Connection').click();
      
      // Verify health check API was called
      cy.wait('@localStorageHealth');
      
      // Verify local storage message
      cy.contains('Using local storage').should('be.visible');
      
      // Upload a file
      cy.get('input[type="file"]').attachFile({
        filePath: 'example.json',
        fileName: 'local-file.txt',
        mimeType: 'text/plain'
      });
      
      // Verify the upload API was called
      cy.wait('@localFileUpload');
      
      // Verify the file link has a local path
      cy.get('a').contains('local-file.txt').should('have.attr', 'href').and('include', '/uploads/');
    });
  });
});