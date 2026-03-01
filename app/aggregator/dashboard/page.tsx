// ============================================================
// FILE: page.tsx
// DESCRIPTION: Aggregator Dashboard — Main Page Component
// FRAMEWORK: Next.js 13+ (App Router) with "use client" directive
// PURPOSE: Provides a comprehensive cockpit view for carbon credit
//          aggregators to manage deals, track analytics, and
//          monitor blockchain audit trails.
// AUTHOR: Auto-commented for documentation purposes
// ============================================================

// "use client" directive tells Next.js this component runs in the browser,
// not on the server. Required because we use browser-only APIs like useEffect,
// useState, and the router. Without this, Next.js would attempt to render
// server-side and throw errors for client-only hooks.
"use client";

// -------------------------------------------------------
// REACT IMPORTS
// -------------------------------------------------------

// useEffect: React hook for side effects (data fetching, subscriptions, DOM mutations).
// Runs AFTER the component renders. Replaces componentDidMount/componentDidUpdate
// from class-based components. We use it here for fetching dashboard data on mount.
// useState: React hook for managing local component state.
// Stores primitive values, arrays, and objects. Re-renders component when updated.
import { useEffect, useState } from 'react';

// -------------------------------------------------------
// NEXT.JS IMPORTS
// -------------------------------------------------------

// useRouter: Next.js hook for programmatic navigation.
// Used to redirect users to login or onboarding pages
// when authentication or profile checks fail.
// Works with Next.js App Router (not the legacy pages/router).
import { useRouter } from 'next/navigation';

// -------------------------------------------------------
// LUCIDE-REACT ICON IMPORTS
// -------------------------------------------------------
// Lucide is a clean, consistent open-source icon library.
// All icons below are SVG-based React components.
// We import only what we use (tree-shaking friendly).

import {
    // Users: Represents community partners / groups.
    // Used in the "Active Communities" stat card.
    Users,

    // Shield: Represents security, trust, aggregator identity.
    // Used in the header logo area for Aggregator Hub branding.
    Shield,

    // Briefcase: Represents deals and business transactions.
    // Used in the "Total Managed Deals" stat card and empty deal state.
    Briefcase,

    // TrendingUp: Represents growth, credits, market performance.
    // Used in the "Aggregated Credits" stat card, sold projects list,
    // and the Market Overview sidebar section.
    TrendingUp,

    // Bell: Notification bell icon.
    // Shown in both desktop and mobile headers with a red dot badge
    // to indicate pending notifications.
    Bell,

    // LogOut: Exit/door icon representing sign-out functionality.
    // Used on the Sign Out button in both desktop nav and mobile menu.
    LogOut,

    // ChevronRight: Small rightward arrow. (Imported but not actively
    // used in rendering — kept for potential future use or cleanup needed.)
    ChevronRight,

    // LayoutDashboard: Grid-like icon representing a dashboard view.
    // Used as the heading icon for "Active Deal Management" section.
    LayoutDashboard,

    // Search: Magnifying glass icon.
    // Used on the "Enter Carbon Exchange" quick action button.
    Search,

    // Filter: Funnel/filter icon. (Imported but not actively rendered —
    // may have been used in an earlier version or reserved for future filters.)
    Filter,

    // Plus: A "+" icon for adding new items.
    // Used on the "New Deal" button in the deal management table header.
    Plus,

    // Loader2: An animated loading spinner icon.
    // Used in the full-page loading state and the sold projects loading state.
    Loader2,

    // ArrowUpRight: Diagonal arrow, typically used for external links or growth.
    // (Imported but not actively rendered — may be reserved for future use.)
    ArrowUpRight,

    // CheckCircle2: A checkmark inside a circle, represents success/completion.
    // Used in "Total Value" stat card, "Sold Projects" section heading,
    // and the empty sold projects placeholder icon.
    CheckCircle2,

    // AlertCircle: Warning/error icon with exclamation mark.
    // (Imported but not rendered — may be used for error states in the future.)
    AlertCircle,

    // Menu: Hamburger menu icon (three horizontal lines).
    // Shown in mobile header when menu is closed, toggling the dropdown.
    Menu,

    // X: Close/dismiss icon.
    // Shown in mobile header when menu is open, allowing user to close it.
    X,

    // Globe: World/globe icon.
    // Used as a decorative background icon in the "Quick Actions" sidebar card.
    Globe,

    // Package: Box/package icon.
    // Used on the "Project Builder" quick action link button.
    Package,

    // Lock: Padlock icon representing security.
    // Used as the heading icon for the "Audit Trail (SHA-256)" sidebar section.
    Lock

} from 'lucide-react';

// -------------------------------------------------------
// NEXT.JS LINK COMPONENT
// -------------------------------------------------------
// Link is Next.js's built-in client-side navigation component.
// It prefetches linked routes for faster page transitions and
// avoids full browser page reloads (unlike <a> tags).
// Used for all internal navigation (dashboard, projects, marketplace).
import Link from 'next/link';

// ============================================================
// TYPESCRIPT INTERFACES
// ============================================================
// These interfaces define the shape of data returned by our
// API endpoints. They provide compile-time type safety and
// autocomplete support in IDEs like VS Code.
// ============================================================

// -------------------------------------------------------
// AggregatorProfile Interface
// -------------------------------------------------------
// Represents the minimal profile data returned by the
// /api/aggregator/verifyaggregator endpoint.
// DealerId: A unique identifier string assigned to each
// aggregator at onboarding. Displayed in the header.
interface AggregatorProfile {
    DealerId: string; // Unique aggregator ID, e.g. "AGG-00123"
}

// -------------------------------------------------------
// RecentDeal Interface
// -------------------------------------------------------
// Represents a single carbon credit deal as returned by
// the analytics API inside the recentDeals array.
interface RecentDeal {
    _id: string;           // MongoDB ObjectId (unique identifier for the deal)
    type: string;          // Deal type: "Community" or another category (e.g., "Project")
    entityId: string;      // The ID of the entity (community or project) involved
    entityName: string;    // Human-readable name of the entity (displayed in deal table)
    credits: number;       // Number of carbon credits purchased in this deal
    pricePerCredit: number; // Price paid per individual credit in INR (₹)
    totalValue: number;    // Total monetary value of the deal: credits × pricePerCredit
    createdAt: string;     // ISO 8601 timestamp of when the deal was created
}

// -------------------------------------------------------
// Analytics Interface
// -------------------------------------------------------
// Represents the aggregated analytics data for the
// current aggregator, returned by /api/aggregator/analytics.
interface Analytics {
    aggregatorId: string;       // The ID of the aggregator this data belongs to
    totalDeals: number;         // Total number of deals completed by this aggregator
    totalCredits: number;       // Sum of all carbon credits purchased across all deals
    totalValue: number;         // Total monetary value of all deals combined (in INR ₹)
    activeCommunities: number;  // Number of distinct community partners
    recentDeals: RecentDeal[];  // Array of recent individual deals (newest first typically)
}

// -------------------------------------------------------
// AuditEntry Interface
// -------------------------------------------------------
// Represents a single entry in the blockchain audit trail.
// Audit logs track important actions (deal creation, approvals,
// credit transfers) using SHA-256 hashes for tamper detection.
interface AuditEntry {
    _id: string;        // MongoDB ObjectId for the audit log document
    action: string;     // Action type, e.g. "DEAL_CREATED", "CREDIT_TRANSFERRED"
    entityType: string; // The type of entity involved, e.g. "Community", "Project"
    txHash: string;     // SHA-256 hash of the transaction (blockchain-style audit trail)
    timestamp: string;  // ISO 8601 timestamp of when the action occurred
    metadata: any;      // Flexible object for additional context (varies by action type)
}

