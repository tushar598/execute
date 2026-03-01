// ============================================================
// FILE: page.tsx (Aggregator Marketplace)
// DESCRIPTION: Aggregator Marketplace — Carbon Credit Acquisition Board
// FRAMEWORK: Next.js 13+ (App Router) with "use client" directive
// PURPOSE: Provides a live marketplace interface for aggregators to:
//   1. Browse verified farming communities and their available credits
//   2. View their existing purchased credit portfolio
//   3. Propose custom OTC (Over-The-Counter) deals to communities
//   4. Track live market statistics (pool size, owned credits, listing count)
//
// KEY WORKFLOWS:
//   - Aggregator scans all active community listings with credit availability
//   - Clicks "Propose Deal" on any listing → opens a modal form
//   - Fills in credits required + price per credit → submits proposal
//   - Backend processes OTC deal and notifies the community
// ============================================================

// "use client" directive is required here because this component uses:
//   - useState: browser-only React state management
//   - useEffect: lifecycle hook that runs in the browser after render
//   - useRouter: Next.js client-side navigation hook
//   - User interaction handlers (form submission, modal toggling)
// Without "use client", Next.js would attempt server-side rendering
// and throw errors because these APIs are not available on the server.
"use client";

// -------------------------------------------------------
// REACT CORE IMPORTS
// -------------------------------------------------------

// useEffect: Side effect hook — runs AFTER the component mounts in the browser.
// Used here to fetch marketplace listings and aggregator portfolio data on load.
// The empty dependency array pattern ensures it runs only once (like componentDidMount).
//
// useState: State management hook — stores and updates component-local data.
// Any state change triggers a re-render of the component (and its children).
// We use multiple useState calls to manage distinct pieces of UI state independently.
import { useEffect, useState } from 'react';

// -------------------------------------------------------
// NEXT.JS NAVIGATION IMPORT
// -------------------------------------------------------

// useRouter: Next.js App Router hook for programmatic navigation.
// Provides router.push() to redirect users without a full page reload.
// Although this component doesn't redirect (no auth check like the dashboard),
// router is passed as a useEffect dependency for lint compliance.
import { useRouter } from 'next/navigation';

// -------------------------------------------------------
// LUCIDE-REACT ICON IMPORTS
// -------------------------------------------------------
// Lucide provides clean, consistent SVG icon components for React.
// Each icon is a pure functional component accepting className and other SVG props.
// We import only the icons we actually use to keep the bundle lean.

import {
    // LayoutDashboard: Grid icon representing a dashboard view.
    // (Imported but not actively rendered — may have been used previously
    // or kept for potential future use in nav or section headers.)
    LayoutDashboard,

    // Loader2: Animated spinning loading indicator.
    // Used in:
    //   1. Full-page loading state while fetching market data
    //   2. Inside the "Send Proposal" button while the deal API call is in progress
    Loader2,

    // Globe: World/globe icon.
    // Used as a large decorative background element in the "Live Market Liquidity"
    // hero section — purely decorative with low opacity.
    Globe,

    // TrendingUp: Upward trend/growth arrow icon.
    // Used as the icon beside "Active Community Listings" section heading.
    TrendingUp,

    // Search: Magnifying glass icon.
    // (Imported but not actively rendered — likely planned for a future
    // search/filter feature to search community listings.)
    Search,

    // MapPin: Location pin icon.
    // (Imported but not actively rendered — may be planned for showing
    // community geographic location on each listing card.)
    MapPin,

    // Leaf: A leaf/plant icon representing nature/environment/carbon.
    // Used inside the "Credits Required" input field in the proposal modal
    // as a left-side icon decoration within the input.
    Leaf,

    // CheckCircle2: Checkmark inside a circle — signals verified/approved status.
    // Used on each community listing card to show "Verified" badge status.
    CheckCircle2,

    // AlertCircle: Alert/warning circle with exclamation.
    // Used in TWO places:
    //   1. The "Market is currently illiquid" empty state (no listings available)
    //   2. As the close/dismiss button icon in the proposal modal (unusual usage
    //      — typically an X icon would be used here, but AlertCircle was chosen)
    AlertCircle,

    // ChevronRight: A rightward-pointing chevron arrow.
    // Used on the "Propose Deal" button on each community listing card
    // to indicate forward navigation/action direction.
    ChevronRight,

    // DollarSign: Dollar currency sign icon.
    // (Imported but not actively rendered — the ₹ (Rupee) symbol is used
    // directly as a JSX text character instead. DollarSign may have been
    // a placeholder before switching to INR currency.)
    DollarSign,

    // Package: Box/package icon representing bundled credits.
    // Used as the icon in the "Your Purchased Credits" section heading
    // to visually represent the credit portfolio/package concept.
    Package

} from 'lucide-react';

// -------------------------------------------------------
// NEXT.JS LINK COMPONENT
// -------------------------------------------------------
// Link enables client-side navigation between Next.js routes.
// It prefetches the destination page for instant navigation.
// Used for the "Dashboard" and "Exit" links in the header.
import Link from 'next/link';

// ============================================================
// TYPESCRIPT INTERFACES
// ============================================================
// Interfaces define the data shapes returned by our API endpoints.
// TypeScript uses these at compile time for type checking and IDE autocomplete.
// At runtime, these don't exist — they're purely a developer tool.
// ============================================================

// -------------------------------------------------------
// MarketListing Interface
// -------------------------------------------------------
// Represents a single community listing in the marketplace.
// Returned as part of an array from /api/aggregator/get_marketplace_data.
// Each listing represents one farming community offering carbon credits for sale.
interface MarketListing {
    communityId: string;                    // Unique identifier for the community (MongoDB ID or similar)
    communityName: string;                  // Human-readable display name of the community
    community_description: string;          // Text description of the community's activities/location
    community_carbon_credit_number: number; // Total carbon credits available for sale by this community
    createdAt: string;                      // ISO 8601 timestamp of when this listing was created
}

// -------------------------------------------------------
// OwnedDeal Interface
// -------------------------------------------------------
// Represents a single carbon credit deal that the aggregator
// has already purchased from a community.
// Derived from the analytics API's recentDeals data,
// mapped into a simplified shape for the portfolio display.
interface OwnedDeal {
    communityId: string;    // The ID of the community from which credits were purchased
    credits: number;        // Number of carbon credits bought in this deal
    pricePerCredit: number; // Price paid per credit in INR (₹) — not currently displayed in UI
    totalValue: number;     // Total monetary value of the deal: credits × pricePerCredit (in INR ₹)
    date: string;           // ISO 8601 timestamp of when the deal was completed
}

// NOTE: There is an extra blank line between the two interfaces in the original.
// This is intentional whitespace for readability — not a code issue.

