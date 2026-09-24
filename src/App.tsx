import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { ScheduleLocationSection } from './components/ScheduleLocationSection';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BookingFlowModal } from './components/BookingFlowModal';
import { MyBookingsModal } from './components/MyBookingsModal';
import { AIChatWidget } from './components/AIChatWidget';
import { AdminPanel } from './components/AdminPanel';
import { NotificationBannerPrompt } from './components/NotificationBannerPrompt';
import { NotificationToast } from './components/NotificationToast';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { checkAndTriggerUpcomingReminders } from './utils/notifications';
import { Service, Booking, Barber } from './types';

import { demoConfig } from './demoConfig';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [preselectedService, setPreselectedService] = useState<Service | null>(null);

  // App data state
  const [services, setServices] = useState<Service[]>(demoConfig.services as Service[]);
  const [barbers, setBarbers] = useState<Barber[]>(demoConfig.barbers as Barber[]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Listen for URL changes for simple routing without heavy external routers
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    fetchServicesAndBookings();
  }, []);

  // Periodic upcoming appointment reminder checker (every 30 seconds)
  useEffect(() => {
    if (bookings.length > 0) {
      checkAndTriggerUpcomingReminders(bookings);
      const interval = setInterval(() => {
        checkAndTriggerUpcomingReminders(bookings);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [bookings]);

  const fetchServicesAndBookings = async () => {
    try {
      const [resS, resBarbers, resB] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/barbers'),
        fetch('/api/bookings')
      ]);
      const dataS = await resS.json();
      const dataBarbers = await resBarbers.json();
      const dataB = await resB.json();
      setServices(dataS);
      setBarbers(dataBarbers);
      setBookings(dataB);
    } catch (err) {
      console.error('Error fetching services, barbers or bookings:', err);
    }
  };

  const handleOpenBooking = (service?: Service) => {
    setPreselectedService(service || null);
    setIsBookingOpen(true);
  };

  const handleCancelBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServicesAndBookings();
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const handleNavigateToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If path is /admin, render protected Admin Panel (NOT accessible via header links on main site)
  if (currentPath === '/admin') {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex flex-col justify-between selection:bg-[#B8860B] selection:text-white">
      {/* Top Push Notification Banner Prompt */}
      <NotificationBannerPrompt />

      {/* Sticky Main Header Navbar */}
      <Navbar
        onOpenBooking={() => handleOpenBooking()}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onNavigateToSection={handleNavigateToSection}
      />

      {/* Main Content Sections */}
      <main className="flex-grow pb-16 md:pb-0">
        <HeroSection
          onOpenBooking={() => handleOpenBooking()}
          onNavigateToServices={() => handleNavigateToSection('services')}
        />

        <ServicesSection
          services={services}
          onSelectService={(service) => handleOpenBooking(service)}
        />

        <ScheduleLocationSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        onOpenBooking={() => handleOpenBooking()}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onNavigateToSection={handleNavigateToSection}
      />

      {/* Modals & Floating Widgets */}
      <BookingFlowModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedService={preselectedService}
        services={services}
        barbers={barbers}
        onBookingConfirmed={() => fetchServicesAndBookings()}
      />

      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        bookings={bookings}
        onCancelBooking={handleCancelBooking}
      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        bookings={bookings}
      />

      {/* Floating Push Notification Toast */}
      <NotificationToast onOpenMyBookings={() => setIsMyBookingsOpen(true)} />

      {/* RGPD-Compliant AI Chatbot */}
      <AIChatWidget />
    </div>
  );
}
