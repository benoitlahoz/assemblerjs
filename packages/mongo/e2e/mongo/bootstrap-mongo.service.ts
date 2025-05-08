import { execSync } from 'child_process';

export class BootstrapMongoService {
  private isMongoInstalled(): boolean {
    try {
      execSync('mongo --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private isMongoRunning(): boolean {
    try {
      const result = execSync('pgrep mongod', { stdio: 'pipe' }).toString();
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  private startMongo(): void {
    try {
      execSync('mongod --fork --logpath /var/log/mongodb.log', {
        stdio: 'ignore',
      });
      console.log('MongoDB started successfully.');
    } catch (error) {
      console.error('Failed to start MongoDB:', error);
    }
  }

  public ensureMongoIsRunning(): void {
    if (!this.isMongoInstalled()) {
      console.error('MongoDB is not installed. Please install it first.');
      return;
    }

    if (!this.isMongoRunning()) {
      console.log('MongoDB is not running. Starting it now...');
      this.startMongo();
    } else {
      console.log('MongoDB is already running.');
    }
  }
}
