import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<typeof mongoose | null> {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
    console.warn('ℹ️  Running in disconnected/fallback mode. Ensure MongoDB is running or configure MONGODB_URI in .env.');
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
