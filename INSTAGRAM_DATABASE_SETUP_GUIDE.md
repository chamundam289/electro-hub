# 📋 Instagram Marketing Database Setup Guide

## 🚨 Error Fix: ON CONFLICT Issue Resolved

The error `there is no unique or exclusion constraint matching the ON CONFLICT specification` has been fixed by creating separate files for table creation and data insertion.

## 📝 Step-by-Step Setup Instructions

### **Step 1: Create Tables** 
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste content from: **`instagram_tables_fixed_setup.sql`**
4. Click "Run" to execute
5. ✅ All tables will be created successfully

### **Step 2: Insert Sample Data**
1. In the same SQL Editor
2. Copy and paste content from: **`instagram_sample_data.sql`**
3. Click "Run" to execute
4. ✅ Sample data will be inserted (campaign + 2 test users)

## 📊 What Gets Created

### **Tables Created:**
- ✅ `instagram_users` - Influencer profiles (≥1000 followers)
- ✅ `instagram_campaigns` - Campaign management with rewards
- ✅ `instagram_stories` - Story tracking with 24h timers
- ✅ `instagram_story_timers` - Timer management system
- ✅ `instagram_coin_transactions` - Loyalty coin transactions
- ✅ `instagram_notifications` - Admin and user notifications

### **Sample Data Inserted:**
- ✅ **Default Campaign**: 100 coins per approved story
- ✅ **Test User 1**: Priya Sharma (@priya_lifestyle) - 5K followers
- ✅ **Test User 2**: Raj Kumar (@tech_reviewer_raj) - 15K followers

## 🔐 Demo Login Credentials

### **Influencer Login 1:**
- **Email**: `priya@example.com`
- **Password**: `instagram123`
- **Username**: `@priya_lifestyle`
- **Followers**: 5,000

### **Influencer Login 2:**
- **Email**: `raj@example.com`
- **Password**: `instagram123`
- **Username**: `@tech_reviewer_raj`
- **Followers**: 15,000

## 🔗 Access URLs

### **Admin Panel:**
- **URL**: `/admin`
- **Tab**: Instagram Marketing
- **Features**: Add influencers, verify stories, assign coins

### **Influencer Login:**
- **URL**: `/instagram-login`
- **Features**: Login with demo credentials above

### **Influencer Dashboard:**
- **URL**: `/instagram-dashboard`
- **Features**: Start story timers, track earnings, view history

## 🧪 Testing Workflow

### **1. Admin Test:**
1. Go to `/admin` → Instagram Marketing tab
2. View existing influencers (Priya & Raj)
3. Try adding a new influencer
4. ✅ Should work without errors

### **2. Influencer Test:**
1. Go to `/instagram-login`
2. Login with `priya@example.com` / `instagram123`
3. Click "Start Story Timer"
4. ✅ Timer should start counting down from 24 hours

### **3. Story Verification Test:**
1. Wait for story to expire (or manually update database)
2. Admin receives notification
3. Admin can approve/reject story
4. ✅ Loyalty coins assigned on approval

## ⚠️ Important Notes

### **Why Two Files?**
- **File 1** (`instagram_tables_fixed_setup.sql`): Creates tables with proper constraints
- **File 2** (`instagram_sample_data.sql`): Inserts data safely using conditional logic
- This prevents the `ON CONFLICT` error that occurred with the previous single file

### **Unique Constraints Added:**
- `instagram_username` - Prevents duplicate usernames
- `email` - Prevents duplicate emails  
- `campaign_name` - Prevents duplicate campaign names
- `story_id` - Prevents duplicate story IDs
- `transaction_id` - Prevents duplicate transactions

### **Safe Data Insertion:**
- Uses `DO $$ BEGIN ... END $$` blocks
- Checks if data exists before inserting
- Prevents duplicate data errors
- Safe to run multiple times

## 🎯 Verification Commands

### **Check Tables Created:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'instagram_%';
```

### **Check Sample Data:**
```sql
SELECT full_name, instagram_username, followers_count 
FROM instagram_users;

SELECT campaign_name, per_story_reward, status 
FROM instagram_campaigns;
```

## ✅ Success Indicators

### **Tables Setup Complete:**
- 6 tables created successfully
- All indexes created
- RLS disabled for development
- Permissions granted

### **Sample Data Ready:**
- 1 active campaign created
- 2 test influencers created
- Ready for immediate testing

### **System Operational:**
- Admin can add influencers
- Influencers can login and start timers
- Story tracking works properly
- Loyalty coins integration active

## 🚀 Ready to Use!

Once both SQL files are executed successfully, the Instagram Marketing Module is **fully operational** and ready for testing and production use!

**Next Step**: Test the system using the demo credentials provided above. 🎉