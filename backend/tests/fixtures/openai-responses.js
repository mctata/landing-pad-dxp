/**
 * Mock data for OpenAI API responses used in tests
 */
module.exports = {
  contentGeneration: {
    text: {
      heading: "Transform Your Digital Presence",
      subheading: "Create beautiful websites in minutes with our AI-powered platform",
      body: "Landing Pad Digital provides everything you need to build a professional website without coding skills. Our intuitive drag-and-drop editor combined with AI suggestions makes website creation faster than ever before."
    },
    hero: {
      headline: "Build Your Dream Website",
      subheadline: "No coding required, just your imagination",
      ctaText: "Get Started Free",
      imagePosition: "right"
    },
    features: {
      features: [
        {
          title: "AI-Powered Design",
          description: "Get intelligent design suggestions that match your brand and style.",
          iconSuggestion: "wand-sparkles"
        },
        {
          title: "Drag-and-Drop Editor",
          description: "Create and customize your website without any coding knowledge.",
          iconSuggestion: "cursor-arrow"
        },
        {
          title: "Responsive Templates",
          description: "All templates automatically adapt to any screen size or device.",
          iconSuggestion: "device-mobile"
        }
      ]
    }
  },
  
  suggestions: {
    text: [
      {
        id: "1",
        type: "text",
        title: "Modern Homepage Headline",
        content: {
          heading: "Create Stunning Websites Without Code",
          subheading: "Our AI-powered platform makes it easy to build professional websites in minutes"
        }
      },
      {
        id: "2",
        type: "text",
        title: "Feature Highlight",
        content: {
          heading: "Powerful Features, Simple Interface",
          subheading: "Everything you need to succeed online"
        }
      }
    ],
    layout: [
      {
        id: "1",
        type: "layout",
        title: "Modern SaaS Homepage",
        content: {
          structure: "Hero > Features > Testimonials > Pricing > CTA",
          elements: ["Header", "Hero", "Features Grid", "Testimonials", "Pricing Table", "Call to Action", "Footer"]
        }
      },
      {
        id: "2",
        type: "layout",
        title: "Professional Services",
        content: {
          structure: "Hero > Services > About > Team > Contact",
          elements: ["Header", "Hero", "Services Grid", "About Section", "Team Members", "Contact Form", "Footer"]
        }
      }
    ],
    style: [
      {
        id: "1",
        type: "style",
        title: "Modern Tech Theme",
        content: {
          colors: {
            primary: "#3B82F6",
            secondary: "#1E293B",
            accent: "#06B6D4",
            background: "#F8FAFC"
          },
          typography: {
            heading: "Inter",
            body: "Inter"
          }
        }
      },
      {
        id: "2",
        type: "style",
        title: "Elegant Professional Theme",
        content: {
          colors: {
            primary: "#4F46E5",
            secondary: "#334155",
            accent: "#EC4899",
            background: "#FFFFFF"
          },
          typography: {
            heading: "Playfair Display",
            body: "Source Sans Pro"
          }
        }
      }
    ]
  },
  
  contentModification: {
    rewrite: {
      content: "Transform your online presence with Landing Pad Digital, the intuitive website builder designed for everyone. Our platform combines AI-powered design with a simple drag-and-drop interface to make website creation accessible and fast."
    },
    expand: {
      content: "Landing Pad Digital revolutionizes website creation with powerful AI tools. Our platform not only makes it easy to build stunning websites without code, but also provides intelligent suggestions for layouts, content, and design elements. With our intuitive editor, you can customize every aspect of your site to perfectly match your brand vision. Our responsive templates ensure your website looks great on any device, while our hosting service guarantees fast loading times and reliable performance. Start your digital journey today with Landing Pad Digital and join thousands of satisfied customers who have transformed their online presence."
    },
    shorten: {
      content: "Landing Pad Digital: AI-powered website builder with drag-and-drop editing. Create professional sites quickly without coding skills."
    },
    changeStyle: {
      content: "Landing Pad Digital empowers users to craft exceptional websites through innovative AI technology and an intuitive drag-and-drop interface, eliminating the necessity for coding expertise."
    },
    proofread: {
      content: "Landing Pad Digital offers a comprehensive website builder platform that empowers users to create, customize, and deploy professional websites with AI assistance. Our intuitive drag-and-drop interface makes website creation accessible to everyone, regardless of technical background."
    }
  }
};
