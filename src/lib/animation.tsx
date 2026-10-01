export const flyToIconAnimation = (e, imgUrl, targetIconId) => {
  if (!e || !imgUrl) return;

  const target = e.currentTarget || e.target;
  const rect = target.getBoundingClientRect();
  
  // Find icon in the DOM
  const targetIcon = document.getElementById(targetIconId);
  if (!targetIcon) return;
  const targetRect = targetIcon.getBoundingClientRect();

  // Create flying element
  const flyingImg = document.createElement("img");
  flyingImg.src = imgUrl;
  flyingImg.className = "flying-cart-img"; // Reusing the same CSS class for the fly effect
  
  // Set initial position
  flyingImg.style.top = `${rect.top}px`;
  flyingImg.style.left = `${rect.left}px`;
  flyingImg.style.transform = "scale(1)";
  
  document.body.appendChild(flyingImg);

  // Trigger animation after a tiny delay to allow DOM to register initial position
  setTimeout(() => {
    flyingImg.style.top = `${targetRect.top}px`;
    flyingImg.style.left = `${targetRect.left}px`;
    flyingImg.style.width = "20px";
    flyingImg.style.height = "20px";
    flyingImg.style.opacity = "0";
    flyingImg.style.transform = "scale(0.3)";
  }, 10);

  // Remove element and trigger bump animation
  setTimeout(() => {
    flyingImg.remove();
    targetIcon.classList.add("cart-bump"); // Reusing the bump animation class
    setTimeout(() => targetIcon.classList.remove("cart-bump"), 400);
  }, 1200); // 1200ms should match CSS transition duration
};

// Kept for backward compatibility if used elsewhere, though we should just replace it everywhere
export const flyToCartAnimation = (e, imgUrl) => {
  flyToIconAnimation(e, imgUrl, "cartIconTrigger");
};
