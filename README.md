# AutoMarket Slovenia - Backend API

## Deploy në Vercel

### 1. Shko te vercel.com → New Project

### 2. Importo automarket-backend repo (ose upload files)

### 3. Shto Environment Variables:
- SUPABASE_URL = https://pajbxchnenouxeaimsdr.supabase.co
- SUPABASE_KEY = sb_publishable_CQVFr7jAHNfQV5DXvxQiZg_h7Cq6MRH

### 4. Deploy!

## API Endpoints

- POST /api/auth.php - Login/Register
- GET /api/cars.php - Merr të gjitha makinat
- POST /api/cars.php - Shto makinë
- GET /api/packages.php - Merr paketat
- GET /api/admin.php?action=users - Admin users
- GET /api/admin.php?action=cars - Admin cars
- GET /api/admin.php?action=packages - Admin packages
- GET /api/brands.php - Merr brand-et
- GET /api/cities.php - Merr qytetet
