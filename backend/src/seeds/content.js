'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed file for adding default content items
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get admin user
    const adminUser = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE role = \'admin\' LIMIT 1;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (!adminUser || adminUser.length === 0) {
      console.warn('No admin user found. Skipping content seeds.');
      return;
    }

    const adminUserId = adminUser[0].id;
    
    // Get a sample website
    const sampleWebsite = await queryInterface.sequelize.query(
      'SELECT id FROM "Websites" LIMIT 1;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const sampleWebsiteId = sampleWebsite && sampleWebsite.length > 0 
      ? sampleWebsite[0].id 
      : null;

    // Create sample content
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const contents = [
      {
        id: uuidv4(),
        title: 'Landing Page Template',
        description: 'A modern landing page template for marketing campaigns',
        type: 'template',
        content: JSON.stringify({
          sections: [
            {
              type: 'hero',
              name: 'Hero Section',
              settings: {
                background: '#4361ee',
                textColor: '#ffffff',
                alignment: 'center'
              },
              content: {
                headline: 'Build Stunning Websites in Minutes',
                subheadline: 'Our AI-powered platform makes website creation fast and easy',
                ctaText: 'Get Started',
                ctaLink: '#signup'
              }
            },
            {
              type: 'features',
              name: 'Features Section',
              settings: {
                background: '#ffffff',
                textColor: '#212529',
                columns: 3
              },
              content: {
                headline: 'Key Features',
                subheadline: 'Everything you need to build your online presence',
                features: [
                  {
                    title: 'Easy Customization',
                    description: 'Customize every aspect of your site with our intuitive editor',
                    icon: 'brush'
                  },
                  {
                    title: 'Mobile Responsive',
                    description: 'Your site looks great on desktops, tablets, and mobile phones',
                    icon: 'devices'
                  },
                  {
                    title: 'SEO Optimized',
                    description: 'Built-in SEO tools to help your site rank higher in search results',
                    icon: 'search'
                  }
                ]
              }
            },
            {
              type: 'cta',
              name: 'Call to Action',
              settings: {
                background: '#f72585',
                textColor: '#ffffff'
              },
              content: {
                headline: 'Ready to get started?',
                subheadline: 'Sign up today and launch your website in minutes',
                buttonText: 'Sign Up Now',
                buttonLink: '/signup'
              }
            }
          ]
        }),
        status: 'published',
        publishedAt: twoWeeksAgo,
        tags: ['marketing', 'landing-page', 'lead-generation'],
        preview: 'https://example.com/previews/landing-template.jpg',
        parentId: null,
        userId: adminUserId,
        websiteId: null,
        config: JSON.stringify({
          category: 'marketing',
          difficulty: 'beginner',
          estimatedSetupTime: '5 minutes'
        }),
        slug: 'landing-page-template',
        createdAt: oneMonthAgo,
        updatedAt: twoWeeksAgo
      },
      {
        id: uuidv4(),
        title: 'Portfolio Template',
        description: 'Showcase your work with this elegant portfolio template',
        type: 'template',
        content: JSON.stringify({
          sections: [
            {
              type: 'hero',
              name: 'Profile Introduction',
              settings: {
                background: '#3f37c9',
                textColor: '#ffffff',
                alignment: 'center'
              },
              content: {
                headline: 'John Smith',
                subheadline: 'UX Designer & Developer',
                ctaText: 'View My Work',
                ctaLink: '#portfolio'
              }
            },
            {
              type: 'portfolio',
              name: 'Portfolio Grid',
              settings: {
                background: '#ffffff',
                textColor: '#212529',
                columns: 3
              },
              content: {
                headline: 'My Work',
                subheadline: 'Recent projects I\'ve worked on',
                items: [
                  {
                    title: 'E-commerce Redesign',
                    description: 'UX redesign for an e-commerce platform',
                    image: 'project1.jpg',
                    link: '#project1'
                  },
                  {
                    title: 'Mobile App',
                    description: 'Fitness tracking mobile application',
                    image: 'project2.jpg',
                    link: '#project2'
                  },
                  {
                    title: 'Marketing Website',
                    description: 'Corporate website for a SaaS company',
                    image: 'project3.jpg',
                    link: '#project3'
                  }
                ]
              }
            }
          ]
        }),
        status: 'published',
        publishedAt: twoWeeksAgo,
        tags: ['portfolio', 'personal', 'creative'],
        preview: 'https://example.com/previews/portfolio-template.jpg',
        parentId: null,
        userId: adminUserId,
        websiteId: null,
        config: JSON.stringify({
          category: 'portfolio',
          difficulty: 'beginner',
          estimatedSetupTime: '10 minutes'
        }),
        slug: 'portfolio-template',
        createdAt: oneMonthAgo,
        updatedAt: twoWeeksAgo
      },
      {
        id: uuidv4(),
        title: 'Hero Section',
        description: 'Eye-catching hero section for the top of your website',
        type: 'section',
        content: JSON.stringify({
          type: 'hero',
          settings: {
            background: '#4361ee',
            textColor: '#ffffff',
            alignment: 'center',
            height: 'full',
            backgroundImage: 'https://example.com/images/hero-bg.jpg'
          },
          content: {
            headline: 'Elevate Your Online Presence',
            subheadline: 'Create beautiful websites without coding',
            ctaText: 'Get Started Free',
            ctaLink: '/signup',
            secondaryCtaText: 'Learn More',
            secondaryCtaLink: '/features'
          }
        }),
        status: 'published',
        publishedAt: oneMonthAgo,
        tags: ['hero', 'header', 'banner'],
        preview: 'https://example.com/previews/hero-section.jpg',
        parentId: null,
        userId: adminUserId,
        websiteId: sampleWebsiteId,
        config: JSON.stringify({
          category: 'layout',
          placement: 'header'
        }),
        slug: 'hero-section',
        createdAt: oneMonthAgo,
        updatedAt: oneMonthAgo
      },
      {
        id: uuidv4(),
        title: 'Contact Form Component',
        description: 'Customizable contact form for gathering user information',
        type: 'component',
        content: JSON.stringify({
          type: 'form',
          settings: {
            background: '#ffffff',
            textColor: '#212529',
            buttonColor: '#4361ee',
            buttonTextColor: '#ffffff',
            borderRadius: '4px'
          },
          content: {
            title: 'Get in Touch',
            subtitle: 'Fill out the form below and we\'ll get back to you as soon as possible.',
            fields: [
              {
                type: 'text',
                name: 'name',
                label: 'Your Name',
                placeholder: 'Enter your full name',
                required: true
              },
              {
                type: 'email',
                name: 'email',
                label: 'Email Address',
                placeholder: 'Enter your email address',
                required: true
              },
              {
                type: 'select',
                name: 'subject',
                label: 'Subject',
                options: [
                  'General Inquiry',
                  'Support',
                  'Feedback',
                  'Partnership'
                ],
                required: true
              },
              {
                type: 'textarea',
                name: 'message',
                label: 'Your Message',
                placeholder: 'Write your message here...',
                required: true
              }
            ],
            submitText: 'Send Message',
            successMessage: 'Thanks for your message! We\'ll get back to you soon.'
          }
        }),
        status: 'published',
        publishedAt: twoWeeksAgo,
        tags: ['form', 'contact', 'leads'],
        preview: 'https://example.com/previews/contact-form.jpg',
        parentId: null,
        userId: adminUserId,
        websiteId: null,
        config: JSON.stringify({
          category: 'forms',
          integration: 'email'
        }),
        slug: 'contact-form-component',
        createdAt: oneMonthAgo,
        updatedAt: twoWeeksAgo
      },
      {
        id: uuidv4(),
        title: 'Blog Page',
        description: 'A complete blog page template with posts list and sidebar',
        type: 'page',
        content: JSON.stringify({
          layout: 'sidebar-right',
          sections: [
            {
              type: 'header',
              content: {
                title: 'Our Blog',
                subtitle: 'Latest news and insights'
              }
            },
            {
              type: 'blog-list',
              content: {
                postsPerPage: 10,
                showFeaturedImage: true,
                showExcerpt: true,
                showDate: true,
                showAuthor: true
              }
            },
            {
              type: 'sidebar',
              content: {
                widgets: [
                  {
                    type: 'categories',
                    title: 'Categories'
                  },
                  {
                    type: 'recent-posts',
                    title: 'Recent Posts',
                    count: 5
                  },
                  {
                    type: 'tags',
                    title: 'Tags'
                  }
                ]
              }
            }
          ]
        }),
        status: 'draft',
        publishedAt: null,
        tags: ['blog', 'content', 'articles'],
        preview: 'https://example.com/previews/blog-page.jpg',
        parentId: null,
        userId: adminUserId,
        websiteId: null,
        config: JSON.stringify({
          category: 'blog',
          contentType: 'dynamic'
        }),
        slug: 'blog-page',
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Contents', contents);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Contents', null, {});
  }
};