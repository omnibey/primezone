"use client";
import { useEffect, Suspense } from "react";
import { pushPageView, pushViewItemList } from "@/lib/dataLayer";
import { usePathname, useSearchParams } from "next/navigation";

function HomeDataLayerContent({ products, flashSaleProducts }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const fullUrl = typeof window !== 'undefined' 
            ? window.location.href 
            : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
        
        pushPageView("home", fullUrl);
        
        if (products && products.length > 0) {
            pushViewItemList(products, "Home - All Products", fullUrl);
        }
        
        if (flashSaleProducts && flashSaleProducts.length > 0) {
            pushViewItemList(flashSaleProducts, "Home - Flash Sale", fullUrl);
        }
    }, [pathname, searchParams, products, flashSaleProducts]);
    
    return null;
}

export default function HomeDataLayer(props) {
    return (
        <Suspense fallback={null}>
            <HomeDataLayerContent {...props} />
        </Suspense>
    );
}
