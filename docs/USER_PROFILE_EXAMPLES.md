# User Profile Feature - Usage Examples

## Example 1: New User Signup Flow

```typescript
// User signs up at /signup
{
  username: "johndoe",
  email: "john@example.com",
  password: "securepass123"
}

// Auto-created profile in Firestore:
{
  userId: "abc123xyz",
  username: "johndoe",
  email: "john@example.com",
  avatarUrl: null,
  createdAt: 2024-01-15T10:30:00Z,
  updatedAt: 2024-01-15T10:30:00Z,
  cravings: [],
  favoriteCuisines: [],
  favoriteRestaurants: [],
  dietaryRestrictions: [],
  allergies: []
}

// User is redirected to /profile to set preferences
```

## Example 2: Setting Preferences

```typescript
// User selects from common options
Cravings: ["Ramen", "Pizza", "Sushi"]
Cuisines: ["Japanese", "Italian", "Chinese"]
Dietary: ["Vegetarian"]
Allergies: ["Peanuts", "Shellfish"]

// User adds custom entries
Cravings: [..., "Pho", "Korean BBQ"]
Cuisines: [..., "Vietnamese", "Korean"]

// Final profile after save:
{
  userId: "abc123xyz",
  username: "johndoe",
  email: "john@example.com",
  avatarUrl: null,
  createdAt: 2024-01-15T10:30:00Z,
  updatedAt: 2024-01-15T10:35:00Z,
  cravings: ["Ramen", "Pizza", "Sushi", "Pho", "Korean BBQ"],
  favoriteCuisines: ["Japanese", "Italian", "Chinese", "Vietnamese", "Korean"],
  favoriteRestaurants: [],
  dietaryRestrictions: ["Vegetarian"],
  allergies: ["Peanuts", "Shellfish"]
}
```

## Example 3: API Usage

### Fetching Profile
```typescript
// GET /api/profile?userId=abc123xyz
const response = await fetch('/api/profile?userId=abc123xyz');
const profile = await response.json();

// Response:
{
  userId: "abc123xyz",
  username: "johndoe",
  email: "john@example.com",
  cravings: ["Ramen", "Pizza"],
  // ... other fields
}
```

### Updating Profile
```typescript
// PUT /api/profile
const response = await fetch('/api/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: "abc123xyz",
    username: "John Doe",
    cravings: ["Ramen", "Sushi", "Tacos"]
  })
});

// Response:
{ success: true }
```

## Example 4: Using Profile Library Functions

### Get Profile
```typescript
import { getUserProfile } from '@/lib/userProfile';

const profile = await getUserProfile('abc123xyz');
if (profile) {
  console.log(profile.username); // "johndoe"
  console.log(profile.cravings); // ["Ramen", "Pizza", "Sushi"]
}
```

### Create Profile
```typescript
import { createUserProfile } from '@/lib/userProfile';

await createUserProfile(
  'abc123xyz',
  'john@example.com',
  'johndoe',
  'https://cloudinary.com/avatar.jpg' // optional
);
```

### Update Profile
```typescript
import { updateUserProfile } from '@/lib/userProfile';

await updateUserProfile('abc123xyz', {
  username: 'John Doe',
  cravings: ['Ramen', 'Pizza', 'Tacos'],
  dietaryRestrictions: ['Vegetarian', 'Gluten-Free']
});
```

### Add to Array
```typescript
import { addToUserArray } from '@/lib/userProfile';

// Add a new craving
await addToUserArray('abc123xyz', 'cravings', 'Bubble Tea');

// Won't add duplicates
await addToUserArray('abc123xyz', 'cravings', 'Ramen'); // No-op if already exists
```

### Remove from Array
```typescript
import { removeFromUserArray } from '@/lib/userProfile';

// Remove a craving
await removeFromUserArray('abc123xyz', 'cravings', 'Pizza');
```

## Example 5: Common Options Available

### Cravings (15 options)
```typescript
const options = [
  'Ramen', 'Bubble Tea', 'Pizza', 'Sushi', 'Burgers',
  'Tacos', 'Pasta', 'Fried Chicken', 'BBQ', 'Salad',
  'Sandwich', 'Noodles', 'Curry', 'Dumplings', 'Seafood'
];
```

