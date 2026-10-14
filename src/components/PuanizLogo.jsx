import React from "react";
import Image from "next/image";

export function PuanizLogo({
  variant = "horizontal", // "horizontal" | "horizontal-dark" | "icon" | "stacked" | "wordmark"
  width,
  height,
  className = "",
  alt = "Puaniz",
  priority = false,
}) {
  let src = "/brand-svg/puaniz-logo-horizontal.svg";
  let defaultWidth = 145;
  let defaultHeight = 40;

  if (variant === "horizontal-dark") {
    src = "/brand-svg/puaniz-logo-horizontal-dark.svg";
    defaultWidth = 145;
    defaultHeight = 40;
  } else if (variant === "icon") {
    src = "/brand-svg/puaniz-icon.svg";
    defaultWidth = 40;
    defaultHeight = 40;
  } else if (variant === "icon-blue") {
    src = "/brand-svg/puaniz-icon-blue.svg";
    defaultWidth = 40;
    defaultHeight = 40;
  } else if (variant === "icon-circle") {
    src = "/brand-svg/puaniz-icon-circle.svg";
    defaultWidth = 40;
    defaultHeight = 40;
  } else if (variant === "stacked") {
    src = "/brand-svg/puaniz-logo-stacked.svg";
    defaultWidth = 120;
    defaultHeight = 120;
  } else if (variant === "wordmark") {
    src = "/brand-svg/puaniz-wordmark.svg";
    defaultWidth = 120;
    defaultHeight = 35;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || defaultWidth}
      height={height || defaultHeight}
      className={className}
      priority={priority}
    />
  );
}

export default PuanizLogo;
