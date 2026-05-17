import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DirectorView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/director/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (err) {
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;
  if (error) return <div style={styles.container}><p style={styles.error}>{error}</p></div>;
  if (!stats) return null;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Director Dashboard</h1>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <h3>{stats.total_parents}</h3>
          <p>Total Families</p>
        </div>
      </div>

      {/* Enrollment Pipeline */}
      <div style={styles.section}>
        <h2>Enrollment Pipeline</h2>
        <div style={styles.pipelineContainer}>
          {stats.enrollment_pipeline.map((stage) => (
            <div key={stage.enrollment_stage} style={styles.pipelineStage}>
              <div style={styles.stageCount}>{stage.count}</div>
              <p>{stage.enrollment_stage.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiry Breakdown */}
      <div style={styles.section}>
        <h2>Inquiry Breakdown</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Stage</span>
            <span>Count</span>
          </div>
          {stats.inquiry_stages.map((stage) => (
            <div key={stage.enrollment_stage} style={styles.tableRow}>
              <span>{stage.enrollment_stage}</span>
              <span>{stage.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Parents */}
      <div style={styles.section}>
        <h2>Recent Family Inquiries</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Name</span>
            <span>Phone</span>
            <span>Email</span>
            <span>Date</span>
          </div>
          {stats.recent_parents.map((parent) => (
            <div key={parent.id} style={styles.tableRow}>
              <span>{parent.full_name}</span>
              <span>{parent.phone}</span>
              <span>{parent.email}</span>
              <span>{new Date(parent.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    color: '#333',
    marginBottom: '40px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  metric: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '40px',
  },
  pipelineContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px',
    marginTop: '20px',
  },
  pipelineStage: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #ddd',
  },
  stageCount: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '10px',
  },
  table: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    marginTop: '20px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    backgroundColor: '#f0f0f0',
    padding: '15px',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '15px',
    borderBottom: '1px solid #ddd',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
};
