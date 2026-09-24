export interface DemoService {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  popular?: boolean;
  available?: boolean;
  icon?: string;
}

export interface DemoBarber {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  available: boolean;
  username?: string;
  password?: string;
  role?: 'admin' | 'staff';
}

export interface DemoConfig {
  shopName: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  softwareCredit: string;
  schedule: {
    weekdays: string;
    saturdays: string;
    sundays: string;
  };
  services: DemoService[];
  barbers: DemoBarber[];
}

export const demoConfig: DemoConfig = {
  shopName: 'The Arsenal Barber Co.',
  tagline: 'Tradición y Precisión Masculina',
  description: 'Experiencia de barbería premium en un entorno exclusivo. Cortes clásicos, arreglos de barba y estilismo contemporáneo.',
  phone: '954 11 50 09',
  whatsapp: '954 11 50 09',
  address: 'Calle Párroco Antonio Gomez Villalobos, 100, Sevilla',
  city: 'Sevilla',
  softwareCredit: 'Software by Neova Digital',
  schedule: {
    weekdays: '10:00 - 20:00',
    saturdays: '09:00 - 14:00',
    sundays: 'Cerrado'
  },
  services: [
    {
      id: 'corte-clasico',
      name: 'Corte Clásico',
      price: 15,
      duration: 30,
      description: 'Asesoramiento de imagen, lavado refrescante, corte artesanal a tijera o máquina y peinado final impecable.',
      popular: true,
      available: true,
      icon: 'content_cut'
    },
    {
      id: 'corte-barba',
      name: 'Corte+Barba',
      price: 22,
      duration: 45,
      description: 'Corte completo combinado con ritual de toallas calientes, perfilado a navaja tradicional y bálsamo hidratante.',
      popular: true,
      available: true,
      icon: 'diamond'
    },
    {
      id: 'perfilado',
      name: 'Perfilado',
      price: 10,
      duration: 20,
      description: 'Definición de contornos de barba y cuello a navaja con toalla caliente y loción calmante.',
      popular: false,
      available: true,
      icon: 'face'
    },
    {
      id: 'nino',
      name: 'Niño',
      price: 12,
      duration: 30,
      description: 'Corte de pelo especial para los más pequeños realizado con paciencia, cuidado y la mejor técnica.',
      popular: false,
      available: true,
      icon: 'child_care'
    }
  ],
  barbers: [
    {
      id: 'cualquiera',
      name: 'Cualquiera',
      title: 'Próximo disponible',
      avatarUrl: '',
      available: true,
      role: 'staff'
    },
    {
      id: 'alejandro',
      name: 'Alejandro',
      title: 'Master Barber & Founder',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      available: true,
      username: 'alejandro',
      password: 'alejandro2026',
      role: 'admin'
    },
    {
      id: 'david',
      name: 'David',
      title: 'Senior Stylist & Fade Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      available: true,
      username: 'david',
      password: 'david2026',
      role: 'staff'
    }
  ]
};
