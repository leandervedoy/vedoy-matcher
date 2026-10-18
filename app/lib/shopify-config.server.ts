export function configured(){
  return Boolean(process.env.SHOPIFY_API_KEY&&process.env.SHOPIFY_API_SECRET&&process.env.SHOPIFY_APP_URL&&process.env.SESSION_ENCRYPTION_KEY);
}
