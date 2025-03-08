# Deployment Guide

## Prerequisites

- Vercel account (for frontend hosting)
- AWS account or similar (for backend hosting)
- PostgreSQL database (e.g., AWS RDS, Digital Ocean)
- Domain name (optional for custom domains)

## Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `.next`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`: Unsplash API key
   - Other required environment variables
4. Deploy the project

## Backend Deployment (AWS EC2)

1. Launch an EC2 instance:
   - Ubuntu Server 22.04 LTS
   - t3.small or larger
   - Configure security group to allow HTTP/HTTPS traffic

2. SSH into your instance and install dependencies:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm nginx
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/mctata/landing-pad-dxp.git
   cd landing-pad-dxp/backend
   npm install
   npm run build
   ```

4. Set up environment variables:
   ```bash
   sudo nano .env
   # Add your environment variables
   ```

5. Set up PM2 for process management:
   ```bash
   sudo npm install -g pm2
   pm2 start dist/main.js --name landing-pad-api
   pm2 startup
   pm2 save
   ```

6. Configure Nginx as a reverse proxy:
   ```bash
   sudo nano /etc/nginx/sites-available/landing-pad
   ```
   
   Add the following configuration:
   ```
   server {
       listen 80;
       server_name api.landingpad.digital;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/landing-pad /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.landingpad.digital
   ```

## Database Setup (AWS RDS)

1. Create a PostgreSQL instance in RDS
2. Configure security groups to allow access from your backend server
3. Connect to the database and run migrations:
   ```bash
   cd landing-pad-dxp/backend
   npm run migration:run
   ```

## Continuous Deployment

The repository is configured with GitHub Actions workflows for continuous deployment:

- Frontend is automatically deployed to Vercel
- Backend requires manual deployment or can be extended to use AWS CodeDeploy

See the `.github/workflows` directory for workflow configurations.