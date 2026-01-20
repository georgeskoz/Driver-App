import { query } from "./_generated/server";
import { v } from "convex/values";

// Query to get vehicle pricing for a specific region
export const getVehiclePricing = query({
args: {
region: v.optional(v.string()), // e.g., "quebec", "ontario"
vehicleType: v.optional(v.string()),
},
handler: async (ctx, args) => {
// For now, return mock pricing data
// In production, this would query a vehiclePricing table filtered by region

const region = args.region || "quebec";

// Quebec pricing (no difference between sedan and van as per user requirement)
const quebecPricing = [
{
id: "sedan",
name: "Sedan",
seats: 4,
basePrice: 34.25,
pricePerKm: 1.5,
pricePerMinute: 0.5,
minimumFare: 10.0,
available: true,
},
{
id: "van",
name: "Van",
seats: 6,
basePrice: 34.25, // Same price as sedan in Quebec
pricePerKm: 1.5,
pricePerMinute: 0.5,
minimumFare: 10.0,
available: true,
},
];

// Ontario pricing (different prices)
const ontarioPricing = [
{
id: "sedan",
name: "Sedan",
seats: 4,
basePrice: 28.50,
pricePerKm: 1.2,
pricePerMinute: 0.4,
minimumFare: 8.0,
available: true,
},
{
id: "van",
name: "Van",
seats: 6,
basePrice: 42.75,
pricePerKm: 1.8,
pricePerMinute: 0.6,
minimumFare: 12.0,
available: true,
},
];

const pricingData = region === "ontario" ? ontarioPricing : quebecPricing;

if (args.vehicleType) {
return pricingData.filter(v => v.id === args.vehicleType);
}

return pricingData;
},
});

// Calculate estimated fare based on distance and duration
export const calculateFare = query({
args: {
vehicleType: v.string(),
distanceKm: v.number(),
durationMinutes: v.number(),
region: v.optional(v.string()),
},
handler: async (ctx, args) => {
const pricing = await getVehiclePricing(ctx, { 
region: args.region,
vehicleType: args.vehicleType 
});

if (!pricing || pricing.length === 0) {
throw new Error("Vehicle pricing not found");
}

const vehiclePricing = pricing[0];

const baseFare = vehiclePricing.basePrice;
const distanceFare = args.distanceKm * vehiclePricing.pricePerKm;
const timeFare = args.durationMinutes * vehiclePricing.pricePerMinute;

const totalFare = Math.max(
vehiclePricing.minimumFare,
baseFare + distanceFare + timeFare
);

return {
vehicleType: args.vehicleType,
baseFare,
distanceFare,
timeFare,
totalFare: parseFloat(totalFare.toFixed(2)),
minimumFare: vehiclePricing.minimumFare,
};
},
});