// ============================================================
// MAIN COMPONENT: AggregatorDashboard
// ============================================================
// This is the default export and the root component rendered
// at the /aggregator/dashboard route. It handles:
//   1. Authentication verification
//   2. Profile loading & aggregator onboarding redirect
//   3. Analytics, sold projects, and audit log fetching
//   4. Full dashboard layout rendering (header + main + sidebar)
// ============================================================
export default function AggregatorDashboard() {

    // -------------------------------------------------------
    // ROUTER SETUP
    // -------------------------------------------------------
    // useRouter gives us programmatic navigation.
    // We use router.push() to redirect unauthenticated users
    // to /login and unregistered aggregators to /aggregator/onboarding.
    const router = useRouter();

    // -------------------------------------------------------
    // STATE DECLARATIONS
    // -------------------------------------------------------
    // All state variables for this component are declared below.
    // React re-renders the component whenever any state changes.

    // profile: Stores the logged-in aggregator's profile data.
    // Initially null — remains null until the API call succeeds.
    // Used to display the DealerId in the header.
    const [profile, setProfile] = useState<AggregatorProfile | null>(null);

    // analytics: Stores the aggregated deal analytics data.
    // Initially null — populated after /api/aggregator/analytics responds.
    // Drives the stat cards and the recent deals table.
    const [analytics, setAnalytics] = useState<Analytics | null>(null);

    // soldProjects: Array of projects the aggregator has sold to companies.
    // Initially empty — populated after /api/aggregator/sold_projects responds.
    // Rendered in the "Sold Projects" section below the deal table.
    const [soldProjects, setSoldProjects] = useState<any[]>([]);

    // auditLogs: Array of audit trail entries with SHA-256 hashes.
    // Initially empty — populated after /api/auditlogs responds.
    // Rendered in the "Audit Trail" sidebar section.
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

    // isLoading: Controls the full-page loading spinner visibility.
    // Starts as true (show spinner immediately) and becomes false
    // once ALL initial data fetching is complete (or fails).
    const [isLoading, setIsLoading] = useState(true);

    // soldLoading: Controls a localized spinner for the sold projects section.
    // Separate from isLoading so the rest of the dashboard can appear
    // while sold projects data is still being fetched independently.
    const [soldLoading, setSoldLoading] = useState(false);

    // mobileMenuOpen: Controls the visibility of the mobile navigation dropdown.
    // Toggled by the hamburger/close button in the mobile header.
    // When true, the mobile nav menu slides down with links and sign out.
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // -------------------------------------------------------
    // DATA FETCHING: useEffect
    // -------------------------------------------------------
    // This effect runs once after the component mounts (due to the
    // empty dependency array [router]). It fetches all necessary
    // data in sequence:
    //   1. Verify aggregator profile (auth check + onboarding redirect)
    //   2. Fetch live analytics data
    //   3. Fetch audit logs
    //   4. Fetch sold projects (independent loading state)
    //
    // All fetches are wrapped in a try/catch to handle network errors
    // gracefully without crashing the component.
    //
    // NOTE: router is included in the dependency array to satisfy
    // React's exhaustive-deps lint rule. The effect only runs once
    // since router reference is stable between renders.
    useEffect(() => {
        // Define the async data-fetching function inside useEffect.
        // We cannot make useEffect's callback directly async, so we
        // define and immediately call an inner async function instead.
        const fetchData = async () => {
            try {
                // ---------------------------------------------------
                // STEP 1: Verify Aggregator Profile
                // ---------------------------------------------------
                // Call the verification endpoint to check:
                //   a) Is the user authenticated? (valid session cookie)
                //   b) Do they have an aggregator profile in the database?
                // If either check fails, we redirect them appropriately.
                const profileRes = await fetch('/api/aggregator/verifyaggregator');

                // Check if the HTTP response was successful (status 200-299).
                // A non-ok response typically means the user is not authenticated
                // (e.g., expired session, no cookie) — redirect to /login.
                if (profileRes.ok) {
                    // Parse the JSON response body from the profile API.
                    // Expected shape: { exists: boolean, aggregator: AggregatorProfile }
                    const profileData = await profileRes.json();

                    // Check if the authenticated user has an aggregator profile.
                    // "exists: true" means they've completed onboarding.
                    // "exists: false" means they're authenticated but haven't
                    // set up their aggregator account yet — send to onboarding.
                    if (profileData.exists) {
                        // Profile found — store in state for display in the header.
                        // This triggers a re-render that shows the DealerId.
                        setProfile(profileData.aggregator);
                    } else {
                        // No aggregator profile found — user needs to complete onboarding.
                        // Push to onboarding page and exit fetchData early via return.
                        // The "return" prevents further API calls for a user who
                        // hasn't set up their aggregator profile.
                        router.push('/aggregator/onboarding');
                        return; // Exit fetchData — no need to load dashboard data
                    }
                } else {
                    // Non-OK response (401 Unauthorized, 403 Forbidden, etc.)
                    // User is not authenticated — redirect to login page.
                    // Return after redirecting to prevent further fetch calls.
                    router.push('/login');
                    return; // Exit fetchData — user must log in first
                }

                // ---------------------------------------------------
                // STEP 2: Fetch Live Analytics Data
                // ---------------------------------------------------
                // Fetch aggregated stats for the current aggregator including
                // totalDeals, totalCredits, totalValue, activeCommunities,
                // and an array of recentDeals for the deal management table.
                const analyticsRes = await fetch('/api/aggregator/analytics');

                // Only process analytics if the request was successful.
                // We use a soft check here (no redirect on failure) so
                // the dashboard can still partially render even if analytics
                // data is temporarily unavailable.
                if (analyticsRes.ok) {
                    // Parse the analytics JSON and store it in state.
                    // The stat cards and deals table read from this state.
                    const analyticsData = await analyticsRes.json();
                    setAnalytics(analyticsData);
                }
                // Note: We don't handle analyticsRes failures with redirects —
                // the dashboard will show default zero values instead.

                // ---------------------------------------------------
                // STEP 3: Fetch Audit Logs
                // ---------------------------------------------------
                // Fetch the 10 most recent audit log entries for this aggregator.
                // The limit=10 query param is passed to avoid fetching thousands
                // of records. Audit logs are displayed in the sidebar.
                const auditRes = await fetch('/api/auditlogs?limit=10');

                // Only process if the request succeeded.
                // Audit logs are a secondary feature — failure doesn't block the dashboard.
                if (auditRes.ok) {
                    // Parse the response — expected shape: { logs: AuditEntry[] }
                    // The "|| []" fallback ensures we always set an array, even if
                    // "logs" is undefined or null in the response (defensive coding).
                    const auditData = await auditRes.json();
                    setAuditLogs(auditData.logs || []);
                }
                // Note: Audit log failures are silently ignored — the sidebar
                // will show "No audit logs yet." as a graceful empty state.

                // ---------------------------------------------------
                // STEP 4: Fetch Sold Projects (Independent Loading State)
                // ---------------------------------------------------
                // Set soldLoading to true BEFORE the fetch starts.
                // This renders a localized spinner in the Sold Projects section
                // while other parts of the dashboard are already visible.
                setSoldLoading(true);

                // Fetch projects that this aggregator has bundled and sold to companies.
                // This is a potentially slower query (joins project + buyer + sale data).
                const soldRes = await fetch('/api/aggregator/sold_projects');

                // Only process if the request succeeded.
                // Failure shows the empty state UI ("No Projects Sold") gracefully.
                if (soldRes.ok) {
                    // Parse the response — expected shape: { soldProjects: any[] }
                    // The "|| []" fallback ensures soldProjects state is always an array.
                    const soldData = await soldRes.json();
                    setSoldProjects(soldData.soldProjects || []);
                }

                // Sold projects fetch is done — hide the localized spinner.
                // This is set AFTER the fetch resolves (whether successful or not).
                setSoldLoading(false);

            } catch (err) {
                // Catch any network-level errors (e.g., no internet, server down)
                // or JSON parse errors from any of the fetch calls above.
                // We log the error for debugging but don't crash the component.
                // The dashboard renders with whatever data was successfully fetched.
                console.error('Failed to fetch data:', err);
            } finally {
                // The "finally" block always runs, whether the try succeeded or
                // the catch handled an error. We set isLoading to false here
                // to dismiss the full-page spinner in all scenarios.
                // This prevents the loading state from getting "stuck" on error.
                setIsLoading(false);
            }
        };

        // Immediately invoke the async function defined above.
        // This is the standard pattern for async operations in useEffect.
        fetchData();

    }, [router]); // Dependency array: re-run if router reference changes (it won't).
    // In practice this runs exactly once after mount, like componentDidMount.

    // ============================================================
    // HELPER FUNCTION: getRelativeTime
    // ============================================================
    // Converts an ISO 8601 timestamp string into a human-friendly
    // relative time string like "Just now", "5m ago", "3h ago", "2d ago".
    //
    // Used in the Sold Projects section to show when each project was sold.
    //
    // Parameters:
    //   timestamp (string): ISO 8601 date string, e.g. "2024-01-15T10:30:00Z"
    //
    // Returns:
    //   A human-readable relative time string.
    //
    // Example:
    //   getRelativeTime("2024-01-15T09:00:00Z") // "3h ago" (if current time is noon)
    const getRelativeTime = (timestamp: string) => {
        // Get the current date/time in milliseconds since epoch.
        const now = new Date();

        // Parse the ISO 8601 timestamp string into a Date object.
        // JavaScript's Date constructor handles standard ISO strings automatically.
        const then = new Date(timestamp);

        // Calculate the difference in seconds between now and the past timestamp.
        // Math.floor rounds down to avoid showing "1m ago" too early.
        // We divide by 1000 to convert milliseconds to seconds.
        const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        // Less than 60 seconds ago — show "Just now" for a fresh, real-time feel.
        if (diffInSeconds < 60) return 'Just now';

        // Between 60 seconds and 3600 seconds (1 hour) — show minutes.
        // Math.floor(diffInSeconds / 60) gives whole minutes elapsed.
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;

        // Between 3600 seconds (1 hour) and 86400 seconds (1 day) — show hours.
        // Math.floor(diffInSeconds / 3600) gives whole hours elapsed.
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

        // 86400 seconds or more (1 day or longer) — show days.
        // Math.floor(diffInSeconds / 86400) gives whole days elapsed.
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    // ============================================================
    // HANDLER: handleLogout
    // ============================================================
    // Asynchronously logs the current user out by calling the
    // logout API endpoint, which clears the session/cookie server-side.
    // After successful logout (or even on failure), navigates to /login.
    //
    // The POST method is used (not GET) to comply with REST conventions
    // where state-changing operations should use POST/PUT/DELETE.
    const handleLogout = async () => {
        try {
            // Call the logout API endpoint with POST method.
            // The server will invalidate the session cookie.
            // We don't need to read the response body — just the status.
            await fetch('/api/auth/logout', { method: 'POST' });

            // After successfully logging out, redirect to the login page.
            // The user's session cookie is now invalidated server-side.
            router.push('/login');
        } catch (err) {
            // If the logout API call fails (network error, server error),
            // log the error. We still redirect to /login since the user
            // intends to leave the dashboard regardless of API success.
            console.error('Logout failed:', err);
        }
    };

    // ============================================================
    // EARLY RETURN: Loading State
    // ============================================================
    // While isLoading is true (data is being fetched), render a
    // centered full-page loading indicator instead of the dashboard.
    // This prevents rendering the dashboard with undefined/null data.
    //
    // The spinner is shown immediately on first render (isLoading starts true)
    // and disappears once all fetch calls in useEffect complete.
    if (isLoading) {
        return (
            // Full-screen container centered both horizontally and vertically.
            // bg-slate-50 provides a subtle gray background matching the dashboard.
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">

                {/* Flex column layout for spinner + message, spaced with gap-4 */}
                <div className="flex flex-col items-center gap-4">

                    {/* Loader2 is a spinning icon from Lucide. 
                        The "animate-spin" Tailwind class applies a CSS rotation animation.
                        w-10/h-10 gives it a 2.5rem size. text-slate-400 colors the SVG stroke. */}
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400" />

                    {/* Descriptive loading message below the spinner.
                        "cockpit" is a fun aviation metaphor for a dashboard control center. */}
                    <p className="text-slate-500 font-medium">Loading your cockpit...</p>
                </div>
            </div>
        );
    }
    // If isLoading is false, continue rendering the full dashboard below.

    // ============================================================
    // MAIN RENDER: Full Dashboard Layout
    // ============================================================
    // Renders the complete dashboard UI after all data is loaded.
    // Structure:
    //   1. Wrapper div (full screen background)
    //   2. <header> — Fixed top navigation bar (desktop + mobile)
    //   3. <main> — Main content area
    //      a. Stats Grid (4 stat cards)
    //      b. Main Grid (deal table + sold projects | sidebar)
    //         - Active Deal Management table
    //         - Sold Projects section
    //         - Market Overview sidebar
    //         - Quick Actions sidebar
    //         - Audit Trail sidebar
    // ============================================================
    return (
        // Root wrapper div with minimum full-screen height.
        // bg-[#F8FAFC] is a custom hex color — a very light cool gray/blue.
        // Using a custom hex allows precision beyond Tailwind's default palette.
        <div className="min-h-screen bg-[#F8FAFC]">

            {/* ==================================================
                HEADER: Fixed Navigation Bar
                ==================================================
                Position: fixed (stays at top when scrolling).
                Layers: z-50 ensures it appears above all content.
                Background: semi-transparent white with backdrop blur
                            for a "frosted glass" effect on scroll.
                Border: subtle bottom border separating it from content.
                Height: 64px on mobile (h-16), 80px on desktop (sm:h-20).
            ================================================== */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">

                {/* Inner container: max-width 7xl, horizontal padding, flex row layout.
                    Items are vertically centered. Space between left logo and right actions. */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">

                    {/* ---- LOGO + BRAND SECTION ---- */}
                    {/* Flex row with gap-3 between icon and text block. */}
                    <div className="flex items-center gap-3">

                        {/* Logo Icon Container:
                            - w-8/h-8 on mobile, w-10/h-10 on larger screens (responsive sizing)
                            - bg-blue-600: vivid blue brand color background
                            - rounded-xl: rounded corners for modern look
                            - Shadow: subtle blue-tinted drop shadow for depth
                            - shrink-0: prevents the icon from shrinking in flex layout */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">

                            {/* Shield icon inside logo box.
                                Smaller on mobile (w-5/h-5), slightly larger on desktop (sm:w-6/h-6).
                                Represents security and trust — fitting for a financial platform. */}
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>

                        {/* Brand text block next to the logo icon. */}
                        <div>
                            {/* App name: "Aggregator Hub"
                                - text-base on mobile, text-xl on desktop (responsive text size)
                                - font-bold and tracking-tight for a strong brand feel
                                - leading-none removes extra line height (tightens the stacked text)
                                - mb-1 adds a tiny gap before the DealerId below */}
                            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Aggregator Hub</h1>

                            {/* Aggregator's unique DealerId displayed below the app name.
                                - Uses optional chaining (?.) to avoid errors if profile is null.
                                - font-mono: monospace font suits ID/code-like strings.
                                - uppercase + tracking-wider: spaced uppercase looks professional.
                                - text-[10px]: extra-small for a subtle, secondary label feel. */}
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">{profile?.DealerId}</p>
                        </div>
                    </div>

                    {/* ---- DESKTOP NAVIGATION LINKS ----
                        Hidden on mobile (hidden md:flex).
                        Shows three navigation links: Dashboard, Projects, Marketplace.
                        mr-6 adds right margin to separate nav from action buttons. */}
                    <nav className="hidden md:flex items-center gap-6 mr-6">

                        {/* Dashboard link — currently active page.
                            Uses text-blue-600 (active color) vs text-slate-500 (inactive).
                            No hover styles needed since this IS the current page. */}
                        <Link href="/aggregator/dashboard" className="text-sm font-bold text-blue-600">Dashboard</Link>

                        {/* Projects link — navigates to project management page.
                            Hover changes text from slate-500 to slate-900 for visual feedback. */}
                        <Link href="/aggregator/project" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Projects</Link>

                        {/* Marketplace link — navigates to the Carbon Exchange/marketplace.
                            Same inactive styling pattern as Projects link. */}
                        <Link href="/aggregator/marketplace" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Marketplace</Link>
                    </nav>

                    {/* ---- DESKTOP ACTION BUTTONS (hidden on mobile) ---- */}
                    <div className="hidden md:flex items-center gap-3">

                        {/* Notification Bell Button:
                            - Circular hover state (rounded-full + hover:bg-slate-100)
                            - "relative" positioning to anchor the notification badge dot
                            - The red dot badge uses absolute positioning */}
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">

                            {/* Bell icon — standard notification/alerts bell */}
                            <Bell className="w-5 h-5" />

                            {/* Notification badge — small red dot in top-right corner.
                                - absolute positioned relative to the button container
                                - top-1.5/right-1.5: slightly inset from corner
                                - w-2/h-2: 8px dot size
                                - bg-red-500: vivid red to grab attention
                                - border-2 border-white: white border separates dot from icon */}
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>

                        {/* Vertical divider between notification bell and sign out button.
                            - h-6 gives it 24px height (matches icon height)
                            - w-px makes it 1px wide (hairline separator)
                            - bg-slate-200: light gray color for a subtle visual separator
                            - mx-1: small horizontal margins on each side */}
                        <div className="h-6 w-px bg-slate-200 mx-1" />

                        {/* Sign Out Button:
                            - Calls handleLogout on click to invalidate session
                            - flex layout to align the LogOut icon and "Sign Out" text
                            - px-4/py-2 padding for a comfortable click target
                            - Subtle hover background (hover:bg-slate-50) and border
                            - transition-all for smooth hover animation */}
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-all text-sm border border-transparent">

                            {/* LogOut icon — door-with-arrow icon indicating exit action */}
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>

                    {/* ---- MOBILE HEADER ACTIONS (visible only on small screens) ----
                        Shows notification bell and hamburger/close menu toggle button. */}
                    <div className="flex md:hidden items-center gap-2">

                        {/* Mobile Notification Bell — same visual as desktop bell with badge */}
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            {/* Red notification dot badge — identical to desktop version */}
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>

                        {/* Mobile Menu Toggle Button (Hamburger ↔ X):
                            Clicking toggles mobileMenuOpen state between true and false.
                            When mobileMenuOpen is true, shows X icon (close).
                            When mobileMenuOpen is false, shows Menu icon (open). */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">

                            {/* Conditional rendering: show X when open, Menu (hamburger) when closed.
                                The ternary operator switches icon based on mobileMenuOpen state. */}
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* ==================================================
                    MOBILE DROPDOWN MENU
                    ==================================================
                    Only rendered when mobileMenuOpen is true.
                    Uses conditional rendering (short-circuit &&).
                    Appears below the header with a border separator.
                    Contains nav links and sign out — mirrors desktop nav.
                ================================================== */}
                {mobileMenuOpen && (
                    // Mobile menu container:
                    // - md:hidden: hidden on medium+ screens (desktop handles its own nav)
                    // - bg-white: solid white background (not frosted glass like header)
                    // - border-t: top border separating from header content
                    // - px-4/py-3: comfortable padding around menu items
                    // - shadow-lg: drop shadow to visually separate from page content below
                    <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 shadow-lg">

                        {/* Dashboard mobile link — block makes it full-width for easy tapping.
                            text-slate-900 (darker) indicates this is the current active page. */}
                        <Link href="/aggregator/dashboard" className="block w-full px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-lg">Dashboard</Link>

                        {/* Projects mobile link — text-slate-600 (lighter) for inactive state. */}
                        <Link href="/aggregator/project" className="block w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Projects</Link>

                        {/* Marketplace mobile link — same inactive styling as Projects link. */}
                        <Link href="/aggregator/marketplace" className="block w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Marketplace</Link>

                        {/* Mobile Sign Out Button:
                            - Full width for easy tapping
                            - text-red-500: red color signals a destructive/exit action
                            - hover:bg-red-50: subtle red background on hover
                            - border-t: top border visually separates from nav links
                            - Calls handleLogout on click (same handler as desktop) */}
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 transition-all text-sm rounded-lg border-t border-slate-50 mt-2 pt-4">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </header>

            {/* ==================================================
                MAIN CONTENT AREA
                ==================================================
                - max-w-7xl + mx-auto: centered, max-width constrained
                - px-4 sm:px-6: responsive horizontal padding
                - pt-24 sm:pt-32: top padding accounts for the fixed header height
                  (header is 64px mobile / 80px desktop, pt includes extra breathing room)
                - pb-20: bottom padding prevents content from touching viewport bottom
            ================================================== */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">

                {/* ==================================================
                    SECTION 1: STATS GRID (4 KPI Cards)
                    ==================================================
                    Displays four key performance indicators:
                    1. Total Managed Deals
                    2. Aggregated Credits
                    3. Active Communities
                    4. Total Value (₹)

                    Layout:
                    - 1 column on mobile (full-width cards stacked vertically)
                    - 2 columns on small screens (sm:grid-cols-2)
                    - 4 columns on large screens (lg:grid-cols-4)
                    - gap-4/sm:gap-6: responsive gutters between cards
                    - mb-8/sm:mb-12: bottom margin separates from main content below
                ================================================== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">

                    {/* ---- STAT CARD 1: Total Managed Deals ----
                        Shows total number of accepted community deals.
                        Value: analytics.totalDeals (number, fallback 0).
                        String() converts the number to string for the value prop.
                        Color: "blue" theme for the icon badge. */}
                    <StatCard
                        title="Total Managed Deals"

                        // analytics?.totalDeals: optional chaining to safely access
                        // totalDeals when analytics is null (before data loads).
                        // ?? 0: nullish coalescing fallback — shows 0 if null/undefined.
                        // String(): converts number to string (StatCard expects string value).
                        value={String(analytics?.totalDeals ?? 0)}

                        // Descriptive subtitle shown below the main value.
                        change="Accepted community deals"

                        // Briefcase icon: represents business/deals.
                        icon={<Briefcase className="w-5 h-5" />}

                        // Blue color theme for this card's icon badge.
                        color="blue"
                    />

                    {/* ---- STAT CARD 2: Aggregated Credits ----
                        Shows total carbon credits purchased across all deals.
                        Value: analytics.totalCredits (number, fallback 0).
                        .toLocaleString(): adds thousands separators (1,000,000 etc.).
                        Color: "emerald" theme — green suits environmental/credits data. */}
                    <StatCard
                        title="Aggregated Credits"

                        // .toLocaleString() formats number with locale-appropriate
                        // thousands separators (e.g., 50000 → "50,000").
                        value={(analytics?.totalCredits ?? 0).toLocaleString()}

                        // Subtitle clarifying what "credits" means.
                        change="Total CRD purchased"

                        // TrendingUp icon: represents growth in credit holdings.
                        icon={<TrendingUp className="w-5 h-5" />}

                        // Emerald (green) color theme — aligns with environmental theme.
                        color="emerald"
                    />

                    {/* ---- STAT CARD 3: Active Communities ----
                        Shows the number of unique community partners this
                        aggregator has engaged with through deals.
                        Color: "indigo" — distinct from blue/emerald for visual variety. */}
                    <StatCard
                        title="Active Communities"

                        // Convert activeCommunities number to string for the prop.
                        value={String(analytics?.activeCommunities ?? 0)}

                        // Subtitle clarifying "communities" = partner organizations.
                        change="Unique community partners"

                        // Users icon: represents groups/communities of people.
                        icon={<Users className="w-5 h-5" />}

                        // Indigo color theme for visual variety in the stat grid.
                        color="indigo"
                    />

                    {/* ---- STAT CARD 4: Total Value (₹) ----
                        Shows the total INR value of all deals combined.
                        Prefixed with "₹" (Indian Rupee symbol) for currency context.
                        Color: "amber" — gold/amber suits monetary/financial value. */}
                    <StatCard
                        title="Total Value (₹)"

                        // Template literal prefixes the formatted number with ₹ symbol.
                        // .toLocaleString() adds thousands separators for readability.
                        value={`₹${(analytics?.totalValue ?? 0).toLocaleString()}`}

                        // Subtitle clarifying this is the credit portfolio monetary value.
                        change="Credit portfolio value"

                        // CheckCircle2 icon: represents verified/completed value.
                        icon={<CheckCircle2 className="w-5 h-5" />}

                        // Amber (gold) color theme — visually signals monetary value.
                        color="amber"
                    />
                </div>

                {/* ==================================================
                    SECTION 2: MAIN CONTENT GRID
                    ==================================================
                    Two-column layout on large screens:
                    - Left (lg:col-span-8): Main content (deals table + sold projects)
                    - Right (lg:col-span-4): Sidebar (market overview + quick actions + audit)

                    On smaller screens, both sections stack vertically (single column).
                    gap-8: 32px gutters between the two columns.
                ================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ==================================================
                        LEFT COLUMN: Main Content (8/12 width on large screens)
                        Contains:
                        1. Active Deal Management Table
                        2. Sold Projects Section
                    ================================================== */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* ==================================================
                            SECTION 2A: ACTIVE DEAL MANAGEMENT TABLE
                            ==================================================
                            Displays recent deals with:
                            - Entity name (community/project partner)
                            - Deal type (Community or other)
                            - Credits purchased
                            - Price per credit
                            - Total deal value

                            If no deals exist, renders an empty state with a CTA.

                            overflow-x-auto: Enables horizontal scroll on mobile
                            so the table doesn't overflow its container.
                        ================================================== */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">

                            {/* ---- TABLE HEADER / SECTION TITLE ---- */}
                            {/* flex row between title and "New Deal" button.
                                min-w-[600px]: ensures header doesn't collapse too narrow on mobile.
                                border-b: separates header from the table content below. */}
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between min-w-[600px]">

                                {/* Section title with dashboard icon.
                                    gap-2 aligns icon and text horizontally. */}
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">

                                    {/* LayoutDashboard icon styled in blue to match brand color */}
                                    <LayoutDashboard className="w-5 h-5 text-blue-600" />
                                    Active Deal Management
                                </h2>

                                {/* "New Deal" button — navigates to Marketplace.
                                    Dark (bg-slate-900) filled button for high visual weight.
                                    rounded-xl gives softer corners than a standard button.
                                    text-xs: small text since this is a compact action button.
                                    hover:bg-slate-800: subtle darkening on hover. */}
                                <Link href="/aggregator/marketplace" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">

                                    {/* Plus icon: visually communicates "add/create" intent */}
                                    <Plus className="w-4 h-4" /> New Deal
                                </Link>
                            </div>

                            {/* ---- CONDITIONAL: DEAL TABLE OR EMPTY STATE ----
                                Check if analytics data exists AND has deals in recentDeals array.
                                The "&&" short-circuits if analytics is null (data not yet loaded).
                                If recentDeals.length > 0, render the table; otherwise render empty state. */}
                            {analytics?.recentDeals && analytics.recentDeals.length > 0 ? (

                                // ---- DEALS TABLE ----
                                // Standard HTML table for tabular deal data.
                                // w-full: takes full width of container.
                                // text-left: aligns text to left (default for tables).
                                // border-collapse: removes double borders between cells.
                                // min-w-[600px]: prevents table from collapsing too narrow;
                                //                parent overflow-x-auto handles overflow.
                                <table className="w-full text-left border-collapse min-w-[600px]">

                                    {/* ---- TABLE HEADER ROW ----
                                        bg-slate-50/50: very subtle gray background (50% opacity).
                                        Column headers use tiny uppercase text for a data-grid feel. */}
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            {/* Entity Column Header — shows community/project name */}
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</th>

                                            {/* Type Column Header — "Community" or other deal types */}
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>

                                            {/* Credits Column Header — number of carbon credits */}
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credits</th>

                                            {/* Rate Column Header — price per credit in INR */}
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate (₹)</th>

                                            {/* Total Column Header — right-aligned for numbers convention */}
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total (₹)</th>
                                        </tr>
                                    </thead>

                                    {/* ---- TABLE BODY ----
                                        divide-y: adds horizontal dividers between rows.
                                        divide-slate-50: very light divider color.
                                        text-sm: standard readable text size for data rows. */}
                                    <tbody className="divide-y divide-slate-50 text-sm">

                                        {/* Map over recentDeals array to render one row per deal.
                                            key={deal._id}: MongoDB ObjectId used as React key for
                                            efficient list diffing/reconciliation. */}
                                        {analytics.recentDeals.map((deal) => (

                                            // ---- INDIVIDUAL DEAL ROW ----
                                            // hover:bg-slate-50/50: subtle row highlight on hover.
                                            // group: enables group-hover utilities on child elements.
                                            // transition-colors: smooth color transition on hover.
                                            <tr key={deal._id} className="hover:bg-slate-50/50 transition-colors group">

                                                {/* Entity Name Cell:
                                                    - font-bold + text-slate-900: strong, dark text
                                                    - text-xs: slightly smaller than body for dense tables */}
                                                <td className="px-6 py-4 font-bold text-slate-900 text-xs">{deal.entityName}</td>

                                                {/* Deal Type Cell:
                                                    Contains a colored badge/pill showing the deal type.
                                                    Conditional styling: Community → indigo badge, others → emerald badge.
                                                    The ternary operator switches Tailwind classes based on deal.type. */}
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${deal.type === 'Community' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {/* Display the deal type text inside the badge */}
                                                        {deal.type}
                                                    </span>
                                                </td>

                                                {/* Credits Cell:
                                                    - .toLocaleString(): formats number with thousands separators
                                                    - " CRD" suffix: clarifies unit (CRD = Carbon Credits)
                                                    - text-slate-600 font-medium: medium-weight slightly muted text */}
                                                <td className="px-6 py-4 text-slate-600 font-medium">{deal.credits.toLocaleString()} CRD</td>

                                                {/* Price Per Credit Cell:
                                                    - .toFixed(2): formats to exactly 2 decimal places (₹XX.XX)
                                                    - ₹ prefix: Indian Rupee currency symbol
                                                    - Consistent with other monetary value displays */}
                                                <td className="px-6 py-4 text-slate-600 font-medium">₹{deal.pricePerCredit.toFixed(2)}</td>

                                                {/* Total Value Cell (right-aligned):
                                                    - text-right: right-aligns numbers (standard financial convention)
                                                    - font-bold: emphasizes the total as the most important value
                                                    - text-emerald-600: green color signals positive monetary value */}
                                                <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{deal.totalValue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            ) : (
                                // ---- EMPTY STATE: No Deals Yet ----
                                // Shown when analytics data loaded but recentDeals is empty.
                                // Centered content with icon, heading, and instruction text.
                                <div className="p-12 text-center">

                                    {/* Large muted Briefcase icon as visual anchor for the empty state.
                                        text-slate-300: very light to not overpower the message text. */}
                                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                                    {/* Primary empty state message */}
                                    <p className="text-sm text-slate-500 font-medium">No deals yet</p>

                                    {/* Secondary guidance — tells user where to go to create their first deal */}
                                    <p className="text-xs text-slate-400 mt-1">Visit the Carbon Exchange to propose deals to communities.</p>
                                </div>
                            )}
                        </section>

                        {/* ==================================================
                            SECTION 2B: SOLD PROJECTS
                            ==================================================
                            Displays projects bundled by the aggregator that have
                            been purchased by companies from the marketplace.

                            Each sold project shows:
                            - Project name
                            - Buyer (company that purchased)
                            - Credits sold
                            - Time since sale
                            - Total sale value
                            - Aggregator profit (margin earned)

                            Has its own loading state (soldLoading) independent
                            from the main dashboard loading state.

                            mt-8: additional top margin (stacked below deals table
                            with space-y-8 already, this provides extra spacing).
                        ================================================== */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 mt-8">

                            {/* ---- SECTION HEADER ---- */}
                            {/* border-b + pb-5 + mb-5: separator between header and content */}
                            <div className="border-b border-slate-50 pb-5 mb-5">

                                {/* Section title with green checkmark icon.
                                    CheckCircle2 icon in emerald green visually signals "completed sales". */}
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    Sold Projects
                                </h2>

                                {/* Subtitle: clarifies these are sales TO companies (B2B context).
                                    text-[10px] uppercase tracking-widest: matches the header style
                                    used throughout other sections for visual consistency. */}
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Sales to Companies</p>
                            </div>

                            {/* ---- CONDITIONAL RENDERING FOR SOLD PROJECTS ----
                                Three possible states handled with ternary operators:
                                1. soldLoading: Show spinner (fetch in progress)
                                2. soldProjects.length === 0: Show empty state
                                3. soldProjects.length > 0: Show project cards */}
                            {soldLoading ? (
                                // ---- STATE 1: LOADING ----
                                // Shows a centered spinner while sold projects are being fetched.
                                // py-12: generous vertical padding to center the spinner nicely.
                                <div className="py-12 text-center">

                                    {/* Loader2 with animate-spin: same spinner pattern as full-page loader.
                                        text-slate-300: muted color since this is a secondary section loader. */}
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                                </div>

                            ) : soldProjects.length === 0 ? (
                                // ---- STATE 2: EMPTY STATE ----
                                // Shown when fetch succeeded but no projects have been sold yet.
                                // Styled as a dashed-border placeholder to invite action.
                                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50">

                                    {/* Large muted icon as visual anchor for the empty state message */}
                                    <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />

                                    {/* Primary empty state headline */}
                                    <h3 className="text-sm font-bold text-slate-700 mb-1">No Projects Sold</h3>

                                    {/* Instructional text explaining HOW projects appear here.
                                        max-w-sm mx-auto: constrain text width for readable line length. */}
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        Projects you bundle and list in the marketplace will appear here once purchased by a company.
                                    </p>
                                </div>

                            ) : (
                                // ---- STATE 3: SOLD PROJECTS LIST ----
                                // Renders a card for each sold project.
                                // space-y-4: 16px gap between consecutive project cards.
                                <div className="space-y-4">

                                    {/* Map over soldProjects array to render one card per project.
                                        key={project._id}: MongoDB ObjectId as stable React key. */}
                                    {soldProjects.map((project) => (

                                        // ---- INDIVIDUAL SOLD PROJECT CARD ----
                                        // p-5: comfortable internal padding.
                                        // rounded-2xl: large rounded corners for card look.
                                        // border border-slate-100: subtle card border.
                                        // hover:bg-slate-50/50: slight background change on hover.
                                        // group: enables group-hover on child elements.
                                        <div key={project._id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-all group">

                                            {/* ---- CARD INNER LAYOUT ----
                                                flex-col on mobile, flex-row on sm+ (responsive flex direction).
                                                justify-between: pushes left content and right value to edges.
                                                gap-4: space between the two sections on mobile (stacked). */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                                {/* ---- LEFT SECTION: Icon + Project Info ---- */}
                                                <div className="flex items-start gap-4">

                                                    {/* Project Icon Container:
                                                        - w-12/h-12: 48px square icon box
                                                        - rounded-xl: rounded corners
                                                        - bg-emerald-50 + text-emerald-600: green theme for sold/completed
                                                        - shrink-0: prevents icon from shrinking in flex
                                                        - shadow-sm + border: subtle depth and definition */}
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100">

                                                        {/* TrendingUp inside the icon box — represents project growth/value */}
                                                        <TrendingUp className="w-6 h-6" />
                                                    </div>

                                                    {/* ---- PROJECT TEXT INFO ---- */}
                                                    <div>
                                                        {/* Project Name:
                                                            - uppercase: project names displayed in caps for visual hierarchy
                                                            - group-hover:text-emerald-600: color transition on card hover
                                                            - transition-colors: smooth color change animation */}
                                                        <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase">{project.projectName}</h4>

                                                        {/* ---- METADATA BADGES ROW ----
                                                            flex-wrap: wraps onto next line if badges don't fit.
                                                            gap-x-3 gap-y-1: horizontal and vertical gaps between badges. */}
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">

                                                            {/* Buyer Badge:
                                                                Shows which company purchased this project.
                                                                Label + value pattern for clarity. */}
                                                            <div className="flex items-center gap-1.5 ">
                                                                {/* "Buyer:" label in muted gray */}
                                                                <span className="text-[10px] font-bold text-slate-400">Buyer:</span>
                                                                {/* Buyer name in indigo pill badge */}
                                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{project.buyerName}</span>
                                                            </div>

                                                            {/* Credits Sold Badge:
                                                                Shows total credits sold in this project.
                                                                .toLocaleString(): thousands separators for readability.
                                                                "(project.totalCredits || 0)": fallback to 0 if null/undefined. */}
                                                            <div className="flex items-center gap-1.5">
                                                                {/* "Credits:" label */}
                                                                <span className="text-[10px] font-bold text-slate-400">Credits:</span>
                                                                {/* Credits value in emerald pill badge with "SOLD" suffix */}
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{(project.totalCredits || 0).toLocaleString()} SOLD</span>
                                                            </div>

                                                            {/* Relative Time:
                                                                Shows how long ago the project was sold.
                                                                Calls getRelativeTime with project.updatedAt (sale timestamp).
                                                                muted text-slate-400 since this is secondary info. */}
                                                            <div className="text-[10px] text-slate-400 font-medium">Sold {getRelativeTime(project.updatedAt)}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ---- RIGHT SECTION: Monetary Values ----
                                                    text-right: right-aligns all content in this section.
                                                    items-end: aligns flex children to the right (end). */}
                                                <div className="text-right">
                                                    <div className="flex flex-col items-end">

                                                        {/* Total Sale Value:
                                                            - Large, bold number for the primary monetary metric
                                                            - ₹ prefix + .toLocaleString() for formatted currency
                                                            - "(project.totalValue || 0)": safe fallback to 0 */}
                                                        <p className="text-lg font-bold text-slate-900">₹{(project.totalValue || 0).toLocaleString()}</p>

                                                        {/* Aggregator Profit Badge:
                                                            Shows the profit earned by the aggregator (difference between
                                                            what they paid communities and what they sold for to companies).
                                                            Styled as a small emerald pill for positive emphasis. */}
                                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                            {/* "Profit:" label in small emerald text */}
                                                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Profit:</span>
                                                            {/* Profit amount: slightly larger and darker than label */}
                                                            <span className="text-xs font-bold text-emerald-700">₹{(project.aggregatorProfit || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ==================================================
                        RIGHT COLUMN: SIDEBAR (4/12 width on large screens)
                        Contains 3 stacked sections:
                        1. Market Overview — credits owned + deals summary
                        2. Quick Actions — CTA buttons for key workflows
                        3. Audit Trail — blockchain SHA-256 transaction log
                    ================================================== */}
                    <aside className="lg:col-span-4 space-y-8">

                        {/* ==================================================
                            SIDEBAR SECTION 1: MARKET OVERVIEW
                            ==================================================
                            A summary card showing the aggregator's current
                            credit holdings and total deal count at a glance.

                            "relative" + "overflow-hidden" enable the decorative
                            blurred circle in the top-right corner.
                        ================================================== */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden relative">

                            {/* Decorative blurred circle element in top-right corner.
                                - absolute positioning relative to the section container.
                                - -top-4 -right-4: partially off-screen for a subtle peek effect.
                                - w-24/h-24: 96px circle.
                                - bg-blue-500/5: very low opacity blue for subtlety.
                                - rounded-full: perfect circle.
                                - blur-2xl: heavy blur makes it a soft glow, not a sharp shape.
                                - pointer-events: prevents this decoration from blocking clicks. */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />

                            {/* Section Title with emerald TrendingUp icon.
                                mb-6: 24px space below title before the stats content. */}
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Market Overview
                            </h2>

                            {/* Stats blocks — vertically stacked with space-y-4 */}
                            <div className="space-y-4">

                                {/* Credits Owned Block:
                                    Emerald-themed block showing total carbon credits held.
                                    bg-emerald-50 + border-emerald-100: green tinted background.
                                    p-4 rounded-2xl: comfortable padding with large radius. */}
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">

                                    {/* Label: tiny uppercase muted emerald text */}
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Credits Owned</p>

                                    {/* Value + Unit row:
                                        items-baseline: aligns the number and "CRD" unit at their text baseline.
                                        gap-2: small gap between the big number and the unit label. */}
                                    <div className="flex items-baseline gap-2">

                                        {/* Large numeric value — text-2xl for visual prominence.
                                            .toLocaleString(): thousands separators for readability. */}
                                        <span className="text-2xl font-bold text-emerald-900">{(analytics?.totalCredits ?? 0).toLocaleString()}</span>

                                        {/* "CRD" unit label — smaller, lighter complement to the big number */}
                                        <span className="text-xs text-emerald-600 font-bold">CRD</span>
                                    </div>
                                </div>

                                {/* Total Deals Block:
                                    Neutral gray-themed block showing completed deal count.
                                    bg-slate-50 + border-slate-200: neutral background. */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">

                                    {/* Label: tiny uppercase muted text */}
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Deals</p>

                                    {/* Value: shows totalDeals count with "Completed" suffix.
                                        text-lg: medium-large size, slightly less prominent than credits. */}
                                    <p className="text-lg font-bold text-slate-900">{analytics?.totalDeals ?? 0} Completed</p>
                                </div>
                            </div>
                        </section>

                        {/* ==================================================
                            SIDEBAR SECTION 2: QUICK ACTIONS
                            ==================================================
                            Dark-themed card with two CTA buttons for the two
                            primary aggregator workflows:
                            1. Enter Carbon Exchange — buy credits from communities
                            2. Project Builder — bundle and list projects for companies

                            Dark background (bg-slate-900) makes this section stand
                            out as a primary action area within the sidebar.
                        ================================================== */}
                        <section className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-slate-900/20">

                            {/* Decorative Globe icon in top-right corner.
                                - absolute top-0 right-0: positioned at top-right corner
                                - opacity-10: very faint, purely decorative
                                - pointer-events-none: doesn't intercept any click events
                                - p-6: inset from the corner edges
                                - The Globe is 80px — large enough to be visible but subtle */}
                            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                <Globe className="w-20 h-20 text-blue-400" />
                            </div>

                            {/* Section Title:
                                - relative z-10: appears above the decorative globe overlay
                                - TrendingUp in blue-400 — matches the globe accent color */}
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Quick Actions
                            </h2>

                            {/* CTA Buttons container:
                                - space-y-3: 12px gap between the two action buttons
                                - relative z-10: above the decorative globe element */}
                            <div className="space-y-3 relative z-10">

                                {/* ---- CTA 1: Enter Carbon Exchange ----
                                    Primary action — more prominent with solid blue fill.
                                    bg-blue-600 + hover:bg-blue-500: blue theme, lightens on hover.
                                    shadow-lg shadow-blue-500/20: blue-tinted shadow for depth.
                                    group: enables group-hover on the icon container inside. */}
                                <Link href="/aggregator/marketplace" className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl border border-blue-400/50 transition-all group shadow-lg shadow-blue-500/20">

                                    {/* Left text area of the CTA button */}
                                    <div>
                                        {/* Primary CTA label */}
                                        <p className="text-sm font-bold leading-tight">Enter Carbon Exchange</p>
                                        {/* Secondary subtitle in lighter blue */}
                                        <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mt-1">Buy Community Credits</p>
                                    </div>

                                    {/* Right icon circle — scales up on group hover for interactive feel.
                                        bg-white/20: semi-transparent white circle on blue background. */}
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {/* Search icon inside the CTA — represents browsing/finding deals */}
                                        <Search className="w-5 h-5 text-white" />
                                    </div>
                                </Link>

                                {/* ---- CTA 2: Project Builder ----
                                    Secondary action — less prominent with subtle white/glass fill.
                                    bg-white/10 + hover:bg-white/20: low-opacity white, increases on hover.
                                    No shadow (this is the secondary CTA, less emphasis than Exchange). */}
                                <Link href="/aggregator/project" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group">

                                    {/* Left text area of the secondary CTA */}
                                    <div>
                                        {/* Primary CTA label */}
                                        <p className="text-sm font-bold leading-tight">Project Builder</p>
                                        {/* Secondary subtitle — explains what "Project Builder" does.
                                            &amp; is the HTML entity for & (required in JSX) */}
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Bundle &amp; List for Companies</p>
                                    </div>

                                    {/* Right icon circle for secondary CTA.
                                        bg-white/10: more subtle than the primary CTA's circle. */}
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {/* Package icon — represents bundling projects into packages */}
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                </Link>
                            </div>
                        </section>

                        {/* ==================================================
                            SIDEBAR SECTION 3: AUDIT TRAIL (SHA-256)
                            ==================================================
                            Displays the most recent blockchain-style audit log
                            entries for this aggregator. Each entry shows:
                            - Action type (e.g., DEAL_CREATED, CREDIT_TRANSFERRED)
                            - Timestamp of the action
                            - Truncated SHA-256 transaction hash

                            SHA-256 hashing ensures tamper detection —
                            any modification to the logged data would produce
                            a completely different hash.

                            max-h-64: limits the log list height and enables
                            overflow-y-auto scrolling for many entries.
                        ================================================== */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">

                            {/* Section Title with purple Lock icon.
                                Purple color signals security/cryptography theme. */}
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-purple-600" />
                                Audit Trail (SHA-256)
                            </h2>

                            {/* ---- CONDITIONAL: AUDIT LOG LIST OR EMPTY STATE ----
                                If auditLogs has entries, render the scrollable list.
                                Otherwise render a simple "No audit logs yet" message. */}
                            {auditLogs.length > 0 ? (

                                // ---- AUDIT LOG LIST ----
                                // space-y-2: 8px gaps between log entry cards.
                                // max-h-64: 256px max height with scrollbar for overflow.
                                // overflow-y-auto: vertical scroll when entries exceed max height.
                                <div className="space-y-2 max-h-64 overflow-y-auto">

                                    {/* Map over auditLogs array — one card per log entry.
                                        key={log._id}: MongoDB ObjectId as stable React key. */}
                                    {auditLogs.map((log) => (

                                        // ---- INDIVIDUAL AUDIT LOG CARD ----
                                        // p-3: compact padding for dense information display.
                                        // bg-slate-50 + border-slate-100: subtle background.
                                        // rounded-xl: rounded corners consistent with card style.
                                        <div key={log._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">

                                            {/* ---- LOG ENTRY HEADER ROW ----
                                                flex row with space-between to put action left, time right. */}
                                            <div className="flex items-center justify-between mb-1">

                                                {/* Action Type Badge:
                                                    - .replace(/_/g, ' '): converts DEAL_CREATED → "DEAL CREATED"
                                                    - uppercase + tracking-wider: all-caps spaced-out label
                                                    - text-purple-600: purple to match the Audit Trail icon */}
                                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>

                                                {/* Timestamp:
                                                    - new Date(log.timestamp): parse ISO string to Date object
                                                    - .toLocaleString(): format using locale (e.g., "1/15/2024, 10:30 AM")
                                                    - text-slate-400: muted secondary text color */}
                                                <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>

                                            {/* Transaction Hash Display:
                                                - font-mono: monospace font for hash readability
                                                - truncate: cuts off overflow with ellipsis (…)
                                                - title={log.txHash}: full hash on hover tooltip
                                                - 🔗 emoji: visual chain-link for blockchain feel
                                                - .slice(0, 24): shows first 24 characters of hash
                                                - ...{log.txHash.slice(-8)}: shows last 8 characters
                                                  This gives "beginning…end" format for quick verification
                                                  while keeping the card compact. */}
                                            <p className="text-[10px] font-mono text-slate-500 truncate" title={log.txHash}>
                                                🔗 {log.txHash.slice(0, 24)}...{log.txHash.slice(-8)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                            ) : (
                                // ---- EMPTY STATE: No Audit Logs ----
                                // Simple text message when no audit entries exist yet.
                                // text-center + py-4: centered with vertical breathing room.
                                <p className="text-xs text-slate-400 text-center py-4">No audit logs yet.</p>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}

// ============================================================
// COMPONENT: StatCard
// ============================================================
// A reusable presentational component that renders a single
// KPI (Key Performance Indicator) stat card.
//
// Used 4 times in the dashboard stats grid for:
//   - Total Managed Deals
//   - Aggregated Credits
//   - Active Communities
//   - Total Value (₹)
//
// Props:
//   title  (string): Label shown above the value (e.g., "Total Managed Deals")
//   value  (string): The main metric value displayed prominently (e.g., "42")
//   change (string): Subtitle/description below the value (e.g., "Accepted community deals")
//   icon   (ReactNode): An icon element rendered in the colored icon badge
//   color  ('blue'|'emerald'|'indigo'|'amber'): Theme color for the icon badge
//
// This component is "dumb" — it contains no logic, only pure rendering.
// ============================================================
function StatCard({ title, value, change, icon, color }: {
    title: string;         // Card label text
    value: string;         // Primary metric value (always passed as string)
    change: string;        // Subtitle / descriptive text below the value
    icon: React.ReactNode; // Icon element (e.g., <Briefcase className="w-5 h-5" />)
    color: 'blue' | 'emerald' | 'indigo' | 'amber'; // Color theme for icon badge
}) {

    // -------------------------------------------------------
    // COLOR CLASS MAP
    // -------------------------------------------------------
    // Maps the color prop to a combined Tailwind class string for
    // the icon badge (background + text + border).
    //
    // We use an object lookup instead of a switch or ternary because:
    // 1. It's cleaner and more scalable for multiple colors.
    // 2. Tailwind's JIT compiler can statically analyze full class strings.
    //    (Tailwind cannot parse template literals like `bg-${color}-50`
    //     because it can't know which classes to include at build time.)
    //
    // Each entry provides:
    //   - bg-{color}-50: very light tinted background
    //   - text-{color}-600: icon stroke/fill color
    //   - border-{color}-100: subtle border matching the background tint
    const colorClasses = {
        // Blue theme — used for "Total Managed Deals" card
        blue: 'bg-blue-50 text-blue-600 border-blue-100',

        // Emerald theme — used for "Aggregated Credits" card
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',

        // Indigo theme — used for "Active Communities" card
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',

        // Amber theme — used for "Total Value (₹)" card
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    // -------------------------------------------------------
    // RENDER: STAT CARD
    // -------------------------------------------------------
    return (
        // Card Container:
        // - bg-white: clean white background
        // - rounded-3xl: very large border radius for modern card look
        // - p-6: 24px padding on all sides
        // - border border-slate-100: very light border for definition
        // - shadow-sm: subtle default shadow
        // - hover:shadow-lg: elevated shadow on hover for interactivity feel
        // - hover:-translate-y-1: slight upward lift on hover (1px)
        // - transition-all: smooth animation for all hover transitions
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">

            {/* ---- ICON BADGE ROW ----
                flex row with space-between.
                Currently only the icon badge is on the left;
                the right side is empty (could hold a trend arrow or % change). */}
            <div className="flex items-start justify-between mb-4">

                {/* Icon Badge:
                    - p-3: 12px padding inside the badge for icon breathing room
                    - rounded-xl: rounded corners on the square badge
                    - border: uses the color-appropriate border from colorClasses
                    - The specific bg/text/border classes come from colorClasses[color] lookup */}
                <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
                    {/* Render the icon passed as a React node prop (e.g., <Briefcase />) */}
                    {icon}
                </div>
            </div>

            {/* ---- TEXT CONTENT SECTION ---- */}
            <div>
                {/* Card Title (Label):
                    - text-[10px]: extra small for a secondary label feel
                    - uppercase + tracking-widest: spaced-out capitals for visual hierarchy
                    - text-slate-400: muted gray — intentionally less prominent than the value
                    - mb-1: 4px gap before the value number */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>

                {/* Primary Value (the main KPI number):
                    - text-2xl: large, dominant number for quick scanning
                    - font-bold: heavy weight for visual emphasis
                    - text-slate-900: near-black for maximum contrast/readability
                    - mb-1: 4px gap before the subtitle text */}
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>

                {/* Subtitle / Change Text:
                    - text-[10px]: very small — supplementary information only
                    - font-bold: slightly heavier than normal for readability at small size
                    - Color: amber cards get amber-600 text (to match their theme);
                             all other cards get muted slate-400
                    - The ternary checks if color is 'amber' to apply the special color. */}
                <p className={`text-[10px] font-bold ${color === 'amber' ? 'text-amber-600' : 'text-slate-400'}`}>{change}</p>
            </div>
        </div>
    );
}
// ============================================================
// END OF FILE: AggregatorDashboard page.tsx
// ============================================================
// Summary of what this file does:
//
// 1. AUTHENTICATION: Verifies the user is logged in and has an
//    aggregator profile via /api/aggregator/verifyaggregator.
//    Redirects to /login or /aggregator/onboarding if needed.
//
// 2. DATA LOADING: Fetches live analytics, audit logs, and sold
//    projects data from three separate API endpoints on mount.
//
// 3. DASHBOARD LAYOUT: Renders a responsive full-page dashboard with:
//    - Fixed top navigation (desktop + mobile responsive)
//    - 4 KPI stat cards (deals, credits, communities, value)
//    - Recent deals table with type-colored badges
//    - Sold projects cards with profit tracking
//    - Market overview sidebar
//    - Quick action CTAs for primary workflows
//    - Scrollable blockchain audit trail log
//
// 4. REUSABLE COMPONENT: StatCard — a clean, themeable stat card
//    used for all four KPI metrics at the top of the dashboard.
// ============================================================