### Cuisines (15 options)
```typescript
const options = [
  'Chinese', 'Japanese', 'Korean', 'Thai', 'Vietnamese',
  'Italian', 'Mexican', 'American', 'French', 'Indian',
  'Mediterranean', 'Middle Eastern', 'Spanish', 'Greek', 'Brazilian'
];
```

### Dietary Restrictions (11 options)
```typescript
const options = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free',
  'Dairy-Free', 'Nut-Free', 'Low-Carb', 'Keto', 'Paleo',
  'Pescatarian'
];
```

### Allergies (10 options)
```typescript
const options = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs',
  'Milk', 'Soy', 'Wheat', 'Sesame', 'Gluten'
];
```

## Example 6: React Component Usage

```tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { getUserProfile } from '@/lib/userProfile';
import UserProfileForm from '@/components/UserProfileForm';

function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile);
    }
  }, [user]);

  if (!profile) return <div>Loading...</div>;

  return (
    <UserProfileForm 
      profile={profile} 
      onUpdate={(updated) => {
        console.log('Profile updated:', updated);
        setProfile(updated);
      }}
    />
  );
}
```

## Example 7: Filtering Restaurants by Profile

```typescript
// Future integration example
import { getUserProfile } from '@/lib/userProfile';

async function getRecommendedRestaurants(userId: string) {
  const profile = await getUserProfile(userId);
  
  if (!profile) return [];

  // Filter by dietary restrictions
  const restaurants = await getRestaurants();
  return restaurants.filter(restaurant => {
    // Check if restaurant matches dietary needs
    if (profile.dietaryRestrictions.includes('Vegetarian')) {
      return restaurant.hasVegetarianOptions;
    }
    
    // Check allergens
    if (profile.allergies.some(a => restaurant.commonAllergens.includes(a))) {
      return false; // Skip restaurants with user's allergens
    }
    
    // Match cuisines
    if (profile.favoriteCuisines.includes(restaurant.cuisine)) {
      return true;
    }
    
    return true;
  });
}
```

## Example 8: Profile Completion Check

```typescript
function getProfileCompleteness(profile: UserProfile): number {
  let completed = 0;
  let total = 6;

  if (profile.username) completed++;
  if (profile.avatarUrl) completed++;
  if (profile.cravings.length > 0) completed++;
  if (profile.favoriteCuisines.length > 0) completed++;
  if (profile.dietaryRestrictions.length > 0) completed++;
  if (profile.allergies.length > 0) completed++;

  return (completed / total) * 100; // Returns percentage
}

// Usage:
const completeness = getProfileCompleteness(profile);
console.log(`Profile ${completeness}% complete`);
```

## Example 9: Form State Management

```tsx
// Internal state in UserProfileForm component
const [selectedCravings, setSelectedCravings] = useState<string[]>(profile.cravings);
const [customCraving, setCustomCraving] = useState('');

// Toggle common option
const toggleSelection = (item: string) => {
  if (selectedCravings.includes(item)) {
    setSelectedCravings(selectedCravings.filter(i => i !== item));
  } else {
    setSelectedCravings([...selectedCravings, item]);
  }
};

// Add custom entry
const addCustomItem = () => {
  const trimmed = customCraving.trim();
  if (trimmed && !selectedCravings.includes(trimmed)) {
    setSelectedCravings([...selectedCravings, trimmed]);
    setCustomCraving('');
  }
};
```

## Example 10: Error Handling

```typescript
// Handling profile fetch errors
try {
  const profile = await getUserProfile(userId);
  if (!profile) {
    console.error('Profile not found');
    // Show error UI or redirect
  }
} catch (error) {
  console.error('Failed to load profile:', error);
  // Show error message to user
}

// Handling profile update errors
try {
  await updateUserProfile(userId, updates);
  setMessage('Profile updated successfully!');
} catch (error) {
  console.error('Failed to update profile:', error);
  setMessage('Failed to update profile. Please try again.');
}
```
