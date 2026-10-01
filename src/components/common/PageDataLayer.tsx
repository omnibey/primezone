"use client";
import { useEffect, Suspense } from "react";
import { pushPageView } from "@/lib/dataLayer";
import { usePathname, useSearchParams } from "next/navigation";

function PageDataLayerContent({ type = "page", name, extra = {} }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const fullUrl = typeof window !== 'undefined' 
            ? window.location.href 
            : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
        pushPageView(type, fullUrl, { page_title: name, ...extra });
    }, [type, name, pathname, searchParams]);
    
    return null;
}

export default function PageDataLayer(props) {
    return (
        <Suspense fallback={null}>
            <PageDataLayerContent {...props} />
        </Suspense>
    );
}
