/**
 * Mock responses for publish API tests
 */

module.exports = {
  // Mock deployment response
  deployment: {
    id: 'deployment-123',
    websiteId: 'website-123',
    userId: 'user-1',
    status: 'queued',
    version: '2023.09.15.1200',
    commitMessage: 'User initiated deployment',
    createdAt: '2023-09-15T12:00:00Z',
    completedAt: null,
    buildTime: null,
    errorMessage: null
  },
  
  // Mock deployments list
  deployments: [
    {
      id: 'deployment-123',
      websiteId: 'website-123',
      userId: 'user-1',
      status: 'success',
      version: '2023.09.15.1200',
      commitMessage: 'User initiated deployment',
      createdAt: '2023-09-15T12:00:00Z',
      completedAt: '2023-09-15T12:01:00Z',
      buildTime: 60000,
      errorMessage: null
    },
    {
      id: 'deployment-122',
      websiteId: 'website-123',
      userId: 'user-1',
      status: 'failed',
      version: '2023.09.14.1500',
      commitMessage: 'User initiated deployment',
      createdAt: '2023-09-14T15:00:00Z',
      completedAt: '2023-09-14T15:00:30Z',
      buildTime: 30000,
      errorMessage: 'Build failed due to a dependency issue'
    }
  ],
  
  // Mock domain response
  domain: {
    id: 'domain-123',
    name: 'example.com',
    websiteId: 'website-123',
    userId: 'user-1',
    status: 'pending',
    verificationStatus: 'pending',
    isPrimary: false,
    dnsRecords: [
      {
        type: 'CNAME',
        host: 'www.example.com',
        value: 'website-123.landingpad.digital',
        ttl: 3600
      },
      {
        type: 'A',
        host: 'example.com',
        value: '76.76.21.21',
        ttl: 3600
      }
    ],
    createdAt: '2023-09-15T12:00:00Z',
    updatedAt: '2023-09-15T12:00:00Z'
  },
  
  // Mock domains list
  domains: [
    {
      id: 'domain-123',
      name: 'example.com',
      websiteId: 'website-123',
      userId: 'user-1',
      status: 'active',
      verificationStatus: 'verified',
      isPrimary: true,
      dnsRecords: [
        {
          type: 'CNAME',
          host: 'www.example.com',
          value: 'website-123.landingpad.digital',
          ttl: 3600
        },
        {
          type: 'A',
          host: 'example.com',
          value: '76.76.21.21',
          ttl: 3600
        }
      ],
      createdAt: '2023-09-15T12:00:00Z',
      updatedAt: '2023-09-15T12:30:00Z'
    },
    {
      id: 'domain-124',
      name: 'test-domain.com',
      websiteId: 'website-123',
      userId: 'user-1',
      status: 'pending',
      verificationStatus: 'pending',
      isPrimary: false,
      dnsRecords: [
        {
          type: 'CNAME',
          host: 'www.test-domain.com',
          value: 'website-123.landingpad.digital',
          ttl: 3600
        },
        {
          type: 'A',
          host: 'test-domain.com',
          value: '76.76.21.21',
          ttl: 3600
        }
      ],
      createdAt: '2023-09-16T10:00:00Z',
      updatedAt: '2023-09-16T10:00:00Z'
    }
  ],
  
  // Mock domain verification response
  domainVerification: {
    verified: true,
    status: 'verified'
  }
};