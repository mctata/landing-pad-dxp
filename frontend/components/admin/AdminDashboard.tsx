import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Card, Tabs, Tab, Pagination, Alert, Badge } from 'react-bootstrap';

interface Stats {
  users: number;
  websites: number;
  deployments: number;
  domains: number;
  failedDeployments: number;
  activeDomains: number;
}

interface Deployment {
  id: string;
  status: string;
  version: string;
  commitMessage: string;
  createdAt: string;
  completedAt: string | null;
  buildTime: number | null;
  website: {
    name: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Website {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastPublishedAt: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Domain {
  id: string;
  name: string;
  status: string;
  verificationStatus: string;
  isPrimary: boolean;
  createdAt: string;
  website: {
    name: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}

interface PaginationData {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDeployments, setRecentDeployments] = useState<Deployment[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [websitesPagination, setWebsitesPagination] = useState<PaginationData>({
    totalItems: 0,
    itemsPerPage: 10,
    currentPage: 1,
    totalPages: 0
  });
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploymentsPagination, setDeploymentsPagination] = useState<PaginationData>({
    totalItems: 0,
    itemsPerPage: 10,
    currentPage: 1,
    totalPages: 0
  });
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsPagination, setDomainsPagination] = useState<PaginationData>({
    totalItems: 0,
    itemsPerPage: 10,
    currentPage: 1,
    totalPages: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  // Fetch websites
  useEffect(() => {
    if (activeTab === 'websites') {
      fetchWebsites(websitesPagination.currentPage);
    }
  }, [activeTab, websitesPagination.currentPage]);

  // Fetch deployments
  useEffect(() => {
    if (activeTab === 'deployments') {
      fetchDeployments(deploymentsPagination.currentPage);
    }
  }, [activeTab, deploymentsPagination.currentPage]);

  // Fetch domains
  useEffect(() => {
    if (activeTab === 'domains') {
      fetchDomains(domainsPagination.currentPage);
    }
  }, [activeTab, domainsPagination.currentPage]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.stats);
      setRecentDeployments(response.data.recentDeployments);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebsites = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/websites?page=${page}&limit=10`);
      setWebsites(response.data.websites);
      setWebsitesPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load websites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/deployments?page=${page}&limit=10`);
      setDeployments(response.data.deployments);
      setDeploymentsPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load deployments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/domains?page=${page}&limit=10`);
      setDomains(response.data.domains);
      setDomainsPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load domains');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleWebsitesPageChange = (page: number) => {
    setWebsitesPagination({
      ...websitesPagination,
      currentPage: page
    });
  };

  const handleDeploymentsPageChange = (page: number) => {
    setDeploymentsPagination({
      ...deploymentsPagination,
      currentPage: page
    });
  };

  const handleDomainsPageChange = (page: number) => {
    setDomainsPagination({
      ...domainsPagination,
      currentPage: page
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge bg="success">Success</Badge>;
      case 'failed':
        return <Badge bg="danger">Failed</Badge>;
      case 'queued':
        return <Badge bg="warning">Queued</Badge>;
      case 'in_progress':
        return <Badge bg="info">In Progress</Badge>;
      case 'active':
        return <Badge bg="success">Active</Badge>;
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'error':
        return <Badge bg="danger">Error</Badge>;
      case 'draft':
        return <Badge bg="secondary">Draft</Badge>;
      case 'published':
        return <Badge bg="success">Published</Badge>;
      case 'archived':
        return <Badge bg="dark">Archived</Badge>;
      case 'verified':
        return <Badge bg="success">Verified</Badge>;
      case 'failed':
        return <Badge bg="danger">Failed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading && !stats && !websites.length && !deployments.length && !domains.length) {
    return <div className="text-center p-5">Loading...</div>;
  }

  return (
    <div className="admin-dashboard p-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(key) => handleTabChange(key as string)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          {stats && (
            <div className="stats-cards">
              <div className="row mb-4">
                <div className="col-md-3">
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Total Users</h5>
                      <h2>{stats.users}</h2>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3">
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Total Websites</h5>
                      <h2>{stats.websites}</h2>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3">
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Total Deployments</h5>
                      <h2>{stats.deployments}</h2>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3">
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Total Domains</h5>
                      <h2>{stats.domains}</h2>
                    </Card.Body>
                  </Card>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Failed Deployments</h5>
                      <h2>{stats.failedDeployments}</h2>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Active Domains</h5>
                      <h2>{stats.activeDomains}</h2>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </div>
          )}

          <h3 className="mb-3">Recent Deployments</h3>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Status</th>
                <th>Website</th>
                <th>Version</th>
                <th>User</th>
                <th>Created At</th>
                <th>Build Time</th>
              </tr>
            </thead>
            <tbody>
              {recentDeployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td>{renderStatusBadge(deployment.status)}</td>
                  <td>{deployment.website?.name || 'N/A'}</td>
                  <td>{deployment.version}</td>
                  <td>{`${deployment.user.firstName} ${deployment.user.lastName}`}</td>
                  <td>{formatDate(deployment.createdAt)}</td>
                  <td>{deployment.buildTime ? `${(deployment.buildTime / 1000).toFixed(2)}s` : 'N/A'}</td>
                </tr>
              ))}
              {recentDeployments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No deployments found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Tab>

        <Tab eventKey="websites" title="Websites">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>User</th>
                <th>Created</th>
                <th>Last Published</th>
              </tr>
            </thead>
            <tbody>
              {websites.map((website) => (
                <tr key={website.id}>
                  <td>{website.name}</td>
                  <td>{renderStatusBadge(website.status)}</td>
                  <td>{`${website.user.firstName} ${website.user.lastName}`}</td>
                  <td>{formatDate(website.createdAt)}</td>
                  <td>{formatDate(website.lastPublishedAt)}</td>
                </tr>
              ))}
              {websites.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">No websites found</td>
                </tr>
              )}
            </tbody>
          </Table>
          <Pagination>
            <Pagination.First 
              onClick={() => handleWebsitesPageChange(1)} 
              disabled={websitesPagination.currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => handleWebsitesPageChange(websitesPagination.currentPage - 1)} 
              disabled={websitesPagination.currentPage === 1}
            />
            
            {[...Array(websitesPagination.totalPages)].map((_, i) => (
              <Pagination.Item 
                key={i + 1} 
                active={i + 1 === websitesPagination.currentPage}
                onClick={() => handleWebsitesPageChange(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            
            <Pagination.Next 
              onClick={() => handleWebsitesPageChange(websitesPagination.currentPage + 1)} 
              disabled={websitesPagination.currentPage === websitesPagination.totalPages}
            />
            <Pagination.Last 
              onClick={() => handleWebsitesPageChange(websitesPagination.totalPages)} 
              disabled={websitesPagination.currentPage === websitesPagination.totalPages}
            />
          </Pagination>
        </Tab>

        <Tab eventKey="deployments" title="Deployments">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Status</th>
                <th>Website</th>
                <th>Version</th>
                <th>User</th>
                <th>Created</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td>{renderStatusBadge(deployment.status)}</td>
                  <td>{deployment.website?.name || 'N/A'}</td>
                  <td>{deployment.version}</td>
                  <td>{`${deployment.user.firstName} ${deployment.user.lastName}`}</td>
                  <td>{formatDate(deployment.createdAt)}</td>
                  <td>{formatDate(deployment.completedAt)}</td>
                </tr>
              ))}
              {deployments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No deployments found</td>
                </tr>
              )}
            </tbody>
          </Table>
          <Pagination>
            <Pagination.First 
              onClick={() => handleDeploymentsPageChange(1)} 
              disabled={deploymentsPagination.currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => handleDeploymentsPageChange(deploymentsPagination.currentPage - 1)} 
              disabled={deploymentsPagination.currentPage === 1}
            />
            
            {[...Array(deploymentsPagination.totalPages)].map((_, i) => (
              <Pagination.Item 
                key={i + 1} 
                active={i + 1 === deploymentsPagination.currentPage}
                onClick={() => handleDeploymentsPageChange(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            
            <Pagination.Next 
              onClick={() => handleDeploymentsPageChange(deploymentsPagination.currentPage + 1)} 
              disabled={deploymentsPagination.currentPage === deploymentsPagination.totalPages}
            />
            <Pagination.Last 
              onClick={() => handleDeploymentsPageChange(deploymentsPagination.totalPages)} 
              disabled={deploymentsPagination.currentPage === deploymentsPagination.totalPages}
            />
          </Pagination>
        </Tab>

        <Tab eventKey="domains" title="Domains">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Domain Name</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Primary</th>
                <th>Website</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.id}>
                  <td>{domain.name}</td>
                  <td>{renderStatusBadge(domain.status)}</td>
                  <td>{renderStatusBadge(domain.verificationStatus)}</td>
                  <td>{domain.isPrimary ? 'Yes' : 'No'}</td>
                  <td>{domain.website?.name || 'N/A'}</td>
                  <td>{formatDate(domain.createdAt)}</td>
                </tr>
              ))}
              {domains.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No domains found</td>
                </tr>
              )}
            </tbody>
          </Table>
          <Pagination>
            <Pagination.First 
              onClick={() => handleDomainsPageChange(1)} 
              disabled={domainsPagination.currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => handleDomainsPageChange(domainsPagination.currentPage - 1)} 
              disabled={domainsPagination.currentPage === 1}
            />
            
            {[...Array(domainsPagination.totalPages)].map((_, i) => (
              <Pagination.Item 
                key={i + 1} 
                active={i + 1 === domainsPagination.currentPage}
                onClick={() => handleDomainsPageChange(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            
            <Pagination.Next 
              onClick={() => handleDomainsPageChange(domainsPagination.currentPage + 1)} 
              disabled={domainsPagination.currentPage === domainsPagination.totalPages}
            />
            <Pagination.Last 
              onClick={() => handleDomainsPageChange(domainsPagination.totalPages)} 
              disabled={domainsPagination.currentPage === domainsPagination.totalPages}
            />
          </Pagination>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;