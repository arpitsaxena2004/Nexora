import mongoose from 'mongoose';
import { env } from './env';

let isConnecting = false;

export async function connectDB(): Promise<typeof mongoose | null> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (isConnecting) {
    return null;
  }

  try {
    isConnecting = true;
    mongoose.set('strictQuery', false);

    // Setup connection event handlers if not already added
    if (mongoose.connection.listenerCount('connected') === 0) {
      mongoose.connection.on('connected', () => {
        console.log(`✅ MongoDB Connection Established: ${mongoose.connection.name}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB Disconnected. Attempting automatic reconnection...');
        setTimeout(() => connectDB(), 3000);
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
      });
    }

    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    isConnecting = false;
    return conn;
  } catch (error: any) {
    isConnecting = false;
    console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
    console.warn('ℹ️  Retrying MongoDB connection in 5 seconds...');
    setTimeout(() => connectDB(), 5000);
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB Disconnected gracefully');
  } catch (error: any) {
    console.error('Error disconnecting MongoDB:', error);
  }
}

