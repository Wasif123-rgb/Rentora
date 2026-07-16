import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="container py-5 text-center">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
      <Link to="/login" className="btn btn-primary">
        Return to Login
      </Link>
    </main>
  );
}

export default NotFoundPage;