# 🛒 ByteMart - Frontend

A modern, responsive e-commerce web application built with React.js and integrated with a Spring Boot backend. This project provides a complete shopping experience with user authentication, product browsing, cart management, wishlist functionality, and order processing.

## 👥 Team Members
- **Sam Gupta** - Full Stack Developer
- **Aalok Zimmerman** - Full Stack Developer

## 🚀 Features

### 🔐 Authentication & User Management
- User registration and login
- Secure session management with localStorage
- User profile management
- Account dashboard with order history

### 🛍️ Shopping Experience
- Product catalog with categories (Phones, Laptops, Audio, Accessories)
- Advanced search and filtering
- Product details with descriptions and pricing
- Shopping cart with quantity management
- Wishlist functionality
- Responsive design for all device sizes

### 💳 Checkout & Orders
- Secure checkout process
- Order summary with tax and shipping calculations
- Discount code support
- Order history and tracking
- Real-time price calculations

### 🎨 UI/UX Features
- Modern, clean interface with Tailwind CSS
- Responsive navigation with mobile menu
- Interactive notifications and modals
- Smooth animations and transitions
- Product card hover effects

## 🛠️ Tech Stack

### Frontend
- **React.js** (18.x) - Component-based UI library
- **React Router** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript ES6+** - Modern JavaScript features
- **CSS3** - Custom styling and animations

### Build Tools & Development
- **Create React App** - React application scaffolding
- **npm** - Package management
- **PostCSS** - CSS processing
- **ESLint** - Code linting and quality

### Backend Integration
- **REST API** - Communication with Spring Boot backend
- **CORS** - Cross-origin resource sharing configuration
- **Environment Variables** - Configuration management

### Deployment & Infrastructure
- **AWS S3** - Static website hosting
- **Jenkins** - CI/CD pipeline automation

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v16.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0 or higher) - Comes with Node.js
- **Git** - For version control

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/sam-gupta-git/ecom-project-front-end.git
cd ecom-project-front-end/front-end
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `front-end` directory:
```env
# Backend API Configuration
REACT_APP_API_BASE_URL=http://localhost:8081/api
REACT_APP_BACKEND_URL=http://localhost:8081

# Environment
REACT_APP_ENV=development
```

For production deployment, create `.env.production`:
```env
REACT_APP_API_BASE_URL=http://your-backend-domain:8081/api
REACT_APP_BACKEND_URL=http://your-backend-domain:8081
REACT_APP_ENV=production
```

### 4. Start the Development Server
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

### 5. Backend Setup (Required)
This frontend requires the corresponding Spring Boot backend to be running:

1. Clone the backend repository
2. Start the Spring Boot application on port 8081
3. Ensure the database is running and configured

## 📦 Available Scripts

### Development
- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (irreversible)

### Production Build
```bash
npm run build
```
This creates an optimized production build in the `build/` folder.

## 🏗️ Project Structure

```
front-end/
├── public/
│   ├── index.html          # HTML template
│   ├── manifest.json       # PWA configuration
│   └── robots.txt         # Search engine directives
├── src/
│   ├── components/        # React components
│   │   ├── Account.js     # User account management
│   │   ├── Cart.js        # Shopping cart component
│   │   ├── Checkout.js    # Checkout process
│   │   ├── FilterBar.js   # Product filtering
│   │   ├── Home.js        # Homepage component
│   │   ├── Login.js       # Authentication forms
│   │   ├── Navbar.js      # Navigation component
│   │   └── ProductCard.js # Product display cards
│   ├── config/
│   │   └── environment.js # Environment configuration
│   ├── services/
│   │   └── apiService.js  # API communication layer
│   ├── App.js            # Main application component
│   ├── App.css          # Global styles
│   ├── index.js         # Application entry point
│   └── index.css        # Base CSS styles
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md            # Project documentation
```

## 🔧 Configuration

### API Endpoints
The application communicates with the following backend endpoints:
- `GET /api/items` - Fetch products
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/cart/view/{username}` - Get user cart
- `POST /api/cart/add/{username}` - Add to cart
- `POST /api/orders/submit/{username}` - Place order

### Environment Variables
- `REACT_APP_API_BASE_URL` - Backend API base URL
- `REACT_APP_BACKEND_URL` - Backend server URL
- `REACT_APP_ENV` - Environment (development/production)

## 🚀 Deployment

### AWS S3 Deployment
1. Build the production version:
   ```bash
   npm run build
   ```

2. Upload the `build/` folder contents to your S3 bucket

3. Configure S3 for static website hosting

4. Update bucket policy for public read access

### Jenkins CI/CD Pipeline
The project includes automated deployment via Jenkins:
- Automatic builds on code commits
- Production deployment to AWS S3
- Environment-specific configurations

## 🧪 Testing

Run the test suite:
```bash
npm test
```

For coverage reports:
```bash
npm test -- --coverage --watchAll=false
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- **User Stories**: [Google Docs](https://docs.google.com/document/d/1kRxmpTiGa4_0o9IEfo-70xOQcrNOvkqmKTsOBRFSVxI/edit?usp=sharing)
- **Project Management**: [Trello Board](https://trello.com/invite/b/68ed4d49febe3b2b2455831e/ATTI9f5fa5090216f16be60333e3437e2ed1FA691ADB/ecommerce-project)

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure backend CORS configuration includes frontend domain
- Check that API URLs in environment files are correct

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version compatibility

**API Connection Issues:**
- Verify backend is running on correct port
- Check network connectivity and firewall settings
- Validate environment variable configurations

## 📞 Support

For questions or support, please contact:
- Aalok Zimmerman - azimmerman1245
- Sam Gupta - sam-gupta-git

