"use client";
import { useEffect, Suspense } from "react";
import { pushPageView, pushViewItemList } from "@/lib/dataLayer";
import { usePathname, useSearchParams } from "next/navigation";

function ProductListDataLayerContent({ products, pageName = "page", listName = "All Products" }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const fullUrl = typeof window !== 'undefined' 
            ? window.location.href 
            : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
        
        pushPageView(pageName, fullUrl, { page_title: listName });
        
        if (products && products.length > 0) {
            pushViewItemList(products, listName, fullUrl);
        }
    }, [pathname, searchParams, products, pageName, listName]);
    
    return null;
}

export default function ProductListDataLayer(props) {
    return (
        <Suspense fallback={null}>
            <ProductListDataLayerContent {...props} />
        </Suspense>
    );
}
