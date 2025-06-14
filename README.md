# Multi-Platform AI with Stripe Integration

A modern, multilingual web application with Stripe subscription integration for premium streaming features. Query multiple AI platforms simultaneously and compare their responses in real-time.

## 🌍 Language Support

- **中文 (Chinese)** - 简体中文支持
- **English** - Full English localization  
- **日本語 (Japanese)** - 完全な日本語対応

## 💰 Subscription Features

### Free Tier
- ✅ Standard response mode
- ✅ Multi-platform AI comparison
- ✅ Multilingual support
- ✅ All basic features

### Pro Tier (¥29/month)
- ⚡ **Real-time streaming responses**
- 🚀 **Faster perceived performance**
- 💜 **Premium UI experience**
- 🎯 **Priority support**

## 🚀 Features

- 🤖 **Multi-Platform Support**: Query ChatGPT, DeepSeek, GitHub Copilot, and Microsoft Copilot
- 💳 **Stripe Integration**: Secure subscription management
- 🔐 **Authentication**: NextAuth.js with Google OAuth
- ⚡ **Streaming Responses**: Real-time AI responses (Pro feature)
- 🌐 **Internationalization**: Full i18n support with next-intl
- 📱 **Mobile Responsive**: Works perfectly on all device sizes
- 🎨 **Modern UI**: Beautiful design with Tailwind CSS

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Internationalization**: next-intl
- **Styling**: Tailwind CSS + Radix UI
- **TypeScript**: Full type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Stripe account
- Google OAuth credentials (for authentication)
- AI API keys

### Installation

1. **Clone and install dependencies:**
\`\`\`bash
git clone <your-repo-url>
cd multi-platform-ai
npm install
\`\`\`

2. **Set up environment variables:**
\`\`\`bash
cp .env.example .env.local
\`\`\`

3. **Configure your `.env.local`:**
\`\`\`env
# AI API Keys
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint

# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_API_URL=https://api.github.com

# Microsoft Azure AD Configuration
MICROSOFT_CLIENT_ID=your_application_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_value_here
MICROSOFT_TENANT_ID=your_directory_tenant_id_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_your_pro_plan_price_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

4. **Set up Stripe:**
   - Create a product in Stripe Dashboard
   - Create a recurring price (e.g., ¥29/month)
   - Copy the price ID to `STRIPE_PRO_PRICE_ID`
   - Set up webhook endpoint: `your-domain.com/api/webhooks/stripe`

5. **Run the development server:**
\`\`\`bash
npm run dev
\`\`\`

6. **Visit the application:**
   - Chinese: http://localhost:3000/zh
   - English: http://localhost:3000/en
   - Japanese: http://localhost:3000/ja

## 🔧 Stripe Configuration

### 1. Create Products and Prices

In your Stripe Dashboard:
1. Go to Products → Add Product
2. Create "Multi-Platform AI Pro"
3. Add recurring pricing (e.g., ¥29/month)
4. Copy the price ID

### 2. Set up Webhooks

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Test with Stripe CLI

\`\`\`bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test webhook
stripe trigger customer.subscription.created
\`\`\`

## 🔐 Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`

## 🔧 GitHub Integration Setup

### 1. Create GitHub Personal Access Token

1. **Go to GitHub Settings:**
   - Visit [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"

2. **Configure Token:**
   \`\`\`
   Note: Multi-Platform AI Integration
   Expiration: 90 days (or as needed)
   Scopes:
   ✅ repo (for private repositories)
   ✅ public_repo (for public repositories) 
   ✅ read:user (for user information)
   ✅ user:email (for user email)
   \`\`\`

3. **Copy Token:**
   - Click "Generate token"
   - Copy the token immediately (you won't see it again)
   - Add it to your `.env.local` as `GITHUB_TOKEN`

### 2. GitHub API Features

With GitHub integration, the app can:
- 🔍 Search relevant code examples from GitHub repositories
- 📊 Analyze code patterns and best practices
- 💡 Provide programming suggestions based on real code
- 🔗 Link to relevant GitHub resources and documentation

### 3. Rate Limits

GitHub API has rate limits:
- **Authenticated requests:** 5,000 per hour
- **Search API:** 30 requests per minute
- **Unauthenticated:** 60 requests per hour

### 4. Alternative: GitHub Apps

For production use, consider creating a GitHub App instead of using personal access tokens:
- Better security and permissions management
- Higher rate limits
- Organization-level installation

## 📊 API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Subscriptions
- `POST /api/subscription/create-checkout` - Create Stripe checkout session
- `POST /api/subscription/portal` - Create billing portal session
- `GET /api/subscription/status` - Check subscription status

### AI Chat
- `POST /api/chat` - Standard AI responses
- `POST /api/chat/stream` - Streaming AI responses (Pro feature)

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🎯 User Flow

### Free User
1. Visit application
2. Use standard response mode
3. See "Pro Feature" badges on streaming toggle
4. Click upgrade to see subscription dialog

### Subscription Flow
1. User clicks "Upgrade to Pro"
2. Redirected to Stripe Checkout
3. Complete payment
4. Webhook updates subscription status
5. User gains access to streaming features

### Pro User
1. Login with Google
2. Toggle streaming mode
3. Enjoy real-time AI responses
4. Manage subscription via billing portal

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy to Vercel:**
\`\`\`bash
vercel --prod
\`\`\`

2. **Add environment variables in Vercel Dashboard**

3. **Update Stripe webhook URL:**
   - Change webhook endpoint to: `https://your-domain.vercel.app/api/webhooks/stripe`

4. **Update OAuth redirect URIs:**
   - Add production URL to Google OAuth settings

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- All AI API keys
- NextAuth configuration
- Stripe keys and webhook secret
- Google OAuth credentials

## 🔒 Security Considerations

- **API Keys**: Never expose secret keys in client-side code
- **Webhooks**: Verify Stripe webhook signatures
- **Authentication**: Secure session management with NextAuth.js
- **Subscription Validation**: Always verify subscription status server-side

## 📱 Features by Plan

| Feature | Free | Pro |
|---------|------|-----|
| Standard Responses | ✅ | ✅ |
| Multi-platform AI | ✅ | ✅ |
| Multilingual Support | ✅ | ✅ |
| Streaming Responses | ❌ | ✅ |
| Real-time Updates | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

**Ready for production with Stripe subscriptions! 🚀💳**
