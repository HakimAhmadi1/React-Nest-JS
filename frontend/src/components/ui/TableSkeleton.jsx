import React from "react";

const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden animate-pulse">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center">
        <div className="h-4 w-32 bg-gray-800 rounded-full"></div>
        <div className="h-8 w-24 bg-gray-800 rounded-full"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-3 w-20 bg-gray-800 rounded-full"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-3 w-full bg-gray-800/50 rounded-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
