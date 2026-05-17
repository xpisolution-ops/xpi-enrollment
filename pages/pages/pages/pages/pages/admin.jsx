import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPanel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClients(response.data.clients);
    } catch (err) {
      setError('Error loading clients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;
  if (error) return <div style={styles.container}><p style={styles.error}>{error}</p></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>XPI Command Center™</h1>
      <p style={styles.subtitle}>Manage all client workspaces and enrollment data</p>

      <div style={styles.clientsGrid}>
        {clients.map((client) => (
          <div key={client.id} style={styles.clientCard}>
            <h3>{client.name}</h3>
            <p><strong>Location:</strong> {client.location}</p>
            <div style={styles.stats}>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{client.parent_count}</div>
                <div style={styles.statLabel}>Families</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{client.is_active ? '✓' : '✗'}</div>
                <div style={styles.statLabel}>Status</div>
              </div>
            </div>
            <button style={styles.button}>View Workspace</button>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div style={styles.emptyState}>
          <p>No clients created yet</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  title: {
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#666',
    marginBottom: '40px',
  },
  clientsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  clientCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  stats: {
    display: 'flex',
    gap: '15px',
    margin: '20px 0',
  },
  statBox: {
    flex: 1,
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  error: {
    color: 'red',
  },
};
