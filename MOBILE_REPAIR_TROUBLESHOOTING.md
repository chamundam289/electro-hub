# Mobile Repair System Troubleshooting Guide

## Issue: Data added from POS system not showing in Mobile Repair admin page

### Step 1: Verify Database Setup
Run these SQL queries in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'mobile_repairs'
) as table_exists;
```

**Expected Result:** `table_exists: true`

### Step 2: Check Data in Database
```sql
-- Count records
SELECT COUNT(*) as total_records FROM mobile_repairs;

-- Show recent records
SELECT * FROM mobile_repairs ORDER BY created_at DESC LIMIT 5;
```

**Expected Result:** Should show records if data was added from POS

### Step 3: Test Manual Insert
```sql
-- Test insert
INSERT INTO mobile_repairs (
    customer_name,
    customer_phone,
    device_brand,
    device_model,
    issue_description,
    repair_type,
    estimated_cost
) VALUES (
    'Test Customer',
    '9999999999',
    'Apple',
    'iPhone 14',
    'Test issue',
    'Screen Replacement',
    5000.00
);
```

### Step 4: Check Browser Console
1. Open Mobile Repair admin page
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Click "Test DB" button
5. Look for console messages

**Expected Messages:**
- "Testing database connection..."
- "Test result - Data: [array], Error: null, Count: X"

### Step 5: Test POS System Insert
1. Go to POS System > Mobile Repair tab
2. Fill in all required fields
3. Click "Register Repair Service"
4. Check browser console for messages

**Expected Messages:**
- "Attempting to save mobile repair data: {object}"
- "Successfully saved repair data: {object}"

### Step 6: Test Real-time Refresh
1. Open Mobile Repair admin page
2. In another tab, add data from POS system
3. Switch back to admin page
4. Data should appear automatically

### Common Issues & Solutions

#### Issue 1: Table doesn't exist
**Solution:** Run `mobile_repair_setup.sql` in Supabase SQL Editor

#### Issue 2: Permission denied
**Solution:** Check RLS policies are set correctly:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'mobile_repairs';
```

#### Issue 3: Data not inserting from POS
**Symptoms:** Success message but no data in database
**Solution:** Check console for actual error messages

#### Issue 4: Data not refreshing in admin page
**Symptoms:** Data exists in database but not showing in UI
**Solutions:**
- Click "Refresh" button
- Click "Test DB" button to verify connection
- Check browser console for errors
- Try hard refresh (Ctrl+F5)

#### Issue 5: Real-time updates not working
**Solution:** Check Supabase real-time is enabled:
1. Go to Supabase Dashboard
2. Settings > API
3. Ensure Realtime is enabled

### Debug Commands for Browser Console

```javascript
// Test direct database query
const { data, error } = await supabase
  .from('mobile_repairs')
  .select('*')
  .order('created_at', { ascending: false });
console.log('Direct query result:', { data, error });

// Test insert
const { data: insertData, error: insertError } = await supabase
  .from('mobile_repairs')
  .insert([{
    customer_name: 'Console Test',
    customer_phone: '1111111111',
    device_brand: 'Samsung',
    device_model: 'Galaxy S21',
    issue_description: 'Console test issue',
    repair_type: 'Battery Replacement',
    estimated_cost: 3000
  }])
  .select();
console.log('Insert result:', { insertData, insertError });
```

### Quick Fix Checklist
- [ ] Table exists in database
- [ ] RLS policies are set
- [ ] Data actually exists in database
- [ ] Browser console shows no errors
- [ ] Real-time subscription is working
- [ ] Manual refresh works
- [ ] POS system shows success messages
- [ ] Admin page shows current timestamp

### Contact Information
If issues persist, check:
1. Supabase project status
2. Network connectivity
3. Browser cache (try incognito mode)
4. Supabase API keys are correct