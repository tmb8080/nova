const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CompanyWalletService {
  /**
   * Initialize company wallets for all networks
   */
  static async initializeCompanyWallets() {
    try {
      const networks = ['BSC', 'POLYGON', 'ETHEREUM', 'TRON'];
      const wallets = [];

      for (const network of networks) {
        // Check if wallet already exists
        const existingWallet = await prisma.companyWallet.findUnique({
          where: { network }
        });

        if (!existingWallet) {
          // Get address from environment variables
          const address = this.getCompanyWalletAddress(network);
          
          if (address) {
            const wallet = await prisma.companyWallet.create({
              data: {
                network,
                address,
                balance: 0,
                totalDeposits: 0,
                totalWithdrawals: 0,
                isActive: true
              }
            });
            wallets.push(wallet);
            console.log(`✅ Company wallet initialized for ${network}: ${address}`);
          } else {
            console.log(`⚠️  No company wallet address configured for ${network}`);
          }
        } else {
          wallets.push(existingWallet);
        }
      }

      return wallets;
    } catch (error) {
      console.error('Error initializing company wallets:', error);
      throw error;
    }
  }

  /**
   * Get company wallet address from environment variables
   */
  static getCompanyWalletAddress(network) {
    const addresses = {
      'BSC': process.env.BSC_WALLET_ADDRESS,
      'POLYGON': process.env.POLYGON_WALLET_ADDRESS,
      'ETHEREUM': process.env.ETH_WALLET_ADDRESS,
      'TRON': process.env.TRON_WALLET_ADDRESS
    };

    return addresses[network];
  }

  /**
   * Get all company wallets
   */
  static async getAllCompanyWallets() {
    try {
      const wallets = await prisma.companyWallet.findMany({
        where: { isActive: true },
        orderBy: { network: 'asc' }
      });

      return wallets;
    } catch (error) {
      console.error('Error getting company wallets:', error);
      throw error;
    }
  }

  /**
   * Get company wallet by network
   */
  static async getCompanyWalletByNetwork(network) {
    try {
      const wallet = await prisma.companyWallet.findUnique({
        where: { network }
      });

      return wallet;
    } catch (error) {
      console.error('Error getting company wallet:', error);
      throw error;
    }
  }

  /**
   * Record deposit transaction to company wallet
   */
  static async recordDeposit(network, amount, currency, fromAddress, transactionHash, metadata = {}) {
    try {
      const companyWallet = await this.getCompanyWalletByNetwork(network);
      
      if (!companyWallet) {
        throw new Error(`Company wallet not found for network: ${network}`);
      }

      // Create transaction record
      const transaction = await prisma.companyWalletTransaction.create({
        data: {
          companyWalletId: companyWallet.id,
          type: 'DEPOSIT',
          amount: parseFloat(amount),
          currency,
          fromAddress,
          toAddress: companyWallet.address,
          transactionHash,
          network,
          status: 'COMPLETED',
          metadata: {
            ...metadata,
            recordedAt: new Date().toISOString()
          }
        }
      });

      // Update company wallet balance
      await prisma.companyWallet.update({
        where: { id: companyWallet.id },
        data: {
          balance: {
            increment: parseFloat(amount)
          },
          totalDeposits: {
            increment: parseFloat(amount)
          },
          lastUpdated: new Date()
        }
      });

      console.log(`✅ Deposit recorded to company wallet ${network}: ${amount} ${currency}`);
      return transaction;

    } catch (error) {
      console.error('Error recording deposit to company wallet:', error);
      throw error;
    }
  }

  /**
   * Record withdrawal transaction from company wallet
   */
  static async recordWithdrawal(network, amount, currency, toAddress, transactionHash, metadata = {}) {
    try {
      const companyWallet = await this.getCompanyWalletByNetwork(network);
      
      if (!companyWallet) {
        throw new Error(`Company wallet not found for network: ${network}`);
      }

      // Check if sufficient balance
      if (companyWallet.balance < parseFloat(amount)) {
        throw new Error(`Insufficient balance in company wallet ${network}`);
      }

      // Create transaction record
      const transaction = await prisma.companyWalletTransaction.create({
        data: {
          companyWalletId: companyWallet.id,
          type: 'WITHDRAWAL',
          amount: parseFloat(amount),
          currency,
          fromAddress: companyWallet.address,
          toAddress,
          transactionHash,
          network,
          status: 'COMPLETED',
          metadata: {
            ...metadata,
            recordedAt: new Date().toISOString()
          }
        }
      });

      // Update company wallet balance
      await prisma.companyWallet.update({
        where: { id: companyWallet.id },
        data: {
          balance: {
            decrement: parseFloat(amount)
          },
          totalWithdrawals: {
            increment: parseFloat(amount)
          },
          lastUpdated: new Date()
        }
      });

      console.log(`✅ Withdrawal recorded from company wallet ${network}: ${amount} ${currency}`);
      return transaction;

    } catch (error) {
      console.error('Error recording withdrawal from company wallet:', error);
      throw error;
    }
  }

  /**
   * Get company wallet transaction history
   */
  static async getTransactionHistory(network = null, limit = 50) {
    try {
      const where = network ? { network } : {};
      
      const transactions = await prisma.companyWalletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          companyWallet: {
            select: {
              network: true,
              address: true
            }
          }
        }
      });

      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Get company wallet statistics
   */
  static async getCompanyWalletStats() {
    try {
      const wallets = await this.getAllCompanyWallets();
      
      const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0);
      const totalDeposits = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.totalDeposits), 0);
      const totalWithdrawals = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.totalWithdrawals), 0);

      return {
        totalWallets: wallets.length,
        totalBalance,
        totalDeposits,
        totalWithdrawals,
        wallets: wallets.map(wallet => ({
          network: wallet.network,
          address: wallet.address,
          balance: wallet.balance,
          totalDeposits: wallet.totalDeposits,
          totalWithdrawals: wallet.totalWithdrawals,
          lastUpdated: wallet.lastUpdated
        }))
      };
    } catch (error) {
      console.error('Error getting company wallet stats:', error);
      throw error;
    }
  }
}

module.exports = CompanyWalletService;
