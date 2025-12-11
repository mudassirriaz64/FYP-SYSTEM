import { Navigate } from 'react-router-dom';

// Helper to decode JWT and check expiration
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload (base64)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration claim
    if (!payload.exp) return false;
    
    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    // Token is valid if current time is before expiration
    // Add a small buffer (30 seconds) to account for clock drift
    return currentTime < (expirationTime - 30000);
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Get token and user from localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // If no token, redirect to login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // Check if token is valid and not expired
  if (!isTokenValid(token)) {
    // Token is expired or invalid, clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const userRoleLower = userRoles.map(r => r.toLowerCase());

    // If specific roles are required, check if user has one of them
    if (allowedRoles.length > 0) {
      const hasAllowedRole = allowedRoles.some(role => 
        userRoleLower.includes(role.toLowerCase())
      );
      
      if (!hasAllowedRole) {
        // User doesn't have required role, redirect to their first available dashboard
        if (userRoleLower.includes('admin') || userRoleLower.includes('superadmin')) {
          return <Navigate to="/admin/dashboard" replace />;
        } else if (userRoleLower.includes('hod')) {
          return <Navigate to="/hod/dashboard" replace />;
        } else if (userRoleLower.includes('coordinator') || userRoleLower.includes('fypcoordinator')) {
          return <Navigate to="/coordinator/dashboard" replace />;
        } else if (userRoleLower.includes('supervisor') || userRoleLower.includes('teacher')) {
          return <Navigate to="/supervisor/dashboard" replace />;
        } else if (
          userRoleLower.includes('proposalcommittee') ||
          userRoleLower.includes('proposal committee') ||
          userRoleLower.includes('proposalcommitteemember') ||
          userRoleLower.includes('proposal committee member')
        ) {
          return <Navigate to="/committee/dashboard" replace />;
        } else if (userRoleLower.includes('evaluator')) {
          return <Navigate to="/evaluator/dashboard" replace />;
        } else if (userRoleLower.includes('committee') || userRoleLower.includes('committeemember')) {
          // Internal committee members default to evaluator dashboard (per earlier requirement)
          return <Navigate to="/evaluator/dashboard" replace />;
        } else if (userRoleLower.includes('finance')) {
          return <Navigate to="/finance/dashboard" replace />;
        } else if (userRoleLower.includes('student')) {
          return <Navigate to="/student/dashboard" replace />;
        } else {
          return <Navigate to="/login" replace />;
        }
      }
    }

    // User is authenticated and has required role, render the protected component
    return children;
  } catch (error) {
    // Invalid user data, clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
