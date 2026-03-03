try {
    console.log('Attempting to require server.js...');
    require('./api/server.js');
    console.log('Server required successfully (or started listening).');
} catch (e) {
    console.error('FAILED TO START:');
    console.error(e.message);
    console.error(e.stack);
    process.exit(1);
}
