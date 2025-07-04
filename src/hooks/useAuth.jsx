import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthProvider: Starting auth initialization...');
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔐 AuthProvider: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 AuthProvider: Error getting session:', error);
        } else {
          console.log('🔐 AuthProvider: Session result:', { session: !!session, user: session?.user?.email });
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('🔐 AuthProvider: Exception getting session:', error);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthProvider: Auth state change:', { event, user: session?.user?.email });
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    console.log('🔐 AuthProvider: Signing out...');
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };

  console.log('🔐 AuthProvider: Current state:', { user: !!user, loading, isAuthenticated: !!user });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 