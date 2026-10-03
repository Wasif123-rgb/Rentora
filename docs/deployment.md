@"
# Rentora Deployment

The Rentora Laravel + React application is deployed to the university VPS at:

http://rentora.austattendance.online

## Project Structure

- `backend/` — Laravel backend and API
- `frontend/` — React/Vite frontend

The React production build is generated into:

`backend/public/app/`

## Deployment

Deployment is handled automatically through GitHub Actions when changes are pushed to `main`.

The deployment pipeline:

1. Installs Laravel production dependencies with Composer.
2. Installs frontend dependencies with `npm ci`.
3. Builds the React application.
4. Verifies the production build.
5. Creates `release.tar.gz`.
6. Copies the release to the VPS using `scp`.
7. Deploys the release on the VPS.
8. Runs Laravel migrations and database seeding.
9. Runs `php artisan optimize`.
10. Preserves the server `.env` and storage.

The deployment uses the shared university `cse3100-db` container with the project's own database and MySQL user.

## Result

The application is publicly accessible at:

http://rentora.austattendance.online
"@ | Set-Content .\docs\deployment.md