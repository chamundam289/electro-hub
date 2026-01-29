# Supabase Redirect URLs Setup Guide

## Step-by-Step Process:

### 1. Supabase Dashboard Access
- Go to: https://supabase.com/dashboard
- Login with your account
- Select your project: `xeufezbuuccohiardtrk`

### 2. Navigate to Authentication Settings
```
Dashboard → Authentication → URL Configuration
```
OR
```
Dashboard → Settings → Authentication
```

### 3. Configure URLs

#### Site URL:
```
http://localhost:3000
```

#### Redirect URLs (Add all these):
```
http://localhost:3000/
http://localhost:3000/dashboard
http://localhost:3000/auth/callback
```

### 4. Production URLs (For later when you deploy):
```
https://yourdomain.com/
https://yourdomain.com/dashboard
https://yourdomain.com/auth/callback
```

### 5. Save Changes
- Click "Save" button
- Wait for confirmation message

## Important Notes:

1. **Local Development**: Use `http://localhost:3000` for development
2. **Port Number**: Make sure port matches your dev server (usually 3000 for Vite)
3. **Multiple URLs**: You can add multiple redirect URLs separated by commas or new lines
4. **Case Sensitive**: URLs are case-sensitive
5. **No Trailing Slash**: Avoid trailing slashes unless necessary

## Common Issues:

### Issue 1: "Invalid redirect URL" error
**Solution**: Make sure the exact URL is added in Supabase dashboard

### Issue 2: OAuth not working
**Solution**: Check if Site URL matches your development server URL

### Issue 3: Redirect not happening
**Solution**: Verify redirect URLs are exactly matching your routes

## Testing:
After setup, test with:
1. Go to `/login`
2. Click "Continue with Google"
3. Should redirect to `/dashboard` after success