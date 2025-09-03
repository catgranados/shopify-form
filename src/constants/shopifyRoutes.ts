const shopDomain: string = import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN;

const SHOP_ROUTES = {
  contact: shopDomain + "/policies/contact-information",
  guides: shopDomain + "/blogs/guias/",
};

export default SHOP_ROUTES;
