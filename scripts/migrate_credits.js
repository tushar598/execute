import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/demowallet';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const Credit = mongoose.connection.collection('credits');
        // Find records where balance is either 0, null, or missing, and credit > 0
        const results = await Credit.find({
            $or: [
                { balance: { $exists: false } },
                { balance: 0 },
                { balance: null }
            ],
            credit: { $gt: 0 }
        }).toArray();

        console.log(`Found ${results.length} records to migrate`);

        for (const doc of results) {
            console.log(`Migrating user ${doc.userId}: ${doc.credit} -> balance`);
            await Credit.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        balance: doc.credit,
                        credit: 0
                    }
                }
            );
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
