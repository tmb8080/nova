const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateVipLevelsWithBicycles() {
  try {
    console.log('Updating VIP levels with bicycle information...');
    
    const vipLevels = [
      { 
        name: 'Starter', 
        bicycleModel: 'City Cruiser Basic',
        bicycleColor: 'Blue',
        bicycleFeatures: 'Comfortable seat, basic gears, city tires'
      },
      { 
        name: 'Bronze', 
        bicycleModel: 'Mountain Explorer',
        bicycleColor: 'Green',
        bicycleFeatures: 'Shock absorbers, 21-speed gears, off-road tires'
      },
      { 
        name: 'Silver', 
        bicycleModel: 'Road Racer Pro',
        bicycleColor: 'Red',
        bicycleFeatures: 'Lightweight frame, racing gears, performance tires'
      },
      { 
        name: 'Gold', 
        bicycleModel: 'Electric Commuter',
        bicycleColor: 'Black',
        bicycleFeatures: 'Electric motor, battery pack, LED lights, GPS tracker'
      },
      { 
        name: 'Platinum', 
        bicycleModel: 'Hybrid Adventure',
        bicycleColor: 'Silver',
        bicycleFeatures: 'Electric assist, suspension, cargo rack, smartphone holder'
      },
      { 
        name: 'Diamond', 
        bicycleModel: 'Carbon Fiber Elite',
        bicycleColor: 'Carbon Black',
        bicycleFeatures: 'Carbon fiber frame, wireless shifting, power meter, premium components'
      },
      { 
        name: 'Elite', 
        bicycleModel: 'Smart E-Bike Premium',
        bicycleColor: 'Titanium',
        bicycleFeatures: 'AI navigation, solar charging, biometric sensors, premium leather seat'
      },
      { 
        name: 'Master', 
        bicycleModel: 'Custom Performance',
        bicycleColor: 'Custom Paint',
        bicycleFeatures: 'Handcrafted frame, premium components, custom paint job, professional fitting'
      },
      { 
        name: 'Legend', 
        bicycleModel: 'Luxury Touring',
        bicycleColor: 'Gold Plated',
        bicycleFeatures: 'Luxury materials, built-in entertainment, climate control, concierge service'
      },
      { 
        name: 'Supreme', 
        bicycleModel: 'Ultimate Dream Bike',
        bicycleColor: 'Diamond Encrusted',
        bicycleFeatures: 'Exclusive design, rare materials, lifetime warranty, personal bike concierge'
      }
    ];

    const results = [];

    for (const vip of vipLevels) {
      try {
        const result = await prisma.vipLevel.update({
          where: { name: vip.name },
          data: {
            bicycleModel: vip.bicycleModel,
            bicycleColor: vip.bicycleColor,
            bicycleFeatures: vip.bicycleFeatures
          }
        });

        results.push({
          name: vip.name,
          status: 'success',
          bicycleModel: vip.bicycleModel
        });

        console.log(`✅ Updated VIP level ${vip.name} with bicycle: ${vip.bicycleModel}`);
      } catch (error) {
        console.error(`❌ Error updating VIP level ${vip.name}:`, error.message);
        results.push({
          name: vip.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('\n📊 Update Summary:');
    results.forEach(result => {
      if (result.status === 'success') {
        console.log(`✅ ${result.name}: ${result.bicycleModel}`);
      } else {
        console.log(`❌ ${result.name}: ${result.error}`);
      }
    });

    return results;
  } catch (error) {
    console.error('Error in updateVipLevelsWithBicycles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if called directly
if (require.main === module) {
  updateVipLevelsWithBicycles()
    .then(() => {
      console.log('🎉 VIP levels bicycle update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { updateVipLevelsWithBicycles };
