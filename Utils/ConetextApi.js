import { createContext, useContext, useState, useEffect } from 'react';
import { ismServices } from '../services/ismServices'; // adjust path if needed

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [nightMode, setNightMode] = useState(false);
  const [flatNo, setFlatNo] = useState(null);
  const [permissions, setPermissions] = useState(null); // null = still loading

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await ismServices.getUserProfileData();


        // ✅ permissions live at response.data.permissions
        const perms = response?.data?.permissions ?? [];

        setPermissions(perms);

        console.log('Permissions loaded:', perms.length, 'entries');
      } catch (error) {
        console.error('Failed to load permissions:', error);
        setPermissions([]); // empty = loaded but no access
      }
    };

    loadPermissions();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        nightMode,
        setNightMode,
        flatNo,
        setFlatNo,
        permissions,
        setPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};