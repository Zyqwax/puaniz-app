import React, { HTMLAttributes } from "react";

export const Skeleton = ({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-700/50 ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
