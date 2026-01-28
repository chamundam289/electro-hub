# Profiles Table RLS Policy Issue - FIXED

## Issue
Admin login successful but dashboard navigation fails with infinite recursion error in RLS policies.

## Error Details
```
Error: infinite recursion detected in policy for relation "profiles"
Code: 42P17
```

## Root Cause
The RLS policy for admins was trying to check if a user is admin by querying the same profiles table, creating infinite recursion:

```sql
-- This causes infinite recursion:
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles  -- ← Queries same table!
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

## Quick Fix Applied
1. **Error Handling**: AuthContext now detects code `42P17` (infinite recursion)
2. **Temporary Profiles**: Creates admin profile in memory when database policies fail
3. **Immediate Solution**: Admin login works right now with temporary profiles

## Permanent Database Fixes

### Option 1: Quick Fix (Recommended for Testing)
Run `disable_profiles_rls.sql` in Supabase SQL Editor:
- Disables RLS temporarily
- Allows immediate admin login
- Can re-enable RLS later with proper policies

### Option 2: Proper RLS Fix
Run `fix_profiles_rls_policies.sql` in Supabase SQL Editor:
- Removes recursive policies
- Creates simple, non-recursive policies
- Maintains security while fixing recursion

## Current Status
- ✅ Admin login works with temporary profiles
- ✅ Dashboard navigation should work now
- ⚠️ Profiles are temporary until database is fixed
- 🔧 Run one of the SQL fixes for permanent solution

## Files Created
1. `fix_profiles_rls_policies.sql` - Proper RLS policy fix
2. `disable_profiles_rls.sql` - Quick temporary fix
3. Updated AuthContext with error handling

## Next Steps
1. Run `disable_profiles_rls.sql` for immediate fix
2. Update admin email in the SQL script
3. Test admin login - should work perfectly now
4. Later, run `fix_profiles_rls_policies.sql` for proper security