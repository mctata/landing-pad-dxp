'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  /**
   * Seed the websites table with sample data
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize constructor
   * @returns {Promise} - Promise that resolves when seeding is complete
   */
  up: async (queryInterface, Sequelize) => {
    // Get the first user for reference
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (users.length === 0) {
      console.log('No users found, skipping website seed');
      return;
    }
    
    const userId = users[0].id;
    
    // Sample website data
    const websites = [
      {
        id: uuidv4(),
        userId,
        name: 'Business Landing Page',
        description: 'A professional landing page for small businesses',
        slug: 'business-landing-page',
        status: 'published',
        content: JSON.stringify({
          pages: [
            {
              id: 'home',
              name: 'Home',
              slug: 'home',
              isHome: true,
              elements: [
                {
                  type: 'hero',
                  id: 'hero-1',
                  content: {
                    headline: 'Grow Your Business',
                    subheadline: 'Reliable solutions for small and medium businesses',
                    ctaText: 'Get Started',
                    ctaLink: '#contact',
                    alignment: 'center'
                  }
                },
                {
                  type: 'features',
                  id: 'features-1',
                  content: {
                    headline: 'Our Services',
                    subheadline: 'What we can do for you',
                    columns: 3,
                    features: [
                      {
                        title: 'Business Strategy',
                        description: 'Develop effective business strategies to achieve your goals',
                        icon: 'strategy'
                      },
                      {
                        title: 'Market Analysis',
                        description: 'In-depth market research and competitor analysis',
                        icon: 'chart'
                      },
                      {
                        title: 'Growth Planning',
                        description: 'Create sustainable growth plans for your business',
                        icon: 'growth'
                      }
                    ]
                  }
                },
                {
                  type: 'text',
                  id: 'about-1',
                  content: {
                    headline: 'About Us',
                    content: '<p>We are a team of experienced business consultants dedicated to helping small and medium businesses achieve their goals. With over 10 years of experience in the industry, we have helped hundreds of businesses grow and thrive.</p>',
                    alignment: 'left'
                  }
                }
              ]
            }
          ]
        }),
        settings: JSON.stringify({
          colors: {
            primary: '#4361ee',
            secondary: '#3f37c9',
            accent: '#f72585',
            background: '#ffffff',
            text: '#212529'
          },
          fonts: {
            heading: 'Montserrat',
            body: 'Open Sans'
          },
          globalStyles: {
            borderRadius: '0.5rem',
            buttonStyle: 'rounded'
          }
        }),
        publicUrl: null,
        lastPublishedAt: null,
        lastDeployedAt: null,
        lastSuccessfulDeploymentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId,
        name: 'Personal Portfolio',
        description: 'A showcase for creative professionals',
        slug: 'personal-portfolio',
        status: 'draft',
        content: JSON.stringify({
          pages: [
            {
              id: 'home',
              name: 'Home',
              slug: 'home',
              isHome: true,
              elements: [
                {
                  type: 'hero',
                  id: 'hero-1',
                  content: {
                    headline: 'John Doe',
                    subheadline: 'UX Designer & Developer',
                    ctaText: 'View Projects',
                    ctaLink: '#projects',
                    alignment: 'center'
                  }
                },
                {
                  type: 'text',
                  id: 'about-1',
                  content: {
                    headline: 'About Me',
                    content: '<p>I am a passionate UX designer with 5 years of experience creating intuitive and engaging digital experiences. I specialize in user-centered design and believe in creating products that solve real problems for people.</p>',
                    alignment: 'left'
                  }
                }
              ]
            }
          ]
        }),
        settings: JSON.stringify({
          colors: {
            primary: '#06d6a0',
            secondary: '#118ab2',
            accent: '#ef476f',
            background: '#f8f9fa',
            text: '#073b4c'
          },
          fonts: {
            heading: 'Poppins',
            body: 'Roboto'
          },
          globalStyles: {
            borderRadius: '0.25rem',
            buttonStyle: 'minimal'
          }
        }),
        publicUrl: null,
        lastPublishedAt: null,
        lastDeployedAt: null,
        lastSuccessfulDeploymentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert the websites
    await queryInterface.bulkInsert('Websites', websites);
    
    console.log(`Seeded ${websites.length} websites`);
  },
  
  /**
   * Remove seeded data
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize constructor
   * @returns {Promise} - Promise that resolves when unseeding is complete
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Websites', null, {});
    console.log('Removed all website seed data');
  }
};