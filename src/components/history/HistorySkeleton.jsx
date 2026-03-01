import React from "react";
import Skeleton from "../Skeleton";

const HistorySkeleton = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <Skeleton className="h-10 w-48" />

        <div className="flex bg-slate-800/50 p-1 rounded-xl glass-panel self-start md:self-auto gap-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TYT COLUMN */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-2 h-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={`tyt-${i}`} className="glass-card flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-3 w-full">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
                <div className="text-right ml-2 space-y-1">
                  <Skeleton className="h-3 w-8 ml-auto" />
                  <Skeleton className="h-5 w-12 ml-auto" />
                </div>
                <Skeleton className="h-4 w-4 ml-3 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* AYT COLUMN */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-2 h-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={`ayt-${i}`} className="glass-card flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-3 w-full">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
                <div className="text-right ml-2 space-y-1">
                  <Skeleton className="h-3 w-8 ml-auto" />
                  <Skeleton className="h-5 w-12 ml-auto" />
                </div>
                <Skeleton className="h-4 w-4 ml-3 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorySkeleton;
