import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient'; // Moved to top

import Header from './components/Header';
import Hero from './components/Hero';
import PopularTrips from './components/PopularTrips';
import RecommendedTrips from './components/RecommendedTrips';
import Features from './components/Features';

import Footer from './components/Footer';
import TripDetail from './components/TripDetail';

import SpecialOffers from './components/SpecialOffers';

import RecommendedAccommodations from './components/RecommendedAccommodations';
import RecommendedTransport from './components/RecommendedTransport';
import Testimonials from './components/Testimonials';

import BlogSection from './components/BlogSection';
import MobileAppMenu from './components/MobileAppMenu';
import PromoPopup from './components/PromoPopup';
import MobileAppPromo from './components/MobileAppPromo';
import PartnersSection from './components/PartnersSection';
import RecentlyViewed from './components/RecentlyViewed';
import TripsPage from './pages/TripsPage';
import TicketsPage from './pages/TicketsPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import AuthCallback from './components/AuthCallback';
import PrivateTripPage from './pages/PrivateTripPage';
import AccommodationPage from './pages/AccommodationPage';
import TransportPage from './pages/TransportPage';
import AccommodationDetail from './pages/AccommodationDetail';
import TransportDetail from './pages/TransportDetail';

import TicketDetail from './pages/TicketDetail';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import BannerManagement from './pages/admin/BannerManagement';
import ProductManagement from './pages/admin/ProductManagement';
import NewsManagement from './pages/admin/NewsManagement';
import TransactionManagement from './pages/admin/TransactionManagement';
import PrivateTripManagement from './pages/admin/PrivateTripManagement';
import UserManagement from './pages/admin/UserManagement';
import PartnerManagement from './pages/admin/PartnerManagement';
import PaymentSettings from './pages/admin/PaymentSettings';
import SystemSettings from './pages/admin/SystemSettings';
import AccommodationCategoryManagement from './pages/admin/AccommodationCategoryManagement';
import PopupManagement from './pages/admin/PopupManagement';
import ContentManagement from './pages/admin/ContentManagement';

import LoginModal from './components/LoginModal'; // Moved to top
import PaymentSuccess from './pages/PaymentSuccess'; // Moved to top

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const GlobalSettings = () => {
  React.useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const { data } = await supabase
          .from('site_content')
          .select('content')
          .eq('key', 'site_favicon')
          .single();
        if (data?.content) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.content;
        }
      } catch (e) {
        console.error("Failed to fetch favicon", e);
      }
    };
    fetchFavicon();
  }, []);
  return null;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [loginMode, setLoginMode] = React.useState('login');
  const [alertMessage, setAlertMessage] = React.useState(null);

  React.useEffect(() => {
    const handleOpenAuth = (e) => {
      if (e.detail && e.detail.mode) {
        setLoginMode(e.detail.mode);
      } else {
        setLoginMode('login');
      }

      if (e.detail && e.detail.alertMessage) {
        setAlertMessage(e.detail.alertMessage);
      } else {
        setAlertMessage(null);
      }

      setShowLoginModal(true);
    };

    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

  // Check if we are in a mobile-specific route or Admin route
  const isMobileView = location.pathname === '/mobilemenu' ||
    location.pathname.startsWith('/mobile-trip') ||
    location.pathname.startsWith('/mobile-stay') ||
    location.pathname.startsWith('/mobile-transport') ||
    location.pathname.startsWith('/mobile-tickets') ||
    location.pathname.startsWith('/payment-success/') ||
    location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
      {!isMobileView && <Header />}
      <main className="flex flex-col flex-1">
        {children}
      </main>
      {!isMobileView && <Footer />}

      {/* Global Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialMode={loginMode}
        alertMessage={alertMessage}
      />
    </div>
  );
};

const Home = () => (
  <>
    <Hero />
    <SpecialOffers />
    <Features />
    <PopularTrips />
    <RecommendedTrips />
    <RecommendedAccommodations />
    <RecommendedTransport />
    <RecentlyViewed />
    <Testimonials />
    <BlogSection />
    <MobileAppPromo />
    <PartnersSection />
    <PromoPopup />
  </>
);

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <GlobalSettings />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/payment-success/:id" element={<PaymentSuccess />} />
          <Route path="/mobilemenu" element={<MobileAppMenu />} />
          <Route path="/mobile-trip/:id" element={<TripDetail mobileMode={true} />} />
          <Route path="/mobile-trips" element={<TripsPage mobileMode={true} />} />
          <Route path="/mobile-tickets" element={<TicketsPage mobileMode={true} />} />
          <Route path="/mobile-stay/:id" element={<AccommodationDetail mobileMode={true} />} />
          <Route path="/mobile-stay" element={<AccommodationPage mobileMode={true} />} />
          <Route path="/mobile-transport/:id" element={<TransportDetail mobileMode={true} />} />
          <Route path="/mobile-transport" element={<TransportPage mobileMode={true} />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/stay/:id" element={<AccommodationDetail />} />
          <Route path="/stay" element={<AccommodationPage />} />
          <Route path="/transport/:id" element={<TransportDetail />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/terms-conditions" element={<TermsConditionsPage />} />

          {/* Admin Routes */}
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<DashboardHome />} />
            <Route path="/admin/content" element={<ContentManagement />} />
            <Route path="/admin/banners" element={<BannerManagement />} />
            <Route path="/admin/popups" element={<PopupManagement />} />
            <Route path="/admin/products/trips" element={<ProductManagement initialProductType="Trip" />} />
            <Route path="/admin/products/stays" element={<ProductManagement initialProductType="Accommodation" />} />
            <Route path="/admin/products/transport" element={<ProductManagement initialProductType="Transportation" />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/news" element={<NewsManagement />} />
            <Route path="/admin/transactions" element={<TransactionManagement />} />
            <Route path="/admin/private-trips" element={<PrivateTripManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/partners" element={<PartnerManagement />} />
            <Route path="/admin/payment-settings" element={<PaymentSettings />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/stays/categories" element={<AccommodationCategoryManagement />} />
          </Route>
          <Route path="/private-trip" element={<PrivateTripPage />} />
          <Route path="/mobile-private-trip" element={<PrivateTripPage isMobile={true} />} />
          <Route path="/auth-callback-popup" element={<AuthCallback />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
