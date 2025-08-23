const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

class WalletAddressService {
  /**
   * Generate unique wallet addresses for a user
   * Creates unique addresses for each user while maintaining company wallet integration
   */
  static async generateUserWalletAddresses(userId, tx = null) {
    try {
      const networks = ['BSC', 'POLYGON', 'ETHEREUM', 'TRON'];
      const addresses = [];
      const client = tx || prisma;

      for (const network of networks) {
        // Generate unique address for this user and network
        const uniqueAddress = this.generateUniqueAddress(network, userId);
        
        // Create wallet address record with the unique user address
        const walletAddress = await client.userWalletAddress.create({
          data: {
            userId,
            network,
            address: uniqueAddress,
            isActive: true
          }
        });

        addresses.push(walletAddress);
      }

      return addresses;
    } catch (error) {
      console.error('Error generating wallet addresses:', error);
      throw error;
    }
  }

  /**
   * Get the real company wallet address for a specific network
   */
  static getCompanyWalletAddress(network) {
    // Map network names to environment variable names
    const networkMap = {
      'BSC': 'BSC_WALLET_ADDRESS',
      'POLYGON': 'POLYGON_WALLET_ADDRESS', 
      'ETHEREUM': 'ETH_WALLET_ADDRESS',
      'TRON': 'TRON_WALLET_ADDRESS'
    };

    const envVar = networkMap[network];
    if (!envVar) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const address = process.env[envVar];
    if (!address) {
      throw new Error(`Company wallet address not configured for ${network}. Please set ${envVar} environment variable.`);
    }

    return address;
  }

  /**
   * Generate a unique address for a specific network and user
   * Creates deterministic but unique addresses for each user
   */
  static generateUniqueAddress(network, userId) {
    try {
      // Create a deterministic seed based on userId and network
      const seed = `${userId}-${network}-${process.env.JWT_SECRET || 'default-secret'}`;
      const hash = crypto.createHash('sha256').update(seed).digest('hex');
      
      // Generate address based on network type
      switch (network) {
        case 'BSC':
        case 'POLYGON':
        case 'ETHEREUM':
          // Generate Ethereum-style address (42 characters, starting with 0x)
          return `0x${hash.substring(0, 40)}`;
        
        case 'TRON':
          // Generate TRON-style address (34 characters, starting with T)
          return `T${hash.substring(0, 33)}`;
        
        default:
          throw new Error(`Unsupported network: ${network}`);
      }
    } catch (error) {
      console.error('Error generating unique address:', error);
      // Fallback to company address if generation fails
      return this.getCompanyWalletAddress(network);
    }
  }

  /**
   * Generate a unique address for a specific network and user (DEPRECATED - now uses company addresses)
   * @deprecated This method is kept for backward compatibility but should not be used
   */
  static generateAddress(network, userId) {
    console.warn('Warning: generateAddress is deprecated. Use generateUniqueAddress instead.');
    return this.generateUniqueAddress(network, userId);
  }

  /**
   * Get wallet addresses for a specific user
   */
  static async getUserWalletAddresses(userId) {
    try {
      const addresses = await prisma.userWalletAddress.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: {
          network: 'asc'
        }
      });

      return addresses;
    } catch (error) {
      console.error('Error getting user wallet addresses:', error);
      throw error;
    }
  }

  /**
   * Get all active wallet addresses for monitoring
   */
  static async getAllActiveWalletAddresses() {
    try {
      const addresses = await prisma.userWalletAddress.findMany({
        where: {
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      return addresses;
    } catch (error) {
      console.error('Error getting all wallet addresses:', error);
      throw error;
    }
  }

  /**
   * Find user by wallet address
   */
  static async findUserByAddress(address) {
    try {
      const walletAddress = await prisma.userWalletAddress.findFirst({
        where: {
          address,
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      return walletAddress?.user || null;
    } catch (error) {
      console.error('Error finding user by address:', error);
      throw error;
    }
  }

  /**
   * Deactivate a wallet address
   */
  static async deactivateAddress(addressId) {
    try {
      await prisma.userWalletAddress.update({
        where: { id: addressId },
        data: { isActive: false }
      });

      return true;
    } catch (error) {
      console.error('Error deactivating address:', error);
      throw error;
    }
  }

  /**
   * Get company wallet addresses for all networks
   */
  static getCompanyWalletAddresses() {
    return {
      TRC20: process.env.TRON_WALLET_ADDRESS || null,
      BEP20: process.env.BSC_WALLET_ADDRESS || null,
      ERC20: process.env.ETH_WALLET_ADDRESS || null,
      POLYGON: process.env.POLYGON_WALLET_ADDRESS || null
    };
  }

  /**
   * Check if company wallet addresses are properly configured
   */
  static validateCompanyWalletAddresses() {
    const addresses = this.getCompanyWalletAddresses();
    const missing = [];
    
    for (const [network, address] of Object.entries(addresses)) {
      if (!address) {
        missing.push(network);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing company wallet addresses for networks: ${missing.join(', ')}. Please configure the corresponding environment variables.`);
    }

    return true;
  }
}

module.exports = WalletAddressService;
