'use client';

import { useState } from 'react';
import { UserProfile, COMMON_CRAVINGS, COMMON_CUISINES, COMMON_DIETARY_RESTRICTIONS, COMMON_ALLERGIES } from '@/types/userProfile';
import { updateUserProfile } from '@/lib/userProfile';
import { getAuth } from 'firebase/auth';
import Image from 'next/image';

interface UserProfileFormProps {
  profile: UserProfile;
  onUpdate?: (updatedProfile: UserProfile) => void;
}

export default function UserProfileForm({ profile, onUpdate }: UserProfileFormProps) {
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [selectedCravings, setSelectedCravings] = useState<string[]>(profile.cravings);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(profile.favoriteCuisines);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(profile.dietaryRestrictions);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(profile.allergies);
  
  const [customCraving, setCustomCraving] = useState('');
  const [customCuisine, setCustomCuisine] = useState('');
  const [customRestriction, setCustomRestriction] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Email change states
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailStep, setEmailStep] = useState<'verify-current' | 'enter-new' | 'verify-new'>('verify-current');
  const [sendingCode, setSendingCode] = useState(false);

  // WHY: Mask email for privacy (show first 3 chars + ***@domain)
  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.slice(0, 3)}***@${domain}`;
  };

  // WHY: Send verification code to email
  const sendVerificationCode = async (email: string) => {
    setSendingCode(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      const data = await response.json();
      
      // Show code in development mode
      if (data.code) {
        setMessage(`✅ Code sent! [DEV MODE: ${data.code}]`);
      } else {
        setMessage(`Verification code sent to ${email}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      setMessage('Failed to send verification code. Please try again.');
      return false;
    } finally {
      setSendingCode(false);
    }
  };

  // WHY: Verify current email before allowing change (no code sent, just validation)
  const handleVerifyCurrentEmail = () => {
    if (currentEmailInput !== profile.email) {
      setMessage('Current email does not match. Please try again.');
      return;
    }

    // Email matches, proceed to enter new email
    setMessage('Current email verified. Please enter your new email.');
    setEmailStep('enter-new');
  };

  // WHY: Send verification code to new email
  const handleSendNewEmailCode = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    const sent = await sendVerificationCode(newEmail);
    if (sent) {
      setEmailStep('verify-new');
    }
  };

  // WHY: Verify code and update email
  const handleVerifyAndUpdateEmail = async () => {
    if (!verificationCode) {
      setMessage('Please enter the verification code.');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-and-update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.userId,
          newEmail,
          verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      // WHY: Reload Firebase Auth user to get updated email
      const auth = getAuth();
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }

      setMessage('Email updated successfully!');
      setShowEmailChange(false);
      setCurrentEmailInput('');
      setNewEmail('');
      setVerificationCode('');
      setEmailStep('verify-current');

      if (onUpdate) {
        onUpdate({
          ...profile,
          email: newEmail,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setMessage('Invalid verification code. Please try again.');
    }
  };

  // WHY: Cancel email change process
  const handleCancelEmailChange = () => {
    setShowEmailChange(false);
    setCurrentEmailInput('');
    setNewEmail('');
    setVerificationCode('');
    setEmailStep('verify-current');
    setMessage('');
  };

  // WHY: Toggle selection for multi-select fields
  const toggleSelection = (item: string, currentList: string[], setList: (list: string[]) => void) => {
    if (currentList.includes(item)) {
      setList(currentList.filter((i) => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };

  // WHY: Add custom item to list
  const addCustomItem = (customValue: string, setCustom: (val: string) => void, currentList: string[], setList: (list: string[]) => void) => {
    const trimmed = customValue.trim();
    if (trimmed && !currentList.includes(trimmed)) {
      setList([...currentList, trimmed]);
      setCustom('');
    }
  };

  // WHY: Upload avatar image to Cloudinary
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'user_avatars');
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Cloudinary not configured');
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      
      // Build optimized URL with transformations
      const baseUrl = data.secure_url;
      const urlParts = baseUrl.split('/upload/');
      const optimizedUrl = `${urlParts[0]}/upload/c_fill,g_face,h_400,w_400,q_auto:good/${urlParts[1]}`;
      
      setAvatarUrl(optimizedUrl);
      setMessage('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // WHY: Save all profile changes to Firestore
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await updateUserProfile(profile.userId, {
        username,
        avatarUrl: avatarUrl || undefined,
        cravings: selectedCravings,
        favoriteCuisines: selectedCuisines,
        dietaryRestrictions: selectedRestrictions,
        allergies: selectedAllergies,
      });
      
      setMessage('Profile updated successfully!');
      if (onUpdate) {
        onUpdate({
          ...profile,
          username,
          avatarUrl,
          cravings: selectedCravings,
          favoriteCuisines: selectedCuisines,
          dietaryRestrictions: selectedRestrictions,
          allergies: selectedAllergies,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">User Profile</h2>

      {/* Basic Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Basic Information</h3>
        
        {/* Avatar Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Profile Picture</label>
          <div className="flex items-center gap-4">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt="Avatar preview"
                width={80}
                height={80}
                unoptimized
                className="rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
              />
            )}
            <div className="flex-1">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploading ? 'Uploading...' : 'Choose Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                JPG, PNG, or GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
          {!showEmailChange ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={maskEmail(profile.email)}
                disabled
                className="flex-1 px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
              />
              <button
                onClick={() => setShowEmailChange(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Change Email
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-4 border rounded-md dark:border-gray-600">
              {emailStep === 'verify-current' && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    To change your email, first verify your current email address.
                  </p>
                  <input
                    type="email"
                    value={currentEmailInput}
                    onChange={(e) => setCurrentEmailInput(e.target.value)}
                    placeholder="Enter current email"
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyCurrentEmail}
                      disabled={sendingCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {sendingCode ? 'Sending...' : 'Verify Current Email'}
                    </button>
                    <button
                      onClick={handleCancelEmailChange}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {emailStep === 'enter-new' && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter your new email address. We&apos;ll send a verification code.
                  </p>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSendNewEmailCode}
                      disabled={sendingCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {sendingCode ? 'Sending...' : 'Send Verification Code'}
                    </button>
                    <button
                      onClick={handleCancelEmailChange}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {emailStep === 'verify-new' && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    A verification code has been sent to <strong>{newEmail}</strong>
                  </p>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyAndUpdateEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Verify & Update
                    </button>
                    <button
                      onClick={handleSendNewEmailCode}
                      disabled={sendingCode}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400"
                    >
                      {sendingCode ? 'Sending...' : 'Resend Code'}
                    </button>
                    <button
                      onClick={handleCancelEmailChange}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cravings */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">What I&apos;m Craving</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_CRAVINGS.map((craving) => (
            <button
              key={craving}
              onClick={() => toggleSelection(craving, selectedCravings, setSelectedCravings)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCravings.includes(craving)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {craving}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCraving}
            onChange={(e) => setCustomCraving(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem(customCraving, setCustomCraving, selectedCravings, setSelectedCravings)}
            placeholder="Add custom craving..."
            className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => addCustomItem(customCraving, setCustomCraving, selectedCravings, setSelectedCravings)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        {selectedCravings.filter(c => !COMMON_CRAVINGS.includes(c as typeof COMMON_CRAVINGS[number])).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCravings.filter(c => !COMMON_CRAVINGS.includes(c as typeof COMMON_CRAVINGS[number])).map((craving) => (
              <span
                key={craving}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                {craving}
                <button
                  onClick={() => setSelectedCravings(selectedCravings.filter(c => c !== craving))}
                  className="ml-1 text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Cuisines */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Favorite Cuisines</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => toggleSelection(cuisine, selectedCuisines, setSelectedCuisines)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCuisines.includes(cuisine)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCuisine}
            onChange={(e) => setCustomCuisine(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem(customCuisine, setCustomCuisine, selectedCuisines, setSelectedCuisines)}
            placeholder="Add custom cuisine..."
            className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => addCustomItem(customCuisine, setCustomCuisine, selectedCuisines, setSelectedCuisines)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Add
          </button>
        </div>
        {selectedCuisines.filter(c => !COMMON_CUISINES.includes(c as typeof COMMON_CUISINES[number])).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCuisines.filter(c => !COMMON_CUISINES.includes(c as typeof COMMON_CUISINES[number])).map((cuisine) => (
              <span
                key={cuisine}
                className="px-3 py-1 bg-green-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                {cuisine}
                <button
                  onClick={() => setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine))}
                  className="ml-1 text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dietary Restrictions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Dietary Restrictions</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_DIETARY_RESTRICTIONS.map((restriction) => (
            <button
              key={restriction}
              onClick={() => toggleSelection(restriction, selectedRestrictions, setSelectedRestrictions)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedRestrictions.includes(restriction)
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {restriction}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customRestriction}
            onChange={(e) => setCustomRestriction(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem(customRestriction, setCustomRestriction, selectedRestrictions, setSelectedRestrictions)}
            placeholder="Add custom restriction..."
            className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => addCustomItem(customRestriction, setCustomRestriction, selectedRestrictions, setSelectedRestrictions)}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Add
          </button>
        </div>
        {selectedRestrictions.filter(r => !COMMON_DIETARY_RESTRICTIONS.includes(r as typeof COMMON_DIETARY_RESTRICTIONS[number])).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedRestrictions.filter(r => !COMMON_DIETARY_RESTRICTIONS.includes(r as typeof COMMON_DIETARY_RESTRICTIONS[number])).map((restriction) => (
              <span
                key={restriction}
                className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                {restriction}
                <button
                  onClick={() => setSelectedRestrictions(selectedRestrictions.filter(r => r !== restriction))}
                  className="ml-1 text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Allergies */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Allergies</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_ALLERGIES.map((allergy) => (
            <button
              key={allergy}
              onClick={() => toggleSelection(allergy, selectedAllergies, setSelectedAllergies)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedAllergies.includes(allergy)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem(customAllergy, setCustomAllergy, selectedAllergies, setSelectedAllergies)}
            placeholder="Add custom allergy..."
            className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => addCustomItem(customAllergy, setCustomAllergy, selectedAllergies, setSelectedAllergies)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Add
          </button>
        </div>
        {selectedAllergies.filter(a => !COMMON_ALLERGIES.includes(a as typeof COMMON_ALLERGIES[number])).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedAllergies.filter(a => !COMMON_ALLERGIES.includes(a as typeof COMMON_ALLERGIES[number])).map((allergy) => (
              <span
                key={allergy}
                className="px-3 py-1 bg-red-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                {allergy}
                <button
                  onClick={() => setSelectedAllergies(selectedAllergies.filter(a => a !== allergy))}
                  className="ml-1 text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {message && (
          <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
