/**
 * Beavy basket comparison API contracts.
 * Money uses integer minor units (bani) to avoid floating-point arithmetic.
 */

export type UUID = string;
export type FulfillmentChannel = "store" | "delivery" | "online";
export type FulfillmentNodeType =
  | "physical_store" | "delivery_area" | "online_service" | "pickup_point";
export type ComparisonStatus = "complete" | "partial" | "unavailable";
export type PlanStatus = "complete" | "partial" | "unavailable";

export interface Money {
  /** 100 bani = 1 RON. */
  amountMinor: number;
  currency: "RON";
}

export interface BasketLocation {
  city: string;
  region?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface BasketLineInput {
  /** Exact ID from public.beavy_products. */
  productId: UUID;
  /** Number of sellable packages. */
  quantity: number;
}

export interface BasketInput {
  location: BasketLocation;
  channels: FulfillmentChannel[];
  /** Hard cap selected for Beavy: a maximum of three destinations. */
  maxStores: 3;
  items: BasketLineInput[];
}

export interface FulfillmentNode {
  id: UUID;
  retailerId: UUID;
  retailerName: string;
  name: string;
  nodeType: FulfillmentNodeType;
  channel: FulfillmentChannel;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface FulfillmentCostRules {
  currency: "RON";
  /** null = unknown/unverified; 0 = explicitly confirmed free. */
  deliveryFee: Money | null;
  serviceFee: Money | null;
  packagingFee: Money | null;
  smallOrderFee: Money | null;
  smallOrderFeeThreshold: Money | null;
  minimumOrderValue: Money | null;
  freeDeliveryThreshold: Money | null;
  observedAt: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  source: string | null;
  sourceUrl: string | null;
}

export interface EligibleOffer {
  offerId: UUID;
  productId: UUID;
  retailerId: UUID;
  fulfillmentNodeId: UUID;
  retailerName: string;
  nodeName: string;
  channel: FulfillmentChannel;
  packageSize: string | null;
  /** Price for one sellable package; not unit_price. */
  packagePrice: Money;
  /** Only verified in-stock offers are eligible for optimization. */
  availability: "in_stock";
  observedAt: string;
  validUntil: string | null;
  source: string;
  sourceUrl: string | null;
  productUrl: string | null;
}

export interface BasketLineResult {
  productId: UUID;
  productName: string;
  brand: string | null;
  packageSize: string | null;
  quantity: number;
  offerId: UUID;
  packagePrice: Money;
  lineTotal: Money;
  source: string;
  sourceUrl: string | null;
  productUrl: string | null;
  observedAt: string;
}

export interface DestinationCostBreakdown {
  productsSubtotal: Money;
  deliveryFee: Money | null;
  serviceFee: Money | null;
  packagingFee: Money | null;
  smallOrderFee: Money | null;
  sgrTotal: Money;
  destinationTotal: Money | null;
  /** False if any applicable fee or rule is unknown. */
  isComplete: boolean;
}

export interface BasketDestinationResult {
  node: FulfillmentNode;
  items: BasketLineResult[];
  costs: DestinationCostBreakdown;
  rulesObservedAt: string | null;
}

export interface MissingBasketItem {
  productId: UUID;
  requestedQuantity: number;
  reason:
    | "no_exact_offer"
    | "out_of_stock"
    | "unknown_availability"
    | "unknown_destination"
    | "stale_offer"
    | "invalid_offer";
}

export interface BasketPlan {
  id: string;
  status: PlanStatus;
  destinationCount: number;
  destinations: BasketDestinationResult[];
  missingItems: MissingBasketItem[];
  /** null unless every requested item and applicable cost is known. */
  total: Money | null;
  totalWithoutSgr: Money | null;
  coveredPackageCount: number;
  requestedPackageCount: number;
  explanation: string[];
}

export interface BasketSavings {
  /** Positive = split plan costs less than single-store plan. */
  amount: Money | null;
  percentage: number | null;
  comparedTo: "singleStore";
  status: "comparable" | "not_comparable";
}

export interface BasketComparisonResult {
  comparisonId: UUID;
  generatedAt: string;
  input: BasketInput;
  status: ComparisonStatus;
  singleStore: BasketPlan;
  splitBasket: BasketPlan;
  recommendedPlanId: string | null;
  savings: BasketSavings;
  excludedOffers: Array<{
    offerId: UUID;
    productId: UUID;
    reason: MissingBasketItem["reason"];
  }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHANNELS = new Set<FulfillmentChannel>(["store", "delivery", "online"]);

/** Validate the API request. The server must still authorize and validate offers. */
export function assertBasketInput(input: BasketInput): void {
  if (!input || typeof input !== "object") {
    throw new TypeError("Basket input is required.");
  }
  if (!input.location?.city?.trim()) {
    throw new TypeError("A city is required for basket comparison.");
  }
  if (input.maxStores !== 3) {
    throw new RangeError("Beavy split-basket comparison is limited to 3 stores.");
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new TypeError("Basket must contain at least one product.");
  }
  if (!Array.isArray(input.channels) || input.channels.length === 0) {
    throw new TypeError("At least one fulfillment channel is required.");
  }
  for (const channel of input.channels) {
    if (!CHANNELS.has(channel)) throw new TypeError(`Unsupported channel: ${channel}`);
  }

  const seen = new Set<string>();
  for (const item of input.items) {
    if (!UUID_RE.test(item.productId)) {
      throw new TypeError(`Invalid canonical product ID: ${item.productId}`);
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new RangeError("Quantity must be a positive whole number of packages.");
    }
    if (seen.has(item.productId)) {
      throw new TypeError(`Duplicate product ${item.productId}; aggregate quantities first.`);
    }
    seen.add(item.productId);
  }

  const { latitude, longitude } = input.location;
  if ((latitude == null) !== (longitude == null)) {
    throw new TypeError("Latitude and longitude must be provided together.");
  }
  if (latitude != null && (latitude < -90 || latitude > 90)) {
    throw new RangeError("Latitude must be between -90 and 90.");
  }
  if (longitude != null && (longitude < -180 || longitude > 180)) {
    throw new RangeError("Longitude must be between -180 and 180.");
  }
}
