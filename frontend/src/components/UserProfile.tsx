import { useAuthStore } from '../store/authStore';

const UserProfile: React.FC = () => {
  const { userData } = useAuthStore();
  
  // Calculate success rate
  const getSuccessRate = (): string => {
    if (!userData) return '0%';
    
    if (userData.totalSearched === 0) return '0%';
    
    const rate = (userData.totalFound / userData.totalSearched) * 100;
    return `${Math.round(rate)}%`;
  };
  
  if (!userData) return null;
  
  return (
    <div className="text-primary-text">
      <h2 className="text-2xl font-semibold mb-4">User Profile</h2>
      <div className="space-y-4">
        <div>
          <p className="text-secondary-text">Name</p>
          <p>{userData.name}</p>
        </div>
        <div>
          <p className="text-secondary-text">Email</p>
          <p>{userData.email}</p>
        </div>
        <div>
          <p className="text-secondary-text">Credits</p>
          <p>{userData.linkCredits}</p>
        </div>
        <div>
          <p className="text-secondary-text">Success Rate</p>
          <p>{getSuccessRate()} ({userData.totalFound} of {userData.totalSearched})</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
