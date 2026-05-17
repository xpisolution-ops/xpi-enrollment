import { useState, useEffect } from 'react';
import axios from 'axios';

export default function StaffDesk() {
  const [phone, setPhone] = useState('');
  const [families, setFamilies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFamilies(null);

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/search?phone=${phone}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFamilies(response.data);
    } catch (err) {
      setError('Error searching families');
    } finally {
      setLoading(false);
    }
  };

  const handleStageUpdate = async (inquiryId, newStage) => {
    setUpdating(inquiryId);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/update-stage`,
        { inquiry_id: inquiryId, new_stage: newStage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh search
      handleSearch({ preventDefault: () => {} });
    } catch (err) {
      setError('Error updating stage');
    } finally {
      setUpdating(null);
    }
  };

  const stageOptions = [
    'inquiry_submitted',
    'tour_scheduled',
    'application_started',
    'documents_needed',
    'payment_needed',
    'enrolled',
    'follow_up_needed',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Staff Enrollment Desk</h1>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="tel"
            placeholder="Enter parent phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div style={styles.error}>{error}</div>}

        {families && (
          <div>
            {families.parents.length === 0 ? (
              <p style={styles.noResults}>No families found</p>
            ) : (
              <div style={styles.resultsContainer}>
                {families.parents.map((parent) => (
                  <div key={parent.id} style={styles.familyCard}>
                    <h3>{parent.full_name}</h3>
                    <p><strong>Phone:</strong> {parent.phone}</p>
                    <p><strong>Email:</strong> {parent.email}</p>

                    {families.children.length > 0 && (
                      <div style={styles.section}>
                        <h4>Children:</h4>
                        {families.children.map((child) => (
                          <p key={child.id}>- {child.full_name}, Age: {child.age}</p>
                        ))}
                      </div>
                    )}

                    {families.inquiries.length > 0 && (
                      <div style={styles.section}>
                        <h4>Enrollment Status:</h4>
                        {families.inquiries.map((inquiry) => (
                          <div key={inquiry.id} style={styles.inquiryCard}>
                            <p><strong>Current Stage:</strong> {inquiry.enrollment_stage}</p>
                            <p><strong>Program:</strong> {inquiry.program_interest}</p>

                            <div style={styles.stageButtons}>
                              {stageOptions.map((stage) => (
                                <button
                                  key={stage}
                                  onClick={() => handleStageUpdate(inquiry.id, stage)}
                                  disabled={updating === inquiry.id}
                                  style={{
                                    ...styles.stageButton,
                                    backgroundColor:
                                      inquiry.enrollment_stage === stage
                                        ? '#007bff'
                                        : '#6c757d',
                                  }}
                                >
                                  {stage.replace(/_/g, ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    color: '#333',
    marginBottom: '30px',
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  familyCard: {
    border: '1px solid #ddd',
    padding: '20px',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
  },
  section: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '4px',
  },
  inquiryCard: {
    padding: '15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginTop: '10px',
  },
  stageButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '10px',
  },
  stageButton: {
    padding: '8px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
  },
};
