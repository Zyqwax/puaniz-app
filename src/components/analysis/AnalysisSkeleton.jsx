import React from "react";
import Skeleton from "../Skeleton";

const AnalysisSkeleton = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="glass-card">
          <Skeleton className="h-6 w-56 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-full opacity-50" />
        </div>

        {/* Trend Chart */}
        <div className="glass-card">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>

      {/* Subject Stats Grid */}
      <Skeleton className="h-8 w-48 mt-8 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-end gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-12 mb-1" />
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisSkeleton;
