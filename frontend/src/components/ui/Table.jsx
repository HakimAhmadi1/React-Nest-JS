import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * Reusable Table component.
 *
 * Props:
 *   columns: [{ key, label, sortable?, render?(row)→ReactNode }]
 *   data: array of row objects
 *   sortBy?: string  (key of sorted column)
 *   sortDir?: 'asc' | 'desc'
 *   onSort?: (key) => void
 *   loading?: boolean
 *   emptyMessage?: string
 */
const Table = ({
  columns = [],
  data = [],
  sortBy,
  sortDir = "asc",
  onSort,
  loading = false,
  emptyMessage = "No records found.",
  // Pagination props
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) => {
  const handleSort = (col) => {
    if (col.sortable && onSort) onSort(col.key);
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const renderPagination = () => {
    if (!onPageChange || totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-t border-gray-800">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-300">
                {totalItems > 0 ? startItem : 0}
              </span>{" "}
              to <span className="font-medium text-gray-300">{endItem}</span> of{" "}
              <span className="font-medium text-gray-300">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-700 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronUp className="w-5 h-5 -rotate-90" />
              </button>
              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium transition-colors ${
                    currentPage === p
                      ? "z-10 bg-primary-600 border-primary-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-700 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronUp className="w-5 h-5 rotate-90" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full rounded-xl border border-gray-800 bg-gray-900/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full admin-table">
          <thead className="bg-gray-800/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={
                    col.sortable
                      ? "cursor-pointer select-none hover:text-gray-200 transition-colors"
                      : ""
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="flex flex-col opacity-40">
                        <ChevronUp
                          size={10}
                          className={
                            sortBy === col.key && sortDir === "asc"
                              ? "opacity-100 text-primary-400"
                              : ""
                          }
                        />
                        <ChevronDown
                          size={10}
                          className={
                            sortBy === col.key && sortDir === "desc"
                              ? "opacity-100 text-primary-400"
                              : ""
                          }
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id ?? idx} className="transition-colors">
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default Table;
