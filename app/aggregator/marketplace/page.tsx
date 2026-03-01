"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, Loader2, Globe, TrendingUp, Search, MapPin, Leaf,
    CheckCircle2, AlertCircle, ChevronRight, DollarSign, Package
} from 'lucide-react';
import Link from 'next/link';

interface MarketListing {
    communityId: string;
    communityName: string;
    community_description: string;
    community_carbon_credit_number: number;
    createdAt: string;
}

interface OwnedDeal {
    communityId: string;
    credits: number;
    pricePerCredit: number;
    totalValue: number;
    date: string;
}



