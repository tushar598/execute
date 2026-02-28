import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/demowallet';

async function inspect() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const Credit = mongoose.connection.collection('credits');
        const count = await Credit.countDocuments();
        console.log(`Total records in credits: ${count}`);

        const sample = await Credit.find({}).limit(5).toArray();
        console.log('Sample records:');
        console.log(JSON.stringify(sample, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
}

inspect();
