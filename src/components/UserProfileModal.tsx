'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getUserProfile } from '@/lib/userProfile';
import { useTheme } from '@/lib/ThemeProvider';
import type { UserProfile } from '@/types/userProfile';

// Convert Cloudinary HEIC URLs to JPG format for browser compatibility
function convertCloudinaryUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.toLowerCase().endsWith('.heic')) {
    return url.replace(/\.heic$/i, '.jpg');
  }
  if (url.includes('/upload/') && !url.includes('f_auto')) {
    return url.replace('/upload/', '/upload/f_auto/');
  }
  return url;
}

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    setImgError(false);
    (async () => {
      try {
        const p = await getUserProfile(userId);
        setProfile(p);
      } catch (e) {
        console.error('Failed to load profile:', e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const avatarUrl = profile?.avatarUrl ? convertCloudinaryUrl(profile.avatarUrl) : null;

  // Scoped CSS that cannot be overridden by browser dark mode
  const scopedStyles = `
    .upm-backdrop {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 9999 !important;
      background-color: rgba(0, 0, 0, ${isDark ? '0.7' : '0.5'}) !important;
    }
    .upm-modal {
      background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
      color: ${isDark ? '#f3f4f6' : '#171717'} !important;
      border-radius: 0.5rem !important;
      padding: 1.5rem !important;
      max-width: 28rem !important;
      width: calc(100% - 2rem) !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
    }
    .upm-header {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-bottom: 1rem !important;
    }
    .upm-title {
      font-size: 1.25rem !important;
      font-weight: bold !important;
      color: ${isDark ? '#f3f4f6' : '#171717'} !important;
    }
    .upm-close {
      font-size: 1.5rem !important;
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      color: ${isDark ? '#9ca3af' : '#6b7280'} !important;
      cursor: pointer !important;
      padding: 0.25rem !important;
    }
    .upm-close:hover {
      opacity: 0.7 !important;
    }
    .upm-content {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }
    .upm-avatar-row {
      display: flex !important;
      align-items: center !important;
      gap: 1rem !important;
    }
    .upm-avatar-placeholder {
      width: 5rem !important;
      height: 5rem !important;
      border-radius: 50% !important;
      background-color: ${isDark ? '#4b5563' : '#d1d5db'} !important;
      color: ${isDark ? '#d1d5db' : '#4b5563'} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 1.5rem !important;
    }
    .upm-username {
      font-size: 1.125rem !important;
      font-weight: 600 !important;
      color: ${isDark ? '#f3f4f6' : '#171717'} !important;
    }
    .upm-section-title {
      font-weight: 500 !important;
      font-size: 0.875rem !important;
      margin-bottom: 0.5rem !important;
      color: ${isDark ? '#9ca3af' : '#6b7280'} !important;
    }
    .upm-tags {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.5rem !important;
    }
    .upm-tag-blue {
      padding: 0.25rem 0.5rem !important;
      border-radius: 9999px !important;
      font-size: 0.875rem !important;
      background-color: ${isDark ? '#1e3a5f' : '#dbeafe'} !important;
      color: ${isDark ? '#93c5fd' : '#1e40af'} !important;
    }
    .upm-tag-green {
      padding: 0.25rem 0.5rem !important;
      border-radius: 9999px !important;
      font-size: 0.875rem !important;
      background-color: ${isDark ? '#14532d' : '#dcfce7'} !important;
      color: ${isDark ? '#86efac' : '#166534'} !important;
    }
    .upm-tag-orange {
      padding: 0.25rem 0.5rem !important;
      border-radius: 9999px !important;
      font-size: 0.875rem !important;
      background-color: ${isDark ? '#7c2d12' : '#ffedd5'} !important;
      color: ${isDark ? '#fdba74' : '#9a3412'} !important;
    }
    .upm-tag-red {
      padding: 0.25rem 0.5rem !important;
      border-radius: 9999px !important;
      font-size: 0.875rem !important;
      background-color: ${isDark ? '#7f1d1d' : '#fee2e2'} !important;
      color: ${isDark ? '#fca5a5' : '#991b1b'} !important;
    }
    .upm-none {
      font-size: 0.875rem !important;
      color: ${isDark ? '#9ca3af' : '#9ca3af'} !important;
    }
    .upm-loading {
      text-align: center !important;
      padding: 2rem 0 !important;
      color: ${isDark ? '#f3f4f6' : '#171717'} !important;
    }
  `;

  return (
    <>
      <style>{scopedStyles}</style>
      <div className="upm-backdrop" onClick={onClose}>
        <div className="upm-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="upm-header">
            <h2 className="upm-title">User Profile</h2>
            <button 
              onClick={onClose} 
              className="upm-close"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="upm-loading">Loading...</div>
          ) : !profile ? (
            <div className="upm-loading">User not found</div>
          ) : (
            <div className="upm-content">
              {/* Avatar and Username */}
              <div className="upm-avatar-row">
                {avatarUrl && !imgError ? (
                  <Image
                    src={avatarUrl}
                    alt={profile.username || 'User'}
                    width={80}
                    height={80}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="upm-avatar-placeholder">
                    {profile.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h3 className="upm-username">{profile.username || 'Unknown'}</h3>
                </div>
              </div>

              {/* Cravings */}
              <div>
                <h4 className="upm-section-title">What I&apos;m Craving</h4>
                {profile.cravings && profile.cravings.length > 0 ? (
                  <div className="upm-tags">
                    {profile.cravings.map((item) => (
                      <span key={item} className="upm-tag-blue">{item}</span>
                    ))}
                  </div>
                ) : (
                  <span className="upm-none">None</span>
                )}
              </div>

              {/* Favorite Cuisines */}
              <div>
                <h4 className="upm-section-title">Favorite Cuisines</h4>
                {profile.favoriteCuisines && profile.favoriteCuisines.length > 0 ? (
                  <div className="upm-tags">
                    {profile.favoriteCuisines.map((item) => (
                      <span key={item} className="upm-tag-green">{item}</span>
                    ))}
                  </div>
                ) : (
                  <span className="upm-none">None</span>
                )}
              </div>

              {/* Dietary Restrictions */}
              <div>
                <h4 className="upm-section-title">Dietary Restrictions</h4>
                {profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0 ? (
                  <div className="upm-tags">
                    {profile.dietaryRestrictions.map((item) => (
                      <span key={item} className="upm-tag-orange">{item}</span>
                    ))}
                  </div>
                ) : (
                  <span className="upm-none">None</span>
                )}
              </div>

              {/* Allergies */}
              <div>
                <h4 className="upm-section-title">Allergies</h4>
                {profile.allergies && profile.allergies.length > 0 ? (
                  <div className="upm-tags">
                    {profile.allergies.map((item) => (
                      <span key={item} className="upm-tag-red">{item}</span>
                    ))}
                  </div>
                ) : (
                  <span className="upm-none">None</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
