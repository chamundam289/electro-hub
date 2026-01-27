# Website Settings Feature

## Overview
The Website Settings feature allows administrators to configure various aspects of the website through a comprehensive admin panel. This includes shop information, social media links, WhatsApp integration, location settings, popup banners, design customization, and maintenance mode.

## Database Schema

### Tables Added
1. **businesses** - Stores business information
2. **website_settings** - Stores all website configuration settings

### Key Fields
- **Shop Information**: name, logo, address, phone, email
- **Social Media**: Facebook, Instagram, Twitter, YouTube, LinkedIn links
- **Location**: Latitude, longitude, Google Maps embed URL
- **WhatsApp**: Number and message templates for different scenarios
- **Popup**: Enable/disable popup banners with custom images
- **Design**: Primary/secondary colors, footer text
- **Maintenance**: Enable/disable maintenance mode

## Admin Interface

### Access
Navigate to Admin Dashboard → Website Settings tab

### Features
- **6 organized tabs**: General, Location, WhatsApp, Popup, Design, Maintenance
- **Real-time preview** of changes
- **Form validation** and error handling
- **Auto-save functionality**

## User-Side Integration

### Components Created
1. **useWebsiteSettings Hook** - Fetches and manages website settings
2. **WhatsAppButton** - Floating WhatsApp contact button
3. **ProductInquiryButton** - Product-specific WhatsApp inquiry button
4. **Updated Footer** - Dynamic content from settings

### WhatsApp Integration
- **Product Inquiry**: "Hi! I'm interested in {{product_name}}. Can you provide more details?"
- **Floating Button**: "Hi! I need help with your products and services."
- **Offer Popup**: "Hi! I saw your special offer and I'm interested. Can you tell me more?"

### Dynamic Content
- Shop name and logo
- Contact information
- Social media links
- Footer text
- Color scheme (future enhancement)

## Usage Examples

### Admin Side
```typescript
// Access via Admin Dashboard → Website Settings
// Configure all settings through the intuitive interface
```

### User Side
```typescript
// Use the hook to get settings
const { settings, getProductInquiryLink } = useWebsiteSettings();

// Get WhatsApp link for product inquiry
const whatsappLink = getProductInquiryLink("iPhone 15 Pro");

// Use in components
<ProductInquiryButton productName="iPhone 15 Pro" />
```

## Default Settings
- Shop Name: "Electro Hub"
- WhatsApp Templates: Pre-configured professional messages
- Colors: Black primary, white secondary
- Popup: Disabled by default
- Maintenance Mode: Disabled by default

## Migration
The database migration automatically:
1. Creates the required tables
2. Inserts a default business for existing admin users
3. Sets up default website settings

## Future Enhancements
- Theme customization with CSS variables
- Advanced popup scheduling
- Multi-language support
- SEO settings integration
- Analytics integration