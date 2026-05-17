import { useState } from 'react';
import axios from 'axios';

export default function ParentPortal() {
  const [formData, setFormData] = useState({
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    child_name: '',
    child_age: '',
    program_interest: '',
    client_id: 1, // Default - would be dynamic in production
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/parent/inquiry`,
        formData
      );
      setMessage('Thank you! Your information has been submitted. We will contact you soon.');
      setFormData({
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        child_name: '',
        child_age: '',
        program_interest: '',
        client_id: 1,
      });
    } catch (err) {
      setMessage('Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Enrollment Inquiry</h1>
        <p style={styles.subtitle}>Tell us about your child and family</p>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h3>Parent Information</h3>
            <input
              type="text"
              name="parent_name"
              placeholder="Parent Name"
              value={formData.parent_name}
              onChange={handleChange}
              required
              style={styles.input}
            />
            <input
              type="tel"
              name="parent_phone"
              placeholder="Phone Number"
              value={formData.parent_phone}
              onChange={handleChange}
              required
              style={styles.input}
            />
            <input
              type="email"
              name="parent_email"
              placeholder="Email Address"
              value={formData.parent_email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.section}>
            <h3>Child Information</h3>
            <input
              type="text"
              name="child_name"
              placeholder="Child's Name"
              value={formData.child_name}
              onChange={handleChange}
              required
              style={styles.input}
            />
            <select
              name="child_age"
              value={formData.child_age}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select Age</option>
              <option value="Infant (0-12 months)">Infant (0-12 months)</option>
              <option value="Toddler (1-2 years)">Toddler (1-2 years)</option>
              <option value="Preschool (3-4 years)">Preschool (3-4 years)</option>
              <option value="Pre-K (4-5 years)">Pre-K (4-5 years)</option>
            </select>
          </div>

          <div style={styles.section}>
            <h3>Program Interest</h3>
            <select
              name="program_interest"
              value={formData.program_interest}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select Program</option>
              <option value="Full-Time Care">Full-Time Care</option>
              <option value="Part-Time Care">Part-Time Care</option>
              <option value="Before/After School">Before/After School</option>
              <option value="Summer Program">Summer Program</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  message: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center',
  },
};
