'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { getUserProfile } from '@/lib/userProfile';
import UsernameModal from '@/components/UsernameModal';

interface UsernameCheckerProps {
  children: React.ReactNode;
}

export default function UsernameChecker({ children }: UsernameCheckerProps) {
  const { user, loading: authLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not logged in, no need to check username
      setCheckingProfile(false);
      setShowModal(false);
      return;
    }

    // Check if user has a username set
    const checkUsername = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        
        // If no profile or no username, show modal
        if (!profile || !profile.username || profile.username.trim() === '') {
          setShowModal(true);
        } else {
          setShowModal(false);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        // On error, assume username needs to be set for safety
        setShowModal(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkUsername();
  }, [user, authLoading]);

  const handleUsernameComplete = () => {
    setShowModal(false);
  };

  // Show loading while checking auth or profile
  if (authLoading || (user && checkingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showModal && user && (
        <UsernameModal
          userId={user.uid}
          onComplete={handleUsernameComplete}
        />
      )}
    </>
  );
}
