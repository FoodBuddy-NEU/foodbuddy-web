export type Deal = {
  id: string;
  title: string;
  description?: string;
  validFrom?: string;
  validTo?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
};

export type Menu = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type Review = {
  userName: string;
  rating: number;
  comment: string;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  phone: string;
  priceRange: "$" | "$$" | "$$$";
  rating: number;
  distance?: number;
  /** Array of images. Either provide a full `url` or a Cloudinary `public_id`. */
  images?: Array<{
    public_id?: string;
    url?: string;
    alt?: string;
  }>;
  foodTypes: string[];
  tags?: string[];
  deals?: Deal[];
  menus?: Menu[];
  reviews?: Review[];
};