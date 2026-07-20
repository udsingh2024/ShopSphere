const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  console.log('Starting MongoDB Memory Server on port 27017...');
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'shopsphere',
        storageEngine: 'ephemeralForTest'
      }
    });
    const uri = mongod.getUri();
    console.log(`MongoDB Memory Server is successfully running at: ${uri}`);
    console.log('Keep this process running to use the database.');
    
    // Keep process alive
    process.stdin.resume();
  } catch (err) {
    console.error('Error starting MongoDB Memory Server:', err);
    process.exit(1);
  }
}

run();
