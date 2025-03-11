const { Template } = require('../models');

// Seed default templates
const seedTemplates = async () => {
  const templates = [
    {
      name: 'Simple Landing Page',
      description: 'A clean, minimalist landing page template for showcasing your product or service.',
      category: 'landing-page',
      thumbnail: '/templates/simple-landing-page.jpg',
      content: {
        sections: [
          {
            id: 'hero',
            type: 'hero',
            content: {
              headline: 'Welcome to Your Website',
              subheadline: 'A clean, professional landing page to showcase your business.',
              ctaText: 'Get Started',
              ctaLink: '#contact',
              image: '/images/templates/hero-image.jpg',
            },
          },
          {
            id: 'features',
            type: 'features',
            content: {
              headline: 'Features',
              features: [
                {
                  title: 'Feature 1',
                  description: 'Description of feature 1',
                  icon: 'star',
                },
                {
                  title: 'Feature 2',
                  description: 'Description of feature 2',
                  icon: 'heart',
                },
                {
                  title: 'Feature 3',
                  description: 'Description of feature 3',
                  icon: 'bolt',
                },
              ],
            },
          },
          {
            id: 'about',
            type: 'content',
            content: {
              headline: 'About Us',
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod, nisl eget ultricies aliquam, nisl nisl ultricies nisl, nec ultricies nisl nisl nec.',
              image: '/images/templates/about-image.jpg',
            },
          },
          {
            id: 'testimonials',
            type: 'testimonials',
            content: {
              headline: 'What Our Customers Say',
              testimonials: [
                {
                  quote: 'This product has completely transformed our workflow.',
                  author: 'John Doe',
                  role: 'CEO, Company Inc.',
                },
                {
                  quote: 'The best solution we have found in the market by far.',
                  author: 'Jane Smith',
                  role: 'CTO, Enterprise Ltd.',
                },
              ],
            },
          },
          {
            id: 'contact',
            type: 'contact',
            content: {
              headline: 'Contact Us',
              text: 'Reach out to us with any questions or inquiries.',
              email: 'contact@example.com',
              phone: '+1 (123) 456-7890',
            },
          },
        ],
      },
      styles: {
        colors: {
          primary: '#4361ee',
          secondary: '#3f37c9',
          accent: '#f72585',
          background: '#ffffff',
          text: '#212529',
        },
        fonts: {
          heading: 'Montserrat',
          body: 'Open Sans',
        },
        spacing: {
          sectionPadding: '4rem 0',
        },
      },
      settings: {
        layout: 'standard',
        navigation: {
          fixed: true,
          transparent: true,
          logo: '/images/templates/logo.svg',
          links: [
            { text: 'Home', url: '#hero' },
            { text: 'Features', url: '#features' },
            { text: 'About', url: '#about' },
            { text: 'Testimonials', url: '#testimonials' },
            { text: 'Contact', url: '#contact' },
          ],
        },
        footer: {
          text: '© 2025 Your Company. All rights reserved.',
          links: [
            { text: 'Privacy Policy', url: '#privacy' },
            { text: 'Terms of Service', url: '#terms' },
          ],
        },
      },
      isDefault: true,
    },
    {
      name: 'Portfolio',
      description: 'A clean portfolio template for showcasing your work and skills.',
      category: 'portfolio',
      thumbnail: '/templates/portfolio.jpg',
      content: {
        sections: [
          {
            id: 'hero',
            type: 'hero',
            content: {
              headline: 'John Doe',
              subheadline: 'Designer & Developer',
              ctaText: 'View My Work',
              ctaLink: '#portfolio',
              image: '/images/templates/portfolio-hero.jpg',
            },
          },
          {
            id: 'about',
            type: 'content',
            content: {
              headline: 'About Me',
              text: 'I\'m a passionate designer and developer with over 5 years of experience creating beautiful, functional websites and applications.',
              image: '/images/templates/portfolio-about.jpg',
            },
          },
          {
            id: 'skills',
            type: 'skills',
            content: {
              headline: 'My Skills',
              skills: [
                { name: 'UI/UX Design', level: 90 },
                { name: 'HTML/CSS', level: 95 },
                { name: 'JavaScript', level: 85 },
                { name: 'React', level: 80 },
                { name: 'Node.js', level: 75 },
              ],
            },
          },
          {
            id: 'portfolio',
            type: 'portfolio',
            content: {
              headline: 'My Work',
              projects: [
                {
                  title: 'Project 1',
                  description: 'A website for a local business',
                  image: '/images/templates/portfolio-project1.jpg',
                  link: '#',
                  tags: ['Web Design', 'Development'],
                },
                {
                  title: 'Project 2',
                  description: 'A mobile app for iOS and Android',
                  image: '/images/templates/portfolio-project2.jpg',
                  link: '#',
                  tags: ['UI/UX', 'Mobile'],
                },
                {
                  title: 'Project 3',
                  description: 'A brand identity for a tech startup',
                  image: '/images/templates/portfolio-project3.jpg',
                  link: '#',
                  tags: ['Branding', 'Design'],
                },
              ],
            },
          },
          {
            id: 'contact',
            type: 'contact',
            content: {
              headline: 'Get In Touch',
              text: 'Interested in working together? Let\'s talk!',
              email: 'hello@johndoe.com',
              phone: '+1 (123) 456-7890',
            },
          },
        ],
      },
      styles: {
        colors: {
          primary: '#6c63ff',
          secondary: '#4361ee',
          accent: '#f72585',
          background: '#ffffff',
          text: '#2b2c34',
        },
        fonts: {
          heading: 'Poppins',
          body: 'Roboto',
        },
        spacing: {
          sectionPadding: '5rem 0',
        },
      },
      settings: {
        layout: 'standard',
        navigation: {
          fixed: true,
          transparent: true,
          logo: '/images/templates/portfolio-logo.svg',
          links: [
            { text: 'Home', url: '#hero' },
            { text: 'About', url: '#about' },
            { text: 'Skills', url: '#skills' },
            { text: 'Portfolio', url: '#portfolio' },
            { text: 'Contact', url: '#contact' },
          ],
        },
        footer: {
          text: '© 2025 John Doe. All rights reserved.',
          links: [
            { text: 'LinkedIn', url: '#' },
            { text: 'GitHub', url: '#' },
            { text: 'Twitter', url: '#' },
          ],
        },
      },
      isDefault: true,
    },
    {
      name: 'Business',
      description: 'A professional template for businesses and corporate websites.',
      category: 'business',
      thumbnail: '/templates/business.jpg',
      content: {
        sections: [
          {
            id: 'hero',
            type: 'hero',
            content: {
              headline: 'Your Business Name',
              subheadline: 'Providing top-notch services for over 10 years',
              ctaText: 'Our Services',
              ctaLink: '#services',
              image: '/images/templates/business-hero.jpg',
            },
          },
          {
            id: 'services',
            type: 'services',
            content: {
              headline: 'Our Services',
              services: [
                {
                  title: 'Service 1',
                  description: 'Description of service 1',
                  icon: 'briefcase',
                },
                {
                  title: 'Service 2',
                  description: 'Description of service 2',
                  icon: 'chart-line',
                },
                {
                  title: 'Service 3',
                  description: 'Description of service 3',
                  icon: 'handshake',
                },
                {
                  title: 'Service 4',
                  description: 'Description of service 4',
                  icon: 'users',
                },
              ],
            },
          },
          {
            id: 'about',
            type: 'content',
            content: {
              headline: 'About Us',
              text: 'Founded in 2015, we have been providing exceptional services to our clients for over a decade. Our team of experts is dedicated to delivering quality results.',
              image: '/images/templates/business-about.jpg',
            },
          },
          {
            id: 'team',
            type: 'team',
            content: {
              headline: 'Our Team',
              members: [
                {
                  name: 'John Smith',
                  role: 'CEO',
                  image: '/images/templates/team-1.jpg',
                },
                {
                  name: 'Jane Doe',
                  role: 'CTO',
                  image: '/images/templates/team-2.jpg',
                },
                {
                  name: 'Mike Johnson',
                  role: 'CFO',
                  image: '/images/templates/team-3.jpg',
                },
              ],
            },
          },
          {
            id: 'contact',
            type: 'contact',
            content: {
              headline: 'Contact Us',
              text: 'Get in touch with us for more information about our services.',
              email: 'info@yourbusiness.com',
              phone: '+1 (123) 456-7890',
              address: '123 Business St, City, Country',
            },
          },
        ],
      },
      styles: {
        colors: {
          primary: '#1a73e8',
          secondary: '#4285f4',
          accent: '#fbbc04',
          background: '#ffffff',
          text: '#202124',
        },
        fonts: {
          heading: 'Roboto',
          body: 'Open Sans',
        },
        spacing: {
          sectionPadding: '4.5rem 0',
        },
      },
      settings: {
        layout: 'standard',
        navigation: {
          fixed: true,
          transparent: false,
          logo: '/images/templates/business-logo.svg',
          links: [
            { text: 'Home', url: '#hero' },
            { text: 'Services', url: '#services' },
            { text: 'About', url: '#about' },
            { text: 'Team', url: '#team' },
            { text: 'Contact', url: '#contact' },
          ],
        },
        footer: {
          text: '© 2025 Your Business. All rights reserved.',
          links: [
            { text: 'Privacy Policy', url: '#privacy' },
            { text: 'Terms of Service', url: '#terms' },
          ],
        },
      },
      isDefault: true,
    }
  ];

  // Clear existing templates
  await Template.destroy({ where: {} });

  // Create new templates
  for (const template of templates) {
    await Template.create(template);
  }

  console.log('Templates seeded successfully');
};

module.exports = seedTemplates;
