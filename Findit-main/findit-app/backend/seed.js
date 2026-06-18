// Run this once to populate demo data: node backend/seed.js
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'data/users.json');
const itemsFile = path.join(__dirname, 'data/items.json');

async function seed() {
  const hash = await bcrypt.hash('demo123', 10);
  const demoUser = {
    id: 'u_demo',
    fname: 'Demo', lname: 'User', name: 'Demo User',
    email: 'demo@findit.com',
    phone: '+91 98765 00000',
    city: 'Chennai',
    gender: 'Other',
    password: hash,
    createdAt: new Date().toISOString()
  };

  // Only add if not exists
  let users = [];
  try { users = JSON.parse(fs.readFileSync(usersFile)); } catch {}
  if (!users.find(u => u.email === demoUser.email)) {
    users.push(demoUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    console.log('✅ Demo user created: demo@findit.com / demo123');
  } else {
    console.log('ℹ️  Demo user already exists');
  }

  const now = new Date();
  const days = (n) => new Date(now - n * 86400000).toISOString();

  const items = [
    {
      id: 'item_s1', type: 'lost', status: 'lost',
      userId: 'u_demo', userName: 'Demo User',
      title: 'Black Samsung Galaxy S23', category: 'Electronics', date: days(2).split('T')[0],
      description: 'Lost my Samsung Galaxy S23 in black colour near the food court. Has a cracked screen protector and a red phone case. IMEI: 352093XXXXXXXX',
      colour: 'Black', size: 'Small', brand: 'Samsung', features: 'Red case, cracked screen protector',
      location: 'Phoenix Mall, Chennai', landmark: 'Near food court',
      contactName: 'Demo User', contactPhone: '+91 98765 00000', contactEmail: 'demo@findit.com',
      contactMethod: 'Any', reward: '₹1000 reward',
      imageData: null, createdAt: days(2), updatedAt: days(1),
      updates: [
        { date: days(2), message: 'Report submitted — actively searching.', status: 'lost' },
        { date: days(1), message: 'Checked with mall security — no luck yet.', status: 'lost' }
      ]
    },
    {
      id: 'item_s2', type: 'found', status: 'found',
      userId: 'u_demo', userName: 'Demo User',
      title: 'Brown Leather Wallet', category: 'Wallet', date: days(1).split('T')[0],
      description: 'Found a brown leather wallet near the bus stop. Contains some cash and what looks like ID cards. Not opened the contents.',
      colour: 'Brown', size: 'Small', brand: '', features: 'Gold buckle, initials "R.K." on front',
      location: 'T. Nagar Bus Stop, Chennai', landmark: 'Stop No. 7',
      currentLocation: 'With me (safe custody)',
      contactName: 'Demo User', contactPhone: '+91 98765 00000', contactEmail: 'demo@findit.com',
      contactMethod: 'Phone call',
      imageData: null, createdAt: days(1), updatedAt: days(1),
      updates: [{ date: days(1), message: 'Item found and reported — awaiting owner contact.', status: 'found' }]
    },
    {
      id: 'item_s3', type: 'lost', status: 'returned',
      userId: 'u_demo', userName: 'Demo User',
      title: 'Blue School Bag (Nike)', category: 'Bags', date: days(5).split('T')[0],
      description: "Lost my son's blue Nike school bag on the MTC bus. Contains textbooks, a pencil case, and a water bottle.",
      colour: 'Blue', size: 'Large', brand: 'Nike', features: 'Name tag "Arjun" inside',
      location: 'MTC Bus Route 21C', landmark: 'Adyar Signal',
      contactName: 'Demo User', contactPhone: '+91 98765 00000', contactEmail: 'demo@findit.com',
      contactMethod: 'WhatsApp', reward: '₹500 reward',
      imageData: null, createdAt: days(5), updatedAt: days(3),
      updates: [
        { date: days(5), message: 'Report submitted — bag lost on bus.', status: 'lost' },
        { date: days(4), message: 'A kind person found it and contacted us!', status: 'pending' },
        { date: days(3), message: 'Bag successfully returned. Thank you to the FindIt community! 🙏', status: 'returned' }
      ]
    },
    {
      id: 'item_s4', type: 'found', status: 'pending',
      userId: 'u_demo', userName: 'Demo User',
      title: 'Gold Chain Necklace', category: 'Jewellery', date: days(3).split('T')[0],
      description: 'Found a gold chain near the beach. Looks valuable. Please describe it correctly to claim.',
      colour: 'Gold', size: 'Very Small', brand: '', features: 'Small pendant, religious symbol',
      location: 'Marina Beach, Chennai', landmark: 'Near lighthouse',
      currentLocation: 'With me (safe custody)',
      contactName: 'Demo User', contactPhone: '+91 98765 00000', contactEmail: 'demo@findit.com',
      contactMethod: 'WhatsApp',
      imageData: null, createdAt: days(3), updatedAt: days(2),
      updates: [
        { date: days(3), message: 'Item found and reported.', status: 'found' },
        { date: days(2), message: 'Someone has reached out claiming ownership — verifying details.', status: 'pending' }
      ]
    },
    {
      id: 'item_s5', type: 'lost', status: 'lost',
      userId: 'u_demo', userName: 'Demo User',
      title: 'Maroon Passport & Documents', category: 'Documents', date: days(0).split('T')[0],
      description: 'Lost my passport and visa documents at the airport. Very urgent — flying in 3 days!',
      colour: 'Red', size: 'Small', brand: 'Government of India', features: 'Name: Rajesh Kumar on cover page',
      location: 'Chennai International Airport', landmark: 'Terminal 2, Departure area',
      contactName: 'Demo User', contactPhone: '+91 98765 00000', contactEmail: 'demo@findit.com',
      contactMethod: 'Phone call',
      imageData: null, createdAt: days(0), updatedAt: days(0),
      updates: [{ date: days(0), message: 'URGENT: Documents lost at airport — please help!', status: 'lost' }]
    }
  ];

  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(itemsFile)); } catch {}
  const newItems = items.filter(i => !existing.find(e => e.id === i.id));
  if (newItems.length) {
    fs.writeFileSync(itemsFile, JSON.stringify([...existing, ...newItems], null, 2));
    console.log(`✅ ${newItems.length} demo items seeded`);
  } else {
    console.log('ℹ️  Demo items already exist');
  }

  console.log('\n🚀 Ready! Run: npm start\n');
}

seed().catch(console.error);
