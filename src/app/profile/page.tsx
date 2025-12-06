'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { getUserProfile } from '@/lib/userProfile';
import { UserProfile } from '@/types/userProfile';
import UserProfileForm from '@/components/UserProfileForm';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // WHY: Fetch user profile data when component mounts
    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          // Ensure email is set from Firebase Auth if not in Firestore
          setProfile({
            ...userProfile,
            email: userProfile.email || user.email || '',
          });
        } else {
          // Profile doesn't exist yet, create a default one
          const defaultProfile: UserProfile = {
            userId: user.uid,
            username: user.email?.split('@')[0] || 'User',
            email: user.email || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            cravings: [],
            favoriteCuisines: [],
            favoriteRestaurants: [],
            dietaryRestrictions: [],
            allergies: [],
          };
          setProfile(defaultProfile);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <UserProfileForm profile={profile} onUpdate={setProfile} />
    </div>
  );
}
