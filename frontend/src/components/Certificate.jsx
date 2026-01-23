import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/storage';
import './Certificate.css';

const Certificate = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificate();
  }, []);

  const loadCertificate = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8000/api/certificates/${certificateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCertificate(data);
    } catch (error) {
      console.error('Error loading certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading">Loading certificate...</div>;
  }

  if (!certificate) {
    return <div className="error">Certificate not found</div>;
  }

  return (
    <div className="certificate-page">
      <div className="certificate-actions no-print">
        <button onClick={() => navigate('/student/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <button onClick={handlePrint} className="print-btn">
          🖨️ Print Certificate
        </button>
      </div>

      <div className="certificate-container">
        <div className="certificate-border">
          <div className="certificate-content">
            <div className="certificate-header">
              <h1>Certificate of Completion</h1>
              <div className="certificate-logo">🎓</div>
            </div>

            <div className="certificate-body">
              <p className="certificate-text">This is to certify that</p>
              <h2 className="certificate-name">{certificate.user.name}</h2>
              <p className="certificate-text">has successfully completed</p>
              <h3 className="certificate-course">{certificate.course.title}</h3>
              
              <div className="certificate-details">
                <p>Date of Completion: {new Date(certificate.issued_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p>Certificate Number: {certificate.certificate_number}</p>
              </div>
            </div>

            <div className="certificate-footer">
              <div className="signature-section">
                <div className="signature-line"></div>
                <p>LearnQuest Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
