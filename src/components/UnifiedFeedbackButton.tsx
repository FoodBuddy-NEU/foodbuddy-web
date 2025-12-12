'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/ThemeProvider';

interface UnifiedFeedbackButtonProps {
  restaurant: {
    id: string;
    name: string;
  };
}

export default function UnifiedFeedbackButton({ restaurant }: UnifiedFeedbackButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  const [feedbackType, setFeedbackType] = useState<'menu' | 'contact-info'>('menu');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Close modal on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackContent.trim()) {
      setErrorMessage('Please enter feedback content');
      return;
    }

    if (!userEmail.trim()) {
      setErrorMessage('Please enter your email');
      return;
    }

    if (!userName.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          userEmail,
          userName,
          feedbackType,
          feedbackContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitStatus('success');
      setFeedbackContent('');
      setTimeout(() => {
        setSubmitStatus('idle');
        setShowModal(false);
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackContent('');
    setFeedbackType('menu');
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Inline styles to prevent browser color scheme interference
  const getModalStyles = (): React.CSSProperties => ({
    backgroundColor: theme === 'light' ? '#ffffff' : '#1f1f1f',
    color: theme === 'light' ? '#171717' : '#f5f5f5',
    borderColor: theme === 'light' ? '#e5e5e5' : '#404040',
  });

  const getInputStyles = (): React.CSSProperties => ({
    backgroundColor: theme === 'light' ? '#ffffff' : '#2a2a2a',
    color: theme === 'light' ? '#171717' : '#f5f5f5',
    borderColor: theme === 'light' ? '#d1d5db' : '#525252',
  });

  const getLabelStyles = (): React.CSSProperties => ({
    color: theme === 'light' ? '#374151' : '#d1d5db',
  });

  const getRadioLabelStyles = (): React.CSSProperties => ({
    color: theme === 'light' ? '#1f2937' : '#e5e5e5',
  });

  return (
    <>
      {/* Feedback Button - Blue with white text */}
      <button
        onClick={openModal}
        className="feedback-btn rounded-full px-4 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: '#2563eb',
          color: '#ffffff',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
      >
        Feedback
      </button>

      {/* Modal Overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleBackdropClick}
        >
          {/* Modal Content */}
          <div
            ref={modalRef}
            className="feedback-modal w-full max-w-md rounded-xl border-2 p-6 shadow-xl"
            style={getModalStyles()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Send Feedback for {restaurant.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:opacity-70 transition-opacity"
                style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium mb-2" style={getLabelStyles()}>
                  What would you like to report?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer" style={getRadioLabelStyles()}>
                    <input
                      type="radio"
                      value="menu"
                      checked={feedbackType === 'menu'}
                      onChange={(e) => setFeedbackType(e.target.value as 'menu' | 'contact-info')}
                      className="accent-blue-600"
                    />
                    Menu Issue
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" style={getRadioLabelStyles()}>
                    <input
                      type="radio"
                      value="contact-info"
                      checked={feedbackType === 'contact-info'}
                      onChange={(e) => setFeedbackType(e.target.value as 'menu' | 'contact-info')}
                      className="accent-blue-600"
                    />
                    Contact Info Issue
                  </label>
                </div>
              </div>

              {/* User Name */}
              <div>
                <label htmlFor="feedback-userName" className="block text-sm font-medium mb-2" style={getLabelStyles()}>
                  Your Name
                </label>
                <input
                  id="feedback-userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="feedback-input w-full px-4 py-2 rounded-lg border"
                  style={getInputStyles()}
                />
              </div>

              {/* User Email */}
              <div>
                <label htmlFor="feedback-userEmail" className="block text-sm font-medium mb-2" style={getLabelStyles()}>
                  Your Email
                </label>
                <input
                  id="feedback-userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="feedback-input w-full px-4 py-2 rounded-lg border"
                  style={getInputStyles()}
                />
              </div>

              {/* Feedback Content */}
              <div>
                <label htmlFor="feedback-content" className="block text-sm font-medium mb-2" style={getLabelStyles()}>
                  Feedback Details
                </label>
                <textarea
                  id="feedback-content"
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder={`Describe the issue with ${feedbackType === 'menu' ? 'the menu' : 'contact information'}...`}
                  className="feedback-input w-full px-4 py-2 rounded-lg border min-h-[100px] resize-none"
                  style={getInputStyles()}
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div 
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: theme === 'light' ? '#fef2f2' : '#450a0a',
                    color: theme === 'light' ? '#dc2626' : '#fca5a5',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Success Message */}
              {submitStatus === 'success' && (
                <div 
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: theme === 'light' ? '#f0fdf4' : '#052e16',
                    color: theme === 'light' ? '#16a34a' : '#86efac',
                  }}
                >
                  ✓ Thank you! Your feedback has been submitted.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
