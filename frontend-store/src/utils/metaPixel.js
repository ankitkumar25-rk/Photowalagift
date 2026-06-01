/**
 * Utility helper for Meta (Facebook) Pixel tracking inside the React SPA.
 * Supports dynamic Pixel ID initialization and standard e-commerce conversion events.
 */

// Retrieve the Pixel ID from Vite environment variables
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

/**
 * Initializes the Meta Pixel script dynamically inside the document head.
 */
export const initMetaPixel = () => {
  if (typeof window === 'undefined') return;
  if (window.fbq) return; // Prevent duplicate initialization

  if (!PIXEL_ID) {
    console.warn('[Meta Pixel] No VITE_META_PIXEL_ID found in environment variables. Tracking is disabled in development mode.');
    return;
  }

  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  console.log(`[Meta Pixel] Initialized successfully with ID: ${PIXEL_ID}`);
};

/**
 * Tracks standard page views. Call this inside a route change hook.
 */
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

/**
 * Tracks when a user views a specific product detail page.
 * @param {Object} product - The product data object
 */
export const trackViewContent = (product) => {
  if (typeof window !== 'undefined' && window.fbq && product) {
    window.fbq('track', 'ViewContent', {
      content_name: product.name,
      content_category: product.category?.name || 'Gifts',
      content_ids: [product.id],
      content_type: 'product',
      value: Number(product.price),
      currency: 'INR',
    });
  }
};

/**
 * Tracks when a user adds a product to their shopping cart.
 * @param {Object} product - The product data object
 * @param {number} quantity - Quantity added
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (typeof window !== 'undefined' && window.fbq && product) {
    window.fbq('track', 'AddToCart', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: Number(product.price) * quantity,
      currency: 'INR',
    });
  }
};

/**
 * Tracks when a user initiates the checkout process.
 * @param {number} subtotal - The subtotal amount of items in the cart
 * @param {number} itemCount - Number of items in checkout
 */
export const trackInitiateCheckout = (subtotal, itemCount = 1) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value: subtotal,
      currency: 'INR',
      num_items: itemCount,
    });
  }
};

/**
 * Tracks when a user successfully completes a purchase.
 * @param {string} orderId - The completed order database ID
 * @param {number} totalAmount - The total order payment amount
 */
export const trackPurchase = (orderId, totalAmount) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_type: 'product',
      value: totalAmount,
      currency: 'INR',
      transaction_id: orderId,
    });
  }
};
