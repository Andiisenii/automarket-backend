import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const app = express()
app.use(cors())
app.use(express.json())

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ============ AUTH ============
app.post('/api/auth.php', async (req, res) => {
  const { action, email, password, name, phone, role, userType } = req.body

  if (action === 'login') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !data) {
      return res.json({ success: false, message: 'Invalid credentials' })
    }
    
    const validPassword = await bcrypt.compare(password, data.password)
    if (!validPassword) {
      return res.json({ success: false, message: 'Invalid credentials' })
    }
    
    const token = 'auth_' + Date.now()
    return res.json({
      success: true,
      user: { id: data.id, name: data.name, email: data.email, role: data.role },
      token
    })
  }

  if (action === 'register') {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existing) {
      return res.json({ success: false, message: 'Email already exists' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        role: role || 'buyer',
        user_type: userType || 'private'
      })
      .select()
      .single()
    
    if (error) {
      return res.json({ success: false, message: error.message })
    }
    
    const token = 'auth_' + Date.now()
    return res.json({
      success: true,
      user: { id: data.id, name: data.name, email: data.email, role: data.role },
      token
    })
  }
})

// ============ CARS ============
app.get('/api/cars.php', async (req, res) => {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return res.json({ success: false, message: error.message })
  }
  return res.json({ success: true, cars: data || [] })
})

app.post('/api/cars.php', async (req, res) => {
  const { user_id, ...carData } = req.body
  
  const { data, error } = await supabase
    .from('cars')
    .insert({ ...carData, user_id })
    .select()
    .single()
  
  if (error) {
    return res.json({ success: false, message: error.message })
  }
  return res.json({ success: true, car: data })
})

app.put('/api/cars.php', async (req, res) => {
  const { id, ...carData } = req.body
  
  const { data, error } = await supabase
    .from('cars')
    .update(carData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return res.json({ success: false, message: error.message })
  }
  return res.json({ success: true, car: data })
})

app.delete('/api/cars.php', async (req, res) => {
  const { id } = req.body
  
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id)
  
  if (error) {
    return res.json({ success: false, message: error.message })
  }
  return res.json({ success: true })
})

// ============ PACKAGES ============
app.get('/api/packages.php', async (req, res) => {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  
  if (error) {
    return res.json({ success: false, message: error.message })
  }
  return res.json({ success: true, packages: data || [] })
})

// ============ ADMIN ============
app.get('/api/admin.php', async (req, res) => {
  const { action } = req.query
  
  if (action === 'users') {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    return res.json({ success: true, users: data || [] })
  }
  
  if (action === 'cars') {
    const { data } = await supabase
      .from('cars')
      .select('*, users:name(name)')
      .order('created_at', { ascending: false })
    return res.json({ success: true, cars: data || [] })
  }
  
  if (action === 'packages') {
    const { data } = await supabase.from('packages').select('*').order('sort_order')
    return res.json({ success: true, packages: data || [] })
  }
  
  if (action === 'analytics') {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: totalCars } = await supabase.from('cars').select('*', { count: 'exact', head: true })
    
    return res.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalCars: totalCars || 0,
        activeCars: totalCars || 0,
        totalRevenue: 0
      }
    })
  }
  
  return res.json({ success: false, message: 'Unknown action' })
})

app.post('/api/admin.php', async (req, res) => {
  const { action } = req.query
  const input = req.body
  
  if (action === 'update_package') {
    const { id, name, name_en, price, min_days, discount, discount_active } = input
    
    const { data, error } = await supabase
      .from('packages')
      .update({
        name,
        name_en,
        price,
        min_days,
        discount_percent: discount,
        discount_active
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return res.json({ success: false, message: error.message })
    }
    return res.json({ success: true, message: 'Package updated' })
  }
  
  return res.json({ success: false, message: 'Unknown action' })
})

// ============ BRANDS ============
app.get('/api/brands.php', async (req, res) => {
  const brands = [
    'Audi', 'BMW', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Kia',
    'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault',
    'Seat', 'Škoda', 'Toyota', 'Volkswagen', 'Volvo', 'Tesla', 'Polestar'
  ]
  return res.json({ success: true, brands })
})

// ============ CITIES ============
app.get('/api/cities.php', async (req, res) => {
  const cities = [
    'Ajdovščina', 'Bled', 'Borovnica', 'Brežice', 'Celje', 'Cerknica',
    'Črnomelj', 'Domžale', 'Gornja Radgona', 'Grosuplje', 'Hrastnik',
    'Idrija', 'Ilirska Bistrica', 'Izola', 'Jesenice', 'Kamnik',
    'Koper', 'Kranj', 'Krapina', 'Krško', 'Laško', 'Lenart', 'Lendava',
    'Ljubljana', 'Ljutomer', 'Logatec', 'Maribor', 'Metlika', 'Murska Sobota',
    'Nova Gorica', 'Novo Mesto', 'Ormož', 'Piran', 'Postojna', 'Prevalje',
    'Ptuj', 'Radovljica', 'Ravne na Koroškem', 'Ribnica', 'Rogatec',
    'Sežana', 'Slovenj Gradec', 'Slovenske Konjice', 'Šmarje pri Jelšah',
    'Tolmin', 'Trbovlje', 'Trebnje', 'Tržič', 'Velenje', 'Vipava',
    'Vodice', 'Vrhnika', 'Zagorje ob Savi', 'Žalec', 'Zreče'
  ]
  return res.json({ success: true, cities })
})

// ============ HEALTH CHECK ============
app.get('/api/health.php', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1)
    return res.json({ 
      status: 'ok', 
      supabase: error ? 'error: ' + error.message : 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    return res.json({ status: 'error', message: err.message })
  }
})

// Export for Vercel - THIS IS THE KEY FIX
export default app
