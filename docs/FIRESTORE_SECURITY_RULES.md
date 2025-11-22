# Firestore Security Rules Configuration

## Problem
Getting "Missing or insufficient permissions" error when accessing user profiles.

## Solution
You need to configure Firestore security rules in your Firebase Console.

## Steps to Fix

### 1. Go to Firebase Console
1. Visit https://console.firebase.google.com
2. Select your project: `foodbuddy-neu`
3. Go to **Firestore Database** in the left menu
4. Click on the **Rules** tab

### 2. Update Security Rules

Replace the existing rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles - users can read and write their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookmarks - users can read and write their own bookmarks
    match /bookmarks/{userId}/restaurants/{restaurantId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Group chats - authenticated users can read and write
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
    
    // Feedback - authenticated users can create feedback
    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
    }
    
    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Publish the Rules
1. Click **Publish** button in the Firebase Console
2. Wait for the rules to be deployed (usually takes a few seconds)

### 4. Test the Application
1. Refresh your browser at http://localhost:3000
2. Try signing up or logging in
3. Navigate to the Profile page
4. You should now be able to save your profile

## Explanation of Rules

### User Profiles (`/users/{userId}`)
- Users can only access their own profile
- `request.auth.uid == userId` ensures the authenticated user ID matches the document ID

### Bookmarks
- Users can only read/write their own bookmarks
- Organized under `/bookmarks/{userId}/restaurants/{restaurantId}`

### Group Chats
- All authenticated users can read and write messages
- Allows collaboration in group chats

### Feedback
- Authenticated users can create feedback
- All authenticated users can read feedback

## Testing Security Rules

After updating, test by:
1. Sign up with a new account
2. Try to access `/profile` page
3. Try to save profile preferences
4. Check browser console for any errors

## Development vs Production

### Development (more permissive)
If you want to test quickly during development, you can use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning**: This allows any authenticated user to access all documents. Use only for development!

### Production (recommended)
Use the detailed rules provided above for production to ensure proper data security.

## Common Issues

### Issue: "Missing or insufficient permissions"
**Solution**: Make sure you're logged in and the security rules are published.

### Issue: "Permission denied" even after login
**Solution**: Check that `request.auth.uid` matches the `userId` in the document path.

### Issue: Rules not taking effect
**Solution**: Wait a few seconds after publishing, then hard refresh your browser (Ctrl+Shift+R).

## Firestore Rules Simulator

You can test your rules in Firebase Console:
1. Go to **Firestore Database** > **Rules**
2. Click **Rules Playground** button
3. Simulate read/write operations
4. Verify rules work as expected
