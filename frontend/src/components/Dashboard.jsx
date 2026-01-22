function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Welcome to Dashboard</h1>
      <p>Hello, {user.name}!</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button 
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '12px 32px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff',
          backgroundColor: '#000000',
          border: '2px solid #000000',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
