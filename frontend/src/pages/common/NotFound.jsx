import { Link } from "react-router-dom";

/**
 * A real 404. Previously every unmatched path silently redirected to `/`,
 * which hid typos and broken links.
 */
const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
    <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
      404
    </p>
    <h1 className="mt-4 text-3xl font-bold text-neutral-900">Page not found</h1>
    <p className="mt-3 max-w-md text-neutral-600">
      The page you’re looking for doesn’t exist or may have been moved.
    </p>
    <Link
      to="/"
      className="mt-8 inline-flex items-center bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
    >
      Back to home
    </Link>
  </div>
);

export default NotFound;
