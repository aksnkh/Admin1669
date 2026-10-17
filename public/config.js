// Public runtime configuration. Never place credentials or JWT signing keys here.
window.ADMIN1669_CONFIG = {
  apiBaseUrl: 'https://api.alobegoo.com/api',
  // Confirmed contract: POST { id, ref_tech } -> Response<bool>. Set null to disable.
  referralEndpoint: 'Orders/refDataEntryForMobile',
};
