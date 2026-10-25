// PrimeCraft Labs details, read from the generated brand file (master: jk/brand/brand.json + sync.py).
import brand from "./brand.json";

export const studio = {
  name: brand.name,
  ownerFirstName: brand.owner.firstName,
  portfolioUrl: brand.urls.portfolio,
  whatsappUrl: `${brand.whatsappUrl}?text=${encodeURIComponent(
    `Hi ${brand.owner.firstName}, I saw the clinic booking demo by ${brand.name} and want this for my clinic.`,
  )}`,
};
