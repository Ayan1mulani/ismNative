import { createContext, useContext, useState } from 'react';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {

  const [nightMode, setNightMode] = useState(false);

  // ✅ add flatNo state
  const [flatNo, setFlatNo] = useState(null);

  return (
    <PermissionsContext.Provider
      value={{
        nightMode,
        setNightMode,

        // ✅ expose flatNo
        flatNo,
        setFlatNo
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};