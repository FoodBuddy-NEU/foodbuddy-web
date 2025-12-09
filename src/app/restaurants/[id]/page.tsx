import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import data from '@/data/restaurants.json';
import cloudinary from '@/lib/cloudinary';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButton from '@/components/ShareButton';
import UnifiedFeedbackButton from '@/components/UnifiedFeedbackButton';
import MenuCategorySelector from '@/components/MenuCategorySelector';
import { calculateDistance, DEFAULT_USER_ADDRESS } from '@/lib/distance';
import { formatDistance, getRestaurantSummary, getDealValidString } from '@/lib/restaurantUtils';

// Dark mode: All text should be white

async function fetchCloudinaryResourcesForRestaurant(restaurantId: string) {
  // Search for images in the restaurant's folder matching the allowed public_id patterns
  const folder = `foodbuddy/restaurants/${restaurantId}`;
  const patterns = [
    'tables_',
    'foods_',
    'menu1_',
    'menu2_',
    'menu3_',
    'menu_',
    'food1_',
    'food_',
    'happyhour_',
  ];

  try {
    // 1. Fetch all image resources from the restaurant folder using cloudinary.api.resources_by_asset_folder
    const res = await cloudinary.api.resources_by_asset_folder(folder, {
      resource_type: 'image',
      max_results: 100,
    });
    console.log('Cloudinary API raw response:', res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resources: any[] = res?.resources || [];

    // 2. Filter images by prefix matching using JavaScript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resources = resources.filter((img: any) => {
      if (!img.public_id) return false;
      return patterns.some((prefix) => img.public_id.startsWith(prefix));
    });

    return resources;
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('Cloudinary resources_by_asset_folder error:', {
      restaurantId,
      error,
    });
    return [];
  }
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restaurant = (data as any[]).find((r: any) => r.id === id);
  if (!restaurant) notFound();

  const summary = getRestaurantSummary(restaurant);

  // Calculate distance dynamically based on restaurant address
  const calculatedDistance = await calculateDistance(restaurant.address, DEFAULT_USER_ADDRESS);
  const distance = formatDistance(calculatedDistance ?? undefined);

  // Attempt to fetch Cloudinary images from likely folders. This runs server-side
  // using your CLOUDINARY_URL or CLOUDINARY_API_KEY/SECRET from environment.
  console.log('Fetching images for restaurant:', { id: restaurant.id, name: restaurant.name });
  const images = await fetchCloudinaryResourcesForRestaurant(restaurant.id);
  console.log('Found images:', images);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
          >
            ← Back
          </Link>
          <ShareButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
            <BookmarkButton restaurantId={String(restaurant.id)} />
          </div>
        </div>
        <UnifiedFeedbackButton restaurant={{ id: restaurant.id, name: restaurant.name }} />
      </div>

      <h1 className="text-2xl font-bold">{restaurant.name}</h1>

      {/* Image gallery from Cloudinary */}
      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {images.map((img: any, idx: number) => (
            <div
              key={img.public_id ?? idx}
              className="overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900"
            >
              <Image
                src={img.secure_url ?? img.url}
                alt={img.public_id ?? `${restaurant.name} image ${idx + 1}`}
                width={800}
                height={500}
                loading={idx === 0 ? 'eager' : 'lazy'}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
          ))}
        </div>
      ) : // Fall back to any images declared in the local data.json (if present)
      Array.isArray(restaurant.images) && restaurant.images.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {restaurant.images.map((img: any, idx: number) => {
            const src =
              img.url ??
              (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${img.public_id}`
                : null);
            if (!src) return null;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900"
              >
                <Image
                  src={src}
                  alt={img.alt ?? `${restaurant.name} image ${idx + 1}`}
                  width={800}
                  height={500}
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Address + Phone + Distance */}
      <div className="mt-4 text-sm text-gray-700 dark:text-white space-y-1">
        {distance ? <div>📍 {distance}</div> : null}
        {restaurant.address ? <div>{restaurant.address}</div> : null}
        {restaurant.phone ? <div>☎ {restaurant.phone}</div> : null}
      </div>

      <p className="mt-2 text-sm text-gray-700 dark:text-white">{summary}</p>

      {/* Deals */}
      <h2 className="mt-6 text-lg font-semibold">Deals</h2>
      <div className="mt-2 space-y-3">
        {restaurant.deals?.length ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          restaurant.deals.map((d: any) => {
            const valid = getDealValidString(d);
            return (
              <Link key={d.id} href={`/restaurants/${restaurant.id}/deals/${d.id}`} className="block">
                <div className="deal-card rounded-xl border p-4 cursor-pointer transition-colors">
                  <div className="font-medium">{d.title}</div>
                  {d.description ? <div className="mt-1 text-sm">{d.description}</div> : null}
                  {valid ? (
                    <div className="mt-1 text-sm text-gray-600 dark:text-white">
                      {valid}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-sm text-gray-600 dark:text-white">
            There is no deal avaliable at the moment
          </div>
        )}
      </div>

      {/* Menus */}
      <h2 className="mt-8 text-lg font-semibold">Menu</h2>
      {restaurant.menus && restaurant.menus.length > 0 ? (
        <div className="mt-4">
          <MenuCategorySelector menus={restaurant.menus} />
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-600 dark:text-white">No menu available</div>
      )}

      {/* Reviews */}
      <h2 className="mt-8 text-lg font-semibold">Reviews</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-white">
        Reviews provided by Yelp
      </p>
      <div className="mt-2 space-y-3">
        {restaurant.reviews?.length ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          restaurant.reviews.map((rev: any, idx: number) => (
            <div key={`${rev.userName}-${idx}`} className="rounded-xl border p-4">
              <div className="font-medium">{rev.userName}</div>
              <div className="text-sm text-gray-600 dark:text-white">{`⭐ ${rev.rating}`}</div>
              <div className="mt-2 text-sm">{rev.comment}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-600 dark:text-white">No reviews</div>
        )}
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((restaurant: any) => ({
    id: restaurant.id,
  }));
}