// ============================================================
// MAIN COMPONENT: AggregatorMarketplace
// ============================================================
// This is the default exported React component rendered at the
// /aggregator/marketplace route.
//
// Responsibilities:
//   1. Fetch and display all available community credit listings
//   2. Fetch and display the aggregator's purchased credit portfolio
//   3. Provide a modal form to propose OTC deals to communities
//   4. Show live market statistics (available communities, pool size, credits owned)
// ============================================================
export default function AggregatorMarketplace() {

    // -------------------------------------------------------
    // ROUTER SETUP
    // -------------------------------------------------------
    // Initialize the Next.js router for potential programmatic navigation.
    // While this component doesn't currently perform auth redirects
    // (unlike the dashboard), the router is used as a useEffect dependency.
    const router = useRouter();

    // -------------------------------------------------------
    // STATE: MARKETPLACE DATA
    // -------------------------------------------------------

    // listings: Array of all available community market listings.
    // Initially empty — populated after the marketplace API responds.
    // Rendered as the grid of listing cards in the main content area.
    // Each item contains communityId, communityName, description, and credit count.
    const [listings, setListings] = useState<MarketListing[]>([]);

    // ownedDeals: Array of deals the aggregator has already purchased.
    // Initially empty — populated from analytics API's recentDeals array.
    // Rendered in the "Your Purchased Credits" section when non-empty.
    // Only shown when ownedDeals.length > 0 (conditionally rendered).
    const [ownedDeals, setOwnedDeals] = useState<OwnedDeal[]>([]);

    // -------------------------------------------------------
    // STATE: AGGREGATOR IDENTITY
    // -------------------------------------------------------

    // aggregatorId: The unique identifier of the current logged-in aggregator.
    // Fetched from the analytics API response (analytics.aggregatorId).
    // Used as a required field in the deal proposal API request body.
    // Without this, the backend cannot associate the deal with the correct aggregator.
    const [aggregatorId, setAggregatorId] = useState<string>('');

    // -------------------------------------------------------
    // STATE: PORTFOLIO STATS
    // -------------------------------------------------------

    // totalOwned: Total number of carbon credits currently owned by the aggregator.
    // Fetched from analytics.totalCredits — represents the aggregator's credit portfolio.
    // Displayed in the "Your Credits Owned" stat block in the market overview hero.
    const [totalOwned, setTotalOwned] = useState(0);

    // -------------------------------------------------------
    // STATE: LOADING FLAGS
    // -------------------------------------------------------

    // isLoading: Controls the full-page loading spinner.
    // Starts as true (shows spinner immediately on first render).
    // Set to false once all initial data fetching completes (in finally block).
    // When true, the full-page spinner renders instead of the marketplace UI.
    const [isLoading, setIsLoading] = useState(true);

    // isProposing: Controls the proposal submission loading state.
    // Set to true when the "Send Proposal" form is submitted and awaiting API response.
    // Disables the submit button (via disabled prop) and shows a spinner inside it.
    // Set back to false once the API call completes (success or error).
    const [isProposing, setIsProposing] = useState(false);

    // -------------------------------------------------------
    // STATE: PROPOSAL MODAL
    // -------------------------------------------------------
    // These three state variables work together to manage the deal proposal modal.
    // The modal is shown when selectedCommunity is not null.

    // selectedCommunity: The listing the user clicked "Propose Deal" on.
    // When null → modal is hidden. When set → modal is visible.
    // The modal uses this data to show the community name and set credit limits.
    // Cleared (set to null) when user closes the modal or after successful submission.
    const [selectedCommunity, setSelectedCommunity] = useState<MarketListing | null>(null);

    // creditsToBuy: The number of credits the aggregator wants to purchase.
    // Controlled input — updated on every keystroke via onChange handler.
    // Used in the form submission payload and for the live total price calculation.
    // Initialized to 0; input shows empty string when 0 (|| '' pattern).
    const [creditsToBuy, setCreditsToBuy] = useState<number>(0);

    // pricePerCredit: The price per carbon credit in INR (₹) being offered.
    // Controlled input — updated on every keystroke via onChange handler.
    // Used in the form submission payload and for the live total price calculation.
    // Initialized to 0; input shows empty string when 0 (|| '' pattern).
    const [pricePerCredit, setPricePerCredit] = useState<number>(0);

    // ============================================================
    // DATA FETCHING: useEffect
    // ============================================================
    // Runs once after the component mounts (equivalent to componentDidMount).
    // Fetches two sources of data in parallel-ish fashion:
    //   1. Marketplace listings — all community credit offerings
    //   2. Aggregator analytics — portfolio data + identity
    //
    // Both fetches are inside a single try/catch so any network error
    // is caught and logged without crashing the component.
    //
    // The finally block ensures isLoading becomes false regardless of
    // success or failure, preventing a stuck loading state.
    //
    // router is listed in the dependency array to satisfy React's
    // exhaustive-deps linting rule. The effect runs only once because
    // router's reference is stable between renders in Next.js.
    useEffect(() => {

        // Define an async inner function because useEffect cannot be async directly.
        // This is the standard React pattern for async operations in effects.
        const fetchData = async () => {
            try {

                // ---------------------------------------------------
                // FETCH 1: Marketplace Listings
                // ---------------------------------------------------
                // Retrieves all active community listings available for deal proposals.
                // This is the primary data source for the marketplace grid.
                // Endpoint: GET /api/aggregator/get_marketplace_data
                // Expected response: { communities: MarketListing[] }
                const marketRes = await fetch('/api/aggregator/get_marketplace_data');

                // Only process the response if the HTTP status is 2xx (success).
                // Non-ok responses (404, 500, etc.) are silently skipped —
                // the listings state remains [] and the empty state UI renders.
                if (marketRes.ok) {
                    // Parse the JSON response body from the marketplace API.
                    const data = await marketRes.json();

                    // Store the communities array in listings state.
                    // This triggers a re-render showing the listing cards grid.
                    setListings(data.communities);
                }

                // ---------------------------------------------------
                // FETCH 2: Aggregator Analytics (Portfolio + Identity)
                // ---------------------------------------------------
                // Retrieves the aggregator's portfolio statistics including:
                //   - aggregatorId: their unique identifier for deal proposals
                //   - totalCredits: sum of all credits purchased so far
                //   - recentDeals: array of individual deal records for portfolio display
                // Endpoint: GET /api/aggregator/analytics
                // Expected response: { aggregatorId, totalCredits, recentDeals: [...] }
                const analyticsRes = await fetch('/api/aggregator/analytics');

                // Only process if the HTTP status indicates success.
                if (analyticsRes.ok) {
                    // Parse the analytics JSON response.
                    const analytics = await analyticsRes.json();

                    // Store the aggregator's unique ID.
                    // The || '' fallback ensures aggregatorId is never undefined.
                    // This ID is required in the deal proposal request body.
                    setAggregatorId(analytics.aggregatorId || '');

                    // Store the total credits owned by this aggregator.
                    // The || 0 fallback ensures totalOwned is always a number.
                    // Displayed in the "Your Credits Owned" stat block.
                    setTotalOwned(analytics.totalCredits || 0);

                    // ---------------------------------------------------
                    // MAP recentDeals → OwnedDeal[]
                    // ---------------------------------------------------
                    // The analytics API returns deals in its own shape (RecentDeal).
                    // We map that to our simplified OwnedDeal interface to decouple
                    // the portfolio display from the analytics API data structure.
                    //
                    // (analytics.recentDeals || []): fallback to empty array if
                    // recentDeals is null/undefined (defensive coding).
                    //
                    // The "d: any" type annotation bypasses TypeScript checking for
                    // the raw API response shape (before mapping to OwnedDeal).
                    const deals: OwnedDeal[] = (analytics.recentDeals || []).map((d: any) => ({
                        communityId: d.entityId,        // API uses "entityId", we map to "communityId"
                        credits: d.credits,             // Direct mapping — same field name
                        pricePerCredit: d.pricePerCredit, // Direct mapping — same field name
                        totalValue: d.totalValue,       // Direct mapping — same field name
                        date: d.createdAt,              // API uses "createdAt", we map to "date"
                    }));

                    // Store the mapped deals array in ownedDeals state.
                    // This triggers a re-render showing the "Your Purchased Credits" section.
                    setOwnedDeals(deals);
                }

            } catch (error) {
                // Catch any network errors, JSON parse failures, or other runtime errors.
                // Log to console for debugging without crashing the component.
                // The UI will render with whatever partial data was loaded before the error.
                console.error('Failed to load marketplace data:', error);
            } finally {
                // Always executed after try or catch completes.
                // Setting isLoading to false dismisses the full-page spinner
                // and reveals the marketplace UI (with whatever data was loaded).
                // This prevents the spinner from being stuck if an error occurred.
                setIsLoading(false);
            }
        };

        // Immediately invoke the async function to start data fetching.
        // This is the standard pattern: define async fn inside effect, then call it.
        fetchData();

    }, [router]); // Dependency: router (stable reference; effect runs once on mount)

    // ============================================================
    // HANDLER: handleProposeDeal
    // ============================================================
    // Handles the OTC deal proposal form submission.
    // Called when the user clicks "Send Proposal" in the modal form.
    //
    // Validation: Guards against submission if:
    //   - No community is selected (selectedCommunity is null)
    //   - creditsToBuy is 0 or negative
    //   - pricePerCredit is 0 or negative
    //   - aggregatorId is empty (not yet loaded from analytics)
    //
    // Flow:
    //   1. Prevent default form submission (page reload)
    //   2. Validate required fields
    //   3. Set isProposing = true (show spinner on button, disable submit)
    //   4. POST deal proposal to API
    //   5. On success: close modal, reset form fields, show success alert
    //   6. On failure: show error alert with API error message
    //   7. Finally: set isProposing = false (restore submit button)
    //
    // Parameters:
    //   e: React.FormEvent — the native form submission event
    const handleProposeDeal = async (e: React.FormEvent) => {

        // Prevent the browser's default form submission behavior.
        // Without this, the form would cause a full page reload.
        e.preventDefault();

        // Guard clause — validate all required fields before proceeding.
        // If any condition fails, the function exits early without making an API call.
        // This provides a client-side validation layer in addition to server validation.
        if (!selectedCommunity || creditsToBuy <= 0 || pricePerCredit <= 0 || !aggregatorId) return;

        // Set proposing state to true — shows spinner inside submit button
        // and disables it via the disabled prop to prevent double-submission.
        setIsProposing(true);

        try {
            // ---------------------------------------------------
            // API CALL: Submit Deal Proposal
            // ---------------------------------------------------
            // POST request to the aggregator deal creation endpoint.
            // This creates a pending deal proposal that the community can accept or reject.
            // Endpoint: POST /api/aggregator/aggregatordeal
            //
            // Request body contains:
            //   - community_id: which community is being proposed to
            //   - aggregator_id: the current aggregator making the proposal
            //   - credits_offered: how many credits the aggregator wants to buy
            //   - price_per_credit: the price offered per credit in INR
            const res = await fetch('/api/aggregator/aggregatordeal', {
                method: 'POST', // POST for creating a new resource (the deal proposal)

                // Headers tell the server to expect JSON in the request body.
                // Required for the server to correctly parse req.body as JSON.
                headers: { 'Content-Type': 'application/json' },

                // JSON.stringify serializes the JavaScript object to a JSON string.
                // The server will parse this back into an object on its end.
                body: JSON.stringify({
                    community_id: selectedCommunity.communityId, // Target community's unique ID
                    aggregator_id: aggregatorId,                 // Current aggregator's ID (comment: "Use actual DealerId")
                    credits_offered: creditsToBuy,               // Number of credits requested
                    price_per_credit: pricePerCredit             // Offered price per credit in INR
                })
            });

            // ---------------------------------------------------
            // HANDLE API RESPONSE
            // ---------------------------------------------------

            // Check if the response status indicates success (2xx).
            if (res.ok) {
                // SUCCESS: Close the modal by clearing selectedCommunity.
                // Setting selectedCommunity to null causes the modal overlay
                // to disappear (conditional rendering: {selectedCommunity && <Modal />}).
                setSelectedCommunity(null);

                // Reset the credits input field back to its initial value.
                // This ensures a clean state if the user opens another proposal later.
                setCreditsToBuy(0);

                // Reset the price per credit input field back to its initial value.
                // Same reason as resetting creditsToBuy above.
                setPricePerCredit(0);

                // Show a browser native alert confirming the proposal was sent.
                // NOTE: Native alert() blocks the JS thread — a toast notification
                // library (e.g., react-hot-toast) would be a more polished alternative,
                // but alert() is used here for simplicity.
                alert("Proposal sent successfully!");

            } else {
                // FAILURE: Parse the error response body to get the error message.
                // The API should return JSON with an "error" field on failure.
                const data = await res.json();

                // Show the API's error message, or a generic fallback if none provided.
                // The "|| 'Failed to send proposal.'" handles cases where the API
                // returns a non-JSON error or an empty error field.
                alert(data.error || "Failed to send proposal.");
            }

        } catch (error) {
            // Catch network errors (no internet, server unreachable, DNS failure).
            // Log for debugging and show a user-friendly error alert.
            console.error(error);
            alert("Error sending proposal");

        } finally {
            // Always restore the submit button to its normal state.
            // This re-enables the button whether the API call succeeded or failed.
            // Prevents the button from being permanently disabled on error.
            setIsProposing(false);
        }
    };

    // ============================================================
    // EARLY RETURN: Full-Page Loading State
    // ============================================================
    // While isLoading is true (data fetching in progress), render a
    // centered full-screen loading indicator instead of the marketplace UI.
    //
    // This prevents the marketplace from rendering with empty/null data,
    // which could cause visual glitches or confusing empty states.
    //
    // The spinner appears immediately (isLoading starts true) and disappears
    // once all fetch calls in useEffect complete (success or error).
    if (isLoading) {
        return (
            // Full-screen container: min-h-screen ensures it fills the viewport.
            // bg-slate-50: subtle light gray background matching the marketplace theme.
            // flex items-center justify-center: centers content both horizontally and vertically.
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">

                {/* Inner flex column: stacks the spinner and message vertically.
                    gap-4: 16px space between spinner and text. */}
                <div className="flex flex-col items-center gap-4">

                    {/* Loader2 spinner: rotates via Tailwind's animate-spin class.
                        w-10/h-10: 40px size — large enough to be clearly visible.
                        text-slate-400: muted gray color for the spinner stroke. */}
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400" />

                    {/* Loading message: "Scanning Market Data" is a thematic message
                        that fits the financial/market context of the page.
                        font-medium: slightly heavier than normal text for readability. */}
                    <p className="text-slate-500 font-medium">Scanning Market Data...</p>
                </div>
            </div>
        );
    }
    // If isLoading is false, continue to render the full marketplace UI below.

    // ============================================================
    // MAIN RENDER: Full Marketplace Layout
    // ============================================================
    // Structure:
    //   1. Wrapper div (full-screen background)
    //   2. <header> — Fixed top navigation bar
    //   3. <main> — Main content
    //      a. Market Overview Hero (dark card with live stats)
    //      b. Purchased Credits Portfolio (conditional, shown if deals exist)
    //      c. Section heading for Active Community Listings
    //      d. Listings Grid (or empty state if no listings)
    //   4. Proposal Modal Overlay (conditional, shown when selectedCommunity is set)
    // ============================================================
    return (
        // Root wrapper with minimum full-viewport height.
        // bg-[#F8FAFC]: custom very-light blue-gray, matches the dashboard background.
        <div className="min-h-screen bg-[#F8FAFC]">

            {/* ==================================================
                HEADER: Fixed Navigation Bar
                ==================================================
                Position: fixed (always visible at top while scrolling).
                bg-white: solid white (no frosted glass on this page).
                border-b border-slate-200: bottom separator.
                z-10: ensures header stays above scrollable content.
                h-16: 64px height (matches mobile dashboard header).
            ================================================== */}
            <header className="bg-white border-b border-slate-200 fixed top-0 w-full z-10">

                {/* Inner container: max-width constrained + responsive horizontal padding.
                    flex items-center justify-between: logo left, nav links right. */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                    {/* ---- BRAND / LOGO SECTION ---- */}
                    {/* gap-4: slightly larger gap than dashboard (gap-3) between icon and text. */}
                    <div className="flex items-center gap-4">

                        {/* Logo Icon Box:
                            w-8/h-8: 32px square.
                            bg-blue-600: vivid blue brand color.
                            rounded-lg: slightly less rounded than dashboard's rounded-xl.
                            flex + items-center + justify-center: centers the "A" letter.
                            text-white font-bold: white bold letter for contrast. */}
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {/* "A" letter as simple text — stands for "Aggregator".
                                A simpler approach than using an icon component. */}
                            A
                        </div>

                        {/* Brand Text block: stacked heading + subtitle */}
                        <div>
                            {/* App title: "Aggregator Terminal" — market/trading themed.
                                text-lg font-bold text-slate-900: readable, high-contrast heading. */}
                            <h1 className="text-lg font-bold text-slate-900">Aggregator Terminal</h1>

                            {/* Subtitle: "Acquisition Board" — describes the page's purpose.
                                text-[10px] uppercase tracking-widest: micro-label style.
                                text-slate-400 font-bold: muted color with bold weight for contrast. */}
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Acquisition Board</p>
                        </div>
                    </div>

                    {/* ---- HEADER NAVIGATION LINKS ---- */}
                    {/* gap-4: space between the two nav links.
                        Both use the same inactive link style (slate-500, hover slate-900). */}
                    <div className="flex items-center gap-4">

                        {/* Dashboard Link — navigates back to the main aggregator dashboard.
                            text-sm font-medium: standard nav link size/weight.
                            transition-colors: smooth text color change on hover. */}
                        <Link href="/aggregator/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                            Dashboard
                        </Link>

                        {/* Exit Link — navigates to the homepage ("/").
                            Provides a way to leave the aggregator-specific area.
                            Same styling as the Dashboard link for visual consistency. */}
                        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                            Exit
                        </Link>
                    </div>
                </div>
            </header>

            {/* ==================================================
                MAIN CONTENT AREA
                ==================================================
                max-w-7xl mx-auto: centered, max-width constrained layout.
                px-4 sm:px-6: responsive horizontal padding.
                pt-24: top padding compensates for the 64px fixed header + extra space.
                pb-20: bottom padding prevents content from touching viewport edge.
            ================================================== */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">

                {/* ==================================================
                    SECTION 1: MARKET OVERVIEW HERO
                    ==================================================
                    A dark-themed hero card showing live market statistics.
                    Contains three stat blocks:
                      1. Available Communities (listing count)
                      2. Total Pool Size (sum of all available credits)
                      3. Your Credits Owned (aggregator's current portfolio)

                    Visual design:
                    - bg-slate-900: dark charcoal background for contrast
                    - Decorative Globe icon in top-right (low opacity)
                    - relative/overflow-hidden/z-10 for layered positioning
                    - shadow-xl shadow-slate-900/20: pronounced dark shadow
                    - mb-8: 32px gap below before the portfolio/listings sections
                ================================================== */}
                <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">

                    {/* ---- DECORATIVE GLOBE BACKGROUND ELEMENT ----
                        absolute positioning places it in the top-right corner.
                        opacity-10: very faint (10%) — purely decorative texture.
                        pointer-events-none: doesn't block any click interactions.
                        p-8: insets it slightly from the corner for a "peeking" effect.
                        The Globe is 192px — intentionally oversized for the effect. */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Globe className="w-48 h-48" />
                    </div>

                    {/* ---- HERO CONTENT GRID ----
                        relative z-10: appears above the decorative globe overlay.
                        grid-cols-1: single column on mobile (content stacks vertically).
                        md:grid-cols-2: two columns on medium screens (content + optional second panel).
                        gap-8 items-center: space between columns, vertically centered.
                        NOTE: Only one grid column is actually populated (the left one).
                        The right column is empty — likely reserved for a chart or map. */}
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                        {/* ---- LEFT COLUMN: Title, Description, Stat Blocks ---- */}
                        <div>
                            {/* Hero Title: "Live Market Liquidity"
                                text-3xl: large display heading.
                                font-extrabold: maximum font weight for impact.
                                tracking-tight: tight letter spacing for display text.
                                mb-2: 8px gap before the description paragraph. */}
                            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Live Market Liquidity</h2>

                            {/* Hero Description paragraph:
                                Explains the purpose of the marketplace in plain language.
                                text-slate-300: lighter white for secondary text on dark bg.
                                text-sm font-medium: readable body text size.
                                mb-6: 24px gap before the stat blocks.
                                max-w-lg: constrains line length for comfortable reading. */}
                            <p className="text-slate-300 text-sm font-medium mb-6 max-w-lg">
                                Scout farming communities worldwide. Propose custom OTC deals to acquire verified, high-quality agricultural carbon credits directly from the source.
                            </p>

                            {/* ---- STAT BLOCKS ROW ----
                                flex gap-4 flex-wrap: horizontal row of stat blocks with wrapping.
                                On small screens, blocks wrap to new lines if they don't fit.
                                Each block has a max-w-[200px] to prevent them from stretching too wide. */}
                            <div className="flex gap-4 flex-wrap">

                                {/* ---- STAT BLOCK 1: Available Communities ----
                                    bg-white/10: 10% opacity white on dark background (subtle glass effect).
                                    border border-white/5: very subtle border using 5% white.
                                    rounded-2xl: rounded corners for card look.
                                    backdrop-blur-sm: slight blur behind the block (frosted glass).
                                    p-4: comfortable padding. max-w-[200px]: width constraint. */}
                                <div className="bg-white/10 p-4 border border-white/5 rounded-2xl w-full max-w-[200px] backdrop-blur-sm">

                                    {/* Stat label: tiny uppercase text identifies the metric.
                                        text-slate-400: muted on the dark background. */}
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Available Communities</p>

                                    {/* Stat value: listings.length — total count of community listings.
                                        text-3xl font-bold: large bold number for quick scanning.
                                        No unit suffix needed — "communities" is self-evident from label. */}
                                    <p className="text-3xl font-bold">{listings.length}</p>
                                </div>

                                {/* ---- STAT BLOCK 2: Total Pool Size ----
                                    bg-emerald-500/10: 10% emerald green tint (environment/carbon theme).
                                    border-emerald-500/20: subtle emerald border at 20% opacity. */}
                                <div className="bg-emerald-500/10 p-4 border border-emerald-500/20 rounded-2xl w-full max-w-[200px] backdrop-blur-sm">

                                    {/* Stat label: emerald text matches the block's color theme. */}
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Total Pool Size</p>

                                    {/* Stat value: sum of all community credits across all listings.
                                        .reduce((sum, item) => sum + item.community_carbon_credit_number, 0):
                                          - Iterates over the listings array
                                          - Accumulates the community_carbon_credit_number of each item
                                          - Starts from 0 (initial accumulator value)
                                        .toLocaleString(): adds thousands separators (e.g., 1,000,000).
                                        text-emerald-400: emerald colored number matching theme. */}
                                    <p className="text-3xl font-bold text-emerald-400">
                                        {listings.reduce((sum, item) => sum + item.community_carbon_credit_number, 0).toLocaleString()} <span className="text-sm font-medium">CCs</span>
                                        {/* "CCs" = Carbon Credits — shown in smaller text as unit suffix.
                                            text-sm font-medium: secondary size to not compete with the number. */}
                                    </p>
                                </div>

                                {/* ---- STAT BLOCK 3: Your Credits Owned ----
                                    bg-blue-500/10: 10% blue tint (matches brand blue color).
                                    border-blue-500/20: subtle blue border at 20% opacity. */}
                                <div className="bg-blue-500/10 p-4 border border-blue-500/20 rounded-2xl w-full max-w-[200px] backdrop-blur-sm">

                                    {/* Stat label: blue text matching the block's color theme. */}
                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Your Credits Owned</p>

                                    {/* Stat value: totalOwned — aggregator's total credit portfolio.
                                        .toLocaleString(): thousands separators for large numbers.
                                        text-blue-400: blue colored number matching block theme. */}
                                    <p className="text-3xl font-bold text-blue-400">
                                        {totalOwned.toLocaleString()} <span className="text-sm font-medium">CRD</span>
                                        {/* "CRD" = Carbon Credits (internal unit abbreviation).
                                            Slightly different from "CCs" used in the pool — may be intentional
                                            to distinguish available market credits from owned portfolio credits. */}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* NOTE: Right grid column intentionally empty — space reserved for future content
                            such as a price chart, geographic map, or market trend visualization. */}
                    </div>
                </div>

                {/* ==================================================
                    SECTION 2: YOUR PURCHASED CREDITS (PORTFOLIO)
                    ==================================================
                    Conditionally rendered: only shown when the aggregator
                    has at least one purchased deal (ownedDeals.length > 0).
                    Uses short-circuit evaluation (&&) for conditional rendering.

                    Displays a responsive grid of deal cards showing:
                    - Deal type badge ("Community Deal")
                    - Purchase date
                    - Community ID (monospace for technical ID display)
                    - Credits count (blue stat block)
                    - Total value in INR (emerald stat block)

                    mb-8: 32px gap below before the listings section.
                ================================================== */}
                {ownedDeals.length > 0 && (
                    <div className="mb-8">

                        {/* Section heading with Package icon.
                            flex items-center gap-2: aligns icon and text horizontally.
                            mb-4: 16px space below heading before the cards grid. */}
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            {/* Package icon: represents bundled/purchased credit packages.
                                text-blue-600: brand blue color for visual consistency. */}
                            <Package className="w-5 h-5 text-blue-600" /> Your Purchased Credits
                        </h3>

                        {/* ---- PORTFOLIO DEALS GRID ----
                            1 column on mobile, 2 on small screens, 3 on large screens.
                            gap-4: 16px gutters between cards. */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* Map over ownedDeals to render one card per purchased deal.
                                key={idx}: using array index as key since deals don't have unique IDs
                                in this simplified OwnedDeal interface. Note: index keys can cause
                                React reconciliation issues if the array order changes, but is
                                acceptable here since the portfolio list doesn't change during session. */}
                            {ownedDeals.map((deal, idx) => (

                                // ---- INDIVIDUAL DEAL CARD ----
                                // bg-white rounded-2xl: clean white card with rounded corners.
                                // border border-slate-100: very light card border.
                                // shadow-sm: subtle depth shadow.
                                // p-5: 20px comfortable internal padding.
                                <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

                                    {/* ---- CARD HEADER ROW ----
                                        flex items-center justify-between: deal type badge on left, date on right.
                                        mb-3: 12px gap below header before community ID. */}
                                    <div className="flex items-center justify-between mb-3">

                                        {/* Deal Type Badge: "Community Deal"
                                            px-2.5 py-1 rounded-full: pill shape badge.
                                            text-[10px] font-bold: very small bold text inside badge.
                                            bg-blue-50 text-blue-600: blue-tinted badge for community deals.
                                            uppercase tracking-wider: spaced caps for badge text. */}
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wider">Community Deal</span>

                                        {/* Purchase Date:
                                            new Date(deal.date): parse ISO timestamp string.
                                            .toLocaleDateString(): format using browser locale (e.g., "1/15/2024").
                                            text-[10px] text-slate-400: tiny muted secondary information. */}
                                        <span className="text-[10px] text-slate-400">{new Date(deal.date).toLocaleDateString()}</span>
                                    </div>

                                    {/* Community ID Display:
                                        text-xs: small body text.
                                        text-slate-500: muted color for label.
                                        font-mono: monospace font for technical ID strings.
                                        mb-2: 8px gap before the stat blocks below.
                                        <span> inside: bold slate-800 for the ID value to stand out. */}
                                    <p className="text-xs text-slate-500 font-mono mb-2">Community: <span className="font-bold text-slate-800">{deal.communityId}</span></p>

                                    {/* ---- STAT BLOCKS GRID ----
                                        grid-cols-2: side-by-side stat blocks.
                                        gap-3: 12px gap between the two blocks. */}
                                    <div className="grid grid-cols-2 gap-3">

                                        {/* Credits Stat Block (Blue):
                                            bg-blue-50: light blue background.
                                            rounded-xl px-3 py-2: rounded corners, compact padding. */}
                                        <div className="bg-blue-50 rounded-xl px-3 py-2">
                                            {/* Stat label: "CREDITS" in tiny uppercase blue */}
                                            <p className="text-[9px] text-blue-400 font-bold uppercase">Credits</p>
                                            {/* Stat value: credits count formatted with thousands separators.
                                                text-sm font-bold text-blue-900: readable bold number. */}
                                            <p className="text-sm font-bold text-blue-900">{deal.credits.toLocaleString()}</p>
                                        </div>

                                        {/* Total Value Stat Block (Emerald):
                                            bg-emerald-50: light green background for monetary value. */}
                                        <div className="bg-emerald-50 rounded-xl px-3 py-2">
                                            {/* Stat label: "TOTAL VALUE" in tiny uppercase emerald */}
                                            <p className="text-[9px] text-emerald-400 font-bold uppercase">Total Value</p>
                                            {/* Stat value: total deal value in INR.
                                                ₹ prefix: Indian Rupee symbol.
                                                .toLocaleString(): thousands separators.
                                                text-sm font-bold text-emerald-900: readable bold number. */}
                                            <p className="text-sm font-bold text-emerald-900">₹{deal.totalValue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* End of conditional portfolio section.
                    If ownedDeals.length === 0, this entire section is not rendered. */}

                {/* ---- SECTION HEADING: Active Community Listings ----
                    mb-6: 24px gap below before the listings grid.
                    flex justify-between items-center: heading on left, reserved space on right.
                    NOTE: The right side of this flex row is empty — likely a placeholder
                    for future filter/sort controls or a search input. */}
                <div className="mb-6 flex justify-between items-center">

                    {/* Section title with TrendingUp icon.
                        flex items-center gap-2: horizontal icon + text layout.
                        text-lg font-bold text-slate-900: strong section heading style.
                        TrendingUp in text-blue-600: brand blue icon. */}
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Active Community Listings
                    </h3>
                    {/* Right side intentionally empty — reserved for future controls. */}
                </div>

                {/* ==================================================
                    SECTION 3: COMMUNITY LISTINGS GRID (or Empty State)
                    ==================================================
                    Conditionally renders either:
                    A) An empty state message when no communities have listed credits
                    B) A responsive grid of community listing cards

                    The ternary operator (condition ? A : B) handles this switch.
                ================================================== */}
                {listings.length === 0 ? (

                    // ---- EMPTY STATE: No Listings Available ----
                    // Shown when listings array is empty (no communities in market).
                    // py-24: generous vertical padding to center the message nicely.
                    // bg-white rounded-3xl: white card container with large radius.
                    // border border-dashed border-slate-200: dashed border style for "empty" feel.
                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">

                        {/* Large alert icon as visual anchor for the empty state.
                            w-12/h-12: 48px icon — large enough to draw the eye.
                            text-slate-300: muted color (not alarming, just decorative).
                            mx-auto: centers the icon horizontally.
                            mb-4: 16px gap before the heading text. */}
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />

                        {/* Empty state headline: market jargon "illiquid" is intentional —
                            fits the financial market theme of the page.
                            text-slate-600 font-bold: bold but not fully dark for softer tone.
                            mb-1: 4px gap before the explanatory text. */}
                        <p className="text-slate-600 font-bold mb-1">Market is currently illiquid</p>

                        {/* Explanatory text: simpler language explaining what "illiquid" means.
                            text-sm text-slate-500: small muted text for secondary information. */}
                        <p className="text-sm text-slate-500">No communities have listed their credits yet.</p>
                    </div>

                ) : (

                    // ---- LISTINGS GRID: One Card Per Community ----
                    // Responsive grid layout:
                    // - 1 column on mobile (full-width cards)
                    // - 2 columns on medium screens (md:grid-cols-2)
                    // - 3 columns on large screens (lg:grid-cols-3)
                    // gap-6: 24px gutters between cards (larger than portfolio gap).
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Map over listings to render one card per community.
                            key={listing.communityId}: communityId as stable unique React key.
                            Using a meaningful ID (not index) for reliable list reconciliation. */}
                        {listings.map((listing) => (

                            // ---- INDIVIDUAL COMMUNITY LISTING CARD ----
                            // bg-white rounded-3xl: white card with very large radius.
                            // border border-slate-100 shadow-sm: subtle border + shadow.
                            // p-6: 24px padding for comfortable content spacing.
                            // hover:shadow-md transition-shadow: shadow elevates on hover.
                            // group: enables group-hover utilities on child elements.
                            // flex flex-col items-start justify-between: vertical flex layout,
                            //   content at top, "Propose Deal" button pushed to bottom.
                            <div key={listing.communityId} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow group flex flex-col items-start justify-between">

                                {/* Inner wrapper div takes full width and holds all card content
                                    except the bottom CTA button. flex-col + justify-between on
                                    parent ensures this div pushes the button to the bottom. */}
                                <div className="w-full">

                                    {/* ---- CARD TOP ROW: Community Initial + Verified Badge ----
                                        flex justify-between items-start: initial icon on left, badge on right.
                                        mb-4: 16px gap below before the community name. */}
                                    <div className="flex justify-between items-start mb-4">

                                        {/* Community Initial Avatar:
                                            w-12/h-12: 48px square.
                                            bg-blue-50 text-blue-600: blue themed initial.
                                            rounded-xl: rounded corners.
                                            font-bold text-xl: large bold letter.
                                            mb-4: gap below (pushes name further down).
                                            group-hover:scale-110 transition-transform: scales up on card hover.
                                            .charAt(0): gets the first character of communityName for the initial.
                                            This creates a simple avatar without requiring images. */}
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                                            {listing.communityName.charAt(0)}
                                        </div>

                                        {/* Verified Badge:
                                            inline-flex items-center gap-1: aligns icon and text.
                                            px-2.5 py-1 rounded-full: pill badge shape.
                                            text-[10px] font-bold: tiny bold text for badge.
                                            bg-emerald-50 text-emerald-600: green "Verified" badge.
                                            border border-emerald-100: subtle border. */}
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            {/* Small CheckCircle2 icon before "Verified" text.
                                                w-3/h-3: 12px — very small to fit inside the badge. */}
                                            <CheckCircle2 className="w-3 h-3" /> Verified
                                        </span>
                                    </div>

                                    {/* Community Name:
                                        text-lg font-bold text-slate-900: strong card title.
                                        mb-1: small gap before the description paragraph. */}
                                    <h4 className="text-lg font-bold text-slate-900 mb-1">{listing.communityName}</h4>

                                    {/* Community Description:
                                        text-sm text-slate-500: smaller muted body text.
                                        mb-4: 16px gap before the credit availability block.
                                        line-clamp-2: Tailwind CSS line clamping — limits description
                                        to exactly 2 lines, adding "..." for overflow. This keeps
                                        all cards the same height regardless of description length. */}
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                        {listing.community_description}
                                    </p>

                                    {/* ---- AVAILABLE VOLUME BLOCK ----
                                        A highlighted inset block showing the credit availability.
                                        bg-slate-50 rounded-xl p-4 mb-6: subtle inset background.
                                        border border-slate-100: light border for definition.
                                        mb-6: 24px gap below before the CTA button. */}
                                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">

                                        {/* Block label: "Available Volume" in tiny uppercase.
                                            mb-1: 4px gap before the credit number. */}
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Available Volume</p>

                                        {/* Credit count with unit:
                                            text-2xl font-bold: large prominent number.
                                            flex items-baseline gap-1: aligns number and "Credits" unit at baseline.
                                            text-slate-800: dark color for emphasis.
                                            .toLocaleString(): thousands separators for readability.
                                            "Credits" suffix in smaller text-sm font-medium text-slate-500. */}
                                        <p className="text-2xl font-bold flex items-baseline gap-1 text-slate-800">
                                            {listing.community_carbon_credit_number.toLocaleString()} <span className="text-sm font-medium text-slate-500">Credits</span>
                                        </p>
                                    </div>
                                </div>

                                {/* ---- CTA BUTTON: Propose Deal ----
                                    Positioned at the bottom of the card (flex justify-between on parent).
                                    w-full: takes full width of the card.
                                    py-3: 12px vertical padding for comfortable click target.
                                    bg-blue-600 hover:bg-blue-700: blue with darker hover.
                                    text-white font-bold rounded-xl: white bold text, rounded.
                                    transition-colors: smooth background color transition.
                                    flex items-center justify-center gap-2: center icon + text.

                                    onClick: setSelectedCommunity(listing)
                                      - Stores the full listing object in selectedCommunity state
                                      - This triggers the modal to appear (conditional rendering below)
                                      - The modal reads from selectedCommunity for community name and credit limit */}
                                <button
                                    onClick={() => setSelectedCommunity(listing)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    Propose Deal <ChevronRight className="w-4 h-4" />
                                    {/* ChevronRight: small right arrow reinforces the "proceed" action. */}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {/* End of listings conditional — grid or empty state. */}

            </main>

            {/* ==================================================
                PROPOSAL MODAL OVERLAY
                ==================================================
                Conditionally rendered when selectedCommunity is not null.
                (Appears after user clicks "Propose Deal" on a listing card.)

                Structure:
                  1. Full-screen semi-transparent overlay (backdrop)
                  2. Centered white modal card
                     a. Close button (top-right)
                     b. Modal title + community name
                     c. Form with two inputs (credits + price)
                     d. Live total price calculation display
                     e. Cancel + Submit buttons

                Uses short-circuit (&&) for conditional rendering:
                  {selectedCommunity && <Modal />}
                When selectedCommunity is null, nothing renders.
                When selectedCommunity is set, the modal appears.
            ================================================== */}
            {selectedCommunity && (

                // ---- MODAL BACKDROP ----
                // fixed inset-0: covers the entire viewport.
                // bg-slate-900/40: dark overlay at 40% opacity (darkens background).
                // backdrop-blur-sm: slight blur on background content (modern glass effect).
                // z-50: highest z-index — appears above all other content including the header (z-10).
                // flex items-center justify-center: centers the modal card in the viewport.
                // p-4: prevents modal from touching viewport edges on very small screens.
                // text-black: resets text color (parent is dark but modal card is white).
                <div className="fixed text-black inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

                    {/* ---- MODAL CARD ----
                        bg-white: solid white card (no blur, clean reading surface).
                        rounded-3xl: large border radius matching the card style elsewhere.
                        max-w-md w-full: max 448px wide, full width on mobile.
                        p-6: 24px internal padding.
                        shadow-2xl: very pronounced shadow to lift modal above backdrop.
                        relative: positioning context for the absolute close button.
                        animate-in fade-in zoom-in duration-200: Tailwind CSS animation plugin
                          classes for a smooth appear animation (fades in + scales up from center).
                          NOTE: This requires the @tailwindcss/animation plugin or similar setup. */}
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">

                        {/* ---- CLOSE BUTTON (top-right) ----
                            absolute top-6 right-6: positioned inside modal card's top-right corner.
                            text-slate-400 hover:text-slate-600: muted color, darkens on hover.

                            onClick: setSelectedCommunity(null)
                              - Clears selectedCommunity state → hides the modal.
                              - Does NOT reset creditsToBuy or pricePerCredit
                                (so values persist if user reopens the same community's modal).

                            NOTE: AlertCircle is used as the close icon here — an unusual choice.
                            Typically an X icon (from Lucide: import { X }) would be used.
                            This may be an oversight or deliberate design choice. */}
                        <button
                            onClick={() => setSelectedCommunity(null)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
                        >
                            <AlertCircle className="w-5 h-5" />
                        </button>

                        {/* ---- MODAL HEADER ----
                            Title: "Draft Proposal" — OTC deal drafting language.
                            text-xl font-bold text-slate-900: strong heading.
                            mb-2: 8px gap before description. */}
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Draft Proposal</h3>

                        {/* Modal description: identifies the target community.
                            text-sm text-slate-500: muted secondary body text.
                            mb-6: 24px gap before the form.
                            <span> inside: bold text-slate-700 highlights the community name. */}
                        <p className="text-sm text-slate-500 mb-6">Create an OTC offer for <span className="font-bold text-slate-700">{selectedCommunity.communityName}</span>.</p>

                        {/* ---- PROPOSAL FORM ----
                            onSubmit={handleProposeDeal}: calls the async deal handler on submit.
                            space-y-4: 16px vertical gap between form fields.

                            NOTE: This is a <form> element (not a React-state-only form).
                            The form's submit is intercepted by handleProposeDeal via e.preventDefault(). */}
                        <form onSubmit={handleProposeDeal} className="space-y-4">

                            {/* ---- FIELD 1: Credits Required ---- */}
                            <div>
                                {/* Field Label:
                                    block: makes label take full width.
                                    text-xs font-bold text-slate-700: small bold label.
                                    uppercase tracking-wide: spaced caps style.
                                    mb-1: 4px gap before the input. */}
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Credits Required
                                </label>

                                {/* Input wrapper: relative for absolute icon positioning inside input. */}
                                <div className="relative">

                                    {/* Left-side Leaf icon inside the input:
                                        w-5/h-5: 20px icon.
                                        text-slate-400: muted gray color.
                                        absolute left-3 top-1/2 -translate-y-1/2: vertically centered,
                                        3px from left edge inside the input field.
                                        pointer-events-none implied (it's decorative, not interactive). */}
                                    <Leaf className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                                    {/* Credits Number Input:
                                        type="number": numeric keyboard on mobile, enforces numeric input.
                                        min="1": prevents negative or zero credit values.
                                        max={selectedCommunity.community_carbon_credit_number}:
                                          — Dynamic max from the selected community's available credits.
                                          — Prevents proposing more credits than the community has.
                                        value={creditsToBuy || ''}:
                                          — Shows the creditsToBuy state value.
                                          — "|| ''" displays empty string when value is 0 (not "0").
                                          — This prevents the confusing UX of seeing "0" pre-filled.
                                        onChange: updates creditsToBuy state on every keystroke.
                                          — Number(e.target.value): converts the string input value to number.
                                        pl-10: left padding (40px) to avoid text overlapping the Leaf icon.
                                        pr-4 py-3: right and vertical padding.
                                        bg-slate-50 border border-slate-200: subtle input background + border.
                                        rounded-xl: rounded input corners.
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500: blue focus ring.
                                        outline-none: removes default browser outline (replaced by focus:ring).
                                        placeholder: shows the max available credits as hint text. */}
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedCommunity.community_carbon_credit_number}
                                        value={creditsToBuy || ''}
                                        onChange={e => setCreditsToBuy(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder={`Max: ${selectedCommunity.community_carbon_credit_number}`}
                                        required
                                        // required: HTML5 validation — form cannot submit without a value.
                                    />
                                </div>
                            </div>

                            {/* ---- FIELD 2: Price Per Credit (INR) ---- */}
                            <div>
                                {/* Field Label: "Price Per Credit (INR)" */}
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Price Per Credit (INR)
                                </label>

                                {/* Input wrapper: relative for absolute ₹ symbol positioning. */}
                                <div className="relative">

                                    {/* ₹ Rupee Symbol inside the input (left side):
                                        Not using an icon component — the ₹ character is rendered directly.
                                        text-slate-400 font-bold: muted bold styling for the currency prefix.
                                        absolute left-4 top-1/2 -translate-y-1/2: vertically centered, 16px from left. */}
                                    <span className="text-slate-400 font-bold absolute left-4 top-1/2 -translate-y-1/2">₹</span>

                                    {/* Price Per Credit Number Input:
                                        type="number": numeric input with optional decimal support.
                                        min="0.1": minimum price of ₹0.10 per credit (prevents zero price).
                                        step="0.1": input increments in 0.1 steps (for decimal precision).
                                        value={pricePerCredit || ''}:
                                          — Shows pricePerCredit state, empty when 0.
                                          — Same "|| ''" pattern as creditsToBuy.
                                        onChange: updates pricePerCredit state on every keystroke.
                                          — Number(e.target.value): string → number conversion.
                                        pl-10: left padding to avoid overlapping the ₹ symbol.
                                        placeholder="e.g. 15.50": example value for guidance.
                                        required: HTML5 validation prevents empty submission. */}
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={pricePerCredit || ''}
                                        onChange={e => setPricePerCredit(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="e.g. 15.50"
                                        required
                                    />
                                </div>
                            </div>

                            {/* ---- LIVE TOTAL PURCHASE VALUE CALCULATOR ----
                                Displays the computed total value as the user types.
                                Updates reactively because creditsToBuy and pricePerCredit
                                are React state values — any change triggers a re-render.

                                bg-blue-50 p-4 rounded-xl border border-blue-100: blue-tinted block.
                                flex justify-between items-center: label left, value right.
                                my-6: 24px vertical margin (top + bottom) for visual separation. */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center my-6">

                                {/* Label: "Total Purchase Value"
                                    text-sm font-bold text-blue-900: readable label in dark blue. */}
                                <span className="text-sm font-bold text-blue-900">Total Purchase Value</span>

                                {/* Computed Total:
                                    (creditsToBuy || 0) * (pricePerCredit || 0):
                                      — "|| 0" fallback ensures multiplication by 0 when inputs are empty.
                                      — Avoids showing "NaN" when either field is empty/zero.
                                    .toLocaleString(undefined, { minimumFractionDigits: 2 }):
                                      — undefined: uses the browser's default locale for formatting.
                                      — minimumFractionDigits: 2 always shows 2 decimal places (e.g., ₹150.00).
                                    text-xl font-black text-blue-600: extra-bold large value in brand blue. */}
                                <span className="text-xl font-black text-blue-600">
                                    ₹{((creditsToBuy || 0) * (pricePerCredit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* ---- MODAL ACTION BUTTONS ----
                                flex gap-3: horizontal row with 12px gap between buttons.
                                Two buttons side-by-side: Cancel (left) + Send Proposal (right). */}
                            <div className="flex gap-3">

                                {/* ---- CANCEL BUTTON ----
                                    type="button": CRITICAL — prevents this button from triggering
                                    the form's onSubmit. Without type="button", clicking Cancel
                                    would submit the form.
                                    flex-1: takes equal half of the available width.
                                    bg-white border border-slate-200: outlined button style.
                                    hover:bg-slate-50: subtle gray background on hover.
                                    text-slate-600 font-bold rounded-xl: readable cancel text.

                                    onClick: setSelectedCommunity(null)
                                      — Clears the selected community → hides the modal.
                                      — NOTE: Does NOT reset creditsToBuy or pricePerCredit.
                                        Form values persist if user reopens a different community's
                                        modal (which may or may not be desired behavior). */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedCommunity(null)}
                                    className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>

                                {/* ---- SEND PROPOSAL BUTTON ----
                                    type="submit": triggers the form's onSubmit → handleProposeDeal.
                                    flex-1: takes equal half of the available width.
                                    bg-blue-600 hover:bg-blue-700: brand blue with darker hover.
                                    text-white font-bold rounded-xl: white bold text, rounded.
                                    disabled: conditionally disabled in TWO cases:
                                      1. isProposing — API call in progress (prevents double-submit)
                                      2. !creditsToBuy — credits field is 0 or empty
                                      3. !pricePerCredit — price field is 0 or empty
                                    disabled:opacity-50: dims button at 50% opacity when disabled.
                                    flex justify-center items-center: centers content (for spinner alignment).

                                    Content: conditionally renders either:
                                      - Loader2 spinner (when isProposing is true)
                                      - "Send Proposal" text (when isProposing is false)
                                    This provides visual feedback that the form is being processed. */}
                                <button
                                    type="submit"
                                    disabled={isProposing || !creditsToBuy || !pricePerCredit}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
                                >
                                    {/* Ternary: show spinner when proposing, text when idle.
                                        Loader2 animate-spin: same spinning loader as full-page loader.
                                        w-5/h-5: 20px — fits comfortably inside the button. */}
                                    {isProposing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* End of conditional modal overlay.
                When selectedCommunity is null, the entire overlay unmounts from DOM. */}

        </div>
        // End of root wrapper div — full marketplace page rendered.
    );
}
// ============================================================
// END OF FILE: AggregatorMarketplace page.tsx
// ============================================================
// Summary of what this file does:
//
// 1. DATA LOADING: On mount, fetches two API endpoints:
//    - /api/aggregator/get_marketplace_data → community listings grid
//    - /api/aggregator/analytics → portfolio data + aggregator identity
//
// 2. MARKET OVERVIEW: Dark hero card shows live stats:
//    available communities, total credit pool size, and owned credits.
//
// 3. PORTFOLIO SECTION: Shows purchased deal cards (conditionally rendered
//    only when the aggregator has existing deals).
//
// 4. LISTINGS GRID: Responsive 3-column grid of community cards
//    with name, description, available credits, and "Propose Deal" CTA.
//    Falls back to an empty state if no listings are available.
//
// 5. PROPOSAL MODAL: Appears when user clicks "Propose Deal" on any card.
//    Contains a form with credits + price inputs, a live total calculator,
//    and Submit/Cancel buttons. POSTs to /api/aggregator/aggregatordeal on submit.
// ============================================================