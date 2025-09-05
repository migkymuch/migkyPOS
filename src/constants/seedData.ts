import { MenuItem } from '../types';

// Initialize seed menu data (A001/A003 items as specified)
export const seedMenus: MenuItem[] = [
  {
    sku: 'A001',
    name: 'ข้าวผัดไก่',
    price: 45,
    category: 'rice',
    station: 'kitchen',
    imageUrl: '/placeholder-food.jpg',
    imageAlt: 'ข้าวผัดไก่',
    modifiers: []
  },
  {
    sku: 'A002',
    name: 'ข้าวผัดหมู',
    price: 40,
    category: 'rice',
    station: 'kitchen',
    imageUrl: '/placeholder-food.jpg',
    imageAlt: 'ข้าวผัดหมู',
    modifiers: []
  },
  {
    sku: 'A003',
    name: 'ชาไทย',
    price: 25,
    category: 'tea',
    station: 'tea',
    imageUrl: '/placeholder-tea.jpg',
    imageAlt: 'ชาไทย',
    modifiers: []
  },
  {
    sku: 'A004',
    name: 'ชาเขียว',
    price: 20,
    category: 'tea',
    station: 'tea',
    imageUrl: '/placeholder-tea.jpg',
    imageAlt: 'ชาเขียว',
    modifiers: []
  },
  {
    sku: 'W001',
    name: 'น้ำเปล่า',
    price: 10,
    category: 'water',
    station: 'kitchen',
    imageUrl: '/placeholder-water.jpg',
    imageAlt: 'น้ำเปล่า',
    modifiers: []
  },
  {
    sku: 'W002',
    name: 'น้ำอัดลม',
    price: 15,
    category: 'water',
    station: 'kitchen',
    imageUrl: '/placeholder-water.jpg',
    imageAlt: 'น้ำอัดลม',
    modifiers: []
  }
];