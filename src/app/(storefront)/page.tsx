export const runtime = 'edge';
import Link from "next/link";
import { getSettings, getProducts, getHomeCategories } from "@/lib/api";
import HeroSlider from "@/components/storefront/HeroSlider";
import FlashSaleTimer from "@/components/storefront/FlashSaleTimer";
import HomeDataLayer from "@/components/common/HomeDataLayer";
import HomeProductSection from "@/components/storefront/HomeProductSection";

import DynamicHeroSlider from "@/components/storefront/DynamicHeroSlider";

export default async function Home() {
  const [settingsRes, productsRes, CATEGORIES] = await Promise.all([
    getSettings(),
    getProducts(null, 1, 24),
    getHomeCategories()
  ]);
  
  const settings = settingsRes?.data?.settings || {};
  const BANNERS = settings.layout?.banners || settings.banners || [];
  
  const PRODUCTS = productsRes?.data?.products || [];
  const PAGINATION = productsRes?.data?.pagination || { page: 1, limit: 24, total: PRODUCTS.length, totalPages: 1 };
  
  const flashSale = settings.layout?.flash_sale || settings.flash_sale || { enabled: false };
  const flashSaleProducts = flashSale.enabled ? PRODUCTS.filter(p => p.is_flash_sale) : [];

  const bannerType = settings.layout?.bannerType || 'classic';

  return (
    <>
      <HomeDataLayer products={PRODUCTS} flashSaleProducts={flashSaleProducts} />
      
      {/* Conditionally render selected banner type */}
      {bannerType === 'dynamic' ? (
        <DynamicHeroSlider banners={BANNERS} />
      ) : (
        <HeroSlider banners={BANNERS} />
      )}

      {/* Home Categories */}
      {CATEGORIES.length > 0 && (
        <div id="homeCategories">
            <div className="container">
                <div className="category-section-wrapper">
                    <div className="category-grid" id="categoryDynamicGrid">
                        {CATEGORIES.map((cat, index) => (
                          <Link key={`${cat.slug}-${index}`} href={`/category/${cat.slug}`} className="category-item">
                              <div className="cat-img-box">
                                  <img src={cat.image_url || "https://placehold.co/150"} alt={cat.name} loading="lazy" />
                              </div>
                              <span className="cat-name">{cat.name}</span>
                          </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Flash Sale Section */}
      {flashSale.enabled && flashSaleProducts.length > 0 && (
        <div className="container" id="flashSaleSection">
            <div className="flash-sale-wrapper">
                <div className="flash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div className="flash-title">
                        <i className="ph-fill ph-lightning"></i> Flash Sale
                    </div>
                    <FlashSaleTimer endDate={flashSale.end_date} />
                </div>
                <div className="flash-slider-container" id="flashSlider">
                    {/* Flash sale products */}
                </div>
            </div>
        </div>
      )}

      {/* PRODUCT GRID WITH 24-BATCH LOAD MORE */}
      <div className="container">
          <HomeProductSection initialProducts={PRODUCTS} initialPagination={PAGINATION} />
      </div>
    </>
  );
}
