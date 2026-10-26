// PrimeCraft Labs details, read from the generated brand file (master: jk/brand/brand.json + sync.py).
import brand from "./brand.json";

export const studio = {
  name: brand.name,
  portfolioUrl: brand.urls.portfolio,
  /** Plain chat link (callers add ?text=...). */
  whatsappChatUrl: brand.whatsappUrl,
  /** "Want this for your clinic?" enquiry to the studio. */
  enquiryUrl: `${brand.whatsappUrl}?text=${encodeURIComponent(
    `Hi ${brand.name}, I saw your clinic booking website concept and want online booking for my clinic.`,
  )}`,
};
